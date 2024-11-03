import Handlebars from '../node_modules/handlebars/lib/handlebars.js'

// Custom helper: uppercase
Handlebars.registerHelper('uppercase', function(str) {
  return str.toUpperCase();
});

// Custom helper: repeat
Handlebars.registerHelper('repeat', function(count, options) {
  let result = '';
  for (let i = 0; i < count; i++) {
    result += options.fn(this);
  }
  return result;
});

// Export the compile function
function compile(template) {
  return Handlebars.compile(template);
}

// Export the render function
function render(template, context) {
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(context);
}

// ADDED:
function renderCompiled(compiledTemplate, context) {
  //const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(context);
}

// New function to handle CLI input
// echo '{"function": "compile", "args": {"template": "Hello, {{name}}!"}}' | node your-script.js
export default function () {
  console.log("In default...");
  let input = arguments
    try {
      const { function: functionName, args } = JSON.parse(input);
      
      switch (functionName) {
        case 'compile':
          if (typeof args.template !== 'string') {
            throw new Error('Invalid template for compile function');
          }
          return JSON.stringify(compile(args.template));
        
        case 'render':
          if (typeof args.template !== 'string' || typeof args.context !== 'object') {
            throw new Error('Invalid arguments for render function');
          }
          return render(args.template, args.context);
        
        case 'renderCompiled':
          if (typeof args.compiledTemplate !== 'string' || typeof args.context !== 'object') {
            throw new Error('Invalid arguments for renderCompiled function');
          }
          const compiledTemplate = eval(`(${args.compiledTemplate})`);
          return renderCompiled(compiledTemplate, args.context);
        
        default:
          throw new Error(`Unknown function: ${functionName}`);
      }
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  }