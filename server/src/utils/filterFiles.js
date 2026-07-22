const IGNORED_DIRECTORIES = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.next',
  '__pycache__',
  '.vscode',
  '.idea',
  'archive',
  'vendor',
  'assets'
];

const IGNORED_FILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
];

const IGNORED_EXTENSIONS = [
  '.lock',
  '.min.js',
  '.map',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.mp4',
  '.mp3'
];

const ALLOWED_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.env.example',
  // Multi-language support
  '.py',     // Python
  '.go',     // Go
  '.rb',     // Ruby
  '.java',   // Java
  '.yaml',
  '.yml',
  '.toml',
  '.md',
  '.env'
];

function isParseableFile(filePath, size = 0) {
  // Skip oversized files (200 KB)
  if (size > 200 * 1024) return false;

  // Skip ignored directories
  const parts = filePath.split('/');
  if (parts.some(part => IGNORED_DIRECTORIES.includes(part))) return false;

  // Skip ignored filenames
  const fileName = parts[parts.length - 1];
  if (IGNORED_FILES.includes(fileName)) return false;

  // Skip ignored extensions
  if (IGNORED_EXTENSIONS.some(ext => filePath.endsWith(ext))) return false;

  // Allow only known extensions + dotfiles like .env, .gitignore
  const hasAllowedExt = ALLOWED_EXTENSIONS.some(ext => filePath.endsWith(ext));
  const isDotFile = fileName.startsWith('.') && !fileName.includes('.min.');

  return hasAllowedExt || isDotFile;
}

module.exports = {
  isParseableFile
};
