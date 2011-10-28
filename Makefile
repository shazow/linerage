VPATH = src/

BUILDDIR = build/linerage

CLOSURE_COMPILER = java -jar util/compiler.jar


javascript: %.js
	$(CLOSURE_COMPILER) $(addprefix --js=,$^) --externs util/jquery-1.4.4.externs.js --js_output_file $@

$(BUILDDIR)/js/%.js: %.js
	mkdir -p $(dir $@)
	$(CC) $< -o $@
