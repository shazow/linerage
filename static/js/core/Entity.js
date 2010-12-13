// TODO: Abstract this into different types of inherited entities:
//  Animated / Static
//  Position / Box / Radius
//  Collidable / Ghost
function EndEntity(box) {
    this.box = box;

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

function BonusEntity(box) {
    this.box = box;
    this.is_active = true;
    this.is_animated = true;
    this.is_collidable = true;
}
BonusEntity.prototype = {
    is_collision: function(pos) {
        return in_boundary(pos, this.box);
    },
    do_collision: function(player) {
        if(!this.is_active) return;

        this.is_active = false;
        player.score += 1000;
        message("Yum.");
    },
    draw: function(ctx) {
        if(!this.is_animated) return false;
        this.is_animated = false;

        var ctx = this.context;
        ctx.fillStyle = 'rgb(180,10,10)';

        var box = this.box;
        ctx.fillRect(box[0], box[1], box[2]-box[0], box[3]-box[1]);
        return false;
    },
    clear: function(ctx) {
        var box = this.box;
        ctx.clearRect(box[0], box[1], box[2]-box[0], box[3]-box[1]);

        // XXX: Remove bits from PositionCollider
        // XXX: Request eviction from animator, entity collider.
    }
}

