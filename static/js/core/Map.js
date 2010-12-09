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

function Level(config) {
    this.src = config.url;
    this.img = new Image();

    this.config = config;
    this.name = config.name

    this.is_loaded = false;
    this.entity_idx = {};
    this.collidable_entities = [];
    this.animated_entities = [];
}
Level.last_loaded = null;
Level.prototype = {
    _preprocess: function() {
        var ctx = this.context;
        var self = this;

        this.bitmap = make_grid(this.size, function(pos) {
            var pixel = ctx.getImageData(pos[0], pos[1], 1, 1).data;
            return 255 == pixel[3];
        });

        if(this.config && this.config.entities) {
            var entities = this.config.entities;
            for(var i=0, stop=entities.length; i<stop; i++) {
                var e = entities[i];
                var o = new (Entities[e.type])(e, this);

                if(!this.entity_idx[e.type]) this.entity_idx[e.type] = [];
                this.entity_idx[e.type].push(o);

                if(o.is_animated) this.animated_entities.push(o);
                if(o.is_collidable) {
                    this.collidable_entities.push(o);

                    iter_box(o.box, function(pos) {
                        self.bitmap[pos[0]][pos[1]]++;
                    });
                }
            }
        }
    },
    load: function(ctx, size, callback) {
        this.context = ctx;
        this.size = size;

        if(Level.last_loaded && Level.last_loaded != this) Level.last_loaded.unload();

        var self = this;
        var process = function() {
            ctx.clearRect(0, 0, size[0], size[1]);
            ctx.drawImage(self.img, 0, 0);

            if(!self.is_loaded) {
                self.is_loaded = true;
                self._preprocess();
            }

            if(callback!==undefined) callback();
        }

        if(this.is_loaded) {
            process();

            // FIXME: Keep better track of the volatile part of the map vs static.
            /*
            var entities = this.collidable_entities;
            for(var i=0, stop=entities.length; i<stop; i++) {
                var e = entities[i];
                if(e.reset !== undefined) e.reset();

                if(e.box) {
                    iter_box(e.box, function(pos) {
                        this.bitmap[pos[0]][pos[1]]++;
                    });
                }
            }
            */
        } else {
            this.img.src = this.src;
            this.img.onload = process;
        }

        Level.last_loaded = self;
    },
    render_entities: function(now) {
        var entities = this.animated_entities;
        for(var i=0, stop=entities.length; i<stop; i++) {
            // FIXME: Get rid of entities that no longer need to be animated
            entities[i].render(now);
        }
    },
    unload: function() {
        this.is_loaded = false;
        this.bitmap = null;
        this.animated_entities = [];
        this.collidable_entities = [];
        this.entity_idx = {};
    },
    is_collision: function(pos) {
        return this.bitmap[pos[0]][pos[1]] != 0;
    },
    is_entity: function(pos) {
        for(var i=0, stop=this.collidable_entities.length; i<stop; i++) {
            var o = this.collidable_entities[i];
            if(o.is_collision(pos)) return o;
        }
        return false;
    },
    has_end: function() {
        return this.entity_idx['END'] !== undefined;
    },
    get_starts: function() {
        return this.entity_idx['START'];
    }
}


/*** Entities ***/

// TODO: Abstract this into different types of inherited entities:
//  Animated / Static
//  Position / Box / Radius
//  Collidable / Ghost

var Entities = {
    'START': StartEntity,
    'END': EndEntity,
    'BONUS': BonusEntity
}


function StartEntity(config, level) {
    this.pos = config.pos;
    this.angle = config.angle;
    this.level = level;
}

function EndEntity(config, level) {
    this.box = config.box;
    this.level = level;
    this.context = level.context;

    this.time_animated = +new Date();
    this.color = new Cycle(EndEntity.colors);

    this.is_animated = true;
    this.is_collidable = true;
}
EndEntity.colors = ['rgb(100,100,100)', 'rgb(120,120,120)', 'rgb(170,170,170)', 'rgb(220,220,220)'];
EndEntity.rate = 1000 / 10;
EndEntity.prototype = {
    render: function(now) {
        if(now - this.time_animated < EndEntity.rate) return true;
        this.time_animated = now;

        var ctx = this.context;
        ctx.fillStyle = this.color.next();

        var box = this.box;
        ctx.fillRect(box[0], box[1], box[2]-box[0], box[3]-box[1]);
        return true;
    },
    is_collision: function(pos) {
        return in_boundary(pos, this.box);
    },
    do_collision: function(player) {
        player.score += 1000;
        $(window).trigger('win', [player, Game.EVENTS.ESCAPED]);
    }
}

function BonusEntity(config, level) {
    this.box = config.box;
    this.level = level;
    this.context = level.context;

    this.is_active = true;
    this.is_animated = true;
    this.is_collidable = true;
}
BonusEntity.prototype = {
    render: function(now) {
        if(!this.is_animated) return false;
        this.is_animated = false;

        var ctx = this.context;
        ctx.fillStyle = 'rgb(180,10,10)';

        var box = this.box;
        ctx.fillRect(box[0], box[1], box[2]-box[0], box[3]-box[1]);
        return false;
    },
    reset: function() {
        this.is_active = true;
        this.is_animated = true;
        this.is_collidable = true;
    },
    is_collision: function(pos) {
        return in_boundary(pos, this.box);
    },
    do_collision: function(player) {
        if(!this.is_active) return;

        this.is_active = false;
        player.score += 1000;
        message("Yum.");

        var box = this.box;
        this.context.clearRect(box[0], box[1], box[2]-box[0], box[3]-box[1]);

        var self = this;
        iter_box(box, function(pos) {
            self.level.bitmap[pos[0]][pos[1]]--;
        });
    }
}

