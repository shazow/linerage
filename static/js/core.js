function message(s) {
    message._buffer = s;
    return message;
}
message._buffer = null;
message._target = null;
message.render = function() {
    if(message._buffer==null) return;
    if(!message._target) message._target = document.getElementById("messages");
    message._target.innerHTML = message._buffer;
    message._buffer = null;
}

function World(canvas) {
    this.size = [canvas.width, canvas.height];
    this.boundary = [0, 0, this.size[0]-1, this.size[1]-1];

    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
    this.context.lineWidth = 1.5;
}
World.prototype = {
    has_at: function(pos) {
        var pixel = this.context.getImageData(pos[0], pos[1], 1, 1);
        return Math.max(pixel.data[0], pixel.data[1], pixel.data[2]) != 0;
    },
    set_line: function(pos1, pos2, color) {
        var ctx = this.context;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(pos1[0], pos1[1]);
        ctx.lineTo(pos2[0], pos2[1]);
        ctx.stroke();
    },
    reset: function() {
        this.context.clearRect(0, 0, this.size[0], this.size[1]);
    }
}

function Player(game, config) {
    // Constants
    this.turn_rate = 0.045;
    this.speed = 3;
    this.angle = 0;
    this.max_time_alive = 0;
    this.num_wins = 0;

    // Reset
    this.reset();

    // Init
    this.game = game;
    this.color = config.color || 'rgba(255,255,255,1)';
    this.name = config.name || 'Anonymous';
    this.controls = config.controls;
}
Player.prototype = {
    reset: function() {
        this.loser = false;
        this.pos = [100 + Math.random() * 440, 100 + Math.random() * 280];
        this.angle = Math.random() * 2;
        this.move_buffer = null;
    },
    move: function(world) {
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

        this.loser = this.is_collided(world);
        if(this.loser) this.max_time_alive = Math.max(this.max_time_alive, this.game.time_elapsed);
        world.set_line(old_pos, new_pos, this.color);
    },
    get_pos: function() {
        // Get normalized position on context
        return [Math.round(this.pos[0]), Math.round(this.pos[1])];
    },
    is_collided: function(world) {
        var pos = this.get_pos();
        if(!in_boundary(pos, world.boundary)) {
            message(this.name + " fell off. lol!");
            return true;
        }
        if(world.has_at(pos)) {
            message(this.name + " collided.");
            return true;
        }
        return false;
    },
    bind_control_listen: function(name) {
        var fn = document.onkeydown;
        var self = this;
        document.onkeydown = function(e) {
            if(e.which == 32 || e.which == 33) return; // Reserved: ESC and SPACE
            self.controls[name] = e.which;
            document.onkeydown = fn;

            self.world._refresh_controls_cache();
            message("Bound key for player " + self.name +": " + name + " &rarr; " +  KEY_CODES[e.which]).render();
        }
    }
}
Player.CONTROL_KEYS = ['left', 'right'];
Player.TEMPLATE_LIST = [
    {color: 'rgba(200,20,20,0.8)', name: 'Red Player', controls: {'left': 37, 'right': 39}}, // LEFT, RIGHT
    {color: 'rgba(80,80,240,0.8)', name: 'Blue Player', controls: {'left': 65, 'right': 83}}, // A, S
    {color: 'rgba(80,240,80,0.8)', name: 'Green Player', controls: {'left': 75, 'right': 76}}, // K, S
    {color: 'rgba(240,200,40,0.8)', name:  'Yellow Player', controls: {'left': 101, 'right': 103}} // NUM_4, NUM_6
]

