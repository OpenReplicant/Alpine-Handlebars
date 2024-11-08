# Alpine.Handlebars
If you like [Alpine.js](https://alpinejs.dev) & [Handlebars.js](https://handlebarsjs.com/) then you'll love this set of Handlebars helpers for common Alpine.js patterns. Write server-side rendered templates, layouts, and partials, with reactive client-side logic, together and in the same syntax. Use component-based architecture with partials and AJAX calls without page reloads. Make Hypertext Great Again :P

Includes [Hyper-Express](https://npmjs.com/package/hyper-express) & classic Express.js starter servers with view engine middleware, as well as example microservice/IPC implementations if JavaScript is not your server-side language.  Handlebars.js can also run client-side (21.6kB minified gzip) and even as an Alpine.js plugin to render as needed, working with 'Pinecone' SPA router, etc.

First/minimal implementation not tested for production/stability... yet. Helper names, inputs, logic, etc., are subject to change.

**WHY:** 
*Why not SvelteKit/Vue/etc?* After meddling with multiple versions of the popular frameworks, I find this approach more flexible and easier to reason about. Alpine.js is great, there are plugins and they are easy to write.
*Why not write Alpine.js normally?* This is shorter and easier to reason about some things.
*Why Handlebars.js vs another templating SSR?* I work in JS the most... plus, I like the syntax, simplicity, and that it isn't going to change. Check /ports dir for ideas on porting this concept to other templating engines.


**Thanks:** [Stringify-Object](https://www.npmjs.com/package/stringify-object) provided just the right structure for sticking JSON into HTML attributes the way Alpine.js likes it. It is the only external dependency.

**Hyperbole:** It's now 0 days since a new web framework was released... ;)

###### TO DO: 
- Testing & feedback
- Revise docs & examples 
- Fork $fetch to add headers option 
- Static site generator script?
- Client-Side Rendering SPA example?
- More Alpine plugins & Penguin UI components as helpers?


---
### Files:
- **helpers/alpine-hbs-helpers.js** - exports `alpineHbsHelpers()` to register.
- express.js - classic server starter/example with view engine config.
- hyper-express.js - *'BLAZINGLY FAST'* server using uWebSockets (C++).
- hyper-handlebars.js - \**New** view engine middleware for HyperExpress.
- views/*.hbs - example/demo templates (includes layouts & partials)
- tailwind.config.js - example Tailwind config (scan templates for classes)
- microservice.js - use via HTTP in non-JS servers.
- stdio_server.js - use via STDIO in non-JS servers.
- stdio_client.py - Python example STDIO consumer.


---
#
# **Documentation**

This library provides a set of Handlebars helpers that integrate Alpine.js directives and patterns seamlessly into your templates. By using these helpers, you can easily bind dynamic data, manage conditional rendering, and trigger actions using Alpine.js directly in your Handlebars templates. Each helper simplifies otherwise verbose Alpine.js syntax, making it easier to embed reactive behavior in your HTML. 

If you pass strings without quotes, Handlebars will interpret them as dynamic context references rather than literal strings (for Alpine.js, etc).
```
{{! Pass Handlebars variable or helper named title }}
{{myHelper title}}

{{! This passes the literal string "title" }}
{{myHelper "title"}}

{{! And we can only "nest 'quotes' \"carefully\" " }}
{{myHelper "Double around 'single' & \"escaped\"."}}
```

Check the docs on Alpine & Handlebars for a solid foundation...
Learn Alpine.js: https://alpinejs.dev/essentials/templating
Learn Handlebars.js: https://handlebarsjs.com/guide

#
**Note: Attributes Handling**
Alpine helpers support arbitrary HTML attributes(e.g., `class`, `id`) passed in the Handlebars helper calls. 
NOTE: `e` key is used internally where element is variable (with defaults). All unused keys pass to HTML, including valueless keys (must be quoted) like `x-cloak` in the example:
```JS
{{$ 'xDataVar' e='h2' class="text-lg" :id="bind" x-cloak}}
Outputs: <h2 x-text='xDataVar' class="text-lg" :id="bind" "x-cloak"></h2>
```

---

## **Table of Contents**

1. [Alpine.js Context](#reactive-data-helper-x-data)
2. [Content Binding](#content-binding-helpers)
3. [Conditional Rendering](#conditional-rendering-helpers)
4. [Iteration](#iteration-helper)
5. [Input Binding](#input-binding-helpers)
6. [Event Binding](#event-binding-helper)
7. [Toggle](#toggle-helper)
8. [Data Fetching](#data-fetching-helper)
9. [AJAX Button](#ajax-button-helper)


---

## **Reactive Data Helper (x-data)**

### **`alpine` / `x`**  
Binds x-data context to an element using the `x-data` directive. You can use this helper to initialize Alpine.js data on any element from Handlebars context or defined statically. Binding to a Handlebars context variable is how you pass data from the server into Alpine.js and then the client-side reactive state will refer to that object/variable. 

**Usage:**
```JS
STATIC DATA:
{{#alpine "{ definedData: 'example' }"
 persist="*"
 e="form"}}
Reactive & persistent content here: {{$$ 'definedData'}}
{{/alpine}}

OR

HANDLEBARS BACKEND: {
  "template": "template1.hbs",
  "context": {
    "title": "My Page",
    "handlebarsVarForAlpine": {
      "say": "Hello, world!",
      "id": session.id
    }}}

IN TEMPLATE:
{{#x handlebarsVarForAlpine}} (quotes optional here)
OR
{{#x 'handlebarsVarForAlpine' $p="id"}} 
Content...  {{$ 'say'}}
{{/x}}

ABOVE: session.id references server request context.
handlebarsVarForAlpine references Handlebars context.
'say' references Alpine.js context & client renders.
```

- **`1`**: The data context to bind to the element.
- **`e=`**: Optional, defaults to `<div>`.
- **`$p= / persist=`**: Optional, persists comma-separated keys or `*` for all.

**Use of $persist magic plugin requires dependency script.**
```<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/persist@3.x.x/dist/cdn.min.js"></script>``` (BEFORE Alpine.js)
For more complex uses see: https://alpinejs.dev/plugins/persist

---

## **Content Binding Helpers**

### **`x-text` / `txt` / `$`**  
Binds a variable’s value to the text content of an element using Alpine's `x-text` directive. (Escapes HTML so it will not render.)

**Usage:**
```JS
{{$ 'variableName'}}
{{txt 'dataToShow' e='h1'}}
```

- **`1`**: The data value to display as HTML-escaped text.
- **`2` or `e=`**: Optional element, defaults to `<span>`.

---

### **`x-html` / `htm` / `$$`**  
Binds raw HTML content to an element using Alpine's `x-html` directive.

**Usage:**
```JS
{{$$ 'variableName'}}
{{htm 'someHTMLVar' e='h1'}}
```

- **`1`**: The data value to display as unescaped HTML content.
- **`2` or `e=`**: Optional element, defaults to `<span>`.

---

## **Conditional Rendering Helpers**

### **`x-if` / `?`**  
Conditionally renders content based on a truthy value using Alpine's `x-if` directive. (Handlebars uses 'if')
Optionally avoid block syntax with show=""

*NEW*: Added else conditions on top of Alpine's x-if directive.

**Usage:**
```JS
{{#x-if 'isVisible'}}Content if true{{/x-if}}
OR
{{? 'condition' show="<p>This will show if true</p>"}}
```

- **`1`**: Condition to evaluate for rendering.
- **`show=`**: Optional content to render. (TODO: add data-binding as an option)

---

### **`x-elseif` / `elif` / `??`**  
Provides additional conditions in an `x-if` block.

**Usage:**
```JS
{{#x-if 'isVisible'}}Primary content

  {{elif 'anotherCondition' show="Alternate content"}}
  {{#?? 'yetAnotherCondition'}}Some content{{/??}}

{{/x-if}}
```

- **`1`**: Condition to evaluate for rendering.
- **`show=`**: Optional content to render. (TODO: add data-binding as an option)

---

### **`x-else` / `els` / `???`**  
Renders fallback content if all previous conditions fail. (Handlebars uses 'else')

**Usage:**
```JS
{{#x-if 'isTrue'}}Primary content
  {{x-elseif 'elseifCondition' show="Other content"}}
  {{#els}}Fallback content{{/els}}
{{/x-if}}

OR

{{#? 'isTrue'}}Primary content
  {{#???}}{{$$ 'fallback.content'}}{{/???}}
{{/?}}
```

- **`1`**: Condition to evaluate for rendering.
- **`show=`**: Optional content to render. (TODO: add data-binding as an option)

---

## **Iteration Helper**

### **`x-for` / `for`**  
Creates a loop over data using Alpine's `x-for` directive. (Handlebars uses 'each')

**Usage:**
```JS
{{#x-for 'item in items'}}
  {{x-text 'item'}}
{{/x-for}}

Defaults to 'i' when unspecified:
{{#for 'items'}}
  {{$ 'i'}}
{{/for}}

TODO: {{for 'items'}} (shorter, without block syntax)
```

---

## **Input Binding Helpers**

### **`input` / `in`**  
Binds a model to an input element using Alpine's `x-model` directive. Any \<input type=" ... "> supported, plus \<textarea> and \<select> similarly.

**Usage:**
```JS
{{in 'text' 'textRef'}} (most are used like this)

OR
{{input 'select' 'modelRef'
 data="x-data-ref"
 key=bindTo 
 classes="option css"
 class="select css"}}

OR (select & textarea elements wrap, optionally)
{{#input select 'selectedModel' data="options"}}
  {{x-text 'v'}}
{{/input}}

OR
{{#in textarea 'modelRef'}}Default text{{/in}}
```

- **`1`**: The input element type.
- **`2`**: Alpine.js data model to bind.
- **`data=`**: Alpine.js data for `<select>` options.
- **`classes=`**: Pass to `<select>` options class attribute.

---

## **Event Binding Helper**

### **`x-on` / `on`**  
Creates an element that reacts to any browser event using Alpine's `x-on` directive.

**Usage:**
```JS
{{#x-on 'click' "alert('clicked')"}}Clickable{{/x-on}}
```

- **`1`**: Interaction event it reacts to
- **`2`**: Javascript to evaluate
- **`e=`**: HTML element type (default: button)

---

## **Toggle Helper**

### **`toggle`**  
Creates an element that toggles a Boolean value in Alpine.js when clicked.

**Usage:**
```JS
{{#toggle 'isOpen'}}Clickable{{/toggle}}
OR
{{#toggle 'touched' when='touchstart' e='div'}}
Touch this div{{/toggle}}
```

- **`1`**: Boolean variable to toggle.
- **`e=`**: HTML element type (default: button)
- **`when=`**: Interaction event (default: click)

---

## **Data Fetching Helper**

### **`x-fetch` / `$f`**  
Fetches HTML content dynamically using the Alpine `$fetch` plugin. Basically, client-side partials or components which can be conditionally rendered. (Replaces contents of element.)

NOTE: Must include (1.3kB) client-side script from https://github.com/hankhank10/alpine-fetch and lazy-loading requires the x-intersect plugin script.
```<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/intersect@3.x.x/dist/cdn.min.js"></script>``` (BEFORE loading Alpine.js)


**Usage:**
```JS
{{$f '/some/path/to/content' 'lazy'}}
OR
{{x-fetch "/path/to/html" e="div" m='POST' lazy=true}}
```

- **`1`**: URL to fetch HTML from.
- **`2='lazy' / lazy=true`**: Lazy loading via x-intersect (requires plugin)
- **`e=`**: HTML element type (default: div)
- **`m=`**: HTTP method (default: GET)
- **`lazy=true`**: Lazy loading via x-intersect (requires plugin script)
- set headers? gotta fork the plugin to extend it.

---

## **AJAX Button Helper**

### **`ajax` / `$a`**  
Creates a button (or any element) that triggers a data fetch and updates a variable with the result using the Alpine `$fetch` plugin. Replaces target Alpine variable which could be bound to any HTML element or otherwise. (Comparable to some HTMX features.)

NOTE: Must include (1.3kB) client-side script from https://github.com/hankhank10/alpine-fetch

**Usage:**
```JS
{{#ajax 'updateVar' '/api/data'}}Click Me{{/ajax}}
 ... will update: {{$$ updateVar}}
OR
{{$a 'prop' '/api/json'
 json='some.property'
 show='Click Me'}}
 ... will update: {{$ 'prop'}}
```

- **`1`**: Variable to update with the fetched data.
- **`2`**: Endpoint to fetch data from.
- **`3 / show= / block`**: Display contents. (default: 'Click Here')
- **`m=`**: HTTP method (default: GET, must be ALL CAPS)
- **`e=`**: HTML element type (default: button)
- **`when=`**: Event type (default: click)
- **`json=`**: If specified uses $fetchjson and that property as var

---

#
### Experiments
I played around with some other ways to use outside JS...
- Port to templating engines & Handlebars in other langs
- WASM module of Handlebars with helpers.
- OS Binaries w/Neutralino, nexe, deno, bun?
- But IPC methodology might be the winner...
- Currently, stdio_client.py & stdio_server.js are working examples.
