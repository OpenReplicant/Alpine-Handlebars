import ipc from 'node-ipc'
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
  const partialFiles = await fs.readdir(PARTIAL_DIR);
  for (const file of partialFiles) {
    const partialName = path.parse(file).name;
    const partialContent = await readFile(path.join(PARTIAL_DIR, file));
    Handlebars.registerPartial(partialName, partialContent);
  }
};

// Register all helpers
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
        // Multiple named helpers
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
  console.log('Partials and helpers registered successfully');
};

// Function to render a template
const renderTemplate = async ({ template, context, layout }) => {
  let templateContent;
  if (template.startsWith('file:')) {
    // If template starts with 'file:', read from file
    const templatePath = path.join(TEMPLATE_DIR, template.slice(5));
    templateContent = await readFile(templatePath);
  } else {
    // Otherwise, use the provided template string
    templateContent = template;
  }

  let layoutContent;
  if (layout) {
    const layoutPath = path.join(LAYOUT_DIR, layout);
    layoutContent = await readFile(layoutPath);
  }

  const compiledTemplate = Handlebars.compile(templateContent);
  let renderedHtml = compiledTemplate(context);

  if (layoutContent) {
    const layoutTemplate = Handlebars.compile(layoutContent);
    renderedHtml = layoutTemplate({ ...context, body: renderedHtml });
  }

  return renderedHtml;
};


ipc.config.id = 'handlebarsServer';
ipc.config.retry = 1500;
ipc.config.silent = true;

// Use 'windowsSocket' for Windows, 'unixSocket' for Unix-based systems
const socketPath = process.platform === 'win32' ? '\\\\.\\pipe\\handlebars-ipc' : '/tmp/handlebars-ipc';

ipc.serve(socketPath, () => {
    ipc.server.on('render', async (data, socket) => {
        try {
          const { template, context, layout } = JSON.parse(data);
          const renderedHtml = await renderTemplate({ template, context, layout });
          ipc.server.emit(socket, 'message', JSON.stringify({ success: true, renderedHtml }));
        } catch (error) {
          ipc.server.emit(socket, 'message', JSON.stringify({ success: false, error: error.message }));
        }
    });
});

ipc.server.start();