var LineRage = (function(exports) {

    var last_loaded = null;

    var Level = exports.Level = Class({
        size: {width: 640, height: 480},
        is_loaded: false,
        is_locked: true,
        high_score: null,
        times_played: 0,

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
            return false; // XXX: TODO
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


/***
function Level(config) {
    this.src = config.url;
    this.img = new Image();

    this.config = config;
    this.name = config.name
    this.description = config.description;
    this.min_players = config.min_players || 0;
    this.max_players = Math.min(config.min_players || 4, this.min_players);
    this.is_deathmatch = config.is_deathmatch || false;

    this.size = [640,480];

    this.unload();
}
Level.last_loaded = null;
Level.prototype = {
    unload: function() {
        this.is_loaded = false;
        this.state = null;
    },
    load: function(contexts, size, callback) {
        this.size = size;

        if(Level.last_loaded && Level.last_loaded != this) Level.last_loaded.unload();

        var self = this;
        var process = function() {
            var ctx = contexts.level;
            ctx.clearRect(0, 0, size[0], size[1]);
            ctx.drawImage(self.img, 0, 0);

            if(!self.is_loaded) {
                self.is_loaded = true;
                self.state = new LevelState(size, self.config.entities, contexts);
            }

            if(callback!==undefined) callback();
        }

        if(this.img.src) {
            process();
        } else {
            this.img.src = this.src;
            this.img.onload = process;
        }

        Level.last_loaded = self;
    },
    is_collision: function(pos) {
        if(this.state.level_collider.get(pos)) return true;

        return this.state.entity_collider.get(pos);
    }
}

function LevelState(size, entities, contexts) {
    this.size = size;
    this.entities = entities;
    this.contexts = contexts;

    // TODO: Should these all compound each other?
    this.entity_collider = new EntityCollider(this.size);
    this.level_collider = new PositionCollider(this.size);

    this.level_collider.init();
    this.level_collider.set_from_canvas(contexts.level, [0, 0, this.size[0], this.size[1]]);

    this.reset();
}
LevelState.prototype = {
    load_entities: function() {
        var entities = this.entities;
        if(!entities) return;

        var ctx = this.contexts.entities;

        for(var i=entities.length-1; i>=0; i--) {
            var e = entities[i];

            switch(e.type) {
                case 'START':
                    this.start_positions.push({'pos': e.pos, 'angle': e.angle});
                    break;
                case 'END':
                    this.is_deathmatch = false;

                    var entity = new EndEntity(e.box);
                    this.entity_collider.add(entity);
                    entity.draw(ctx);
                    this.entity_collider.collider.set_box(entity.box);

                    break;
                case 'BONUS':
                    var entity = new BonusEntity(e.pos);

                    this.entity_collider.add(entity);
                    entity.draw(ctx);
                    this.entity_collider.collider.set_box(entity.get_boundary());

                    break;
            }
        }
    },
    reset: function() {
        this.start_positions = [];
        this.is_deathmatch = true;
        this.score = 0;

        var ctx = this.contexts.entities;
        ctx.clearRect(0, 0, this.size[0], this.size[1]);

        this.entity_collider.init();

        this.load_entities();
    }
}



function LevelPack(name, levels, mode) {
    this.name = name;
    this.levels = levels;
    this.current_level = 0;
    this.mode = mode || LevelPack.MODES.NORMAL;
}
LevelPack.MODES = {
    NORMAL: 0,
    LOOP: 1,
    RANDOM: 2
}
LevelPack.prototype = {
    next: function() {
        if(this.current_level >= this.levels.length-1) {
            if(this.mode==LevelPack.MODES.NORMAL) return false;
            else if(mode==LevelPack.MODES.LOOP) this.current_level = 0;
        }
        if(this.mode==LevelPack.MODES.RANDOM) this.current_level = Math.floor(Math.random() * (this.levels.length - 1));
        else this.current_level++;
        return this.levels[this.current_level];
    },
    first: function() {
        this.current_level = 0;
        return this.levels[this.current_level];
    }
}
**/


/***
    function load_levelpack(pack) {
        if(!pack.manifest) return;

        var levels = [];
        for(var j=0, jstop=pack.manifest.levels.length; j<jstop; j++) {
            levels.push(new Level(pack.manifest.levels[j]));
        }
        var levelpack = new LevelPack(pack.name, levels);

        hud.add_pack(levelpack);
    };

    load_levelpack(
        {"name": "Singleplayer Puzzles", "manifest":
            {"levels": [
                {"name": "White Level",
                    "url": "levels/easy/white.png",
                    "description": "<p>Use the arrow keys (left and right) to maneuver your line to the yellow portal.</p><p>Don't hit things. Try to get the delicious red circles for bonus points.</p>",
                    "entities": [
                        {"type": "START", "pos": [5, 5], "angle": 0.25},
                        {"type": "END", "box": [350, 250, 370, 270]},
                        {"type": "BONUS", "pos": [150,150]},
                        {"type": "BONUS", "pos": [300,50]},
                        {"type": "BONUS", "pos": [500,125]},
                        {"type": "BONUS", "pos": [50,320]},
                        {"type": "BONUS", "pos": [600,350]}
                    ]
                },
                {"name": "Pink Level",
                    "url": "levels/easy/pink.png",
                    "description": "<p>You might not get all the bonus points on the first try. There is always tomorrow.</p>",
                    "entities": [
                        {"type": "START", "pos": [200, 2], "angle": 0.35},
                        {"type": "END", "box": [300, 200, 320, 220]},
                        {"type": "BONUS", "pos": [575,75]},
                        {"type": "BONUS", "pos": [440,200]},
                        {"type": "BONUS", "pos": [535,360]},
                        {"type": "BONUS", "pos": [100,300]},
                        {"type": "BONUS", "pos": [170,150]}
                    ]
                },
                {"name": "Orange Level",
                    "url": "levels/easy/orange.png",
                    "description": "",
                    "entities": [
                        {"type": "START", "pos": [2, 164], "angle": 0},
                        {"type": "END", "box": [600,350,620,370]},
                        {"type": "BONUS", "pos": [230,70]},
                        {"type": "BONUS", "pos": [625,25]},
                        {"type": "BONUS", "pos": [630,250]},
                        {"type": "BONUS", "pos": [325,150]},
                        {"type": "BONUS", "pos": [75,350]},
                        {"type": "BONUS", "pos": [330,430]},
                        {"type": "BONUS", "pos": [625,460]},
                        {"type": "BONUS", "pos": [500,360]}
                    ]
                },
                {"name": "Green Level",
                    "url": "levels/easy/green.png",
                    "description": "",
                    "entities": [
                        {"type": "START", "pos": [2, 2], "angle": 0.30},
                        {"type": "END", "box": [375,200,395,220]},
                        {"type": "BONUS", "pos": [520,55]},
                        {"type": "BONUS", "pos": [610,65]},
                        {"type": "BONUS", "pos": [580,430]},
                        {"type": "BONUS", "pos": [500,355]},
                        {"type": "BONUS", "pos": [90,415]},
                        {"type": "BONUS", "pos": [105,140]},
                        {"type": "BONUS", "pos": [510,265]},
                        {"type": "BONUS", "pos": [240,275]}
                    ]
                }
            ]}
        }
    );

    load_levelpack(
        {"name": "Hotseat Deathmatch", "manifest":
            {"levels": [
                {"name": "Two Players",
                    "url": "levels/deathmatch/blank.png",
                    "description": "<p>Player 1 controls: Arrow keys</p><p>Player 2 controls: A/S</p>",
                    "is_deathmatch": true,
                    "max_players": 4,
                    "min_players": 2
                },
                {"name": "Three Players",
                    "url": "levels/deathmatch/blank.png",
                    "description": "<p>Player 1 controls: Arrow keys</p><p>Player 2 controls: A/S</p><p>Player 3 controls: K/L</p>",
                    "is_deathmatch": true,
                    "max_players": 3,
                    "min_players": 3
                },
                {"name": "Four Players",
                    "url": "levels/deathmatch/blank.png",
                    "description": "<p>Player 1 controls: Arrow keys</p><p>Player 2 controls: A/S</p><p>Player 3 controls: K/L</p><p>Player 4 controls: Num Pad</p>",
                    "is_deathmatch": true,
                    "max_players": 4,
                    "min_players": 4
                }
            ]}
        }
    );
***/
