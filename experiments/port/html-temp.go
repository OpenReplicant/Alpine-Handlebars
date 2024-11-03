//EXAMPLE TRANSPILE VIA CLAUDE SONNET ...didn't even capture all the logic
package alpinehelpers

import (
	"fmt"
	"html/template"
	"strings"
)

// Helper function to create a safe HTML string
func safeHTML(s string) template.HTML {
	return template.HTML(s)
}

// AlpineData creates an element with x-data attribute
func AlpineData(data string, element string, attributes string) template.HTML {
	return safeHTML(fmt.Sprintf("<%s x-data='%s' %s>{{.}}</%s>", element, data, attributes, element))
}

// XText creates an element with x-text directive
func XText(value string, element string, attributes string) template.HTML {
	return safeHTML(fmt.Sprintf("<%s x-text='%s' %s></%s>", element, value, attributes, element))
}

// XHtml creates an element with x-html directive
func XHtml(value string, element string, attributes string) template.HTML {
	return safeHTML(fmt.Sprintf("<%s x-html='%s' %s></%s>", element, value, attributes, element))
}

// XShow creates an element with x-show directive
func XShow(condition string, element string, attributes string) template.HTML {
	return safeHTML(fmt.Sprintf("<%s x-show='%s' %s>{{.}}</%s>", element, condition, attributes, element))
}

// XIf creates a template with x-if directive
func XIf(condition string, attributes string) template.HTML {
	return safeHTML(fmt.Sprintf("<template x-if='%s' %s>{{.}}</template>", condition, attributes))
}

// XFor creates a template with x-for directive
func XFor(iterator string, attributes string) template.HTML {
	return safeHTML(fmt.Sprintf("<template x-for='%s' %s>{{.}}</template>", iterator, attributes))
}

// XInput creates an input element with x-model directive
func XInput(inputType string, model string, attributes string) template.HTML {
	return safeHTML(fmt.Sprintf("<input type='%s' x-model='%s' %s />", inputType, model, attributes))
}

// XToggle creates a toggleable element
func XToggle(variable string, element string, attributes string) template.HTML {
	return safeHTML(fmt.Sprintf("<%s @click='%s = !%s' %s>{{.}}</%s>", element, variable, variable, attributes, element))
}

// XFetch creates an element that fetches and displays HTML content
func XFetch(url string, method string, element string, attributes string) template.HTML {
	fetchAttr := fmt.Sprintf("x-html=\"await $fetch('%s'%s)\"", url, method)
	return safeHTML(fmt.Sprintf("<%s %s %s></%s>", element, fetchAttr, attributes, element))
}

// RegisterAlpineHelpers registers all Alpine helpers with the provided template
func RegisterAlpineHelpers(tmpl *template.Template) {
	funcMap := template.FuncMap{
		"alpineData": AlpineData,
		"xText":      XText,
		"xHtml":      XHtml,
		"xShow":      XShow,
		"xIf":        XIf,
		"xFor":       XFor,
		"xInput":     XInput,
		"xToggle":    XToggle,
		"xFetch":     XFetch,
	}
	tmpl.Funcs(funcMap)
}

/*
IN GO:
import (
    "html/template"
    "alpinehelpers"
)

func main() {
    tmpl := template.New("example")
    alpinehelpers.RegisterAlpineHelpers(tmpl)
    // Parse your template files and execute them
}

IN HTML:
{{ alpineData "{count: 0}" "div" "class='counter'" }}
  {{ xToggle "count" "button" "class='btn'" }}Clicky{{ end }}
  <p>Count: {{ xText "count" "span" "" }}</p>
{{ end }}
*/