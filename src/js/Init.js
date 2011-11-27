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


var KEY_CODES = {
    START: Game.Input.KEY_CODES.SPACE,
    CANCEL: Game.Input.KEY_CODES.ESC
}


var change_level = function(pack, level_idx) {
    pack.levels_idx = level_idx;

    current_pack = pack;
    current_level = pack.levels[level_idx];

    state_machine.enter('loading');
    current_level.load(contexts, players, function() {
        state_machine.enter('play');
    });
}


state_machine.add('intro', {
    'enter': function() {
        players = [
            new LineRage.Player(input)
        ]

        $(div_header).html('<h1>LineRage</h1>');

        var next_fn = function() {
            input.queue(KEY_CODES.START, false, true);

            state_machine.enter('levels');
        };

        var div_play = $('<div id="play">Play</div>').click(next_fn);

        input.queue(KEY_CODES.START, next_fn);

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

        renderer.reset(camera);

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

        input.queue(KEY_CODES.START, function() {
            state_machine.enter('pause');
        }, true);

        Game.Time.update();
        clock.tick();

        engine.start();

        stats('num_players', current_level.state.players.length);
    },

    'exit': function() {
        input.queue(KEY_CODES.START, false, true);
        engine.stop();
    },

    'run': function() {
        var time_delta = clock.tick();

        stats('fps', ~~(1000 / time_delta));
        stats('ticks', clock.num_ticks);

        var players = current_level.state.players;
        var active_players = 0;

        for(var i=0, istop=players.length; i<istop; i++) {
            var p = players[i];
            if(p.is_active) {
                active_players++;
                var pos = p.move(contexts.player, current_level, time_delta);

                if(pos) stats('player[' + i + '] pos', pos.x + ',' + pos.y);
            }
        }
        stats('active_players', active_players);

        if(!active_players) {
            state_machine.enter('lose');
        }

    }
});

state_machine.add('lose', {
    'enter': function() {
        var retry_fn = function() {
            current_level.state.reset();
            state_machine.enter('play');
        }

        var cancel_fn = function() {
            state_machine.enter('levels');
        }

        $(div_hud).html('<div id="lose">Try again?</div>').click(retry_fn).show();

        input.queue(KEY_CODES.START, retry_fn, true);
        input.queue(KEY_CODES.CANCEL, cancel_fn, true);
    },
    'exit': function() {
        input.queue(KEY_CODES.START, false, true);
        input.queue(KEY_CODES.CANCEL, false, true);
    }
});

state_machine.add('pause', {
    'enter': function() {
        $(div_hud).html('<div id="paused">Paused</div>').show();

        input.queue(KEY_CODES.START, function() {
            state_machine.enter('play');
        }, true);
    }
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
