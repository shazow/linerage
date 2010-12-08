function World(canvas) {
    this.size = [canvas.width, canvas.height];
    this.boundary = [0, 0, this.size[0]-1, this.size[1]-1];
    this.bitmap = null;

    this.map = null;

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

            if(self.map.is_collision(pos)) return collision_fn(pos);

            if(self.bitmap[pos[0]][pos[1]] != 0) return collision_fn(pos);
            else self.bitmap[pos[0]][pos[1]] = 1;
        });
    },
    reset: function(callback) {
        this.bitmap = make_grid(this.size, function() { return 0; });
        this.load_map(this.map, callback);
    },
    _draw_escape: function(box) {
        var ctx = this.context;
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.fillRect(box[0], box[1], box[2]-box[0], box[3]-box[1]);
    },
    load_map: function(map, callback) {
        this.map = map;
        var self = this;

        map.load(this.context, this.size, function() {
            if(map.object_idx['END']) self._draw_escape(map.object_idx['END'][0].box);
            if(callback!==undefined) callback.call(this);
        });

    }
}