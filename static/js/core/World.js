function World(canvas) {
    this.size = [canvas.width, canvas.height];
    this.boundary = [0, 0, this.size[0]-1, this.size[1]-1];
    this.bitmap = null;

    this.level = null;

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
            if(pos[0] == pos1[0] && pos[1] == pos1[1]) return true; // Skip the first one

            if(self.level.is_collision(pos)) {
                collision_fn(pos);
                return false;
            }

            if(self.bitmap[pos[0]][pos[1]] != 0) {
                collision_fn(pos);
                return false;
            }
            else self.bitmap[pos[0]][pos[1]] = 1;
            return true;
        });
    },
    reset: function(callback) {
        this.bitmap = make_grid(this.size, function() { return 0; });
        this.load_level(this.level, callback);
    },
    load_level: function(level, callback) {
        this.level = level;
        var self = this;

        level.load(this.context, this.size, function() {
            if(callback!==undefined) callback.call(this);
        });

    }
}
