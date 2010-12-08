var game, stats, campaign;
$(document).ready(function() {
    $("body").disableTextSelect();
    game = new Game(document.getElementById("game_canvas"));

    campaign = new Campaign("Don't worry, be happy", [
        new Map("maps/01.png", {'objects': [
            {'type': 'START', 'pos': [50, 300], 'angle': 0.25},
            {'type': 'START', 'pos': [50, 320], 'angle': 0.25},
            {'type': 'END', 'box': [550,230,570,250]}
        ]}),
        new Map("maps/02.png", {'objects': [
            {'type': 'START', 'pos': [200, 25], 'angle': 0.35},
            {'type': 'START', 'pos': [200, 35], 'angle': 0.37},
            {'type': 'END', 'box': [300,200,320,220]}
        ]}),
        new Map("maps/custom/jaygoldman.png", {'objects': [
            {'type': 'START', 'pos': [39, 418], 'angle': 0.75},
            {'type': 'END', 'box': [490,387,570,400]}
        ]}),
    ], Campaign.MODES.NORMAL);

    game.campaign = campaign;
    game.world.load_map(campaign.maps[0], function() {
        game.is_ready = true;
        message("Ready? Press <em>Space</em> to start.").render();
    });
});
