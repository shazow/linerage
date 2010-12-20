function Game(canvases) {
    // TODO: Put these guys into a clojure scope to reduce instance access
    this.contexts = {
        'level': canvases['static'].getContext("2d"),
        'entities': canvases['dynamic'].getContext("2d")
    }
    this.contexts.entities.lineWidth = 1.5;

    this.size = [canvases['static'].width, canvases['static'].height];

    this.players = [];
    this.num_players = this.players.length;
    this.num_active = this.num_players;
    this.num_end = Math.min(1, this.num_players-1);

    this.is_ready = false;
    this.is_fresh = false;
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
                    self.reset();
                    message("Ready?");
                    self.continue_fn = self.resume;
                });
            }
        } else {
            self.continue_fn = function() {
                hud.show("packs");
                self.continue_fn = function() {
                    self.reset();
                    hud.show("description");
                    message("Ready?");
                    self.continue_fn = self.resume;
                }
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
        if(self.level.is_deathmatch) {
            // Find active player
            var players = self.players;
            for(var i=players.length-1; i>=0; i--) {
                if(players[i].is_active) {
                    $(window).trigger('win', [players[i], Player.EVENTS.SURVIVED]);
                    return;
                }
            }
        } else if(self.num_players > 1) {
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
        hud.hide();
        message("");
        this.is_paused = false;
        this.continue_fn = this.pause;
        this.is_fresh = false;

        this.time_last_tick = +new Date();
        this.loop = setInterval(this.game_loop, 1000 / 30);
    },
    end: function() {
        clearInterval(this.loop);

        this.is_ended = true;
        this.is_paused = true;

        var self = this;
        this.continue_fn = function() {
            self.reset();
            hud.show("description");
            message("Ready?");
            self.continue_fn = self.resume;
        }
    },
    reset: function() {
        if(!this.is_ready) return;

        var starts = this.level.state.start_positions;

        for(var i=0; i<this.num_players; i++) {
            var start_obj = starts[i] || {};
            this.players[i].reset(start_obj.pos, start_obj.angle);
        }
        this.time_started = +new Date();
        this.num_active = this.num_players;
        this.is_ended = false;
        this.continue_fn = this.pause;

        this.is_fresh = true;

        this._refresh_game_conditions();
        this.level.state.reset();

        $("#score").text("0");
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
        this.end();
        var self = this;
        this.level = level;
        level.load(this.contexts, this.size, function() {
            for(var i=0; self.num_players < level.min_players && i<5; i++) self.add_player();
            for(var i=0; self.num_players > level.max_players && i<5; i++) self.remove_player();

            if(callback!==undefined) callback.call(this);
        });

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
