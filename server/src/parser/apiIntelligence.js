const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ROUTER_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'all'];

function isRouterCall(node) {
  if (node.type !== 'CallExpression') return false;
  if (node.callee.type !== 'MemberExpression') return false;
  const propName = node.callee.property.name;
  return ROUTER_METHODS.includes(propName);
}

function analyzeRouteComplexity(node) {
    let complexityScore = 0;
    
    // Simplistic heuristic: count statements and branches
    traverse(node, {
        noScope: true,
        IfStatement() { complexityScore += 2; },
        ForStatement() { complexityScore += 2; },
        WhileStatement() { complexityScore += 2; },
        SwitchStatement() { complexityScore += 2; },
        TryStatement() { complexityScore += 1; },
        CallExpression() { complexityScore += 1; }
    });

    if (complexityScore < 10) return 'Simple';
    if (complexityScore < 30) return 'Medium';
    return 'Complex';
}

function calculateApiHealth(route) {
    let score = 100;
    
    // Deduct for lack of auth
    if (!route.auth) score -= 20;
    // Deduct for no validation middleware
    const hasValidation = route.middleware.some(m => m.toLowerCase().includes('validat') || m.toLowerCase().includes('schema') || m.toLowerCase().includes('zod') || m.toLowerCase().includes('joi'));
    if (!hasValidation) score -= 15;
    // Deduct for missing status codes in responses
    if (route.responseTypes.length === 0) score -= 10;
    
    // Check REST best practices
    const pathParts = route.path.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    
    // Singular nouns instead of plural (very basic heuristic)
    // Avoid verbs in REST paths unless it's a specific action
    const verbs = ['get', 'create', 'update', 'delete', 'add', 'remove', 'fetch'];
    if (pathParts.some(p => verbs.includes(p.toLowerCase()))) {
        score -= 10; // Avoid verbs in URL
    }

    return Math.max(0, score);
}

