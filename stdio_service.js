import Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ArgumentParser } from 'argparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the CLI argument parser
const parser = new ArgumentParser({
  description: 'Alpine.Handlebars IPC Microservice'
});
parser.add_argument('-v', '--views', {
  help: 'Handlebars templates dir containing partials dir and layouts dir',
  //required: false,
  default: 'views'
});
parser.add_argument('--helpers', {
  help: 'Handlebars helpers dir',
  default: 'helpers'
});
parser.add_argument('--main', {
  help: 'Primary Handlebars layout file in the layouts dir',
  default: 'main.hbs'
});
//ADD ANY ARGS
const args = parser.parse_args();

// Directory setup
const TEMPLATE_DIR = path.join(__dirname, args.views);
const PARTIAL_DIR = path.join(__dirname, args.views, 'partials');
const LAYOUT_DIR = path.join(__dirname, args.views, 'layouts');
const HELPER_DIR = path.join(__dirname, args.helpers);

// Helper function to read file contents
const readFile = async (filePath) => {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
};

// Register all partials
const registerPartials = async () => {
  try {
    const partialFiles = await fs.readdir(PARTIAL_DIR);
    for (const file of partialFiles) {
      const partialName = path.parse(file).name;
      const partialContent = await readFile(path.join(PARTIAL_DIR, file));
      Handlebars.registerPartial(partialName, partialContent);
    }
  } catch (error) {
    console.error('Error registering partials:', error);
    throw error;
  }
};

// Register all helpers in /helpers dir (default export fn/obj)
const registerHelpers = async () => {
  const helperFiles = await fs.readdir(HELPER_DIR);
  for (const file of helperFiles) {
    if (file.endsWith('.js')) {
      const helperPath = path.join(HELPER_DIR, file);
      const helper = await import(helperPath);

      if (typeof helper.default === 'function') {
        // Single helper function
        const helperName = path.parse(file).name;
        Handlebars.registerHelper(helperName, helper.default);
      } else if (typeof helper.default === 'object') {
        // Multiple named helpers (as our library is setup)
        for (const [helperName, helperFunction] of Object.entries(helper.default)) {
          if (typeof helperFunction === 'function') {
            Handlebars.registerHelper(helperName, helperFunction);
          }
        }
      }
    }
  }
};

// Initialize Handlebars setup
const initializeHandlebars = async () => {
  await registerPartials();
  await registerHelpers();
  //console.log('Partials and helpers registered successfully');
};

// Function to render a template
const renderTemplate = async ({ template, templateContent, context, layout = args.main }) => {
  if (template && !templateContent) {
    const templatePath = path.join(TEMPLATE_DIR, template);
    templateContent = await readFile(templatePath);
  }

  const layoutPath = path.join(LAYOUT_DIR, layout);
  let layoutContent = await readFile(layoutPath);

  const compiledTemplate = Handlebars.compile(templateContent);
  let renderedHtml = compiledTemplate(context);

  if (layoutContent) {
    const layoutTemplate = Handlebars.compile(layoutContent);
    renderedHtml = layoutTemplate({ ...context, body: renderedHtml });
  }

  return renderedHtml;
};

// Read from stdin and write to stdout
process.stdin.on('data', async (data) => {
  try {
    const { template, context, layout } = JSON.parse(data);
    const renderedHtml = await renderTemplate({ template, context, layout });
    process.stdout.write(`SUCCESS:${renderedHtml}:EOF:\n`);
  } catch (error) {
    process.stdout.write(`ERROR:${error.message}:EOF:\n`);
  }
});

// Initialize Handlebars
initializeHandlebars().then(() => {
  console.log('Alpine.Handlebars IPC service is running');
});