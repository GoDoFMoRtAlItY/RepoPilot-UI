const { Octokit } = require('octokit');
const { isParseableFile } = require('../utils/filterFiles');

// Initialize Octokit with auth if token is provided
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || undefined
});

/**
 * Fetch repository metadata
 */
async function fetchRepoMeta(owner, repo) {
  const { data } = await octokit.rest.repos.get({
    owner,
    repo,
  });

  return {
    owner: data.owner.login,
    repo: data.name,
    defaultBranch: data.default_branch,
    description: data.description || '',
    language: data.language || '',
    stars: data.stargazers_count,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Fetch recursive file tree for the repository
 */
async function fetchFileTree(owner, repo, branch) {
  // Get the latest commit SHA for the branch to get the tree
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`
  });
  const commitSha = refData.object.sha;

  // Get the recursive tree
  const { data: treeData } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: commitSha,
    recursive: '1'
  });

  return { tree: treeData.tree, commitSha };
}

/**
 * Fetch raw file content
 */
async function fetchFileContent(owner, repo, path, commitSha) {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: commitSha
    });

    if (data.type === 'file' && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }
    return '';
  } catch (error) {
    console.error(`Error fetching file content for ${path}:`, error.message);
    return '';
  }
}

/**
 * Orchestrate fetching tree, filtering, and fetching contents
 */
async function fetchAllFiles(owner, repo) {
  const meta = await fetchRepoMeta(owner, repo);
  const { tree, commitSha } = await fetchFileTree(owner, repo, meta.defaultBranch);
  meta.commitSha = commitSha;

  // Filter for parseable files
  const parseableFiles = tree.filter(item => 
    item.type === 'blob' && isParseableFile(item.path, item.size)
  );

  // Fetch contents in parallel (batching to avoid rate limits if too many)
  const filesWithContent = [];
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < parseableFiles.length; i += BATCH_SIZE) {
    const batch = parseableFiles.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (fileNode) => {
      const content = await fetchFileContent(owner, repo, fileNode.path, commitSha);
      return {
        path: fileNode.path,
        content,
        size: fileNode.size
      };
    });
    
    const results = await Promise.all(promises);
    filesWithContent.push(...results);
  }

  return {
    meta,
    files: filesWithContent.filter(f => f.content) // Remove any empty/failed fetches
  };
}

module.exports = {
  fetchRepoMeta,
  fetchFileTree,
  fetchFileContent,
  fetchAllFiles
};
