// hyper-handlebars.js
// View engine middleware for HyperExpress like 'express-handlebars'/exphbs
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

export default class HyperExpressHandlebars {
    constructor(app, options = {}) {
        // Set up options for the view directory, layout directory, partials directory, and default layout
        this.viewsDir = options.viewsDir || path.join(__dirname, 'views');
        this.layoutDir = options.layoutDir || path.join(this.viewsDir, 'layouts');
        this.partialsDir = options.partialsDir || path.join(this.viewsDir, 'partials');
        this.defaultLayout = options.defaultLayout || 'main';
        
        // Initialize the HyperExpress app and Handlebars
        this.app = app;
        this.handlebars = handlebars;

        // Load all partials from the specified partials directory, if it exists
        this._loadPartials(this.partialsDir);

        // Add the custom render method to the response object
        this._setupRenderMethod();
    }

    // Load all partials from the specified directory, if it exists
    _loadPartials(partialsDir) {
        if (this._directoryExists(partialsDir)) {
            const partialFiles = fs.readdirSync(partialsDir);
            partialFiles.forEach(file => {
                const partialName = path.basename(file, path.extname(file)); // Remove file extension
                const partialContent = fs.readFileSync(path.join(partialsDir, file), 'utf-8');
                this.handlebars.registerPartial(partialName, partialContent);
            });
            console.log(`Loaded ${partialFiles.length} Handlebars partials from ${partialsDir}`);
        } else {
            console.warn(`Partials directory "${partialsDir}" not found. No partials were loaded.`);
        }
    }

    // Check if a directory exists
    _directoryExists(directory) {
        try {
            return fs.existsSync(directory) && fs.lstatSync(directory).isDirectory();
        } catch (err) {
            console.warn(`Failed to access directory "${directory}": ${err.message}`);
            return false;
        }
    }

    // Setup a custom res.render function for HyperExpress to use Handlebars
    _setupRenderMethod() {
        this.app.use((req, res, next) => {
            res.render = (viewName, data = {}, layoutName = this.defaultLayout) => {
                const viewPath = path.join(this.viewsDir, `${viewName}.hbs`);
                const layoutPath = path.join(this.layoutDir, `${layoutName}.hbs`);

                // Check if the view exists
                if (!this._fileExists(viewPath)) {
                    console.error(`View file "${viewPath}" not found.`);
                    res.status(404).send('View not found');
                    return;
                }

                // If layout is specified, check if it exists
                if ((layoutName && layoutName !== 'none') && !this._fileExists(layoutPath)) {
                    console.warn(`Layout file "${layoutPath}" not found. Using view-only rendering.`);
                    return this._sendResponse(res, viewPath, data);
                }

                // Render the view content first
                try {
                    const viewContent = this._renderTemplate(viewPath, data);

                    // If layout is specified, wrap the view content with the layout template
                    if (layoutName && layoutName !== 'none') {
                        const html = this._renderTemplate(layoutPath, { ...data, body: viewContent });
                        res.type('text/html').send(html);
                    } else {
                        // If 'none'/missing layout specified, send view content directly
                        res.type('text/html').send(viewContent);
                    }
                } catch (err) {
                    console.error('Error rendering template:', err);
                    res.status(500).send('Internal Server Error');
                }
            };
            next();
        });
    }

    // Check if a file exists
    _fileExists(filePath) {
        try {
            return fs.existsSync(filePath) && fs.lstatSync(filePath).isFile();
        } catch (err) {
            console.warn(`Failed to access file "${filePath}": ${err.message}`);
            return false;
        }
    }

    // Compile and render a template using Handlebars
    _renderTemplate(templatePath, data) {
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        const template = this.handlebars.compile(templateContent);
        return template(data);
    }

    // Helper function to send a rendered response when layout is missing
    _sendResponse(res, viewPath, data) {
        try {
            const viewContent = this._renderTemplate(viewPath, data);
            res.type('text/html').send(viewContent);
        } catch (err) {
            console.error('Error rendering view-only response:', err);
            res.status(500).send(`${err}`) //'Internal Server Error');
        }
    }

    // Register a custom plugin that modifies the Handlebars instance
    registerPlugin(plugin) {
        if (typeof plugin === 'function') {
            plugin(this.handlebars);
            console.log('Custom plugin registered with Handlebars.');
        } else {
            console.error('Invalid plugin. Plugins should be a function that accepts a Handlebars instance.');
        }
    }
}

//module.exports = HyperExpressHandlebars;
