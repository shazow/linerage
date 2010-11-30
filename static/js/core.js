function World(target) {
    this.target = target;
    this.size = [640, 480];
    this.boundary = [0, 0, this.size[0], this.size[1]];

    this.canvas = $('<canvas width="' + this.size[0] + 'px" height="' + this.size[1] + 'px"></canvas>').appendTo(this.target);
    this.context = this.canvas[0].getContext("2d");
}
World.prototype = {
    has_at: function(pos) {
        var pixel = this.context.getImageData(pos[0], pos[1], 1, 1);
        return Math.max(pixel.data[0], pixel.data[1], pixel.data[2]) != 0;
    },
    set_at: function(pos, color) {
        var ctx = this.context;
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(pos[0], pos[1], 1, 1);
        ctx.restore();
    },
    reset: function() {
        this.context.clearRect(0, 0, this.size[0], this.size[1]);
    }
}

function Player(world, color, name, controls) {
    // Constants
    this.turn_rate = 0.015;
    this.speed = 1;
    this.angle = 0;

    // Reset
    this.reset();

    // Init
    this.world = world;
    this.color = color;
    this.name = name;
    this.controls = controls;

    this.move();
}
Player.prototype = {
    reset: function() {
        this.loser = false;
        this.pos = [100 + Math.random() * 440, 100 + Math.random() * 280];
        this.angle = Math.random() * 2;
        this.move_buffer = null;
    },
    move: function() {
        if(this.move_buffer) {
            if(this.move_buffer == 'left') this.angle -= this.turn_rate;
            else if(this.move_buffer == 'right') this.angle += this.turn_rate;
        }

        var old_pos = this.get_pos();

        var x = this.pos[0], y = this.pos[1];
        var delta = rotate([this.speed, 0], this.angle * Math.PI);
        this.pos = [x + delta[0], y + delta[1]];

        var new_pos = this.get_pos();

        // Skip render to rounding?
        if(new_pos[0] == old_pos[0] && new_pos[1] == old_pos[1]) return;

        this.loser = this.is_collided(this.world);
        if(this.loser) return;

        this.world.set_at(new_pos, this.color);
    },
    get_pos: function() {
        // Get normalized position on context
        return [Math.round(this.pos[0]), Math.round(this.pos[1])];
    },
    is_collided: function(world) {
        var pos = this.get_pos();
        if(!in_boundary(pos, world.boundary)) {
            console.log(this.name + " fell off. lol!");
            return true;
        }
        if(Math.max(world.has_at(pos))) {
            console.log(this.name + " collided!");
            return true;
        }
        return false;
    }
}

var world, players;

function start_game() {
    world = new World($("#container"));
    players = [
        new Player(world, 'rgba(200,20,20,0.8)', 'Red', {'left': 37, 'right': 39}),
        new Player(world, 'rgba(80,80,240,0.8)', 'Blue', {'left': 65, 'right': 83}),
    ];
    var num_players = players.length, last_player;

    var loop;
    function game_loop() {
        var active_players = 0;
        for(var i=0; i<num_players; i++) {
            var p = players[i];
            if(p.loser) continue

            last_player = p;
            active_players++;
            p.move();
        }
        if(active_players==1) {
            clearInterval(loop);
        }
    }
    loop = window.setInterval(game_loop, 12);

    // Bind controls
    $(document).keydown(function(e) {
        if(e.which == 37) {
            players[0].move_buffer = 'left';
        } else if(e.which == 39) {
            players[0].move_buffer = 'right';
        } else if(e.which == 65) {
            players[1].move_buffer = 'left';
        } else if(e.which == 83) {
            players[1].move_buffer = 'right';
        } else if(e.which == 32) {
            console.log('Resetting');
            clearInterval(loop);
            for(var i=0; i<num_players; i++) players[i].reset();
            world.reset();
            loop = window.setInterval(game_loop, 12);
        }
    }).keyup(function(e) {
        if(e.which == 37 || e.which == 39) players[0].move_buffer = null;
        else if(e.which == 65 || e.which == 83) players[1].move_buffer = null;
    });
}
