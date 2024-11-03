//SIMPLE TRANSPILE FROM CLAUDE SONNET
package alpinehelpers

import (
	"fmt"
	"html/template"
	"strings"

	"github.com/aymerick/raymond"
)

// Helper function to create a safe HTML string
func safeHTML(s string) raymond.SafeString {
	return raymond.SafeString(s)
}

// normalize is a helper function to standardize arguments
func normalize(args []interface{}) map[string]interface{} {
	options := args[len(args)-1].(raymond.Options)
	pos := args[:len(args)-1]

	return map[string]interface{}{
		"i":     pos[0],
		"pos":   pos,
		"ops":   options,
		"inner": options.FnWith(options.Value),
		"hash":  options.Hash,
	}
}

// cutOut removes and returns a value from a map or slice
func cutOut(input interface{}, key interface{}) interface{} {
	switch v := input.(type) {
	case map[string]interface{}:
		if strKey, ok := key.(string); ok {
			if val, exists := v[strKey]; exists {
				delete(v, strKey)
				return val
			}
		}
	case []interface{}:
		if intKey, ok := key.(int); ok && intKey < len(v) {
			val := v[intKey]
			v = append(v[:intKey], v[intKey+1:]...)
			return val
		}
	}
	return nil
}

// attributes converts a map to HTML attributes string
func attributes(hash map[string]interface{}, pos []interface{}) string {
	attrs := []string{}
	for i := 1; i < len(pos); i++ {
		attrs = append(attrs, fmt.Sprint(pos[i]))
	}
	for k, v := range hash {
		attrs = append(attrs, fmt.Sprintf(`%s="%v"`, k, v))
	}
	return strings.Join(attrs, " ")
}

// Alpine helper for x-data
func alpineHelper(ctx interface{}, args ...interface{}) raymond.SafeString {
	params := normalize(args)
	i := params["i"]
	ops := params["ops"].(raymond.Options)
	hash := params["hash"].(map[string]interface{})
	inner := params["inner"].(string)

	var data string
	if val, ok := ops.Value.(map[string]interface{})[i.(string)]; ok {
		data = fmt.Sprintf("%v", val)
	} else {
		data = i.(string)
	}

	e := cutOut(hash, "e")
	if e == nil {
		e = cutOut(params["pos"].([]interface{}), 1)
	}
	if e == nil {
		e = "div"
	}

	a := attributes(hash, params["pos"].([]interface{}))
	return safeHTML(fmt.Sprintf("<%v x-data='%s' %s>%s</%v>", e, data, a, inner, e))
}

// XText helper for x-text directive
func xTextHelper(ctx interface{}, args ...interface{}) raymond.SafeString {
	params := normalize(args)
	i := params["i"]
	hash := params["hash"].(map[string]interface{})
	pos := params["pos"].([]interface{})

	e := cutOut(hash, "e")
	if e == nil {
		e = cutOut(pos, 1)
	}
	if e == nil {
		e = "span"
	}

	a := attributes(hash, pos)
	return safeHTML(fmt.Sprintf("<%v x-text='%s' %s></%v>", e, i, a, e))
}

// XHtml helper for x-html directive
func xHtmlHelper(ctx interface{}, args ...interface{}) raymond.SafeString {
	params := normalize(args)
	i := params["i"]
	hash := params["hash"].(map[string]interface{})
	pos := params["pos"].([]interface{})

	e := cutOut(pos, 1)
	if e == nil {
		e = "span"
	}

	a := attributes(hash, pos)
	return safeHTML(fmt.Sprintf("<%v x-html='%s' %s></%v>", e, i, a, e))
}

// XShow helper for x-show directive
func xShowHelper(ctx interface{}, args ...interface{}) raymond.SafeString {
	params := normalize(args)
	pos := params["pos"].([]interface{})
	hash := params["hash"].(map[string]interface{})
	inner := params["inner"].(string)

	e := cutOut(pos, 1)
	if e == nil {
		e = "div"
	}

	a := attributes(hash, pos)
	return safeHTML(fmt.Sprintf("<%v x-show='%s' %s>%s</%v>", e, pos[0], a, inner, e))
}

// XIf helper for x-if directive
func xIfHelper(ctx interface{}, args ...interface{}) raymond.SafeString {
	params := normalize(args)
	i := params["i"]
	hash := params["hash"].(map[string]interface{})
	pos := params["pos"].([]interface{})
	inner := params["inner"].(string)

	a := attributes(hash, pos)
	show := inner
	if len(pos) > 1 {
		show = fmt.Sprint(pos[1])
	}
	if val, ok := hash["show"]; ok {
		show = fmt.Sprint(val)
	}

	return safeHTML(fmt.Sprintf("<template x-if='%s' %s>%s</template>", i, a, show))
}

// XFor helper for x-for directive
func xForHelper(ctx interface{}, args ...interface{}) raymond.SafeString {
	params := normalize(args)
	i := params["i"].(string)
	hash := params["hash"].(map[string]interface{})
	pos := params["pos"].([]interface{})
	inner := params["inner"].(string)

	a := attributes(hash, pos)
	if strings.Contains(i, " ") {
		return safeHTML(fmt.Sprintf("<template x-for='%s' %s>%s</template>", i, a, inner))
	}
	return safeHTML(fmt.Sprintf("<template x-for='i in %s' %s>%s</template>", i, a, inner))
}

