/**
 * Auto-generate setup steps for a repository based on package.json and detected env vars.
 */

function generateSetup(packageJson, envVars, repoUrl) {
  const steps = [];
  let order = 0;

  // Derive repo name from URL
  const repoName = repoUrl ? repoUrl.split('/').pop() || 'project' : 'project';

  // 1. Clone
  if (repoUrl) {
    steps.push({
      order: ++order,
      title: 'Clone the repository',
      command: `git clone ${repoUrl}.git`,
      description: 'Download the source code to your local machine.',
      note: null
    });

    steps.push({
      order: ++order,
      title: 'Navigate to the project directory',
      command: `cd ${repoName}`,
      description: 'Move into the cloned repository folder.',
      note: null
    });
  }

  // Detect package manager
  let packageManager = 'npm';
  let installCommand = 'npm install';
  let devCommand = null;
  let startCommand = null;
  let buildCommand = null;
  let testCommand = null;

  if (packageJson) {
    // Check for Yarn or pnpm
    if (packageJson.packageManager) {
      if (packageJson.packageManager.includes('yarn')) {
        packageManager = 'yarn';
        installCommand = 'yarn install';
      } else if (packageJson.packageManager.includes('pnpm')) {
        packageManager = 'pnpm';
        installCommand = 'pnpm install';
      }
    }

    // Parse scripts
    if (packageJson.scripts) {
      if (packageJson.scripts.dev) {
        devCommand = `${packageManager}${packageManager === 'npm' ? ' run' : ''} dev`;
      }
      if (packageJson.scripts.start) {
        startCommand = `${packageManager}${packageManager === 'npm' ? ' run' : ''} start`;
      }
      if (packageJson.scripts.build) {
        buildCommand = `${packageManager}${packageManager === 'npm' ? ' run' : ''} build`;
      }
      if (packageJson.scripts.test) {
        testCommand = `${packageManager}${packageManager === 'npm' ? ' run' : ''} test`;
      }
    }

    // 3. Install dependencies
    steps.push({
      order: ++order,
      title: 'Install dependencies',
      command: installCommand,
      description: `Install all required packages using ${packageManager}.`,
      note: packageManager === 'npm'
        ? 'Requires Node.js (v18+) installed on your machine.'
        : `Requires ${packageManager} installed. Run: npm install -g ${packageManager}`
    });
  }

  // 4. Environment variables
  if (envVars && envVars.length > 0) {
    const requiredVars = envVars.filter(e => e.required);
    const optionalVars = envVars.filter(e => !e.required);

    let note = '';
    if (requiredVars.length > 0) {
      note += `Required variables: ${requiredVars.map(e => e.name).join(', ')}`;
    }
    if (optionalVars.length > 0) {
      if (note) note += '. ';
      note += `Optional (have defaults): ${optionalVars.map(e => `${e.name}${e.defaultValue ? '=' + e.defaultValue : ''}`).join(', ')}`;
    }

    steps.push({
      order: ++order,
      title: 'Set up environment variables',
      command: 'cp .env.example .env',
      description: 'Create a local environment file and fill in the required values.',
      note: note || 'Check the project docs for required environment variables.'
    });
  }

  // 5. Build step (if exists)
  if (buildCommand) {
    steps.push({
      order: ++order,
      title: 'Build the project',
      command: buildCommand,
      description: 'Compile/build the project before running.',
      note: null
    });
  }

  // 6. Start the application
  const runCommand = devCommand || startCommand;
  if (runCommand) {
    steps.push({
      order: ++order,
      title: 'Start the development server',
      command: runCommand,
      description: 'Run the application in development mode.',
      note: devCommand
        ? 'The dev server usually has hot-reload enabled.'
        : 'The app will start in production mode.'
    });
  } else if (!packageJson) {
    // Non-Node.js project fallback
    steps.push({
      order: ++order,
      title: 'Run the application',
      command: 'Check the README for run instructions',
      description: 'This project may require specific setup steps.',
      note: 'Look for a Makefile, Dockerfile, or README for instructions.'
    });
  }

  // 7. Test (if exists)
  if (testCommand) {
    steps.push({
      order: ++order,
      title: 'Run tests',
      command: testCommand,
      description: 'Verify everything works by running the test suite.',
      note: null
    });
  }

  return steps;
}

module.exports = { generateSetup };
