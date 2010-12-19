var game, hud, stats, levelpacks = [];
$(document).ready(function() {
    $("body").disableTextSelect();
    game = new Game({
        'static': document.getElementById("static_canvas"),
        'dynamic': document.getElementById("dynamic_canvas")
    });

    hud = new Hud(game, $("#hud"));
    function load_levelpack(pack) {
        if(!pack.manifest) continue;

        var levels = [];
        for(var j=0, jstop=pack.manifest.levels.length; j<jstop; j++) {
            levels.push(new Level(pack.manifest.levels[j]));
        }
        var levelpack = new LevelPack(pack.name, levels);

        hud.add_pack(levelpack);
    };

    load_levelpack(
        {"name": "Singleplayer Puzzles", "manifest":
            {"levels": [
                {"name": "White Level",
                    "url": "levels/easy/white.png",
                    "description": "<p>Use the arrow keys (left and right) to maneuver your line to the yellow portal.</p><p>Don't hit things. Try to get the delicious red circles for bonus points.</p>",
                    "entities": [
                        {"type": "START", "pos": [5, 5], "angle": 0.25},
                        {"type": "END", "box": [350, 250, 370, 270]},
                        {"type": "BONUS", "pos": [150,150]},
                        {"type": "BONUS", "pos": [300,50]},
                        {"type": "BONUS", "pos": [500,125]},
                        {"type": "BONUS", "pos": [50,320]},
                        {"type": "BONUS", "pos": [600,350]}
                    ]
                },
                {"name": "Pink Level",
                    "url": "levels/easy/pink.png",
                    "description": "<p>Use the arrow keys (left and right) to maneuver your line to the yellow portal.</p><p>Don't hit things. Try to get the delicious red circles for bonus points.</p>",
                    "entities": [
                        {"type": "START", "pos": [200, 25], "angle": 0.35},
                        {"type": "END", "box": [300, 200, 320, 220]},
                        {"type": "BONUS", "pos": [255,65]}
                    ]
                },
                {"name": "Orange Level",
                    "url": "levels/easy/orange.png",
                    "description": "",
                    "entities": [
                        {"type": "START", "pos": [50, 375], "angle": 1.6},
                        {"type": "END", "box": [600,350,620,370]}
                    ]
                },
                {"name": "Green Level",
                    "url": "levels/easy/green.png",
                    "description": "",
                    "entities": [
                        {"type": "START", "pos": [25, 25], "angle": 0.30},
                        {"type": "END", "box": [375,200,395,220]}
                    ]
                }
            ]}
        }
    );

    load_levelpack(
        {"name": "Hotseat Deathmatch", "manifest":
            {"levels": [
                {"name": "Two Players",
                    "url": "levels/deathmatch/blank.png",
                    "description": "<p>Player 1 controls: Arrow keys</p><p>Player 2 controls: A/S</p>",
                    "is_deathmatch": true,
                    "max_players": 4,
                    "min_players": 2
                },
                {"name": "Three Players",
                    "url": "levels/deathmatch/blank.png",
                    "description": "<p>Player 1 controls: Arrow keys</p><p>Player 2 controls: A/S</p><p>Player 3 controls: K/L</p>",
                    "is_deathmatch": true,
                    "max_players": 3,
                    "min_players": 3
                },
                {"name": "Four Players",
                    "url": "levels/deathmatch/blank.png",
                    "description": "<p>Player 1 controls: Arrow keys</p><p>Player 2 controls: A/S</p><p>Player 3 controls: K/L</p><p>Player 4 controls: Num Pad</p>",
                    "is_deathmatch": true,
                    "max_players": 4,
                    "min_players": 4
                }
            ]}
        }
    );

    hud.draw();
    hud.show('packs');
});
