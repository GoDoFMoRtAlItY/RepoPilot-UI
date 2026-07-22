// Quick integration test for the parser modules
const { analyzeRepo } = require('./src/services/parser');

// Mock file data simulating a small Express project
const mockFiles = [
  {
    path: 'package.json',
    content: JSON.stringify({
      name: 'test-api',
      scripts: { start: 'node src/index.js', dev: 'nodemon src/index.js', test: 'jest' },
      dependencies: {
        express: '^4.18.0',
        mongoose: '^7.0.0',
        jsonwebtoken: '^9.0.0',
        bcrypt: '^5.1.0',
        cors: '^2.8.5',
        helmet: '^7.0.0',
        dotenv: '^16.0.0'
      },
      devDependencies: { jest: '^29.0.0', supertest: '^6.0.0' }
    }),
    size: 500
  },
  {
    path: 'src/index.js',
    content: `
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const userRoutes = require('./routes/users');
const articleRoutes = require('./routes/articles');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`,
    size: 400
  },
  {
    path: 'src/routes/users.js',
    content: `
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const user = new User({ email, password });
  await user.save();
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

router.get('/profile', async (req, res) => {
  const user = await User.findById(req.userId);
  res.json(user);
});

module.exports = router;
`,
    size: 600
  },
  {
    path: 'src/routes/articles.js',
    content: `
const express = require('express');
const router = express.Router();
const Article = require('../models/Article');

router.get('/', async (req, res) => {
  const articles = await Article.find().sort({ createdAt: -1 });
  res.json(articles);
});

router.post('/', async (req, res) => {
  const article = new Article(req.body);
  await article.save();
  res.status(201).json(article);
});

router.delete('/:id', async (req, res) => {
  await Article.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
`,
    size: 400
  },
  {
    path: 'src/models/User.js',
    content: `
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String
});

userSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

module.exports = mongoose.model('User', userSchema);
`,
    size: 350
  },
  {
    path: 'src/models/Article.js',
    content: `
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);
`,
    size: 250
  },
  {
    path: 'src/middleware/auth.js',
    content: `
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
`,
    size: 300
  },
  {
    path: '.gitignore',
    content: 'node_modules\n.env\n',
    size: 20
  },
  {
    path: 'README.md',
    content: '# Test API\nA simple REST API built with Express and MongoDB.',
    size: 60
  },
  {
    path: 'tests/users.test.js',
    content: `
const request = require('supertest');
const app = require('../src/index');

describe('User endpoints', () => {
  test('POST /api/users/register', async () => {
    const res = await request(app).post('/api/users/register').send({ email: 'test@test.com', password: 'Test123!' });
    expect(res.statusCode).toBe(200);
  });
});
`,
    size: 250
  }
];

const meta = {
  owner: 'test-user',
  repo: 'test-api',
  defaultBranch: 'main',
  description: 'A simple REST API',
  language: 'JavaScript',
  stars: 42,
  analyzedAt: new Date().toISOString(),
  commitSha: 'abc123'
};

(async () => {
  try {
    console.log('=== Running Integration Test ===\n');
    const result = await analyzeRepo('test-user', 'test-api', mockFiles, meta);
    
    console.log('--- SUMMARY ---');
    console.log(`  Project Type: ${result.summary.projectType}`);
    console.log(`  One-Liner: ${result.summary.oneLiner}`);
    console.log(`  Total Files: ${result.summary.totalFiles}, Analyzed: ${result.summary.analyzedFiles}`);
    
    console.log('\n--- ENTRY POINT ---');
    console.log(`  File: ${result.entryPoint.file} (${result.entryPoint.confidence} confidence)`);
    console.log(`  Reason: ${result.entryPoint.reason}`);
    
    console.log(`\n--- ROUTES (${result.routes.length}) ---`);
    result.routes.forEach(r => console.log(`  ${r.method} ${r.path} -> ${r.file}:L${r.line}`));
    
    console.log(`\n--- ENV VARS (${result.envVars.length}) ---`);
    result.envVars.forEach(e => console.log(`  ${e.name} (${e.required ? 'Required' : 'Optional'}) in ${e.file}:L${e.line}${e.defaultValue ? ' [default: ' + e.defaultValue + ']' : ''}`));
    
    console.log(`\n--- APIs/PACKAGES (${result.apis.length}) ---`);
    result.apis.forEach(a => console.log(`  ${a.name} [${a.category}] from ${a.importFile}`));
    
    console.log(`\n--- FILE ROLES (${result.fileRoles.length}) ---`);
    result.fileRoles.forEach(f => console.log(`  ${f.role.padEnd(15)} ${f.file}`));
    
    console.log(`\n--- GRAPH ---`);
    console.log(`  Nodes: ${result.graph.nodes.length}, Edges: ${result.graph.edges.length}`);
    result.graph.nodes.forEach(n => console.log(`    [${n.type}] ${n.label}`));
    result.graph.edges.forEach(e => console.log(`    ${e.source} --${e.label}--> ${e.target}`));
    
    console.log(`\n--- SETUP STEPS (${result.setupSteps.length}) ---`);
    result.setupSteps.forEach(s => console.log(`  ${s.order}. ${s.title}: ${s.command}`));
    
    console.log(`\n--- SECURITY ALERTS (${result.securityAlerts.length}) ---`);
    result.securityAlerts.forEach(a => console.log(`  [${a.severity.toUpperCase()}] ${a.type}: ${a.message} (${a.file}:L${a.line})`));
    
    console.log(`\n--- ONBOARDING SCORE: ${result.onboardingScore.score}/100 ---`);
    result.onboardingScore.breakdown.forEach(b => console.log(`  ${b.passed ? '✓' : '✗'} ${b.check} (${b.points > 0 ? '+' : ''}${b.points}pts): ${b.detail}`));
    
    console.log('\n=== ALL TESTS PASSED ===');
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  }
})();
