//const Handlebars = require("handlebars");
import handlebars from 'handlebars';
import stringifyObject from 'stringify-object';

/////////// Helpers need helpers too!
function normalize(args) { //Helpers interfaces can be hard to predict
    const options = args[args.length - 1];
    const pos = Array.prototype.slice.call(args, 0, args.length - 1);

    return {
        i: pos[0],  // First positional argument (easy ref)
        pos: pos,   // All positional arguments
        ops: options,  // Handlebars options object
        inner: options.fn ? options.fn(this) : null,  // Inner content for block helpers
        hash: options.hash || {}  // Hash arguments (key='val' as map)
    };
}


function cutOut(input, key = 1) { //Cut & return key from hash/pos ...cut BEFORE att avoids duplicate
    if (typeof input !== Array && key in input) {
        // Check for key in hash.hash (normalized into its own obj), extract/remove/return it
        const value = input[key]; // Extract the value associated
        delete input[key]; // Remove from hash (prevent duplicates)
        return value;
        //OR pass the positional args array with an index number, or default 1 (second)
    } else if (typeof key === Number) { return input.splice(key, 1)[0] }
    else { return false }
}


function attributes(hash, pos) { // Stringify remaining attributes
    // {{tag arg att=thing thing2}} = <... att="thing" thing2>
    let attributes = [];
    // Check for positional arguments AFTER the first/primary
    for (let i = 1; i < pos.length; i++) {
        let arg = pos[i];
        attributes.push(arg); // Treat these as attributes without values
    }
    // Convert attributes into key="value" strings
    for (const [key, value] of Object.entries(hash)) {
        attributes.push(`${key}="${value}"`);
    }
    return attributes.join(" ");
}


function HBstr(str) { return new handlebars.SafeString(str) }


function persistStringify(obj, persistKeys) {
    // Convert string to array and clean up
    persistKeys = (persistKeys || '').split(',').map(k => k.trim()).filter(Boolean);

    // If no persist keys, return original stringified object
    if (!persistKeys.length) {
        return stringifyObject(obj, { singleQuotes: true });
    }

    // Handle string input (try to parse as JSON)
    if (typeof obj === 'string') {
        try {
            obj = JSON.parse(obj);
        } catch (e) {
            return obj; // Return original if can't parse
        }
    }

    // Convert the object to string representation with $persist
    let output = '{';
    Object.entries(obj).forEach(([key, value], index) => {
        if (index > 0) output += ',';
        output += key + ':';
        if (persistKeys.includes(key) || persistKeys.includes('*')) {
            output += `$persist(${stringifyObject(value, { singleQuotes: true })})`;
        } else {
            output += stringifyObject(value, { singleQuotes: true });
        }
    });
    output += '}';

    return output;
}

///////////END


