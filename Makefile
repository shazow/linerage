BUILD_DIR = build/linerage
SOURCE_DIR = src
VPATH = $(SOURCE_DIR)

CLOSURE_COMPILER = java -jar util/compiler.jar

JS_MANIFEST := $(SOURCE_DIR)/js/core/*.js $(SOURCE_DIR)/js/lib/*.js
JS_EXTERNS := $(SOURCE_DIR)/js/extern/*.js
STATIC_MANIFEST := $(addprefix $(BUILD_DIR)/,$(shell cd $(SOURCE_DIR) && find {levels,images} -type f))
STATIC_DIRS := $(dir $(STATIC_MANIFEST))

$(BUILD_DIR)/js/all.js: $(JS_MANIFEST)
	$(CLOSURE_COMPILER) \
		$(addprefix --js=,$^) \
		$(addprefix --externs=,$(wildcard $(JS_EXTERNS))) \
		--js_output_file $@

$(BUILD_DIR)/index.html: built.html
	cp $? $(BUILD_DIR)/index.html

$(BUILD_DIR)/icon%.png: images/icon%.png
	cp $? $(BUILD_DIR)/

$(BUILD_DIR)/%: %
	cp $? $@

all: build

$(STATIC_DIRS): $(patsubst $(BUILD_DIR),$(SOURCE_DIR),$(STATIC_DIR))
	echo $?

tree: $(STATIC_DIRS)
	mkdir -p $?

js: tree $(BUILD_DIR)/js/all.js

static: tree $(STATIC_MANIFEST) $(BUILD_DIR)/index.html

build: tree js static

serve: build
	cd $(BUILD_DIR)
	python -m SimpleHTTPServer

dist: clean build
	cd $(BUILD_DIR)
	rm ../linerage.zip
	zip -r ../linerage.zip .

clean:
	rm -rf $(BUILD_DIR)

