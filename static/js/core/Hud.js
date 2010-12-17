function Hud(game, target) {
    this.game = game;
    this.target = $(target);
    this.packs = [];
    this.active = false;
}
Hud.prototype = {
    add_pack: function(pack) {
        this.packs.push(pack);
    },
    draw: function() {
        var hud = $(this.target).empty();

        var game = this.game;

        var description = $('<div id="description" class="state"></div>').hide();
        this.description = $(description).appendTo(hud);

        var self = this;

        var packs_menu = $('<div id="packs" class="state"></div>').hide();
        $(this.packs).each(function(i, pack) {
            packs_menu.append('<h2>' + pack.name + '</h2>');

            var levels_list = $('<ol></ol>');
            $(pack.levels).each(function(j, level) {
                $('<li>' + level.name + '</li>').click(function() {

                    game.is_ready = false;
                    message("Loading.");

                    game.load_level(level, function() {
                        if(level.description) {
                            $(description).html(level.description);
                            self.show('description');
                        }
                        game.is_ready = true;
                        message("Ready? Press <em>Space</em> to start.");
                    });

                }).appendTo(levels_list);
            });
            packs_menu.append(levels_list);
        });
        this.packs_menu = $(packs_menu).appendTo(hud);
    },
    show: function(id) {
        $('.state', this.target).hide();
        this.active = $('#' + id + '.state', this.target).show();
        $(this.target).show();
    },
    hide: function() {
        this.active = false;
        $(this.target).hide();
    }
}
