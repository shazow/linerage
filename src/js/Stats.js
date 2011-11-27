var Stats = function(target) {
    this.container = $('<dl class="stats" />').appendTo(target);

    this.values = {};
    this.targets = {};
}
Stats.prototype = {
    set: function(key, value) {
        this.values[key] = value;

        var target = this.targets[key];
        if(!target) {
            $('<dt>' + key + '</dt>').appendTo(this.container);
            this.targets[key] = target = $('<dd />').appendTo(this.container);
        }
        target[0].innerHTML = value;
    },
    add: function(key, value) {
        this.set(key, (this.values[key] || 0) + value);
    }
}
