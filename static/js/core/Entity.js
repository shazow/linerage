var EntityAnimator = function() {
    this.time_drawn = +new Date();
    this.init();
}
EntityAnimator.prototype = {
    init: function() {
        this.entities = [];
    },
    add: function(entity) {
        this.entities.push(entity);
    },
    remove: function(entity) {
        for(var entities=this.entities, i=entities.length-1; i>=0; i--) {
            if(entity==entities[i]) {
                entities.splice(i, 1);
                return true;
            }
        }
    },
    draw: function(ctx, now) {
        for(var entities=this.entities, i=entities.length-1; i>=0; i--) {
            var entity = entities[i];

            // TODO: Optimize this by keeping a sorted list of entities based
            // on their time to draw.
            if(entity.time_drawn && now - entity.time_drawn < entity.draw_rate) continue;

            entity.draw(ctx);
            entity.time_drawn = now;
        }
        this.time_drawn = now;
    }
}

// TODO: Figure out a way to evict entities on consumption.

// TODO: Abstract this into different types of inherited entities:
//  Animated / Static
//  Position / Box / Radius
//  Collidable / Ghost

function EndEntity(box) {
    this.box = box;

    this.center = boundary_center(box);
    this.length = Math.max(box[2]-box[0], box[3]-box[1]);
}
EndEntity.prototype = {
    is_collidable: true,

    draw: function(ctx) {
        var box = this.box;
        var center = this.center;

        var gradient = ctx.createRadialGradient(center[0], center[1], 0, center[0], center[1], this.length);

        gradient.addColorStop(0, "rgb(0,0,0)");
        gradient.addColorStop(0.4, "rgb(230,170,0)");
        gradient.addColorStop(0.9, "rgb(0,0,0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(box[0], box[1], box[2]-box[0], box[3]-box[1]);

        ctx.strokeStyle = "rgba(0,0,0,0.8)";
        ctx.strokeWidth = 1;
        ctx.strokeRect(box[0], box[1], box[2]-box[0], box[3]-box[1]);

        return true;
    },
    is_collision: function(pos) {
        return in_boundary(pos, this.box);
    },
    do_collision: function(player) {
        player.is_active = false;
        player.score += 1000;
        $("#score").text(player.score);
        $(window).trigger('win', [player, Player.EVENTS.ESCAPED]);
        return false;
    }
}

function BonusEntity(pos) {
    this.pos = pos;
    this.radius = 6;
    this.box = this.get_boundary();
    this.is_active = true;
    this.is_drawn = false;
}
BonusEntity.prototype = {
    is_collidable: true,

    is_collision: function(pos) {
        return in_boundary(pos, this.box);
    },
    do_collision: function(player, ctx) {
        if(!this.is_active) return;

        this.is_active = false;
        player.score += 100;
        message("Yum.");
        $("#score").text(player.score);

        this.clear(ctx);
    },
    get_boundary: function() {
        var x = this.pos[0], y = this.pos[1], radius=this.radius;
        return [x-radius, y-radius, x+radius, y+radius];
    },
    draw: function(ctx) {
        var x = this.pos[0], y = this.pos[1], radius=this.radius;

        ctx.beginPath();
        ctx.arc(x, y, radius - 0.5, 0, Math.PI*2);
        ctx.closePath();
        ctx.fillStyle = 'rgb(190,10,10)';
        ctx.strokeStyle = 'rgb(120,0,0)';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgb(225,150,150)';
        ctx.fillRect(x-radius*0.6, y-radius*0.6, 2, 2);
    },
    clear: function(ctx) {
        var box = this.get_boundary();
        ctx.clearRect(box[0], box[1], box[2]-box[0], box[3]-box[1]);

        // XXX: Remove bits from PositionCollider
        // XXX: Request eviction from animator, entity collider.
    }
}

