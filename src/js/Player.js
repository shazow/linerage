var LineRage = (function(exports) {

    var PLAYER_SPEED = 8; // Pixels per second
    var PLAYER_TURN_RATE = 8 / 5.5; // Radians per second

    var Player = exports.Player = Class({
        pos: {x: 0, y: 0},

        speed: PLAYER_SPEED,
        turn_rate: PLAYER_TURN_RATE,
        angle: 0,

        color: 'rgb(255,255,255)',
        name: 'Hypotenuse',
        control_labels: {'left': 'p1_left', 'right': 'p1_right'},

        max_time_alive: 0,
        num_wins: 0,
        num_deaths: 0,
        score: 0,

        is_active: true,
        move_buffer: null,

        init: function(input, config) {
            this.input = input;

            if(config) {
                this.color = config.color || 'rgb(255,255,255)';
                this.name = config.name || 'Hypotenuse';
                this.control_labels = config.control_labels || {'left': 'p1_left', 'right': 'p1_right'};
            }
        },
        reset: function(pos, angle) {
            this.pos = pos;
            this.angle = angle;

            this.is_active = true;
            this.move_buffer = null;
        },
        move: function(ctx, level, time_delta) {
            if(this.input.pressed[this.control_labels['left']]) {
                this.angle -= this.turn_rate * time_delta / 1000;
            } else if(this.input.pressed[this.control_labels['right']]) {
                this.angle += this.turn_rate * time_delta / 1000;
            }

            var old_pos = this.get_pos();

            var x = this.pos.x, y = this.pos.y;
            var delta = unstdlib.rotate({x: this.speed * time_delta / 100, y: 0}, this.angle * Math.PI);
            this.pos = {x: x + delta.x, y: y + delta.y};

            var new_pos = this.get_pos();
            var self = this;

            // Skip render to rounding?
            if(new_pos.x == old_pos.x && new_pos.y == old_pos.y) return;

            if(!unstdlib.in_boundary(new_pos, level.size)) {
                this.is_active = false;
                $(window).trigger('die', [self, Player.EVENTS.FALL_OFF]);

            } else if(this.is_active) {

                // FIXME: Clean this up, it's fugly.

                //var collider = level.state.entity_collider.collider;

                unstdlib.iter_line(old_pos, new_pos, function(pos) {
                    if(pos.x == old_pos.x && pos.y == old_pos.y) return true; // Skip the first one

                    var hit = level.is_collision({'pos': pos}, true);
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

            return new_pos;
        },
        get_pos: function() {
            // Get normalized position on context
            return {x: Math.round(this.pos.x), y: Math.round(this.pos.y)};
        }
    });

    Player.EVENTS = {
        FALL_OFF: 1,
        COLLIDED: 2,
        ESCAPED: 3,
        SURVIVED: 4
    }

    return exports;
})(LineRage || {});
