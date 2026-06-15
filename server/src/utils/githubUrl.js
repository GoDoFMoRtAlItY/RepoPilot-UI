// Build a GitHub source URL
function buildGithubUrl(owner, repo, branch, file, line) {
  if (!owner || !repo || !file) return null;
  const baseUrl = `https://github.com/${owner}/${repo}/blob/${branch || 'main'}/${file}`;
  return line ? `${baseUrl}#L${line}` : baseUrl;
}

module.exports = {
  buildGithubUrl
};
