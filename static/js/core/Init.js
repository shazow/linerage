var game, stats, levelpack;
$(document).ready(function() {
    $("body").disableTextSelect();
    game = new Game(document.getElementById("static_canvas"), document.getElementById("dynamic_canvas"));

    var levelpacks = [];
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

        game.levelpacks = levelpacks;
        game.current_levelpack = levelpacks[0];
        game.world.load_level(game.current_levelpack.first(), function() {
            game.is_ready = true;
            message("Ready? Press <em>Space</em> to start.");
        });
    });
});
