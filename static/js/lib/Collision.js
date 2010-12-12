/*

There's a good amount of repetitive code in this module for the sake of execution optimization.

*/


var CircleEntity = function(pos, radius) {
    this.pos = pos;
    this.radius = radius;
}



var BoxEntity = function(box) {
    this.box = box;
}



var EntityCollider = function() {
    this.circles = [];
    this.boxes = [];
}
EntityCollider.prototype = {
    add: function(entity) {
        if(entity.box) {
            this.boxes.push(entity);
        } else if(entity.pos && entity.radius) {
            this.circles.push(entity);
        }
    },
    remove: function(entity) {
        var boxes = this.boxes;
        for(var i=boxes.length; i>=0; i--) {
            if(entity==boxes[i]) {
                boxes.splice(i, 1);
                return true;
            }
        }

        var circles = this.circles;
        for(var i=circles.length; i>=0; i--) {
            if(entity==circles[i]) {
                circles.splice(i, 1);
                return true;
            }
        }

    },
    check_collisions: function(pos, callback) {
        // Calls callback on collision with position from entity context.

        // Check boxes
        var boxes = this.boxes;
        for(var i=boxes.length-1; i>=0; i--) {
            var entity = boxes[i];
            if(!in_boundary(pos, entity.box)) continue;

            var r = callback.call(entity, pos);
            if(!r) return;
        }

        // Check circles
        var circles = this.circles;
        for(var i=circles.length-1; i>=0; i--) {
            var entity = circles[i];
            if(!in_radius(pos, entity.pos, entity.radius)) continue;

            var r = callback.call(entity, pos);
            if(!r) return;
        }
    }
}


var PositionCollider = function(size) {
    this.size = size;

    var grid = [];

    var w = size[0], h = size[1];
    for (var x=w; x>=0; x--) {
        var row = [];
        for(var y=h; y>=0; y--) row.push(0);
        grid.push(row);
    }
    this.grid = grid;
}
PositionCollider.prototype = {
    set: function(pos, value) {
        this.grid[pos[0]][pos[1]] = value;
    },
    set_box: function(box, value) {
        var x1 = box[0], y1 = box[1], x2 = box[2], y2 = box[3];

        var grid = this.grid;
        for(var x=x1; x<x2; x++) {
            for(var y=y1; y<y2; y++) {
                grid[x][y] = value;
            }
        }
    },
    set_from_canvas: function(ctx, box) {
        var x1 = box[0], y1 = box[1], x2 = box[2], x3 = box[3];
        var dx = x2-x1, dy = y2-y1;

        var data = ctx.getImageData(x1, y2, dx, dy).data;
        var grid = this.grid;

        var i = 3;
        for(var x=x1; x<=x2; x++) {
            for(var y=y1; y<=y2; y++, i+=4) {
                grid[x][y] = data[i] == 255 ? 1 : 0;
            }
        }
    },
    get: function(pos) {
        return this.grid[pos[0]][pos[1]] > 0;
    }
}
