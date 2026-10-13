const test = require('node:test');
const assert = require('node:assert/strict');
const { extractJson, validateFileStory, validateRepoEvolution, scrubUnknownShas } = require('../src/services/history/storySchema');

const SHA1 = 'a'.repeat(8) + '1234567890abcdef1234567890abcdef';
const SHA2 = 'b'.repeat(8) + '1234567890abcdef1234567890abcdef';
const refs = new Map([['M1', SHA1], ['M2', SHA2]]);

test('extractJson handles fences, chatter and trailing commas', () => {
  assert.deepEqual(extractJson('```json\n{"a": 1}\n```').value, { a: 1 });
  assert.deepEqual(extractJson('Sure! Here it is: {"a": [1, 2,],} hope that helps').value, { a: [1, 2] });
  assert.equal(extractJson('no json here').ok, false);
  assert.equal(extractJson('').ok, false);
  assert.equal(extractJson('{"a": }').ok, false);
});

test('validateFileStory keeps only known milestone refs and normalises enums', () => {
  const raw = {
    summary: 'Auth controller story.',
    origin: { explanation: 'Started as a login route.', basis: 'code' },
    chapters: [
      { milestoneRef: 'm1', title: 'Birth', explanation: 'Created.', reasonForChange: null, reasonBasis: 'commit_message', confidence: 'high' },
      { milestoneRef: 'M1', title: 'Dup', explanation: 'Duplicate.' },
      { milestoneRef: 'M7', title: 'Invented', explanation: 'Not in evidence.' },
      { milestoneRef: 'M2', title: 'Validation', explanation: 'Added Joi.', reasonForChange: 'Commit says so', reasonBasis: 'made_up', confidence: 'certain' },
    ],
    currentState: { explanation: 'Now thin.', lingeringInfluences: [{ milestoneRef: 'M2', note: 'Joi still used' }, { milestoneRef: 'M9', note: 'x' }] },
    uncertainties: ['History may be partial'],
  };
  const v = validateFileStory(raw, refs);
  assert.equal(v.ok, true);
  assert.deepEqual(v.value.chapters.map(c => c.milestoneRef), ['M1', 'M2']);
  assert.equal(v.value.chapters[0].reasonBasis, 'unknown', 'no reason => basis forced to unknown');
  assert.equal(v.value.chapters[1].reasonBasis, 'unknown', 'invalid enum falls back');
  assert.equal(v.value.chapters[1].confidence, 'low');
  assert.equal(v.value.currentState.lingeringInfluences.length, 1);
  assert.ok(v.issues.some(i => i.includes('M7')));
  assert.ok(v.issues.some(i => i.includes('duplicate')));
});

test('validateFileStory rejects non-objects and empty stories', () => {
  assert.equal(validateFileStory(null, refs).ok, false);
  assert.equal(validateFileStory([], refs).ok, false);
  assert.equal(validateFileStory({ chapters: [] }, refs).ok, false);
});

test('model text that mentions unknown commit hashes is scrubbed', () => {
  const v = validateFileStory({
    summary: `Changed in deadbeef12 and in ${SHA1.slice(0, 7)}.`,
    chapters: [{ milestoneRef: 'M1', title: 'x', explanation: 'see c0ffee99' }],
  }, refs);
  assert.match(v.value.summary, /\[unverified commit\]/);
  assert.match(v.value.summary, new RegExp(SHA1.slice(0, 7)));
  assert.match(v.value.chapters[0].explanation, /\[unverified commit\]/);
  // plain words made of hex letters are left alone
  assert.equal(scrubUnknownShas('added a facade', []), 'added a facade');
});

test('long fields are clipped', () => {
  const v = validateFileStory({ summary: 'x'.repeat(5000), chapters: [] }, refs);
  assert.ok(v.value.summary.length <= 700);
});

test('validateRepoEvolution filters invalid milestones', () => {
  const v = validateRepoEvolution({
    overview: 'Grew from a prototype.',
    milestones: [{ milestoneRef: 'M2', title: 'API', explanation: 'Routes added.', confidence: 'medium' }, { milestoneRef: 'X', title: 'bad', explanation: 'bad' }],
  }, refs);
  assert.equal(v.ok, true);
  assert.equal(v.value.milestones.length, 1);
  assert.equal(v.issues.length, 1);
});
