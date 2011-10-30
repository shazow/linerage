$("body").disableTextSelect();

var div_game = Dom.select("#game")
var camera = new Game.Camera(div_game, {width: 640, height: 480});
var renderer = new Game.Renderer(camera, 2);
var input = new Game.Input();
var state_machine = new Game.StateMachine();
var engine = new Game.Engine(state_machine);
var clock = new Game.Clock();


var div_header = Dom.select("#header");
var div_hud = Dom.select("#hud");

var current_level = false;


state_machine.add('intro', {
    'enter': function() {
        $(div_header).html('<h1>LineRage</h1>');

        var div_play = $('<div id="play">Play</div>').click(function() {
            state_machine.enter('levels');
        });

        $(div_hud).html(div_play).show();
    }
});

state_machine.add('levels', {
    'enter': function() {
        $(div_hud).empty();

        var div_levels = $('<div id="levels"></div>');

        var ul = $('<ul class="horizontal"></ul>').appendTo(div_levels);

        // TODO: Use actual levels
        for(var i=12; i>0; i--) {
            $('<li class="locked"></li>').appendTo(ul).click(function() {
                current_level = i;
                state_machine.enter('play');
            });
        }

        $(div_hud).html(div_levels).show();
    }
});

state_machine.add('play', {
    'enter': function() {
        $(div_hud).empty().hide();
        $(div_header).html('<span class="score">0</span>');
    }
});

state_machine.add('lose', {
    'enter': function() {

    }
});


state_machine.enter('intro');
input.keyboard_start();