////////// HELPERS
export const help = {
    alpine() {
        const { i, pos, ops, inner, hash } = normalize(arguments);
        const persistAttr = cutOut(hash, 'persist') || cutOut(hash, '$p') || '';

        let data;
        if (ops.data.root[i]) {
            // Handle data from Handlebars context
            data = persistStringify(ops.data.root[i], persistAttr);
        } else {
            // Handle direct input
            data = persistStringify(i, persistAttr);
        }

        let e = cutOut(hash, "e") || cutOut(pos, 1) || "div";
        let a = attributes(hash, pos);

        return HBstr(`<${e} x-data="${data}" ${a}>${inner}</${e}>`);
    },
    // Helper for passing Handlebars data into x-data context (on-page)
    //could be used in layout with body or top-div so view already has data
    //USE: {{#x 'handlebarsData' 'p'}}content{{/x}} OR: {{#alpine "{data: 'stuff'}"}} {{/alpine}}
    /* "alpine"() {
        const { i, pos, ops, inner, hash } = normalize(arguments);

        let data ;    //STRINGIFYOBJECT IS A GODSEND HERE
        if (ops.data.root[i]) { //1st input matches a handlebars data key:
          data = stringifyObject(ops.data.root[i], {singleQuotes: true}); }
        else { data = i }

        let e = cutOut(hash, "e") || cutOut(pos, 1) || "div";
        let a = attributes(hash, pos) || '';
        return HBstr( //<script> document.addEventListener('alpine:init', () => {
            //Alpine.data('myAppData', () => (${stringifyObject(i)}); } </script>
            `<${e} x-data="${data}" ${a}>${inner}</${e}>`);
    }, */
    x(...args) { return this["alpine"](...args) },


    // Helper for x-text directive
    "x-text"() {
        const { i, pos, ops, inner, hash } = normalize(arguments);
        let e = cutOut(hash, "e") || cutOut(pos, 1) || "span";
        let a = attributes(hash, pos) || '';
        return HBstr(`<${e} x-text="${i}" ${a}></${e}>`);
    },
    'txt'(...args) { return this["x-text"](...args) },
    '$'(...args) { return this["x-text"](...args) },
    //USE: {{$ thing e='h1'}} or {{$ thing h1}}


    // Helper for x-html directive
    "x-html"() {
        const { i, pos, ops, inner, hash } = normalize(arguments);
        let e = cutOut(pos, 1) || "span";
        let a = attributes(hash, pos) || '';
        return HBstr(`<${e} x-html="${i}" ${a}></${e}>`);
    },
    'htm'(...args) { return this["x-html"](...args) },
    '$$'(...args) { return this["x-html"](...args) },
    //{{htm 'someHTMLinX-data'}}


    // Helper for x-show directive
    "x-show"() {
        const { i, pos, ops, inner, hash } = normalize(arguments);
        let e = cutOut(pos, 1) || "div";
        let a = attributes(hash, pos) || '';
        return HBstr(`<${e} x-show="${pos[0]}" ${a}>${inner}</${e}>`);
    },
    show(...args) { return this["x-show"](...args) },


    ///// Block helpers for x-if directive + EXPERIMENTAL else-if & else nested logic
    //USE: {{#x-if 'thingTrue'}}show & nest{{eif cond}} OR {{els}} ...{{/x-if}}
    "x-if"() {
        const { i, pos, ops, inner, hash } = normalize(arguments);
        let a = attributes(hash, pos) || '';
        let show = pos[1] || hash['show'] || inner || '';

        // Initialize conditions array in the root data
        if (!ops.data.root) ops.data.root = {};
        if (!ops.data.root._conditions) ops.data.root._conditions = [];
        ops.data.root._conditions.push(i); // Track the condition

        return new HBstr( //add <div>${show}</div> ?
            `<template x-if="${i}" ${a}>${show}</template>`
        );
    },
    "?"(...args) { return this["x-if"](...args) },
    //USE: {{? 'yep' show="<p>yep</p>"}} OR {{? 'yes' "This will show."}}

    "x-elseif"() {
        const { i, pos, ops, inner, hash } = normalize(arguments);
        let a = attributes(hash, pos) || '';
        let show = pos[1] || hash['show'] || inner || '';

        // Ensure root and conditions array exist
        if (!ops.data.root) ops.data.root = {};
        if (!ops.data.root._conditions) ops.data.root._conditions = [];
        ops.data.root._conditions.push(show); // Track this condition

        return new HBstr(`</template><template x-if="${i}" ${a}>${show}`);
    },
    elif(...args) { return this["x-elseif"](...args) },
    "??"(...args) { return this["x-elseif"](...args) },

    "x-else"() {
        const { i, pos, ops, inner, hash } = normalize(arguments);
        let a = attributes(hash, pos) || '';
        let show = pos[1] || hash['show'] || inner || '';

        // Ensure root and conditions array exist
        if (!ops.data.root) ops.data.root = {};
        if (!ops.data.root._conditions) ops.data.root._conditions = [];
        let conditions = ops.data.root._conditions;
        // Create a negation of all previously evaluated conditions in block
        let not = conditions.map((c) => `!(${c})`).join(" && ");
        // Clear the conditions array for the next block
        ops.data.root._conditions = [];

        return new HBstr(`</template><template x-if="${not}" ${a}>${show}`);
    },
    els(...args) { return this["x-else"](...args) }, //'else' reserved by Handlebars
    "???"(...args) { return this["x-else"](...args) },


    // Helper block for x-for directive
    //USE: {{#x-for 'v in things' :key='id'}}{{x-text 'v'}}{{/x-for}} OR {{#for 'things'}}{{$ 'i'}}{{/for}}
    "x-for"() {
        const { i, pos, ops, inner, hash } = normalize(arguments);
        let a = attributes(hash, pos) || '';
        if (i.includes(" ")) {
            return HBstr(
                `<template x-for="${i}" ${a}>${inner}</template>`
            );
        } else { //pre-set iterator name "i"
            return HBstr(`<template x-for="i in ${i}" ${a}>${inner}</template>`);
        }
    },
    for(...args) { return this["x-for"](...args) },


    // Helper to create inputs with x-model
    "input"() {
        const { i, pos, ops, inner, hash } = normalize(arguments);
        let m = cutOut(pos, 1) || '';
        let d = cutOut(hash, "data") || '';
        let k = cutOut(hash, "key") || cutOut(hash, ":key")
        let c = cutOut(hash, "classes") || '';
        let a = attributes(hash, pos) || '';
        if (inner && i === ("textarea" || "select")) {
            return HBstr(`<${i} x-model="${m}" ${a}>${inner}</${i}>`)
            //USE: {{#input select model}}...x-for, pre-text{{/input}}
        }
        else if (!inner && i === ("select")) {
            return HBstr(`<select x-model="${m}" ${a}>
            <template x-for="op in ${d}" ${k ? `:key="op.${k}"` : ''}>
            <option :value="op" x-text="op" class="${c}">
            </option></template></select>` ); //'op' used internally here
            //USE: {{input 'select' 'modelRef' data="x-data-ref" key=bindTo classes="option css" class="select css"}}
        }
        else { return HBstr(`<input type="${i}" x-model="${m}" ${a} />`) }  // {{input text modelRef}}
    },
    "in"(...args) { return this["input"](...args) },  //Example: {{in radio modelVar}}


    //x-on helper
    "x-on"() {
        const { i, pos, ops, inner, hash } = normalize(arguments);
        let doit = cutOut(pos, 1)
        let e = cutOut(hash, "e") || "button";
        let a = attributes(hash, pos) || '';
        return HBstr(`<${e} @${i}="${doit}" ${a}>${inner || `Click Me`}</${e}>`);
    },
    "on"(...args) { return this["x-on"](...args) },

    //Toggle helper can be any element. Toggles true/false of var
    "toggle"() { //USE: {{#toggle var e=div}}Clickable{{/toggle}}
        const { i, pos, ops, inner, hash } = normalize(arguments);
        let wrap = inner || `Toggle ${i}`;
        let action = cutOut(hash, "when") || 'click'
        let e = cutOut(hash, "e") || cutOut(pos, 1) || "button";
        let a = attributes(hash, pos) || '';
        return HBstr(`<${e} @${action}="${i} = ! ${i}" ${a}>${wrap}</${e}>`);
    },

    //Alpine $fetch plugin used like partial to get HTML (also supports string?)
    //SEE: https://github.com/hankhank10/alpine-fetch
    "x-fetch"() { //USE: {{x-fetch "/path/to/html" m='POST' "div"}}
        const { i, pos, ops, inner, hash } = normalize(arguments);
        let e = cutOut(hash, "e") || 'div'
        let m = cutOut(hash, 'm') || 'GET'
        let l = cutOut(pos, 1)
        let lazy = cutOut(hash, 'lazy') || l==='lazy'?l:'' //if lazy=true or 1 or is 
        let a = attributes(hash, pos) || '';
        return HBstr(`${lazy ? `<div x-data="{ shown: false }" x-intersect.once="shown = true">` : ''}
        <${e} x-html="await $fetch('${i}', method='${m}')" ${lazy ? `x-show="shown"` : ''} ${a}></${e}>
        ${lazy ? `</div>` : ''}`);
    },
    "$f"(...args) { return this["x-fetch"](...args) },
    //USE: {{$f "/some/path/returns/html"}} in x-if, etc...

    "ajax"() { // alternative to HTMX ...one could just use HTMX, though
        const { i, pos, ops, inner, hash } = normalize(arguments);
        let wrap = cutOut(hash, "show") || cutOut(pos, 2) || inner || 'Click Here'
        let json = cutOut(hash, "json")
        let j = json ? `, jsonItem='${json}'` : ''
        let m = `, method='${cutOut(hash, "m") || 'GET'}'`
        let url = cutOut(pos, 1)
        let action = cutOut(hash, 'when') || 'click'
        let e = cutOut(hash, "e") || "button";
        let a = attributes(hash, pos) || '';
        return HBstr(`<${e} @${action}="${i} = await $fetch${j ? 'json' : ''}('${url}'${j}${m})" ${a}>${wrap}</${e}>`);
    }, //USE: {{#ajax "toUpdate" '/path/to/fetch'}}Click{{/ajax}} will update: {{$ toUpdate}}
    "$a"(...args) { return this["ajax"](...args) },

    //...see https://alpinejs.dev/plugins/intersect for lazy-loading, etc
};

// Plugin registration function
export default function alpineHbsHelpers(handlebars) {
    Object.entries(help).forEach(([name, helper]) => {
        handlebars.registerHelper(name, helper.bind(help));
    });
}

//export default help;