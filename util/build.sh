#!/bin/sh

if [ ! -d ../build ]; then
    echo "build dir doesn't exist. aborting."
    exit 1;
fi

BUILD_PATH=../build/linerage
WORKING_PATH=../static

rm -rf $BUILD_PATH
mkdir -p $BUILD_PATH/{js,css,levels}
cp -vr $WORKING_PATH/js/extern $BUILD_PATH/js/extern
cp -v $WORKING_PATH/built.html $BUILD_PATH/index.html
cp -vr $WORKING_PATH/css/* $BUILD_PATH/css/
cp -vr $WORKING_PATH/levels/* $BUILD_PATH/levels/

echo "Compiling..."

# --compilation_level ADVANCED_OPTIMIZATIONS \
java -jar compiler.jar \
    --js_output_file ../build/linerage/js/all.js \
    --externs jquery-1.4.4.externs.js \
    --js ../static/js/lib/Util.js \
    --js ../static/js/lib/Collision.js \
    --js ../static/js/core/Player.js \
    --js ../static/js/core/Entity.js \
    --js ../static/js/core/Level.js \
    --js ../static/js/core/Hud.js \
    --js ../static/js/core/Game.js \
    --js ../static/js/core/Init.js \
