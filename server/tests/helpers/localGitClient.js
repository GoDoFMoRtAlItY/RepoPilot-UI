/**
 * A minimal Octokit stand-in backed by a LOCAL git repository.
 *
 * It answers the four REST calls the Time Machine uses with the same response
 * shapes as api.github.com, so tests (and offline demos) exercise the real
 * history pipeline against real commits without network access or rate limits.
 * Path-filtered listing deliberately does NOT follow renames, matching GitHub.
 */
const { execFileSync } = require('child_process');

const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
const SEP = '\x1f';
const REC = '\x1e';

function createLocalGitClient(repoDir, { owner = 'local', repo = 'repo' } = {}) {
  const calls = { listCommits: 0, getCommit: 0, getContent: 0, get: 0 };
  const git = (args) => execFileSync('git', ['-C', repoDir, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const notFound = (msg) => Object.assign(new Error(msg), { status: 404 });

  function revExists(ref) {
    try { git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]); return true; } catch (_) { return false; }
  }

  function commitItem(sha) {
    const out = git(['show', '-s', `--format=%H${SEP}%P${SEP}%an${SEP}%aI${SEP}%B`, sha]);
    const [full, parents, name, date, ...msg] = out.split(SEP);
    return {
      sha: full,
      html_url: `https://github.com/${owner}/${repo}/commit/${full}`,
      commit: { message: msg.join(SEP).replace(/\n+$/, ''), author: { name, date } },
      author: null,
      parents: parents.trim() ? parents.trim().split(' ').map(s => ({ sha: s })) : [],
    };
  }

  const client = {
    calls,
    rest: {
      repos: {
        async get() {
          calls.get++;
          return { data: { default_branch: git(['rev-parse', '--abbrev-ref', 'HEAD']).trim() } };
        },

        async listCommits({ path, sha, per_page = 30, page = 1 }) {
          calls.listCommits++;
          const ref = sha || 'HEAD';
          if (!revExists(ref)) throw Object.assign(new Error('No commit found for SHA'), { status: 422 });
          const args = ['log', '--format=%H', ref];
          if (path) args.push('--', path);
          const shas = git(args).split('\n').filter(Boolean);
          const start = (page - 1) * per_page;
          const slice = shas.slice(start, start + per_page);
          const hasNext = start + per_page < shas.length;
          return {
            data: slice.map(commitItem),
            headers: hasNext ? { link: `<https://api.github.com/x?page=${page + 1}>; rel="next"` } : {},
          };
        },

        async getCommit({ ref }) {
          calls.getCommit++;
          if (!revExists(ref)) throw notFound('No commit found');
          const item = commitItem(ref);
          const parent = item.parents[0]?.sha || EMPTY_TREE;
          const status = git(['diff', '--name-status', '-M', parent, item.sha]).split('\n').filter(Boolean);
          const numstat = git(['diff', '--numstat', '-M', parent, item.sha]).split('\n').filter(Boolean);
          const files = status.map((line, i) => {
            const parts = line.split('\t');
            const code = parts[0][0];
            const [add, del] = (numstat[i] || '0\t0').split('\t');
            const filename = code === 'R' || code === 'C' ? parts[2] : parts[1];
            const previous = code === 'R' || code === 'C' ? parts[1] : undefined;
            const map = { A: 'added', M: 'modified', D: 'removed', R: 'renamed', C: 'copied', T: 'changed' };
            const pathspec = previous ? [previous, filename] : [filename];
            const raw = git(['diff', '-M', parent, item.sha, '--', ...pathspec]);
            const at = raw.indexOf('\n@@');
            const patch = at === -1 ? undefined : raw.slice(at + 1).replace(/\n$/, '');
            const a = add === '-' ? 0 : Number(add);
            const d = del === '-' ? 0 : Number(del);
            return { filename, previous_filename: previous, status: map[code] || 'modified', additions: a, deletions: d, changes: a + d, patch };
          });
          const additions = files.reduce((s, f) => s + f.additions, 0);
          const deletions = files.reduce((s, f) => s + f.deletions, 0);
          return { data: { ...item, stats: { additions, deletions, total: additions + deletions }, files } };
        },

        async getContent({ path, ref }) {
          calls.getContent++;
          let buf;
          try {
            buf = execFileSync('git', ['-C', repoDir, 'show', `${ref || 'HEAD'}:${path}`], { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
          } catch (_) {
            throw notFound('Not Found');
          }
          return { data: { type: 'file', encoding: 'base64', content: buf.toString('base64'), path } };
        },
      },
    },
  };
  return client;
}

module.exports = { createLocalGitClient, REC };