// XIn helper for x-model inputs
func xInHelper(ctx interface{}, args ...interface{}) raymond.SafeString {
	params := normalize(args)
	i := params["i"]
	hash := params["hash"].(map[string]interface{})
	pos := params["pos"].([]interface{})
	inner := params["inner"].(string)

	m := cutOut(pos, 1)
	if m == nil {
		m = ""
	}

	d := cutOut(hash, "data")
	k := cutOut(hash, "key")
	if k == nil {
		k = cutOut(hash, ":key")
	}
	c := cutOut(hash, "classes")
	a := attributes(hash, pos)

	if inner != "" && (i == "textarea" || i == "select") {
		return safeHTML(fmt.Sprintf("<%s x-model='%s' %s>%s</%s>", i, m, a, inner, i))
	} else if inner == "" && i == "select" {
		return safeHTML(fmt.Sprintf(`<select x-model='%s' %s>
			<template x-for='op in %s' %s>
			<option :value='op' x-text='op' class='%s'>
			</option></template></select>`, m, a, d, k, c))
	}
	return safeHTML(fmt.Sprintf("<input type='%s' x-model='%s' %s />", i, m, a))
}

// Toggle helper for toggling boolean values
func toggleHelper(ctx interface{}, args ...interface{}) raymond.SafeString {
	params := normalize(args)
	i := params["i"]
	hash := params["hash"].(map[string]interface{})
	pos := params["pos"].([]interface{})
	inner := params["inner"].(string)

	wrap := inner
	if wrap == "" {
		wrap = fmt.Sprintf("Toggle %s", i)
	}

	e := cutOut(hash, "e")
	if e == nil {
		e = cutOut(pos, 1)
	}
	if e == nil {
		e = "button"
	}

	a := attributes(hash, pos)
	return safeHTML(fmt.Sprintf("<%s @click='%s = !%s' %s>%s</%s>", e, i, i, a, wrap, e))
}

// XFetch helper for Alpine's $fetch plugin
func xFetchHelper(ctx interface{}, args ...interface{}) raymond.SafeString {
	params := normalize(args)
	i := params["i"].(string)
	hash := params["hash"].(map[string]interface{})
	pos := params["pos"].([]interface{})

	var e, m, url string
	if strings.Contains(i, "/") {
		url = i
		m = ""
		e = cutOut(pos, 1).(string)
		if e == "" {
			e = cutOut(hash, "e").(string)
		}
		if e == "" {
			e = "div"
		}
	} else if len(pos) > 1 && strings.Contains(pos[1].(string), "/") {
		url = cutOut(pos, 1).(string)
		m = fmt.Sprintf(", method='%s'", i)
		e = cutOut(pos, 2).(string)
		if e == "" {
			e = "div"
		}
	}

	a := attributes(hash, pos)
	return safeHTML(fmt.Sprintf("<%s x-html=\"await $fetch('%s'%s)\" %s></%s>", e, url, m, a, e))
}

// XBtn helper for creating buttons with fetch functionality
func xBtnHelper(ctx interface{}, args ...interface{}) raymond.SafeString {
	params := normalize(args)
	i := params["i"]
	hash := params["hash"].(map[string]interface{})
	pos := params["pos"].([]interface{})

	data := cutOut(pos, 1)
	url := cutOut(pos, 2)
	method := cutOut(pos, 3)

	m := ""
	if method != nil {
		m = fmt.Sprintf(", method='%s'", method)
	}

	e := cutOut(hash, "e")
	if e == nil {
		e = "button"
	}

	a := attributes(hash, pos)
	return safeHTML(fmt.Sprintf("<%s @click=\"%s = await $fetch('%s'%s)\" %s>%s</%s>", e, data, url, m, a, i, e))
}

// RegisterAlpineHelpers registers all Alpine helpers with Raymond
func RegisterAlpineHelpers(r *raymond.Handlebars) {
	r.RegisterHelper("alpine", alpineHelper)
	r.RegisterHelper("x", alpineHelper)
	r.RegisterHelper("x-text", xTextHelper)
	r.RegisterHelper("txt", xTextHelper)
	r.RegisterHelper("$", xTextHelper)
	r.RegisterHelper("x-html", xHtmlHelper)
	r.RegisterHelper("htm", xHtmlHelper)
	r.RegisterHelper("$$", xHtmlHelper)
	r.RegisterHelper("x-show", xShowHelper)
	r.RegisterHelper("show", xShowHelper)
	r.RegisterHelper("x-if", xIfHelper)
	r.RegisterHelper("?", xIfHelper)
	r.RegisterHelper("x-for", xForHelper)
	r.RegisterHelper("for", xForHelper)
	r.RegisterHelper("x-in", xInHelper)
	r.RegisterHelper("in", xInHelper)
	r.RegisterHelper("toggle", toggleHelper)
	r.RegisterHelper("x-fetch", xFetchHelper)
	r.RegisterHelper("$f", xFetchHelper)
	r.RegisterHelper("x-btn", xBtnHelper)
}