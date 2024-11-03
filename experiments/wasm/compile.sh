#!/bin/bash

javy build \
    ./dist/hbs-wasm.esm.js \
    -C wit=hbs-wasm.wit \
    -C wit-world=handlebars-world \
    -o handlebars.wasm