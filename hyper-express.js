import HyperExpress from 'hyper-express'
import HyperExpressHandlebars from './hyper-handlebars.js'
import alpineHbsHelpers from './helpers/alpine-hbs-helpers.js'

// __dirname in ES modules
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000

// Create the HyperExpress server instance
const app = new HyperExpress.Server();

// Options for Handlebars configuration
const handlebarsOptions = {
  viewsDir: path.join(__dirname, 'views'),
  layoutDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
  defaultLayout: 'main', // Default layout to use for all views
};

// Initialize the HyperExpressHandlebars with the server instance
const hbsMiddleware = new HyperExpressHandlebars(app, handlebarsOptions);

// Register the Alpine.js plugin
alpineHbsHelpers(hbsMiddleware.handlebars);
// Register the plugin with the Handlebars middleware
//hbsMiddleware.registerPlugin(handlebarsAlpinePlugin);

// Define a sample route
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Home Page',
    alpineData: {
      count: 0,
      message: "Welcome to HyperExpress with Handlebars!",
      todos: ['test'],
      newTodo: '',
      selectedTodo: '',
      fetchedData: '',
      toUpdate: ''
    }}, 'main'); //main layout (default if unspecified)
});

app.get('/demo', (req, res) => {
  res.render('demo', { contextData: {
    title: 'Demo HTML block',
    showText: true,
    message: 'This page uses a custom layout.',
    textInput: '',
    items: '',
    options: ['something']
  }}, 'none'); //'none' layout
});

//app.get('/api/data', (req, res) => {
//  return `hello kitty`; });

// Start the server
app.listen(PORT)
  .then(() => console.log('Server running on http://localhost:3000'))
  .catch(console.error);
