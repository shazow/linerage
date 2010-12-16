function Game(canvases) {
    // TODO: Put these guys into a clojure scope to reduce instance access
    this.contexts = {
        'level': canvases.static.getContext("2d"),
        'entities': canvases.dynamic.getContext("2d")
    }
    this.contexts.entities.lineWidth = 1.5;

    this.size = [canvases.static.width, canvases.static.height];

    this.players = [];
    this.num_players = this.players.length;
    this.num_active = this.num_players;
    this.num_end = Math.min(1, this.num_players-1);

    this.is_ready = false;
    this.is_paused = true;
    this.is_ended = true;

    this.loop = null;
    this.time_last_tick = null;
    this.time_started = null;

    this.levelpack = null;
    this.level = null;

    var self = this;
    var tick_num = 0;

    var entity_context = this.contexts.entities;

    var game_tick = function() {
        var now = +new Date();
        var time_delta = now - self.time_last_tick;

        if(self.is_paused) return;

        for(var i=0; i<self.num_players; i++) {
            var p = self.players[i];
            if(p.is_active) p.move(entity_context, self.level, time_delta);
        }

        // Execute the rest half as frequently
        if(tick_num % 2 == 0) {
            self.ui['timer'][0].innerHTML = Number((now - self.time_started)/1000).toFixed(1);
        }
        self.time_last_tick = now;
        tick_num++;
    }
    this.game_loop = function() {
        game_tick();
        if(stats!==undefined) stats.update();
    }

    this.continue_fn = this.reset;

    // Bind controls
    window.onkeydown = function(e) {
        // Find which player owns the key
        if(e.which == 32) {
            return self.continue_fn();
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

    $(window).bind('win', function(e, player, how) {
        e.stopPropagation();

        self.end();
        player.num_wins++;
        player.max_time_alive = Math.max(player.max_time_alive, self.time_last_tick - self.time_started);

        if(how==Player.EVENTS.ESCAPED) {
            message(player.name + " escaped successfully!");
        } else {
            message(player.name + " wins!");
        }

        if(self.levelpack) {
            var m = self.levelpack.next();
            if(!m) {
                message("Winner is you.");
                return false;
            }
            self.continue_fn = function() {
                message("Loading.");
                self.load_level(m, function() {
                    self.is_ready = true;
                    message("Ready?");
                    self.continue_fn = self.reset;
                });
            }
        }
        return false;
    }).bind('die', function(e, player, how) {
        e.preventDefault();
        e.stopPropagation();
        self.num_active--;
        player.is_active = false;

        player.max_time_alive = Math.max(player.max_time_alive, self.time_last_tick - self.time_started);
        player.num_deaths++;

        if(self.num_active<=self.num_end) {
            $(window).trigger('lose', [player, how]);
            return false;
        }
        if(how==Player.EVENTS.FALL_OFF) {
            message(player.name + " fell off. lol!");
        } else if(how==Player.EVENTS.COLLIDED) {
            message(player.name + " collided.");
        } else {
            message(player.name + " died.");
        }
        return false;
    }).bind('lose', function(e, player, how) {
        if(self.num_players > 1) {
            message("Complete failure.");
        } else if(how==Player.EVENTS.COLLIDED || how==Player.EVENTS.FALL_OFF) {
            message("You died.");
        } else {
            message("You lose.");
        }
        self.end();
        return false;
    });
}
Game.prototype = {
    pause: function() {
        clearInterval(this.loop);

        message("Paused.");
        this.is_paused = true;
        this.continue_fn = this.resume;
    },
    resume: function() {
        message("");
        this.is_paused = false;
        this.continue_fn = this.pause;

        this.time_last_tick = +new Date();
        this.loop = setInterval(this.game_loop, 1000 / 30);
    },
    end: function() {
        clearInterval(this.loop);

        this.is_ended = true;
        this.is_paused = true;
        this.continue_fn = this.reset;

        this.ui['root'].removeClass('inactive');
        this.draw_scoreboard();
    },
    reset: function() {
        if(!this.is_ready) return;
        var starts = this.level.state.start_positions;
        for(var i=0; i<this.num_players; i++) {
            var start_obj = starts[i];
            this.players[i].reset(start_obj.pos, start_obj.angle);
        }
        this.time_started = +new Date();
        this.num_active = this.num_players;
        this.is_ended = false;
        this.continue_fn = this.pause;

        this.ui['root'].addClass('inactive');

        this._refresh_game_conditions();
        this.level.state.reset();
        this.resume();
    },
    add_player: function() {
        if(!this.is_ended || this.num_players >= 4) return;
        this.players.push(new Player(Player.TEMPLATE_LIST[this.num_players]));
        this.num_players = this.players.length;
        this._refresh_controls_cache();
    },
    remove_player: function() {
        if(!this.is_ended || this.num_players <= 1) return;
        this.players.pop();
        this.num_players = this.players.length;
        this._refresh_controls_cache();
    },
    _refresh_game_conditions: function() {
        if(!this.level.is_deathmatch) {
            this.num_end = 0;
        } else {
            this.num_end = Math.min(1, this.num_players-1);
        }
    },
    load_level: function(level, callback) {
        this.level = level;
        level.load(this.contexts, this.size, function() {
            if(callback!==undefined) callback.call(this);
        });

    },
    draw_scoreboard: function() {
        var self = this;
        var t = this.ui['players'];
        t.empty();
        for(var i=0, stop=this.num_players; i<stop; i++) {
            var p = this.players[i];
            var seconds = Number(p.max_time_alive / 1000).toFixed(1);
            var player_ui = $('<li><span class="color" style="background: '+p.color+'"></span> <span class="name">'+p.name+'</span> (<span class="wins">'+p.num_wins+'</span> wins, <span class="longest">'+seconds+'s</span>) <div class="controls"><span class="button">'+ KEY_CODES[p.controls['left']] +'</span> &harr; <span class="button">'+ KEY_CODES[p.controls['right']] +'</span></div> </li>');
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
    },
    bind_control_listen: function(player, name) {
        var fn = document.onkeydown;
        var self = this;
        document.onkeydown = function(e) {
            if(e.which == 32 || e.which == 33) return; // Reserved: ESC and SPACE // FIXME: Use a dict
            if(self._controls_cache[e.which]) return; // Taken
            player.controls[name] = e.which;
            document.onkeydown = fn;
            self._refresh_controls_cache();
        }
    }
}
