function Map(name, src) {
    this.name = name;
    this.src = src;
    this.is_loaded = false;
}
Map.get_collision_bitmap = function(ctx) {
}
Map.prototype = {
    load: function(ctx, callback) {
        var self = this;

        this.ctx = ctx;
        this.img = new Image();
        this.img.onload = function() {
            ctx.drawImage(ctx);
            self.is_loaded = true;
            self._compute_collision_bitmap();
            if(callback !== undefined) callback.call(self);
        }
        this.img.src = this.src;
    },
}

/*** World ***/

function World(canvas) {
    this.size = [canvas.width, canvas.height];
    this.boundary = [0, 0, this.size[0]-1, this.size[1]-1];
    this.bitmap = null;

    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
    this.context.lineWidth = 1.5;
}
World.prototype = {
    set_line: function(pos1, pos2, color) {
        var ctx = this.context;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(pos1[0], pos1[1]);
        ctx.lineTo(pos2[0], pos2[1]);
        ctx.stroke();
    },
    track_collision: function(pos1, pos2, collision_fn) {
        var ctx = this.context;
        var self = this;
        iter_line(pos1, pos2, function(pos) {
            if(pos[0] == pos1[0] && pos[1] == pos1[1]) return; // Skip the first one

            if(self.bitmap[pos[0]][pos[1]] != 0) collision_fn(pos);
            else self.bitmap[pos[0]][pos[1]] = 1;
        });

    },
    reset: function() {
        this.context.clearRect(0, 0, this.size[0], this.size[1]);
        this.bitmap = make_grid(this.size, function() { return 0; });
    }
}

/*** Player ***/

function Player(game, config) {
    // Constants
    this.speed = 8; // Pixels per second
    this.turn_rate = this.speed / 6; // Radians per second
    this.angle = 0;
    this.max_time_alive = 0;
    this.num_wins = 0;

    // Reset
    this.reset();

    // Init
    this.game = game;
    this.color = config.color || 'rgb(255,255,255)';
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
    move: function(world, time_delta) {
        if(this.move_buffer) {
            if(this.move_buffer == 'left') this.angle -= this.turn_rate * time_delta / 1000;
            else if(this.move_buffer == 'right') this.angle += this.turn_rate * time_delta / 1000;
        }

        var old_pos = this.get_pos();

        var x = this.pos[0], y = this.pos[1];
        var delta = rotate([this.speed * time_delta / 100, 0], this.angle * Math.PI);
        this.pos = [x + delta[0], y + delta[1]];

        var new_pos = this.get_pos();

        // Skip render to rounding?
        if(new_pos[0] == old_pos[0] && new_pos[1] == old_pos[1]) return;

        if(!in_boundary(new_pos, world.boundary)) {
            message(this.name + " fell off. lol!");
            this.loser = true;
        }

        if(!this.loser) {
            var self = this;
            world.track_collision(old_pos, new_pos, function(pos) {
                message(self.name + " collided.");
                self.loser = true;
                new_pos = pos;
            });
        }

        world.set_line(old_pos, new_pos, this.color);

        if(this.loser) {
            this.max_time_alive = Math.max(this.max_time_alive, new Date() - this.game.time_started);
        }
    },
    get_pos: function() {
        // Get normalized position on context
        return [Math.round(this.pos[0]), Math.round(this.pos[1])];
    },
    is_collided: function(world, pos) {
        var pos = pos || this.get_pos();
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
            if(self.game._controls_cache[e.which]) return; // Taken
            self.controls[name] = e.which;
            document.onkeydown = fn;
            self.game._refresh_controls_cache();
        }
    }
}
Player.CONTROL_KEYS = ['left', 'right'];
Player.TEMPLATE_LIST = [
    {color: 'rgb(150,30,20)', name: 'Red Player', controls: {'left': 37, 'right': 39}}, // LEFT, RIGHT
    {color: 'rgb(40,70,140)', name: 'Blue Player', controls: {'left': 65, 'right': 83}}, // A, S
    {color: 'rgb(20,140,50)', name: 'Green Player', controls: {'left': 75, 'right': 76}}, // K, S
    {color: 'rgb(160,140,30)', name:  'Yellow Player', controls: {'left': 101, 'right': 103}} // NUM_4, NUM_6
]


