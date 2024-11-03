const Handlebars = require('handlebars');

// Define custom Handlebars helpers
Handlebars.registerHelper('uppercase', function (str) {
  return str.toUpperCase();
});

Handlebars.registerHelper('lowercase', function (str) {
  return str.toLowerCase();
});

// Utility function to parse command-line arguments
function parseArgs(args) {
  const parsed = {};
  args.forEach((arg) => {
    const [key, value] = arg.split('=');
    parsed[key.replace('--', '')] = value;
  });
  return parsed;
}

// Main function to render a template
function renderTemplate(templatePath, contextPath) {
  const fs = require('fs');

  try {
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const contextContent = fs.readFileSync(contextPath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    const context = JSON.parse(contextContent);
    const result = template(context);
    console.log(result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Check Neutralinojs global variables and execute accordingly
if (typeof NL_ARGS !== 'undefined') {
  const args = parseArgs(NL_ARGS);
  if (args.template && args.context) {
    renderTemplate(args.template, args.context);
  } else {
    console.error('Usage: --template=path/to/template --context=path/to/context');
  }
} else {
  console.error('Neutralinojs arguments are not defined.');
}
