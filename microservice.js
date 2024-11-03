//EXAMPLE HANDLEBARS MICROSERVICE FOR POLYGLOT USE
//ALSO SEE stdio_service.js & stdio_client.py
import HyperExpress from 'hyper-express';
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
parser.add_argument('--main', { 
  help: 'Primary Handlebars layout file in the layouts dir', 
  default: 'main.hbs'
});
parser.add_argument('--helpers', { 
  help: 'Handlebars helpers dir', 
  default: 'helpers'
});
parser.add_argument('-p', '--port', { 
  help: 'Port to listen, HTTP server', 
  //required: false,
  default: 3000
});
const args = parser.parse_args();

// Directory setup
const TEMPLATE_DIR = path.join(__dirname, args.views);
const PARTIAL_DIR = path.join(__dirname, args.views, 'partials');
const LAYOUT_DIR = path.join(__dirname, args.views, 'layouts');
const HELPER_DIR = path.join(__dirname, args.helpers);

//Hyper-Express setup
const app = new HyperExpress.Server();
const port = process.env.PORT || args.port;

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

// JSON-RPC request handler
const handleRpcRequest = async (req, res) => {
  const rpcRequest = await req.json();

  if (rpcRequest.jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid Request' },
      id: null
    });
  }

  const { method, params, id } = rpcRequest;

  try {
    let result;
    switch (method) {
      case 'render':
        result = await renderTemplate(params);
        break;
      default:
        throw { code: -32601, message: 'Method not found' };
    }

    res.json({
      jsonrpc: '2.0',
      result,
      id
    });
  } catch (error) {
    res.status(error.code ? 400 : 500).json({
      jsonrpc: '2.0',
      error: {
        code: error.code || -32000,
        message: error.message || 'Server error'
      },
      id
    });
  }
};

// Set up the JSON-RPC endpoint
app.post('/rpc', handleRpcRequest);

// Set up standard HTTP endpoint
app.post('/render', async (req, res) => {
  const { template, context, layout } = await req.json();

  if (!template || !context) {
    return res.status(400).json({ error: 'Template and context are required' });
  }

  try {
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

    res.json({ renderedHtml });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

initializeHandlebars().then(() => {
  app.listen(port)
    .then(() => console.log(`HyperExpress Handlebars microservice listening on port ${port}`))
    .catch(error => console.error('Failed to start server:', error));
});



/* 

USAGE: HTTP POST with JSON body like this... then forward response to client.
{
  "template": "file:template1.hbs",
  "context": {
    "title": "My Page",
    "content": "Hello, world!"
  },
  "layout": "main.hbs"
}

To use JSON-RPC, clients would send POST requests to the /rpc endpoint with a JSON body following the JSON-RPC 2.0 specification. Here's an example request:
{
  "jsonrpc": "2.0",
  "method": "render",
  "params": {
    "template": "file:template1.hbs",
    "context": {
      "title": "My Page",
      "content": "Hello, world!"
    },
    "layout": "main.hbs"
  },
  "id": 1
}

And here's what a successful response would look like:
{
  "jsonrpc": "2.0",
  "result": {
    "renderedHtml": "<html>...rendered content...</html>"
  },
  "id": 1
}

*/