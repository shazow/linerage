Function.prototype.bind = function(bind) {
    var self = this;
    return function () {
        var args = Array.prototype.slice.call(arguments);
        return self.apply(bind || null, args);
    };
};

/** Geometry and vectors **/

function in_boundary(pos, box) {
    return pos[0] >= box[0] && // x1
           pos[1] >= box[1] && // y1
           pos[0] <= box[2] && // x2
           pos[1] <= box[3];   // y2
}

function in_radius(pos, circle_pos, circle_radius) {
    var dx = pos[0] - circle_pos[0], dy = pos[1] - circle_pos[1];
    return circle_radius*circle_radius >= dx*dx + dy*dy;
}

function boundary_center(box) {
    return [box[0] - (box[0]-box[2]) / 2, box[1] - (box[1]-box[3]) / 2];
}

function bounding_square(pos, size) {
    /* Given pos [x1, y1] with size scalar,
 [x1, y1, x2: "   * Returns boundary", y2] */
    return [pos[0], pos[1]+size, pos[1], pos[1]+size];
}

function rotate(vector, angle) {
    // Rotate vector by angle (in radians)
    var x = vector[0], y = vector[1];
    var sin = Math.sin(angle), cos = Math.cos(angle);
    return [x * cos - y * sin, x * sin + y * cos];
}


/** Binary Search **/

var binary_search = function(a, val, compare_fn) {
    // Returns (positive) index of element if found (not necessarily the first),
    // otherwise (negative) negated index of insertion point.

    var left = 0, right = a.length;

    // Tight loop optimization
    if(compare_fn) {
        while(left < right) {
            var middle = (left + right) >> 1;
            compare_fn(a[middle], val) ? left = middle + 1 : right = middle;
        }
        return compare_fn(a[left], val) ? left : ~left;
    } else {
        while(left < right) {
            var middle = (left + right) >> 1;
            a[middle] < val ? left = middle + 1 : right = middle;
        }
        return a[left] == val ? left : ~left;
    }
}

var binary_insert = function(a, val, compare_fn) {
    // Returns position of insertion

    var i = binary_search(a, val, compare_fn);
    if(i < 0) i = ~i;
    a.splice(i, 0, val);
    return i;
}

var binary_remove = function(a, val, compare_fn) {
    // Returns removed element

    var i= binary_search(a, val, compare_fn);
    return (i >= 0) ? a.splice(i, 1)[0] : false;
}



/****/

function Cycle(a) {
    var i = 0, stop = a.length;
    return function() {
        if(i==stop) i = 0;
        return a[i++];
    }
}

function CounterCallback(count, callback) {
    return function() {
        if(--count == 0) callback();
    }
}


function make_grid(size, fn) {
    // size -> [dx, dy]
    // fn -> Value to use based on position.
    // Returns a 2d grid of dimensions `size`.
    var grid = [];
    for (var x=0, width=size[0]; x<width; x++) {
        var row = [];
        for(var y=0, height=size[1]; y<height; y++) row.push(fn([x,y]));
        grid.push(row);
    }
    return grid;
}

function make_grid_fast(size, value) {
    var grid = [];
    var w = size[0]-1, h = size[1]-1;
    for (var x=w; x>=0; x--) {
        var row = [];
        for(var y=h; y>=0; y--) row.push(value);
        grid.push(row);
    }
    return grid;
}

function iter_box(box, fn) {
    // Given a box, call fn with the position of each element.
    var x1 = box[0], y1 = box[1], x2 = box[2], y2 = box[3];

    for(var x=x1; x<x2; x++) {
        for(var y=y1; y<y2; y++) {
            fn([x, y]);
        }
    }
}

function iter_line(A, B, fn) {
    // Bresenham's line algorithm from point A to point B.

    var x0 = A[0], x1 = B[0], y0 = A[1], y1 = B[1];

    var steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    if(steep) {
        x0 = A[1]; y0 = A[0]; // Swap x0 <-> y0
        x1 = B[1]; y1 = B[0]; // Swap x1 <-> y1
    }

    if(x0 > x1) {
        var t = x0; x0 = x1, x1 = t; // Swap x0 <-> x1
        var t = y0; y0 = y1; y1 = t; // Swap y0 <-> y1
    }

    var dx = x1 - x0, dy = Math.abs(y1 - y0);
    var error = dx / 2, ystep = -1;
    if(y0 < y1) ystep = 1;

    var r;
    for(var x=x0, y=y0, stop=x1; x<=stop; x++) {
        if(steep) r = fn([y,x])
        else r = fn([x,y]);

        if(r==false) return false;

        error -= dy;
        if(error < 0) {
            y += ystep;
            error += dx;
        }
    }
}

function draw_grid_to_ctx(grid, ctx, box) {
    ctx.fillStyle = 'rgb(255,255,255)';
    iter_box(box, function(pos) {
        if(!grid[pos[0]][pos[1]]) return;
        ctx.fillRect(pos[0], pos[1], 1, 1);
    });
}

function ctx_xy_to_rgb(ctx, xy) {
    var img=ctx.getImageData(xy[0],xy[1],1,1);
    return [img.data[0], img.data[1], img.data[2]];
}


function flat_idx(dim, pos) {
    return (pos[0] * dim[0] * dim[2]) + (pos[1] * dim[2]) + pos[2];
}

function message(s) {
    if(message._target===undefined) message._target = document.getElementById("messages");
    message._target.innerHTML = s;
    return message;
}

function inverse_lookup(o) {
    var r = {};
    for(var k in o) {
        r[o[k]] = k;
    }
    return r;
}
