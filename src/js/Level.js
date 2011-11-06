var LineRage = (function(exports) {

    var last_loaded = null;

    var Level = exports.Level = Class({
        size: {x: 0, y: 0, width: 640, height: 480},

        is_loaded: false,
        is_locked: true,

        high_score: null,
        times_played: 0,

        state: null,

        init: function(config) {
            this.src = config.url;
            this.img = new Image();

            this.config = config;
            this.name = config.name
            this.description = config.description;
            this.min_players = config.min_players || 0;
            this.max_players = Math.min(config.min_players || 4, this.min_players);
            this.is_deathmatch = config.is_deathmatch || false;
        },
        unload: function() {
            this.is_loaded = false;
        },
        load: function(contexts, callback) {
            if(last_loaded && last_loaded != this) last_loaded.unload();

            var self = this;
            var process = function() {
                var ctx = contexts.level;
                ctx.clearRect(0, 0, self.size.width, self.size.height);
                ctx.drawImage(self.img, 0, 0);

                if(!self.is_loaded) {
                    self.is_loaded = true;
                }

                if(callback!==undefined) callback();
            }

            if(this.img.src) {
                process();
            } else {
                this.img.src = this.src;
                this.img.onload = process;
            }

            last_loaded = self;
        },
        is_collision: function(pos) {
            if(this.state.level_collider.get(pos)) return true;

            return this.state.entity_collider.get(pos);
        }
    });

    var MODES = {
        NORMAL: 0,
        LOOP: 1,
        RANDOM: 2
    }

    var LevelPack = exports.LevelPack = Class({
        mode: MODES.NORMAL,
        levels_idx: 0,
        levels: [],

        init: function(name, levels, mode) {
            this.name = name;
            this.levels = levels;

            if(mode!==undefined) this.mode = mode;
        },
        next: function() {
            if(this.levels_idx >= this.levels.length-1) {
                if(this.mode==MODES.NORMAL) return false;
                else if(mode==MODES.LOOP) this.levels_idx = 0;
            }
            if(this.mode==MODES.RANDOM) this.levels_idx = Math.floor(Math.random() * (this.levels.length - 1));
            else this.levels_idx++;
            return this.levels[this.levels_idx];
        },
        first: function() {
            this.levels_idx = 0;
            return this.levels[this.levels_idx];
        },
        get_current_level: function() {
            return this.levels[this.levels_idx];
        }

    });

    LevelPack.MODES = MODES;

    var load_level_index = exports.load_level_index = function(index) {
        var packs = [];

        for(var i=0, stop=index['packs'].length; i<stop; i++) {
            var pack_data = index['packs'][i];

            var levels = [];
            for(var j=0, jstop=pack_data['levels'].length; j<jstop; j++) {
                levels.push(new Level(pack_data['levels'][j]));
            }
            packs.push(new LevelPack(pack_data['name'], levels));
        }

        return packs;
    }


    return exports;
})(LineRage || {});
