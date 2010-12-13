var game, stats, levelpacks = [];
$(document).ready(function() {
    $("body").disableTextSelect();
    game = new Game({
        'static': document.getElementById("static_canvas"),
        'dynamic': document.getElementById("dynamic_canvas")
    });

    $.getJSON("levels/index.json", function(r) {
        foo = r;
        for(var i=0, stop=r.packs.length; i<stop; i++) {
            var pack = r.packs[i];

            // FIXME: Let levelpacks load dynamically later?
            if(!pack.manifest) continue;

            var levels = [];
            for(var j=0, jstop=pack.manifest.levels.length; j<jstop; j++) {
                levels.push(new Level(pack.manifest.levels[j]));
            }
            levelpacks.push(new LevelPack(r.name, levels));
        }

        game.levelpack = levelpacks[0];
        game.load_level(game.levelpack.first(), function() {
            game.is_ready = true;
            message("Ready? Press <em>Space</em> to start.");
        });
    });
});
