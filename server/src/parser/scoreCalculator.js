/**
 * Calculate an onboarding/developer experience score for a repository.
 * Score range: 0-100 based on various quality checks.
 */

function calculateScore(filesWithContent, packageJson, envVars, routes, entryPoint) {
  const breakdown = [];
  const filePaths = filesWithContent.map(f => f.path);

  // 1. Has README.md (10 points)
  const hasReadme = filePaths.some(f => /^readme\.md$/i.test(f) || /^README/i.test(f));
  breakdown.push({
    check: 'Has README.md',
    passed: hasReadme,
    points: hasReadme ? 10 : -5,
    detail: hasReadme
      ? 'README.md found in root directory.'
      : 'No README.md found. A README is essential for onboarding new contributors.'
  });

  // 2. Has package.json scripts (10 points)
  const hasScripts = packageJson && packageJson.scripts && 
    (packageJson.scripts.start || packageJson.scripts.dev);
  breakdown.push({
    check: 'Has run scripts',
    passed: !!hasScripts,
    points: hasScripts ? 10 : -5,
    detail: hasScripts
      ? `Run scripts available: ${Object.keys(packageJson.scripts).join(', ')}`
      : 'No start/dev scripts in package.json. Contributors won\'t know how to run the project.'
  });

  // 3. Has .env.example (10 points)
  const hasEnvExample = filePaths.some(f => f === '.env.example' || f === '.env.sample');
  const hasEnvVars = envVars && envVars.length > 0;
  breakdown.push({
    check: 'Has .env.example',
    passed: hasEnvExample || !hasEnvVars,
    points: (hasEnvExample || !hasEnvVars) ? 10 : -10,
    detail: hasEnvExample
      ? '.env.example found — contributors can see required env vars.'
      : hasEnvVars
        ? `No .env.example file found, but ${envVars.length} env vars detected. Contributors won't know which variables to set.`
        : 'No environment variables detected, so .env.example is not needed.'
  });

  // 4. Has clear entry point (10 points)
  const hasHighConfidenceEntry = entryPoint && entryPoint.confidence === 'high';
  const hasMediumConfidenceEntry = entryPoint && entryPoint.confidence === 'medium';
  breakdown.push({
    check: 'Has clear entry point',
    passed: hasHighConfidenceEntry || hasMediumConfidenceEntry,
    points: hasHighConfidenceEntry ? 10 : hasMediumConfidenceEntry ? 5 : -5,
    detail: hasHighConfidenceEntry
      ? `Entry point clearly defined: ${entryPoint.file} (${entryPoint.reason})`
      : hasMediumConfidenceEntry
        ? `Entry point detected with medium confidence: ${entryPoint.file}`
        : 'No clear entry point found. Define "main" or "scripts.start" in package.json.'
  });

  // 5. Organized structure (10 points)
  const hasRoutes = filePaths.some(f => /(?:^|\/)routes?\//i.test(f));
  const hasModels = filePaths.some(f => /(?:^|\/)models?\//i.test(f));
  const hasControllers = filePaths.some(f => /(?:^|\/)controllers?\//i.test(f));
  const hasServices = filePaths.some(f => /(?:^|\/)services?\//i.test(f));
  const hasComponents = filePaths.some(f => /(?:^|\/)components?\//i.test(f));
  const hasSrc = filePaths.some(f => f.startsWith('src/'));
  const organizedCount = [hasRoutes, hasModels, hasControllers, hasServices, hasComponents, hasSrc].filter(Boolean).length;
  const isOrganized = organizedCount >= 2;
  breakdown.push({
    check: 'Organized project structure',
    passed: isOrganized,
    points: isOrganized ? 10 : -5,
    detail: isOrganized
      ? `Good structure with ${organizedCount} organizational patterns: ${[
          hasRoutes && 'routes', hasModels && 'models', hasControllers && 'controllers',
          hasServices && 'services', hasComponents && 'components', hasSrc && 'src/'
        ].filter(Boolean).join(', ')}`
      : 'Project lacks clear directory organization. Consider grouping files into routes/, models/, etc.'
  });

  // 6. Has tests (10 points)
  const hasTests = filePaths.some(f =>
    /(?:^|\/)(?:tests?|__tests__)\//.test(f) ||
    /\.(?:test|spec)\.(js|ts|jsx|tsx|py)$/.test(f)
  );
  breakdown.push({
    check: 'Has tests',
    passed: hasTests,
    points: hasTests ? 10 : -5,
    detail: hasTests
      ? 'Test files found in the project.'
      : 'No test files detected. Testing helps prevent bugs and improves contributor confidence.'
  });

  // 7. Has .gitignore (5 points)
  const hasGitignore = filePaths.some(f => f === '.gitignore');
  breakdown.push({
    check: 'Has .gitignore',
    passed: hasGitignore,
    points: hasGitignore ? 5 : -5,
    detail: hasGitignore
      ? '.gitignore file found.'
      : 'No .gitignore found. node_modules, .env, and other files should be excluded.'
  });

  // 8. Has TypeScript (5 points)
  const hasTypeScript = filePaths.some(f => f === 'tsconfig.json' || f.endsWith('.ts') || f.endsWith('.tsx'));
  breakdown.push({
    check: 'Uses TypeScript',
    passed: hasTypeScript,
    points: hasTypeScript ? 5 : 0,
    detail: hasTypeScript
      ? 'TypeScript detected — provides type safety and better DX.'
      : 'No TypeScript detected. TypeScript improves code quality but is optional.'
  });

  // 9. Has linter config (5 points)
  const hasLinter = filePaths.some(f =>
    /eslint/i.test(f) || /prettier/i.test(f) || f === '.pylintrc' || f === 'setup.cfg' || f === 'tox.ini'
  );
  breakdown.push({
    check: 'Has linter/formatter config',
    passed: hasLinter,
    points: hasLinter ? 5 : 0,
    detail: hasLinter
      ? 'Linter/formatter configuration found — ensures code consistency.'
      : 'No linter configuration detected. Consider adding ESLint or Prettier.'
  });

  // 10. Has CI/CD config (5 points)
  const hasCiCd = filePaths.some(f =>
    f.startsWith('.github/workflows/') || f === '.gitlab-ci.yml' || f === 'Jenkinsfile' ||
    f === '.circleci/config.yml' || f === '.travis.yml' || f === 'azure-pipelines.yml'
  );
  breakdown.push({
    check: 'Has CI/CD configuration',
    passed: hasCiCd,
    points: hasCiCd ? 5 : 0,
    detail: hasCiCd
      ? 'CI/CD pipeline configuration found.'
      : 'No CI/CD configuration detected. Consider adding GitHub Actions or similar.'
  });

  // 11. Has Dockerfile (5 points)
  const hasDocker = filePaths.some(f => /^Dockerfile/i.test(f) || f === 'docker-compose.yml' || f === 'docker-compose.yaml');
  breakdown.push({
    check: 'Has Docker configuration',
    passed: hasDocker,
    points: hasDocker ? 5 : 0,
    detail: hasDocker
      ? 'Docker configuration found — easy containerized setup.'
      : 'No Docker configuration. Consider adding Dockerfile for reproducible environments.'
  });

  // 12. Security check — no obvious hardcoded secrets
  let hasSecrets = false;
  for (const file of filesWithContent) {
    if (file.path.endsWith('.env') || file.path.includes('node_modules')) continue;
    if (file.content && file.content.match(/(?:password|secret|api_?key)\s*[:=]\s*['"`][^'"`\s]{12,}['"`]/i)) {
      hasSecrets = true;
      break;
    }
  }
  breakdown.push({
    check: 'No hardcoded secrets',
    passed: !hasSecrets,
    points: hasSecrets ? -10 : 5,
    detail: hasSecrets
      ? 'Potential hardcoded secrets detected in source code!'
      : 'No obvious hardcoded secrets found in source files.'
  });

  // Calculate total score
  const baseScore = 50; // Start at 50
  const totalAdjustment = breakdown.reduce((sum, item) => sum + item.points, 0);
  const score = Math.max(0, Math.min(100, baseScore + totalAdjustment));

  return { score, breakdown };
}

module.exports = { calculateScore };