/*** Game ***/

function Game(canvas) {
    // TODO: Put these guys into a clojure scope to reduce instance access
    this.world = new World(canvas);
    this.players = [];

    this.num_players = this.players.length;
    this.last_player = null;
    this.num_end = Math.min(1, this.num_players-1);

    this.is_paused = true;
    this.is_ended = true;

    this.loop = null;
    this.time_last_tick = null;
    this.time_started = null;

    var self = this;

    var game_tick = function() {
        var now = new Date();
        var time_delta = now - self.time_last_tick;

        message.render();
        if(self.is_paused) return;

        var active_players = 0;
        for(var i=0; i<self.num_players; i++) {
            var p = self.players[i];
            if(p.loser) continue;

            self.last_player = p;
            active_players++;
            p.move(self.world, time_delta);
        }
        if(active_players==self.num_end) {
            if(self.num_end==0) message("You died.").render();
            else {
                message(self.last_player.name + " wins!").render();
                self.last_player.num_wins++;
                self.last_player.max_time_alive = Math.max(self.last_player.max_time_alive, now - self.time_started);
            }
            self.end();
        }

        self.ui['timer'][0].innerHTML = Number((now - self.time_started)/1000).toFixed(1);
        self.time_last_tick = now;
    }
    this.game_loop = function() {
        game_tick();
        stats.update();
    }

    // Bind controls
    window.onkeydown = function(e) {
        // Find which player owns the key
        if(e.which == 32) {
            if(self.is_ended) self.reset();
            else if(self.is_paused) self.resume();
            else self.pause();

            return;
        }

        var player_action = self._controls_cache[e.which];
        if(player_action) {
            player_action[0].move_buffer = player_action[1];
            game_tick();
        }
    };
    window.onkeyup = function(e) {
        if(e.which == 32) return;

        var player_action = self._controls_cache[e.which];
        if(player_action && player_action[0].move_buffer == player_action[1]) {
            player_action[0].move_buffer = null;
            game_tick();
        }
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

    this.add_player();
    this.add_player();

    message("Ready? Press <em>Space</em> to start.").render();
}
Game.prototype = {
    pause: function() {
        clearInterval(this.loop);

        message("Paused.").render();
        this.is_paused = true;
    },
    resume: function() {
        message("").render();
        this.is_paused = false;
        this.time_last_tick = +new Date();
        this.loop = setInterval(this.game_loop, 1000/30); // Max framerate
    },
    end: function() {
        clearInterval(this.loop);

        this.is_ended = true;
        this.is_paused = true;

        this.ui['root'].removeClass('inactive');
        this.draw_scoreboard();
    },
    reset: function() {
        for(var i=0; i<this.num_players; i++) this.players[i].reset();
        this.world.reset();

        this.is_ended = false;
        this.time_started = +new Date();
        this.resume();

        this.ui['root'].addClass('inactive');
    },
    add_player: function() {
        if(!this.is_ended || this.num_players >= 4) return;
        this.players.push(new Player(this, Player.TEMPLATE_LIST[this.num_players]));
        this.num_players = this.players.length;
        this.num_end = Math.min(1, this.num_players-1);
        this._refresh_controls_cache();
    },
    remove_player: function() {
        if(!this.is_ended || this.num_players <= 1) return;
        this.players.pop();
        this.num_players = this.players.length;
        this.num_end = Math.min(1, this.num_players-1);
        this._refresh_controls_cache();
    },
    draw_scoreboard: function() {
        var self = this;
        var t = this.ui['players'];
        t.empty();
        for(var i=0, stop=this.num_players; i<stop; i++) {
            var p = this.players[i];
            var player_ui = $('<li> \
                <span class="color" style="background: '+p.color+'"></span> \
                <span class="name">'+p.name+'</span> \
                (<span class="wins">'+p.num_wins+'</span> wins, <span class="longest">'+Number(p.max_time_alive/1000).toFixed(1)+'s</span>) \
                <div class="controls"><span class="button">'+ KEY_CODES[p.controls['left']] +'</span> &harr; <span class="button">'+ KEY_CODES[p.controls['right']] +'</span></div> \
            </li>');
            t.append(player_ui);
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
        this.draw_scoreboard();
    }
}
