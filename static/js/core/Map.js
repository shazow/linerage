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

    this.is_loaded = false;
    this.object_idx = {};
    this.collision_boxes = [];
}
Level.prototype = {
    _preprocess: function() {
        var ctx = this.context;
        var self = this;

        this.bitmap = make_grid(this.size, function(pos) {
            var pixel = ctx.getImageData(pos[0], pos[1], 1, 1).data;
            return 255 == pixel[3];
        });

        if(this.config && this.config.objects) {
            var objects = this.config.objects;
            for(var i=0, stop=objects.length; i<stop; i++) {
                var o = objects[i];
                if(!this.object_idx[o.type]) this.object_idx[o.type] = [];
                this.object_idx[o.type].push(o);

                if(o.box === undefined) continue;

                this.collision_boxes.push(o);
                iter_box(o.box, function(pos) {
                    self.bitmap[pos[0]][pos[1]] = 2;
                });
            }
        }
    },
    load: function(ctx, size, callback) {
        this.context = ctx;
        this.size = size;

        var self = this;
        var process = function() {
            ctx.clearRect(0, 0, size[0], size[1]);
            ctx.drawImage(self.img, 0, 0);

            if(!self.is_loaded) {
                self.is_loaded = true;
                self._preprocess();
            }

            if(callback !== undefined) callback.call(self);
        }

        if(this.is_loaded) {
            process();
        } else {
            this.img.src = this.src;
            this.img.onload = process;
        }
    },
    is_collision: function(pos) {
        return this.bitmap[pos[0]][pos[1]] != 0;
    },
    is_object: function(pos) {
        for(var i=0, stop=this.collision_boxes.length; i<stop; i++) {
            var o = this.collision_boxes[i];
            if(in_boundary(pos, o.box)) return o;
        }
        return false;
    },
    has_end: function() {
        return this.object_idx['END'] !== undefined;
    }
}
