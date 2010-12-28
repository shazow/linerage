(function() {

    var Clock = Game.Clock = Class({
        init: function() {
            this.num_ticks = 0;
            this.time_ticked = Clock.now;
        },
        tick: function() {
            var delta = Clock.now - this.time_ticked;
            this.time_ticked = Clock.now;
            this.num_ticks++;
            return delta;
        },
        delta: function() {
            return Clock.now - this.time_ticked;
        }
    });
    Clock.update = function() {
        Clock.now = +new Date();
    }
    Clock.update();

})();
