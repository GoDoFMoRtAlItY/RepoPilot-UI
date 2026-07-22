function compressContext(fileContent, metadata) {
  const lines = fileContent.split('\n');
  const maxLines = Math.min(lines.length, 50); // Get first meaningful section
  const firstSection = lines.slice(0, maxLines).join('\n');
  
  let compressed = `## First Meaningful Section:\n${firstSection}\n`;

  if (metadata.imports && metadata.imports.length > 0) {
    compressed += `\n## Imports:\n${metadata.imports.join(', ')}\n`;
  }
  
  if (metadata.exports && metadata.exports.length > 0) {
    compressed += `\n## Exports:\n${metadata.exports.join(', ')}\n`;
  }

  // A more robust implementation would use AST to extract exact interfaces/types/comments,
  // but this basic heuristic provides significant token savings.
  
  return compressed;
}

module.exports = {
  compressContext
};
