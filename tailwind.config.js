// tailwind.config.js
module.exports = {
  content: [
    // Scan Handlebars templates
    './views/**/*.hbs',
    // Scan JavaScript files for Alpine helper calls that might include Tailwind classes
    './helpers/**/*.js',
    // Any other JS files that might define UI components
    //'./public/**/*.js'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

// package.json additions
{
  "scripts": {
    "build:css": "tailwindcss -i ./src/input.css -o ./public/css/styles.css",
    "watch:css": "tailwindcss -i ./src/input.css -o ./public/css/styles.css --watch",
    "build": "npm run build:css"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0"
  }
}

// src/input.css
@tailwind base;
@tailwind components;
@tailwind utilities;