function analyzeFiles(filesWithContent) {
  const routes = [];
  
  for (const fileObj of filesWithContent) {
    if (!fileObj.path.match(/\.(js|ts|jsx|tsx)$/)) continue;
    if (fileObj.path.includes('node_modules')) continue;

    try {
      const isTs = fileObj.path.endsWith('.ts') || fileObj.path.endsWith('.tsx');
      const ast = parser.parse(fileObj.content, {
        sourceType: 'module',
        plugins: isTs ? ['typescript', 'jsx'] : ['jsx'],
      });

      traverse(ast, {
        CallExpression(path) {
          if (isRouterCall(path.node)) {
            const method = path.node.callee.property.name.toUpperCase();
            const args = path.node.arguments;
            if (args.length < 2) return; // Needs at least path and handler
            
            if (args[0].type === 'StringLiteral' || args[0].type === 'TemplateLiteral') {
              let routePath = args[0].value || (args[0].quasis && args[0].quasis[0].value.raw) || 'unknown';
              
              const middleware = [];
              let controllerName = 'Anonymous Function';
              let auth = null;
              
              // Middlewares and Controller
              for (let i = 1; i < args.length; i++) {
                const arg = args[i];
                if (arg.type === 'Identifier') {
                    if (i === args.length - 1) {
                        controllerName = arg.name;
                    } else {
                        middleware.push(arg.name);
                    }
                } else if (arg.type === 'CallExpression' && arg.callee.type === 'Identifier') {
                    if (i === args.length - 1) controllerName = arg.callee.name;
                    else middleware.push(arg.callee.name);
                } else if (arg.type === 'MemberExpression') {
                     // e.g., UserController.getUsers
                     let name = arg.property.name || 'func';
                     if (arg.object.type === 'Identifier') {
                         name = `${arg.object.name}.${name}`;
                     }
                     if (i === args.length - 1) controllerName = name;
                     else middleware.push(name);
                }
              }

              // Check Auth based on middleware names
              const authNames = ['auth', 'jwt', 'passport', 'verifyToken', 'requireAuth', 'ensureAuthenticated'];
              const authMatch = middleware.find(m => authNames.some(an => m.toLowerCase().includes(an.toLowerCase())));
              if (authMatch) auth = authMatch;

              // Extract Deep info from the handler (the last argument)
              const handlerNode = args[args.length - 1];
              const parameters = [];
              const responseTypes = new Set();
              const dbOperations = new Set();
              const externalApis = new Set();
              const usesEnvVars = new Set();
              
              // Very basic static analysis of the handler
              traverse(handlerNode, {
                  noScope: true,
                  MemberExpression(innerPath) {
                      const node = innerPath.node;
                      // Detect req.params, req.query, req.body
                      if (node.object.type === 'Identifier' && (node.object.name === 'req' || node.object.name === 'request')) {
                          if (node.property.type === 'Identifier') {
                              if (['params', 'query', 'body', 'headers', 'cookies'].includes(node.property.name)) {
                                  // Look up to see what was accessed if possible
                                  let paramName = 'unknown';
                                  if (innerPath.parent.type === 'MemberExpression') {
                                      paramName = innerPath.parent.property.name || 'unknown';
                                  } else if (innerPath.parent.type === 'VariableDeclarator' && innerPath.parent.id.type === 'ObjectPattern') {
                                       innerPath.parent.id.properties.forEach(prop => {
                                           if (prop.key && prop.key.name) parameters.push({ type: node.property.name, name: prop.key.name });
                                       });
                                       return;
                                  }
                                  parameters.push({ type: node.property.name, name: paramName });
                              }
                          }
                      }
                      
                      // Detect res.status(200)
                      if (node.object.type === 'Identifier' && (node.object.name === 'res' || node.object.name === 'response')) {
                          if (node.property.name === 'status' && innerPath.parent.type === 'CallExpression') {
                              const arg = innerPath.parent.arguments[0];
                              if (arg && arg.type === 'NumericLiteral') {
                                  responseTypes.add(arg.value);
                              }
                          }
                      }

                      // Detect DB Ops
                      const propName = node.property.name;
                      if (['find', 'findOne', 'findById', 'select', 'query'].includes(propName)) dbOperations.add('Reads');
                      if (['save', 'create', 'insert', 'insertOne'].includes(propName)) dbOperations.add('Creates');
                      if (['update', 'updateOne', 'findByIdAndUpdate', 'modify'].includes(propName)) dbOperations.add('Updates');
                      if (['delete', 'deleteOne', 'findByIdAndDelete', 'remove'].includes(propName)) dbOperations.add('Deletes');

                      // Detect External APIs
                      const objName = node.object.type === 'Identifier' ? node.object.name.toLowerCase() : '';
                      if (objName.includes('stripe')) externalApis.add('Stripe');
                      if (objName.includes('twilio')) externalApis.add('Twilio');
                      if (objName.includes('openai')) externalApis.add('OpenAI');
                      if (objName.includes('firebase')) externalApis.add('Firebase');
                      if (objName.includes('aws') || objName.includes('s3') || objName.includes('dynamo')) externalApis.add('AWS');

                      // Detect Env Vars
                      if (node.object.type === 'MemberExpression' && node.object.object && node.object.object.name === 'process' && node.object.property.name === 'env') {
                          if (node.property.type === 'Identifier') {
                              usesEnvVars.add(node.property.name);
                          }
                      }
                  }
              }, path.scope, path);

              const complexity = analyzeRouteComplexity(handlerNode);
              
              const routeInfo = {
                method,
                path: routePath,
                file: fileObj.path,
                line: path.node.loc ? path.node.loc.start.line : 1,
                controller: controllerName,
                middleware,
                auth,
                parameters,
                responseTypes: Array.from(responseTypes),
                dbOperations: Array.from(dbOperations),
                externalApis: Array.from(externalApis),
                complexity,
                usesEnvVars: Array.from(usesEnvVars),
                usesApis: [], // We keep it empty or fill it with known deps
                description: `Handles ${method} requests to ${routePath}`,
                githubUrl: '' // Will be populated by parser.js
              };

              routeInfo.securityScore = calculateApiHealth(routeInfo);

              routes.push(routeInfo);
            }
          }
        }
      });
    } catch (err) {
      console.warn(`Failed to parse ${fileObj.path} for API Intelligence: ${err.message}`);
    }
  }

  // Calculate Global API Health
  let totalScore = 0;
  routes.forEach(r => totalScore += r.securityScore);
  const apiHealth = routes.length > 0 ? Math.round(totalScore / routes.length) : 100;

  return { routes, apiHealth };
}

module.exports = { analyzeFiles };
