# Alpine.Handlebars
If you like Alpine.js & Handlebars.js (HBS) then you'll love this set of Handlebars helpers for templated Alpine.js patterns.

Write server-side templates with reactive client-side logic, together and in a similar syntax. Includes Hyper-Express (https://npmjs.com/package/hyper-express) & classic Express.js starter servers with view engine middleware, as well as experimental/example microservice/IPC implementations if JavaScript is not your server-side language. 

First/minimal implementation not tested for production/stability... yet. Helper names, input order, logic, etc., are subject to change.

**WHY:** *Why not SvelteKit/Vue/etc?* After meddling with multiple versions of the popular frameworks, I find this approach more flexible and easier to reason about. Alpine.js is great and then there's plugins for many things from client-side routing to visuals, and its easy to write new plugins.
*Why not write Alpine.js normally?* This is shorter and easier to reason about some things.
*Why Handlebars.js vs X/Y/Z?* I like the syntax, simplicity, and that it isn't going to change.

**NOTE:** Handlebars.js can run client-side (21.6kB minified gzip) and was considered first as an Alpine.js plugin to work with 'Pinecone' router.

**Hyperbole:** It's now 0 days since a new web framework was released... ;)

###### TO DO: 
- Testing & feedback
- Revise docs & examples 
- Static site generator script? 
- More Alpine plugins & Penguin UI components as helpers?


#
### Files:
- **helpers/alpine-hbs-helpers.js** - exports `alpineHbsHelpers()` to register.
- hyper-express.js - *'BLAZINGLY FAST'* server using uWebSockets (C++).
- hyper-handlebars.js - \**New** view engine middleware for HyperExpress.
- express.js - classic server starter/example with view engine config.
- views/*.hbs - example templates ...also layouts & partials
- microservice.js - easily use HBS/helpers in non-JS servers. uWS-based.
- stdio_client.py & stdio_server.js - use STDIO pipes in non-JS servers.


#
# **Documentation**

This library provides a set of Handlebars helpers that integrate Alpine.js directives and patterns seamlessly into your templates. By using these helpers, you can easily bind dynamic data, manage conditional rendering, and trigger actions using Alpine.js directly in your Handlebars templates. Each helper simplifies otherwise verbose Alpine.js syntax, making it easier to embed reactive behavior in your HTML. Check the docs on Alpine & Handlebars for more information.

Learn about Alpine.js: https://alpinejs.dev/essentials/templating
Learn about Handlebars.js: https://handlebarsjs.com/guide

---

## **Table of Contents**

1. [Alpine.js Context](#context-helpers)
2. [Content Binding](#content-binding-helpers)
3. [Conditional Rendering](#conditional-rendering-helpers)
4. [Iteration](#iteration-helpers)
5. [Input Binding](#input-binding-helpers)
6. [Toggle](#toggle-helpers)
7. [Data Fetching](#data-fetching-helpers)
8. [HTTP Button](#button-action-helpers)

#
**Note: Attributes Handling**
Alpine helpers support arbitrary HTML attributes(e.g., `class`, `id`) passed in the Handlebars helper calls. 
NOTE: `e` key is used internally where element is variable (with defaults). All unused keys pass to HTML, including valueless keys like `x-cloak` in the example.

**Example:**
```JS
{{$ 'xDataVar' e='h2' class="text-lg" :id="bind" x-cloak}}
Outputs: <h2 x-text='xDataVar' class="text-lg" :id="bind" x-cloak></h2>
```


---

## **Reactive Data Helper (x-data)**

### **`alpine` / `x`**  
Binds x-data context to an element using the `x-data` directive. You can use this helper to initialize Alpine.js data on any element from Handlebars context or defined statically. Binding to a Handlebars context variable is how you pass data from the server into Alpine.js and then the client-side reactive state will refer to that object/variable. **Use of $persist magic plugin requires dependency script.**

**Usage:**
```JS
{{#alpine "{ definedData: 'example' }"
 persist="*"
 e="form"}}
Reactive & persistent content here: {{$$ 'definedData'}}
{{/alpine}}

OR

HANDLEBARS RENDER INPUT: {
  "template": "template1.hbs",
  "context": {
    "title": "My Page",
    "handlebarsVarForAlpine": {
      "say": "Hello, world!",
      "id": session.id
    }}}

IN TEMPLATE:
{{#x 'handlebarsVarForAlpine' $p="id"}}Content...
  {{$ 'say'}}
{{/x}}
```

- **`1`**: The data context to bind to the element.
- **`e=`**: Optional, defaults to `<div>`.
- **`$p=` or `persist=`**: Optional list of comma-separated keys or `*` for all.

---

## **Content Binding Helpers**

### **`x-text` / `txt` / `$`**  
Binds a variable’s value to the text content of an element using the `x-text` directive. (Escapes HTML so it will not render.)

**Usage:**
```JS
{{$ 'variableName'}}
{{txt 'dataToShow' e='h1'}}
```

- **`1`**: The data value to display as HTML-escaped text.
- **`2` or `e=`**: Optional element, defaults to `<span>`.

---

### **`x-html` / `htm` / `$$`**  
Binds raw HTML content to an element using the `x-html` directive.

**Usage:**
```JS
{{$$ 'variableName'}}
{{htm 'someHTMLVar' e='h1'}}
```

- **`1`**: The data value to display as unescaped HTML content.
- **`2` or `e=`**: Optional element, defaults to `<span>`.

---

## **Conditional Rendering Helpers**
NEW: Added else conditions on top of Alpine's x-if directive.

### **`x-if` / `?`**  
Conditionally renders content based on a truthy value using the `x-if` directive. (Handlebars uses 'if')
Optionally avoid block syntax with show=""

**Usage:**
```JS
{{#x-if 'isVisible'}}Content if true{{/x-if}}
OR
{{? 'condition' show="<p>This will show if true</p>"}}
```

- **`1`**: Condition to evaluate for rendering.

---

### **`x-elseif` / `elif` / `??`**  
Provides additional conditions in an `x-if` block.

**Usage:**
```JS
{{#x-if 'isVisible'}}Primary content

  {{elif 'anotherCondition'}}Alternate content
  {{?? 'yetAnotherCondition'}}Some content

{{/x-if}}
```

- **`1`**: Condition to evaluate for rendering.

---

### **`x-else` / `els` / `???`**  
Renders fallback content if all previous conditions fail. (Handlebars uses 'else')

**Usage:**
```JS
{{#x-if 'isTrue'}}Primary content
  {{x-elseif 'elseifCondition'}}Other content
  {{x-else}}Fallback content
{{/x-if}}

OR

{{#? 'isTrue'}}Primary content
  {{???}}Fallback content
{{/?}}
```

- **`1`**: Condition to evaluate for rendering.

---

## **Iteration Helper**

### **`x-for` / `for`**  
Creates a loop over data using the `x-for` directive. (Handlebars uses 'each')

**Usage:**
```JS
{{#x-for 'item in items'}}
  {{x-text 'item'}}
{{/x-for}}

Defaults to 'i' when unspecified:
{{#for 'items'}}
  {{$ 'i'}}
{{/for}}
```

---

## **Input Binding Helpers**

### **`input` / `in`**  
Binds a model to an input element using the `x-model` directive. Any \<input type=" ... "> supported, plus \<textarea> and \<select> similarly.

**Usage:**
```JS
{{in 'text' 'textRef'}} (most are used like this)

OR
{{input 'select' 'modelRef'
 data="x-data-ref"
 key=bindTo 
 classes="option css"
 class="select css"}}

OR (select & textarea elements wrap)
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

## **x-on Helper**

### **`x-on` / `on`**  
Creates an element that reacts to any browser event.

**Usage:**
```JS
{{#x-on 'click' "alert('clicked')"}}Clickable{{/toggle}}
```

- **`1`**: Event to react to
- **`2`**: Event to react to
- **`e=`**: HTML element type (default: button)
- **`when=`**: Interaction event (default: click)

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
NOTE: Must include (1.3kB) client-side script from https://github.com/hankhank10/alpine-fetch


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

## **HTTP Button Helper**

### **`ajax` / `$a`**  
Creates a button that triggers a data fetch and updates a variable with the result using the Alpine `$fetch` plugin. (Replaces target Alpine data property which could be bound to any section of HTML.)
NOTE: Must include (1.3kB) client-side script from https://github.com/hankhank10/alpine-fetch

**Usage:**
```JS
{{#ajax 'updateVar' '/api/data'}}Click Me{{/ajax}}
 ... will update: {{$ updateVar}}

 OR

{{a$ 'prop' '/api/json' json='some.property' show='Click Me'}}
 ... will update: {{$ 'prop'}}
```

- **`1`**: Variable to update with the fetched data.
- **`2`**: Endpoint to fetch data from.
- **`3 / show= / block inner`**: Display contents. (default: 'Click Here')
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