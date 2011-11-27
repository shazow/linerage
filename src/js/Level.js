var LineRage = (function(exports) {

    var last_loaded = null;


    /***/


    var LEVEL_MODES = {
        GOAL: 0,
        DEATHMATCH: 1
    }

    var Level = exports.Level = Class({
        size: {x: 0, y: 0, width: 640, height: 480},

        src: null,
        img: null,
        name: 'Unnamed',
        description: 'Don\'t hit things.',
        entities: [],
        min_players: 1,
        max_players: 1,
        mode: LEVEL_MODES.GOAL,

        is_loaded: false,
        is_locked: true,

        high_score: null,
        times_played: 0,

        state: null,

        init: function(config) {
            this.src = config.url;
            this.img = new Image();

            if(config) {
                this.name = config.name || this.name;
                this.description = config.description || this.descripton;
                this.min_players = config.min_players || this.min_players;
                this.max_players = config.max_players || this.max_players;
            }
        },
        unload: function() {
            this.is_loaded = false;
            this.state = null;
        },
        load: function(contexts, players, callback) {
            if(last_loaded && last_loaded != this) last_loaded.unload();

            var self = this;
            var process = function() {
                var ctx = contexts.level;
                ctx.clearRect(0, 0, self.size.width, self.size.height);
                ctx.drawImage(self.img, 0, 0);

                if(!self.is_loaded) {
                    self.is_loaded = true;
                    self.state = new LevelState(contexts, players, self.entities, self.size);
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
        is_collision: function(entity) {
            return this.state.is_collision(entity);
        }
    });

    Level.MODES = LEVEL_MODES;


    /***/


    var LevelState = exports.LevelState = Class({
        size: {x: 0, y: 0, width: 640, height: 480},
        contexts: {},
        players: [],
        entities: [],

        score: 0,
        start_positions: [],
        colliders: {},

        init: function(contexts, players, entities, size) {
            this.contexts = contexts;
            this.players = players;
            this.entities = entities || this.entities;
            this.size = size || this.size;

            // TODO: Invent a CompoundCollider
            this.colliders = {
                entity: new Game.ShapeCollider(),
                level: new Game.BitmapCollider(this.size)
            };

            this.colliders.level.add_canvas(contexts.level);
        },
        reset: function() {
            this.score = 0;

            this.contexts.entity.clearRect(0, 0, this.size.width, this.size.height);
            this.colliders.entity.init();

            this.start_positions = [{pos: {x: 15, y: 15}, angle: 24}];
            // TODO: this.load_entities();

            for(var i=0, stop=this.players.length; i<stop; i++) {
                var start_obj = this.start_positions[i] || {};
                this.players[i].reset(start_obj.pos, start_obj.angle);
            }
        },
        is_collision: function(entity) {
            var r = this.colliders.level.is_collision(entity);
            if(r) return r;

            var r = this.colliders.entity.is_collision(entity);
            if(r) return r;

            return false;
        }
    });



    /***/


    var PACK_MODES = {
        NORMAL: 0,
        LOOP: 1,
        RANDOM: 2
    }

    var LevelPack = exports.LevelPack = Class({
        mode: PACK_MODES.NORMAL,
        levels_idx: 0,
        levels: [],

        init: function(name, levels, mode) {
            this.name = name;
            this.levels = levels;

            if(mode!==undefined) this.mode = mode;
        },
        next: function() {
            if(this.levels_idx >= this.levels.length-1) {
                if(this.mode==PACK_MODES.NORMAL) return false;
                else if(mode==PACK_MODES.LOOP) this.levels_idx = 0;
            }
            if(this.mode==PACK_MODES.RANDOM) this.levels_idx = ~~(Math.random() * (this.levels.length - 1));
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

    LevelPack.MODES = PACK_MODES;


    /***/


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
