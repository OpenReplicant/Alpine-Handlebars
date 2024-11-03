import express from 'express';
import exphbs from 'express-handlebars';
import alpineHbsHelpers from './helpers/alpine-hbs-helpers.js';
// __dirname for ES:
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const hbs = exphbs.create({
  viewsDir: path.join(__dirname, 'views'),
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  //extname: '.hbs', //You can specify additional extensions
  //helpers: {} // Your existing custom helpers can go here
});

// Register the Alpine.js plugin
alpineHbsHelpers(hbs.handlebars);

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
//app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Home Page',
    alpineData: {
      count: 0,
      message: "Welcome to Alpine.js with Handlebars!",
      todos: [],
      newTodo: '',
      selectedTodo: '',
      fetchedData: ''
    }});
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
