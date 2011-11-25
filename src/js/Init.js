$("body").disableTextSelect();

var log = log || function() {}; // Default off
var stats = stats || function() {};

var div_game = Dom.select("#game")
var camera = new Game.Camera(div_game, {width: 640, height: 480});
var renderer = new Game.Renderer(camera, 3);
var input = new Game.Input();
var state_machine = new Game.StateMachine();
var engine = new Game.Engine(state_machine);
var clock = new Game.Clock();

var contexts = {
    'level': renderer.layers[0],
    'entity': renderer.layers[1],
    'player': renderer.layers[2]
}

var div_header = Dom.select("#header");
var div_hud = Dom.select("#hud");

var packs = null;
var current_level = null;
var current_pack = null;

var players = [];


var change_level = function(pack, level_idx) {
    pack.levels_idx = level_idx;

    current_pack = pack;
    current_level = pack.levels[level_idx];

    state_machine.enter('loading');
    current_level.load(contexts, function() {
        state_machine.enter('play');
    });
}


state_machine.add('intro', {
    'enter': function() {
        players = [
            new LineRage.Player(input)
        ]

        $(div_header).html('<h1>LineRage</h1>');

        var div_play = $('<div id="play">Play</div>').click(function() {
            state_machine.enter('levels');
        });

        $(div_hud).html(div_play).show();
    }
});

state_machine.add('loading', {
    'enter': function() {
        $(div_hud).html("Loading...").show();
    }
});

state_machine.add('levels', {
    'enter': function() {
        $(div_hud).empty();

        var div_levels = $('<div id="levels"></div>');

        var ul = $('<ul class="horizontal"></ul>').appendTo(div_levels);

        if(!packs) {
            packs = LineRage.load_level_index(level_index);
        }

        // TODO: Multiple packs.
        var pack = current_pack = packs[0];

        var level_idx = 0;
        for(var istop=pack.levels.length; level_idx<istop; level_idx++) {

            (function(level_idx) {
                var level = pack.levels[level_idx];

                var li_level = $('<li></li>').click(function() {
                    change_level(pack, level_idx);
                }).appendTo(ul);

                if(level.is_locked) li_level.addClass("locked");
                // TODO: High score, etc.

            })(level_idx);
        }

        $(div_hud).html(div_levels).show();
    }
});

state_machine.add('play', {
    'enter': function() {
        $(div_hud).empty().hide();
        $(div_header).html('<span class="score">0</span>');

        engine.start();
    },

    'exit': function() {
        engine.stop();
    },

    'run': function() {
        var time_delta = clock.tick();

        for(var i=0, istop=players.length; i<istop; i++) {
            var p = players[i];
            if(p.is_active) {
                p.move(contexts.player, current_level, time_delta);
            }
        }

    }
});

state_machine.add('lose', {
    // TODO: ...
});

state_machine.add('pause', {
    // TODO: ...
});

state_machine.add('win', {
    // TODO: ...
});


state_machine.enter('intro');


input.bind({
    'RIGHT_ARROW': 'p1_right',
    'LEFT_ARROW': 'p1_left'
});


input.keyboard_start();
