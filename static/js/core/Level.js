function Level(config) {
    this.src = config.url;
    this.img = new Image();

    this.config = config;
    this.name = config.name

    this.size = [640,480];

    this.unload();
}
Level.last_loaded = null;
Level.prototype = {
    unload: function() {
        this.is_loaded = false;
        this.state = null;
    },
    load: function(ctx, size, callback) {
        this.size = size;

        if(Level.last_loaded && Level.last_loaded != this) Level.last_loaded.unload();

        var self = this;
        var process = function() {
            ctx.clearRect(0, 0, size[0], size[1]);
            ctx.drawImage(self.img, 0, 0);

            if(!self.is_loaded) {
                self.is_loaded = true;
                self.state = new LevelState(size, self.config.entities, ctx);
            }

            if(callback!==undefined) callback();
        }

        if(this.is_loaded) {
            process();
        } else {
            this.img.src = this.src;
            this.img.onload = process;
        }

        Level.last_loaded = self;
    },
    is_collision: function(pos) {
        if(!this.state.level_collider.get(pos)) return false;

        return this.state.entity_collider.get(pos) || true;
    },
}

function LevelState(size, entities, context) {
    this.size = size;
    this.entities = entities;
    this.context = context;

    // TODO: Should these all compound each other?
    this.entity_animator = new EntityAnimator();
    this.entity_collider = new EntityCollider(this.size);
    this.level_collider = new PositionCollider(this.size);

    this.level_collider.init();
    this.level_collider.set_from_canvas(context, [0, 0, this.size[0], this.size[1]]);

    this.reset();
}
LevelState.prototype = {
    load_entities: function() {
        var entities = this.entities;
        for(var i=entities.length-1; i>=0; i--) {
            var e = entities[i];

            switch(e.type) {
                case 'START':
                    this.start_positions.push({'pos': e.pos, 'angle': e.angle});
                    break;
                case 'END':
                    this.is_deathmatch = false;
                    this.entity_collider.add(new EndEntity(e.box));
                    // XXX: Add to animator
                    // XXX: Add to position collider
                    break;
                case 'BONUS':
                    this.entity_collider.add(new BonusEntity(e.box));
                    // XXX: Add to animator;
                    // XXX: Add to position collider
                    break;
            }
        }
    },
    reset: function() {
        this.start_positions = [];
        this.is_deathmatch = true;
        this.score = 0;

        this.entity_collider.init();
        this.entity_animator.init();

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
