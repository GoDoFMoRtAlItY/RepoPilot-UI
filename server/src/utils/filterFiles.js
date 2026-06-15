const IGNORED_DIRECTORIES = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.next',
  '__pycache__',
  '.vscode',
  '.idea'
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
  '.env.example'
];

function isParseableFile(filePath, size = 0) {
  // Skip large files (> 100KB)
  if (size > 100 * 1024) return false;

  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];

  // Check directories
  for (const part of parts) {
    if (IGNORED_DIRECTORIES.includes(part) || part.startsWith('.')) {
      if (part !== '.env.example') return false; // Allow .env.example
    }
  }

  // Check exact file names
  if (IGNORED_FILES.includes(fileName)) return false;

  // Ensure it matches an allowed extension
  const extMatch = fileName.match(/\.[0-9a-z]+$/i);
  if (!extMatch) {
    return fileName === '.env.example';
  }
  
  const ext = extMatch[0].toLowerCase();

  if (IGNORED_EXTENSIONS.includes(ext)) return false;
  if (!ALLOWED_EXTENSIONS.includes(ext)) return false;

  return true;
}

module.exports = {
  isParseableFile
};
