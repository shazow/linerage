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
    this.color = new Cycle(this.colors);
}
EndEntity.prototype = {
    is_collidable: true,
    is_animated: true,
    colors: ['rgb(100,100,100)', 'rgb(120,120,120)', 'rgb(170,170,170)', 'rgb(220,220,220)'],
    draw_rate: 1000 / 5,

    draw: function(ctx) {
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
        $(window).trigger('win', [player, Player.EVENTS.ESCAPED]);
    }
}

function BonusEntity(box) {
    this.box = box;
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
        player.score += 1000;
        message("Yum.");

        this.clear(ctx);
    },
    draw: function(ctx) {
        ctx.fillStyle = 'rgb(180,10,10)';

        var box = this.box;
        ctx.fillRect(box[0], box[1], box[2]-box[0], box[3]-box[1]);
    },
    clear: function(ctx) {
        var box = this.box;
        ctx.clearRect(box[0], box[1], box[2]-box[0], box[3]-box[1]);

        // XXX: Remove bits from PositionCollider
        // XXX: Request eviction from animator, entity collider.
    }
}

