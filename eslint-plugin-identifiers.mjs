import { features } from "web-features";

export default {
  rules: {
    "collect-identifiers": {
      meta: {
        type: "suggestion",
        schema: [
          {
            enum: ["low", "high", "false", "all"]
          }
        ],
        messages: {
          "high": "'{{name}}' is baseline widely available",
          "low": "'{{name}}' is baseline newly available",
          "false": "'{{name}}' is baseline limited",
          "all": "'{{name}}' baseline status: {{status}}"
        }
      },
      create(context) {
        const options = context.options[0] || "all";
        const reported = new Set();

        function reportFeature(node, featureName, displayName = featureName) {
          const key = `${featureName}:${node.loc.start.line}:${node.loc.start.column}`;
          if (reported.has(key)) return;
          reported.add(key);

          const feature = features[featureName];
          if (feature?.status?.baseline !== undefined) {
            const baseline = feature.status.baseline;
            
            // Report based on filter option
            if (options === "all" || 
                baseline === options || 
                (options === "false" && baseline === false)) {
              
              const messageId = options === "all" ? "all" : options;
              const status = baseline === false ? "limited" : 
                            baseline === "low" ? "newly available" : "widely available";
              
              context.report({
                loc: node.loc,
                messageId,
                data: { 
                  name: displayName,
                  status: status
                }
              });
            }
          }
        }

        return {
          // Handle standalone identifiers (like console, fetch, etc.)
          Identifier(node) {
            // Skip if this identifier is part of a member expression we'll handle separately
            const parent = node.parent;
            if (parent && parent.type === 'MemberExpression' && parent.object === node) {
              return; // Will be handled in MemberExpression
            }
            
            reportFeature(node, node.name);
          },

          // Handle member expressions (like Promise.try, Promise.any, etc.)
          MemberExpression(node) {
            if (node.object && node.property) {
              const objectName = node.object.name;
              const propertyName = node.property.name;
              
              if (objectName && propertyName) {
                // Check for patterns like Promise.try -> promise-try
                const featureKey = `${objectName.toLowerCase()}-${propertyName.toLowerCase()}`;
                const displayName = `${objectName}.${propertyName}`;
                
                reportFeature(node, featureKey, displayName);
                
                // Also check the object itself (like Promise)
                reportFeature(node.object, objectName);
              }
            }
          },

          // Handle call expressions to catch method calls
          CallExpression(node) {
            if (node.callee && node.callee.type === 'MemberExpression') {
              const { object, property } = node.callee;
              
              if (object && property && object.name && property.name) {
                const objectName = object.name;
                const methodName = property.name;
                
                // Special handling for Object methods
                if (objectName === 'Object') {
                  const displayName = `${objectName}.${methodName}()`;
                  reportFeature(node.callee, 'object-object', displayName);
                } else {
                  // Check for method patterns
                  const featureKey = `${objectName.toLowerCase()}-${methodName.toLowerCase()}`;
                  const displayName = `${objectName}.${methodName}()`;
                  
                  reportFeature(node.callee, featureKey, displayName);
                }
              }
            }
            // Handle direct function calls like escape(), unescape()
            else if (node.callee && node.callee.type === 'Identifier') {
              const functionName = node.callee.name;
              
              // Check for deprecated functions
              if (['escape', 'unescape'].includes(functionName)) {
                reportFeature(node.callee, 'escape-unescape', functionName);
              }
              // Check for Symbol constructor calls
              else if (functionName === 'Symbol') {
                reportFeature(node.callee, 'symbol', 'Symbol()');
              }
            }
          },

          // Handle variable declarations (let, const)
          VariableDeclaration(node) {
            if (node.kind === 'let' || node.kind === 'const') {
              reportFeature(node, 'let-const', `${node.kind} declaration`);
            }
          },

          // Handle class declarations
          ClassDeclaration(node) {
            reportFeature(node, 'class-syntax', 'class declaration');
          },

          // Handle class expressions
          ClassExpression(node) {
            reportFeature(node, 'class-syntax', 'class expression');
          },

          // Handle functions (async, generators, regular)
          FunctionDeclaration(node) {
            if (node.generator) {
              if (node.async) {
                reportFeature(node, 'async-generators', 'async generator function');
              } else {
                reportFeature(node, 'generators', 'generator function');
              }
            } else if (node.async) {
              reportFeature(node, 'async-await', 'async function');
            }
            // Report regular functions
            reportFeature(node, 'functions', 'function declaration');
          },

          FunctionExpression(node) {
            if (node.generator) {
              if (node.async) {
                reportFeature(node, 'async-generators', 'async generator expression');
              } else {
                reportFeature(node, 'generators', 'generator expression');
              }
            } else if (node.async) {
              reportFeature(node, 'async-await', 'async function expression');
            }
            reportFeature(node, 'functions', 'function expression');
          },

          ArrowFunctionExpression(node) {
            if (node.async) {
              reportFeature(node, 'async-await', 'async arrow function');
            }
            reportFeature(node, 'functions', 'arrow function');
          },

          // Handle await expressions
          AwaitExpression(node) {
            reportFeature(node, 'async-await', 'await expression');
          },

          // Handle yield expressions
          YieldExpression(node) {
            reportFeature(node, 'generators', 'yield expression');
          },

          // Handle destructuring
          ObjectPattern(node) {
            reportFeature(node, 'destructuring', 'object destructuring');
          },

          ArrayPattern(node) {
            reportFeature(node, 'destructuring', 'array destructuring');
          },

          // Handle spread syntax
          SpreadElement(node) {
            reportFeature(node, 'spread', 'spread syntax');
          },

          // Handle template literals
          TemplateLiteral(node) {
            reportFeature(node, 'template-literals', 'template literal');
          },

          // Handle for...of loops (iterators)
          ForOfStatement(node) {
            if (node.await) {
              reportFeature(node, 'async-iterators', 'for await...of loop');
            } else {
              reportFeature(node, 'iterators', 'for...of loop');
            }
          },

          // Handle BigInt literals
          Literal(node) {
            if (typeof node.value === 'bigint' || (typeof node.raw === 'string' && node.raw.endsWith('n'))) {
              reportFeature(node, 'bigint', 'BigInt literal');
            }
          },

          // Handle nullish coalescing
          LogicalExpression(node) {
            if (node.operator === '??') {
              reportFeature(node, 'nullish-coalescing', 'nullish coalescing operator');
            }
          },

          // Handle optional chaining
          ChainExpression(node) {
            reportFeature(node, 'optional-chaining', 'optional chaining');
          },

          // Handle try-catch without binding
          CatchClause(node) {
            if (!node.param) {
              reportFeature(node, 'optional-catch-binding', 'optional catch binding');
            }
          },

          // Handle new constructors
          NewExpression(node) {
            if (node.callee && node.callee.name) {
              const constructorName = node.callee.name;
              
              // Check for specific constructors
              const constructorMappings = {
                'BigInt': 'bigint',
                'Proxy': 'proxy-reflect',
                'Symbol': 'symbol',
                'Array': 'array',
                'Promise': 'promise',
                'Set': 'set-methods',
                'Map': 'map',
                'WeakMap': 'weakmap',
                'WeakSet': 'weakset',
                'Int8Array': 'typed-arrays',
                'Uint8Array': 'typed-arrays',
                'Int16Array': 'typed-arrays',
                'Uint16Array': 'typed-arrays',
                'Int32Array': 'typed-arrays',
                'Uint32Array': 'typed-arrays',
                'Float32Array': 'typed-arrays',
                'Float64Array': 'typed-arrays',
                'BigInt64Array': 'bigint64array',
                'BigUint64Array': 'bigint64array'
              };
              
              const featureKey = constructorMappings[constructorName];
              if (featureKey) {
                reportFeature(node, featureKey, `new ${constructorName}()`);
              }
            }
          },

          "Program:exit"() {
            // Clean up for next file
            reported.clear();
          }
        };
      }
    }
  }
};
