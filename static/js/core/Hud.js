function Hud(game, target) {
    this.game = game;
    this.target = $(target);
    this.packs = [];
    this.active = false;

    var self = this;
    this.logo = $("h1:first").click(function() {
        if(!self.active) {
            self.game.pause();
            self.show("packs");
        } else if(self.game.is_fresh) {
            self.hide();
            self.game.resume();
        }
    });
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
                        } else {
                            self.hide();
                        }
                        game.is_ready = true;
                        game.reset();
                        game.continue_fn = game.resume;
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
        if(id=="packs") $(this.logo).addClass("active");
        else $(this.logo).removeClass("active");
    },
    hide: function() {
        this.active = false;
        $(this.target).hide();
        $(this.logo).removeClass("active");
    }
}
