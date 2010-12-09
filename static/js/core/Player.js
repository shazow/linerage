function Player(game, config) {
    // Constants
    this.speed = 8; // Pixels per second
    this.turn_rate = this.speed / 6; // Radians per second
    this.angle = 0;
    this.max_time_alive = 0;
    this.num_wins = 0;
    this.num_deaths = 0;

    // Reset
    this.reset();

    // Init
    this.game = game;
    this.color = config.color || 'rgb(255,255,255)';
    this.name = config.name || 'Anonymous';
    this.controls = config.controls;
}
Player.prototype = {
    reset: function(pos, angle) {
        this.is_active = true;
        this.pos = pos || [100 + Math.random() * 440, 100 + Math.random() * 280];
        this.angle = angle === undefined ? Math.random() * 2 : angle;
        this.move_buffer = null;
    },
    move: function(world, time_delta) {
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

        if(!in_boundary(new_pos, world.boundary)) {
            this.is_active = false;
            $(window).trigger('die', [self, Game.EVENTS.FALL_OFF])
        } else if(this.is_active) {
            world.track_collision(old_pos, new_pos, function(pos) {

                var hit_entity = world.level.is_entity(pos);
                if(hit_entity) {
                    hit_entity.do_collision(self);
                } else {
                    self.is_active = false;
                    $(window).trigger('die', [self, Game.EVENTS.COLLIDED])
                    self.new_post = new_pos = pos;
                }
                return false;
            });
        }
        world.set_line(old_pos, new_pos, this.color);
    },
    get_pos: function() {
        // Get normalized position on context
        return [Math.round(this.pos[0]), Math.round(this.pos[1])];
    },
    bind_control_listen: function(name) {
        var fn = document.onkeydown;
        var self = this;
        document.onkeydown = function(e) {
            if(e.which == 32 || e.which == 33) return; // Reserved: ESC and SPACE // FIXME: Use a dict
            if(self.game._controls_cache[e.which]) return; // Taken
            self.controls[name] = e.which;
            document.onkeydown = fn;
            self.game._refresh_controls_cache();
        }
    }
}
Player.CONTROL_KEYS = ['left', 'right'];
Player.TEMPLATE_LIST = [
    {color: 'rgb(150,30,20)', name: 'Red Player', controls: {'left': 37, 'right': 39}}, // LEFT, RIGHT
    {color: 'rgb(40,70,140)', name: 'Blue Player', controls: {'left': 65, 'right': 83}}, // A, S
    {color: 'rgb(20,140,50)', name: 'Green Player', controls: {'left': 75, 'right': 76}}, // K, S
    {color: 'rgb(160,140,30)', name:  'Yellow Player', controls: {'left': 101, 'right': 103}} // NUM_4, NUM_6
]
