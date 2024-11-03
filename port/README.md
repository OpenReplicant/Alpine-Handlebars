i considered a number of ways to bring this set of template helpers to non-JS environments.
- binary & wasm module are possible, but not straight-forward to build or use, & questionable performance.
- a server/RPC might work as a persistent microservice any web server could interface with, in parallel!
 (yeah that might be the most practical, not the 'most performant' by however many nanoseconds)
- gRPC code generator could make it instantly polyglot

anyhow...
one could port them to whatever template engine you plan on using - *see html-temp.go*
but to bring existing templates without refactor & keep usage identical, use HBR ports - see *raymond.go*
(then test the ported implementation against JS-HBR as a microservice)

# Handlebars Implementations Across Languages
1. JavaScript (Original)
2. PHP  - LightnCandy   - Handlebars.php
3. Python   - pybars3   - Handlebars.py
4. Ruby   - handlebars.rb
5. Java   - handlebars.java
6. C#   - Handlebars.Net
7. Go   - raymond
8. Rust   - handlebars-rust
9. Perl   - Text::Handlebars
11. Scala    - handlebars.scala
13. Swift    - Handlebars-Swift
14. Kotlin    - handlebars.kt
10. Lua    - lua-handlebars
12. Elixir    - Eex (not a direct implementation, but can be extended to support Handlebars-like syntax)

Note: The quality, maintenance status, and feature completeness of these implementations may vary. Always check the project's documentation and community activity before adopting it for a production project.