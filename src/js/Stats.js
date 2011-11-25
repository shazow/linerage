var Stats = function(target) {
    var data_targets = {};
    var container = $('<dl class="stats" />').appendTo(target);

    return function(key, value) {
        var target = data_targets[key];
        if(!target) {
            $('<dt>' + key + '</dt>').appendTo(container);
            data_targets[key] = target = $('<dd />').appendTo(container);
        }
        target[0].innerHTML = value;
    }
}

