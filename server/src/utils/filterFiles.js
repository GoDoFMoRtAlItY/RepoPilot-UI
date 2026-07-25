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
  // JavaScript / TypeScript
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  // Web
  '.html', '.htm', '.css', '.scss', '.sass', '.less', '.vue', '.svelte',
  // Mobile
  '.dart',       // Flutter / Dart
  '.swift',      // iOS / Swift
  '.kt', '.kts', // Kotlin / Android
  '.m', '.mm',   // Objective-C
  // Systems
  '.c', '.h', '.cc', '.cpp', '.cxx', '.hpp', '.hh',  // C / C++
  '.rs',         // Rust
  '.go',         // Go
  '.zig',        // Zig
  // JVM
  '.java',       // Java
  '.scala',      // Scala
  '.groovy',     // Groovy
  '.gradle',     // Gradle build files
  // Scripting
  '.py',         // Python
  '.rb',         // Ruby
  '.php',        // PHP
  '.lua',        // Lua
  '.r', '.R',    // R
  '.pl', '.pm',  // Perl
  '.ex', '.exs', // Elixir
  '.erl', '.hrl',// Erlang
  '.clj', '.cljs', // Clojure
  '.hs',         // Haskell
  // Shell & DevOps
  '.sh', '.bash', '.zsh', '.fish', '.bat', '.cmd', '.ps1',
  // Data & Config
  '.json', '.yaml', '.yml', '.toml', '.xml', '.ini', '.cfg',
  '.env', '.env.example', '.env.local', '.env.production',
  // Database & Query
  '.sql', '.graphql', '.gql', '.prisma',
  // Documentation & Markup
  '.md', '.mdx', '.rst', '.txt', '.adoc',
  // Build & CI
  '.cmake', '.makefile', '.mk',
  // Other
  '.proto',      // Protocol Buffers
  '.tf', '.hcl', // Terraform
  '.nix',        // Nix
  '.ino',        // Arduino
];

function isParseableFile(filePath, size = 0) {
  // Skip oversized files (500 KB)
  if (size > 500 * 1024) return false;

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
