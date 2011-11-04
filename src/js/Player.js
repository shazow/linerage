var LineRage = (function(exports) {

    var Player = exports.Player = Class({
        pos: [0, 0],

        speed: 8, // Pixels per second
        turn_rate: 8 / 5.5, // Radians per second
        angle: 0,

        max_time_alive: 0,
        num_wins: 0,
        num_deaths: 0,
        score: 0,

        is_active: true,
        move_buffer: null,

        init: function(config) {
            this.reset();

            // Init
            this.color = config.color || 'rgb(255,255,255)';
            this.name = config.name || 'Anonymous';
            this.controls = config.controls;
        },
        move: function(ctx, level, time_delta) {
            if(this.move_buffer) {
                if(this.move_buffer == 'left') this.angle -= this.turn_rate * time_delta / 1000;
                else if(this.move_buffer == 'right') this.angle += this.turn_rate * time_delta / 1000;
            }

            var old_pos = this.get_pos();

            var x = this.pos[0], y = this.pos[1];
            var delta = rotate([this.speed * time_delta / 100, 0], this.angle * Math.PI);
            this.pos = [x + delta[0], y + delta[1]];

            var new_pos = this.get_pos();
            var self = this;

            // Skip render to rounding?
            if(new_pos[0] == old_pos[0] && new_pos[1] == old_pos[1]) return;

            if(!in_boundary(new_pos, [0,0,level.size[0]-1, level.size[1]-1])) {
                this.is_active = false;
                $(window).trigger('die', [self, Player.EVENTS.FALL_OFF]);

            } else if(this.is_active) {

                // FIXME: Clean this up, it's fugly.

                var collider = level.state.entity_collider.collider;

                iter_line(old_pos, new_pos, function(pos) {
                    if(pos[0] == old_pos[0] && pos[1] == old_pos[1]) return true; // Skip the first one

                    var hit = level.is_collision(pos);
                    if(!hit) {
                        // FIXME: This is a ridiculous chain.
                        collider.set(pos, true);
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
            ctx.moveTo(old_pos[0], old_pos[1]);
            ctx.lineTo(new_pos[0], new_pos[1]);
            ctx.stroke();
        },
        get_pos: function() {
            // Get normalized position on context
            return [Math.round(this.pos[0]), Math.round(this.pos[1])];
        }
    }

    Player.CONTROL_KEYS = ['left', 'right'];
    Player.TEMPLATE_LIST = [
        {color: 'rgb(150,30,20)', name: 'Red Player', controls: {'left': 37, 'right': 39}}, // LEFT, RIGHT
        {color: 'rgb(40,70,140)', name: 'Blue Player', controls: {'left': 65, 'right': 83}}, // A, S
        {color: 'rgb(20,140,50)', name: 'Green Player', controls: {'left': 75, 'right': 76}}, // K, S
        {color: 'rgb(160,140,30)', name: 'Yellow Player', controls: {'left': 101, 'right': 103}} // NUM_4, NUM_6
    ]
    Player.EVENTS = {
        FALL_OFF: 1,
        COLLIDED: 2,
        ESCAPED: 3,
        SURVIVED: 4
    }

    return exports;
})(LineRage || {});