function Game(canvas) {
    this.world = new World(canvas);
    this.players = [
        new Player(this, Player.TEMPLATE_LIST[0]),
    ];

    this.num_players = this.players.length;
    this.last_player = null;
    this.num_end = Math.min(1, this.num_players-1);

    this.is_paused = false;
    this.is_ended = true;

    this.loop = null;
    this.time_elapsed = 0;

    var self = this;
    this.game_loop = function() {
        message.render();

        var active_players = 0;
        for(var i=0; i<self.num_players; i++) {
            var p = self.players[i];
            if(p.loser) continue;

            self.last_player = p;
            active_players++;
            p.move(self.world);
        }
        if(active_players==self.num_end) {
            clearInterval(self.loop);

            if(self.num_end==0) message("You died.").render();
            else {
                message(self.last_player.name + " wins!").render();
                self.last_player.num_wins++;
                self.last_player.max_time_alive = Math.max(self.last_player.max_time_alive, self.time_elapsed);
            }
            self.end();
        }

        self.ui['timer'].text(Number(self.time_elapsed).toFixed(1));
        self.time_elapsed += 0.036;
    }

    this._refresh_controls_cache();

    // Bind controls
    document.onkeydown = function(e) {
        // Find which player owns the key
        if(e.which == 32) {
            if(self.is_ended) self.reset();
            else if(self.is_paused) self.resume();
            else self.pause();
            return;
        }

        var player_action = self._controls_cache[e.which];
        if(player_action) player_action[0].move_buffer = player_action[1];
    };
    document.onkeyup = function(e) {
        if(e.which == 32) return;

        var player_action = self._controls_cache[e.which];
        if(player_action && player_action[0].move_buffer == player_action[1]) player_action[0].move_buffer = null;
    };

    this.ui = {
        'root': $("#game nav"),
        'players': $('<ul id="players"></ul>'),
        'timer': $('<div id="timer">0.0</div>'),
        'add_player': $('<input type="button" value="Add Player"></input>').click(function() {
            self.add_player();
        }),
        'remove_player': $('<input type="button" value="Remove Player"></input>').click(function() {
            self.remove_player();
        })
    };
    this.ui['root'].append(this.ui['timer']).append(this.ui['add_player']).append(this.ui['remove_player']).append(this.ui['players']);
    this.draw_scoreboard();

    message("Ready? Press <em>Space</em> to start.").render();
}
Game.prototype = {
    pause: function() {
        message("Paused.").render();
        this.is_paused = true;
        clearInterval(this.loop);
    },
    resume: function() {
        message("").render();
        this.is_paused = false;
        this.loop = setInterval(this.game_loop, 36);
    },
    end: function() {
        this.is_ended = true;
        this.is_paused = true;

        this.ui['root'].removeClass('inactive');
        this.draw_scoreboard();
    },
    reset: function() {
        for(var i=0; i<this.num_players; i++) this.players[i].reset();
        this.world.reset();
        this.time_elapsed = 0;

        this.is_ended = false;
        clearInterval(this.loop);
        this.resume();

        this.ui['root'].addClass('inactive');
    },
    add_player: function() {
        if(!this.is_ended || this.num_players >= 4) return;
        this.players.push(new Player(this, Player.TEMPLATE_LIST[this.num_players]));
        this.num_players = this.players.length;
        this.num_end = Math.min(1, this.num_players-1);
        this._refresh_controls_cache();
        this.draw_scoreboard();
    },
    remove_player: function() {
        if(!this.is_ended || this.num_players <= 1) return;
        this.players.pop();
        this.num_players = this.players.length;
        this.num_end = Math.min(1, this.num_players-1);
        this._refresh_controls_cache();
        this.draw_scoreboard();
    },
    draw_scoreboard: function() {
        var t = this.ui['players'];
        t.empty();
        for(var i=0, stop=this.num_players; i<stop; i++) {
            var p = this.players[i];
            t.append('<li><span class="color" style="background: '+p.color+'"></span><span class="name">'+p.name+'</span> (<span class="wins">'+p.num_wins+'</span> wins, <span class="longest">'+Number(p.max_time_alive).toFixed(1)+'s</span>)</li>');
        }
    },
    _refresh_controls_cache: function() {
        var cache = {};
        for(var i=0, istop=this.players.length; i<istop; i++) {
            var p = this.players[i];
            for(var j=0, jstop=Player.CONTROL_KEYS.length; j<jstop; j++) {
                var name = Player.CONTROL_KEYS[j];
                cache[p.controls[name]] = [p, name];
            }
        }
        this._controls_cache = cache;
    }
}
