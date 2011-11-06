var LineRage = (function(exports) {

    var Player = exports.Player = Class({
        pos: {x: 0, y: 0},

        speed: 8, // Pixels per second
        turn_rate: 8 / 5.5, // Radians per second
        angle: 0,

        max_time_alive: 0,
        num_wins: 0,
        num_deaths: 0,
        score: 0,

        is_active: true,
        move_buffer: null,

        init: function(input, config) {
            this.input = input;
            this.color = config.color || 'rgb(255,255,255)';
            this.name = config.name || 'Hypotenuse';
            this.control_labels = config.control_labels || {'left': 'p1_left', 'right': 'p1_right'};
        },
        move: function(ctx, level, time_delta) {
            if(this.input.pressed(this.control_labels['left'])) {
                this.angle -= this.turn_rate * time_delta / 1000;
            } else if(this.input.pressed(this.control_labels['right'])) {
                 this.angle += this.turn_rate * time_delta / 1000;
            }

            var old_pos = this.get_pos();

            var x = this.pos.x, y = this.pos.y;
            var delta = rotate({x: this.speed * time_delta / 100, y: 0}, this.angle * Math.PI);
            this.pos = {x: x + delta.x, y: y + delta.y};

            var new_pos = this.get_pos();
            var self = this;

            // Skip render to rounding?
            if(new_pos.x == old_pos.x && new_pos.y == old_pos.y) return;

            if(!in_boundary(new_pos, level.size)) {
                this.is_active = false;
                $(window).trigger('die', [self, Player.EVENTS.FALL_OFF]);

            } else if(this.is_active) {

                // FIXME: Clean this up, it's fugly.

                var collider = level.state.entity_collider.collider;

                iter_line(old_pos, new_pos, function(pos) {
                    if(pos.x == old_pos.x && pos.y == old_pos.y) return true; // Skip the first one

                    var hit = level.state.is_collision(pos, true);
                    if(!hit) {
                        return true;
                    }

                    if(hit===true) {
                        self.is_active = false;
                        $(window).trigger('die', [self, Player.EVENTS.COLLIDED])
                        new_pos = self.new_post = pos;
                        return false;
                    }

                    return hit.do_collision(self, ctx);
                });
            }

            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(old_pos.x, old_pos.y);
            ctx.lineTo(new_pos.x, new_pos.y);
            ctx.stroke();
        },
        get_pos: function() {
            // Get normalized position on context
            return {x: Math.round(this.pos.x), y: Math.round(this.pos.y)};
        }
    }

    Player.EVENTS = {
        FALL_OFF: 1,
        COLLIDED: 2,
        ESCAPED: 3,
        SURVIVED: 4
    }

    return exports;
})(LineRage || {});
