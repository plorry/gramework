var _ = require('underscore'),
    gamejs = require('gamejs'),
    Entity = require('../../lib/gramework/entity'),
    animate = require('../../lib/gramework/animate');

var DIRECTIONS = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

var MOVE = 0,
    ACTIVITY = 1,
    EXHAUSTED = 2;

var TileSprite = exports.TileSprite = Entity.extend({
    initialize: function(options) {
        this.coords = [options.x, options.y];
        this.tile_size = options.tile_size;
        this.activeColor = options.color || "#fe03d4";
        this.exhaustColor = "#555";
        this.color = this.activeColor;
        this.scene = options.scene;
        this.map = options.map;

        if (this.map) {
            this.setMap(this.map);
        }
        this.scene.pushEntity(this);
        if (options.spriteSheet){
            this.spriteSheet = new animate.SpriteSheet(options.spriteSheet, options.width, options.height);
        }
        if (options.animations) {
            this.anim = new animate.Animation(this.spriteSheet, "static", {
                static: {frames: _.range(options.animations.frames), rate: 4, loop: true}
            });
            this.image = this.anim.update(0);
        }
        if (options.image) {
            this.defaultImage = gamejs.image.load(options.image);
            this.image = this.defaultImage;
        }

    },

    setMap: function(map) {
        this.map = map;
        map.addContent(this);
    },

    update: function(dt) {
        this.setPos(Math.floor(this.coords[0] * this.tile_size), Math.floor(this.coords[1] * this.tile_size));
    },

    slide: function(vec) {
        var coord_x = this.coords[0] + vec[0];
        var coord_y = this.coords[1] + vec[1];
        var tile = this.map.getTile(coord_x, coord_y);
        this.setTile(tile);
    },

    setTilePos: function(pos) {
        this.coords[0] = pos[0];
        this.coords[1] = pos[1];
    },

    setTile: function(tile) {
        this.map.getTile(this.coords[0], this.coords[1]).removeContent(this);
        this.coords[0] = tile.coords[0];
        this.coords[1] = tile.coords[1];
        tile.addContent(this);
    },

    getTile: function() {
        return this.map.getTile(this.coords[0], this.coords[1]);
    },

    draw: function(display) {
        if (this.image) {
            Entity.super_.prototype.draw.call(this, display);
        } else {
            gamejs.draw.rect(display, this.color, this.rect, 0);
            gamejs.draw.rect(display, "#000", this.rect, 1);
        }
    }
});

var Cursor = exports.Cursor = TileSprite.extend({
    initialize: function(options) {
        Cursor.super_.prototype.initialize.apply(this, arguments);
    },

    draw: function(display) {
        if (this.image) {
            Entity.super_.prototype.draw.call(this, display);
        } else {
            gamejs.draw.rect(display, "#fff", this.rect, 1);
        }
    }
});

var Unit = exports.Unit = TileSprite.extend({
    initialize: function(options) {
        Unit.super_.prototype.initialize.apply(this, arguments);

        var defaultStats = {
            speed: 3,
            power: 3,
            defense: 3,
            reflex: 3
        };

        this.name = options.name;
        this.type = "Unit";
        this.phaseOrder = ['move', 'activity', 'exhausted'];
        this.player = options.player;
        this.stats = _.extend(defaultStats, options.stats);
        this.attackRange = options.attackRange || 1;
        this._canMove = true;
        this.availableTiles = [];
        this.noCooccupy = [];
        this.noPass = [];

        this.maxSlides = this.stats.speed;
        this.currentSlides = 0;
        this._target;

        this.generateExhaustImage();
        this._selected = false;
        this._exhausted = false;
        this.currentPhase = 0;

        this.hasMoved = false;
        this.hasActioned = false;

        if (this.player) {
            this.player.addUnit(this);
        }

        this.maxHitPoints = options.maxHitPoints || 10;
        this.hitPoints = options.hitPoints || this.maxHitPoints;
    },

    generateExhaustImage: function() {
        // Generate the modified image to use when unit is exhausted
        if (!this.image) {
            return;
        }

        var darkSurface = new gamejs.Surface([this.tile_size * 2, this.tile_size * 2]);
        darkSurface.fill('rgba(0,0,0,0.5)');

        this.exhaustImage = new gamejs.Surface([this.tile_size, this.tile_size]);
        this.exhaustImage.blit(this.image);
        this.exhaustImage.blit(darkSurface, [0,0], this.rect, 'source-atop');
    },

    getChildren: function() {
        return [];
    },

    getPhase: function() {
        return this.phaseOrder[this.currentPhase];
    },

    action: function(tile) {
        // Move
        if (this.currentPhase == MOVE) {
            if (this.availableTiles.indexOf(tile) > -1) {
                this.moveTo(tile);
                this.availableTiles = [];
                this.map.dehighlightAll();
                this.nextPhase();
            }
        } else if (this.currentPhase == ACTIVITY) {
            if (this.getValidTargets().indexOf(tile) > -1) {
                var enemy = this.getEnemyOnTile(tile);
                this.attack(enemy);
                this.nextPhase();
            }
        }

        // Attack

    },

    getDirectionTo: function(target) {
        var dirs = [];

        var left = this.coords[0] - target.coords[0];
        var up = this.coords[1] - target.coords[1];

        if (left > 0) {
            dirs.push(DIRECTIONS.LEFT);
        } else if (left < 0) {
            dirs.push(DIRECTIONS.RIGHT);
        }

        if (up > 0) {
            dirs.push(DIRECTIONS.UP);
        } else if (up < 0) {
            dirs.push(DIRECTIONS.DOWN);
        }

        return _.sample(dirs);
    },

    getNeighbour: function(direction) {
        var x = this.coords[0];
        var y = this.coords[1];
        if (direction === DIRECTIONS.UP) {
            return this.map.getTile(x,y-1);
        } else if (direction === DIRECTIONS.DOWN) {
            return this.map.getTile(x,y+1);
        } else if (direction === DIRECTIONS.LEFT) {
            return this.map.getTile(x-1,y);
        } else if (direction === DIRECTIONS.RIGHT) {
            return this.map.getTile(x+1,y);
        }
    },

    slideDir: function(direction) {
        if (direction === DIRECTIONS.UP) {
            this.slide([0,-1]);
        } else if (direction === DIRECTIONS.DOWN) {
            this.slide([0, 1]);
        } else if (direction === DIRECTIONS.LEFT) {
            this.slide([-1, 0]);
        } else if (direction === DIRECTIONS.RIGHT) {
            this.slide([1, 0]);
        }
        this.currentSlides--;
    },

    select: function() {
        this._selected = true;
        this.startPhase(0);
    },

    deselect: function() {
        if (this.currentPhase > 0) {
            // The unit has moved already. Deselecting exhausts it.
            this.exhaust();
        }

        this.currentPhase = 0;
        this._selected = false;
    },

    nextPhase: function() {
        this.currentPhase++;

        if (this.currentPhase >= this.phaseOrder.length) {
            this.exhaust();
        } else {
            this.startPhase(this.currentPhase);
        }
    },

    // AI Methods: ask the unit to decide its own turn
    AIMove: function() {
        if (this.getValidTargets().length > 0) {
            // We have a valid target! Since we're very dumb, let's just attack.
            this.nextPhase();
            return;
        }

        if (this.getTarget()) {
            var dir = this.getDirectionTo(this.getTarget());
        } else {
            var dir = _.sample([0,1,2,3]);
        }

        var availableTiles = this.getAvailableTiles();

        if (availableTiles.indexOf(this.getNeighbour(dir)) >= 0) {
            this.slideDir(dir);
        } else {
            var moved = false;
            // Can't slide the desired direction - pick one at random!
            _.shuffle([0,1,2,3]).forEach(function(dir) {
                if (availableTiles.indexOf(this.getNeighbour(dir)) >= 0) {
                    this.slideDir(dir);
                    moved = true;
                    return;
                }
            }, this);

            if (!moved) {
                // No viable movement, it seems. Just exhaust.
                this.currentSlides = 0;
            }
        }

        if (this.currentSlides <= 0) {
            this.nextPhase();
        }
    },

    AIActivity: function() {
        if (this.getValidTargets()) {
            // We have a valid target! Time to strike!
            var targetTile = _.sample(this.getValidTargets());
            this.setTarget(this.getEnemyOnTile(targetTile));
            this.attack(this.getTarget());
        }
        
        this.nextPhase();
    },

    moveTo: function(tile) {
        this.setTile(tile);
        this.availableTiles = [];
    },

    attack: function(target) {
        // Calculate chance of hitting (float between 0 and 1)
        /*
        toHit = (Math.atan(this.speed - target.reflex) + Math.PI / 2) / (Math.PI);
        hit = (toHit - Math.random()) > 0;
        // Calculate damage
        if (!hit){
            // Display a miss
            return false;
        }
        */
        baseDamage = ((Math.atan((5 * this.stats.power - target.stats.defense) / 5 ) + Math.PI / 2) / Math.PI) * 20;
        console.log('base damage: ' + baseDamage);
        damageFraction = baseDamage * 0.15;
        damage = baseDamage + _.random(-damageFraction, damageFraction);
        if (damage < 0) {
            damage = 0;
        }
        console.log('total damage: ' + damage);
        target.hit(damage);
        console.log(target.type + " " + target.hitPoints);
    },

    startPhase: function(phase) {
        // Setup conditions for new phase
        if (this.currentPhase == MOVE) {
            // MOVE phase - determine the available tiles and highlight
            
            this.availableTiles = this.getAvailableTiles();
        } else if (this.currentPhase == ACTIVITY) {
            // ATTACK phase - determine valid target tiles and highlight
            var targetTiles = this.getValidTargets();

            if (targetTiles.length === 0) {
                this.nextPhase();
            }
        }
    },

    isSelected: function() {
        return this._selected;
    },

    isExhausted: function() {
        return this._exhausted;
    },

    isAwake: function() {
        return !this.isExhausted();
    },

    exhaust: function() {
        this._exhausted = true;
        if (this.exhaustImage) {
            this.image = this.exhaustImage;
        }
    },

    wake: function(){
        this._exhausted = false;
        this.hasMoved = false;
        this.hasActioned = false;
        if (this.defaultImage) {
            this.image = this.defaultImage;
        }
    },

    getCurrentPhase: function() {
        return this.phaseOrder[this.currentPhase];
    },

    getAvailableTiles: function() {
        var cantPass = [];
        // Unit can't pass through enemy units
        this.player.opponents.forEach(function(opponent){
            cantPass = cantPass.concat(opponent.getOccupiedTiles());
        }, this);
        // Unit can't rest on friendly units
        var cantRest = this.player.getOccupiedTiles(this);
        var tiles = getTilesInRange(
            this.map,
            {x: this.coords[0], y: this.coords[1]},
            this.stats.speed,
            0,
            cantPass,
            cantRest
        );
        return tiles;
    },

    getValidTargets: function() {
        var validTargetTiles = [];
        var tilesInRange = getTilesInRange(
            this.map,
            {x: this.coords[0], y: this.coords[1]},
            this.attackRange
        );
        tilesInRange.forEach(function(tile) {
            if (this.hasValidTarget(tile)) {
                validTargetTiles.push(tile);
            }
        }, this);
        return validTargetTiles;
    },

    getEnemyOnTile: function(tile) {
        var returnVal = null;
        tile.getContents().forEach(function(content) {
            if (this.player.getEnemyUnits().indexOf(content) > -1) {
                returnVal = content;
            }
        }, this);
        return returnVal
    },

    hasValidTarget: function(tile) {
        var returnVal = false;
        tile.getContents().forEach(function(content) {
            if (this.player.getEnemyUnits().indexOf(content) > -1) {
                returnVal = true;
            }
        }, this);
        return returnVal;
    },

    hit: function(damage) {
        this.hitPoints -= Math.round(damage);
        var damageText = new FloatingText({
            text: "-" + Math.round(damage),
            fontStyle: '8px LoRes',
            pos: [this.rect.left, this.rect.top - 5],
            drift: {x: 0, y:-1}
        });
        this.scene.pushElement(damageText);
    },

    update: function(dt) {
        if (this.hitPoints <= 0){
            this.kill();
        }

        Unit.super_.prototype.update.apply(this, arguments);

        if (this.isSelected() && this.phaseOrder[this.currentPhase] == 'move'){
            //Move phase - highlight available tiles
            if (this.player.isHuman()) {
                this.availableTiles.forEach(function(tile) {
                    tile.highlight([45,22,22]);
                });
            }
        }
        if (this.currentPhase == EXHAUSTED) {
            this.exhaust();
        }

        if (this.anim && !this.isExhausted()) {
            this.image = this.anim.update(dt);
        }
    }
});

var getTilesInRange = exports.getTilesInRange = function(map, coords, maxDistance, minDistance, cantPass, cantRest) {
    /*
        This method starts from tile x, y, collects all tiles within tile distance maxDistance,
        removes all tiles within minDistance. Tiles listed in cantPass will block the path of
        tile collection, whereas tiles listed in cantRest will be cleaned out from the final
        list of tiles.
    */
    var cantRest = cantRest || [];
    var cantPass = cantPass || [];

    if (!minDistance) {
        var minDistance = 0;
    }
    var homeTile = map.getTile(coords.x, coords.y);
    // tiles_ordered holds each tile at its relative depth from the origin point
    // tiles_flat is a flat array of each tile available
    // checked_tiles is another flat array of the tiles we've checked, whether available or not
    var tiles_ordered = [[homeTile]];
    var tiles_flat = [],
        checked_tiles = [homeTile];
    var neighbours, available;

    for(var depth = 1; depth <= maxDistance; depth++) {
        tiles_ordered[depth] = [];

        tiles_ordered[depth - 1].forEach(function(tile){
            neighbours = map.getNeighbours(tile.coords[0], tile.coords[1]);

            neighbours.forEach(function(neighbour) {
                if (checked_tiles.indexOf(neighbour) >= 0) {
                    // We've already checked this tile. We can skip it.
                    return;
                }
                available = true;
                if (cantPass.indexOf(neighbour) >= 0) {
                    available = false;
                }
                if (neighbour.properties.water === true) {
                    available = false;
                }
                if (available) {
                    tiles_ordered[depth].push(neighbour);
                }
                checked_tiles.push(neighbour);
            });
        });
    }
    tiles_ordered.forEach(function(tiles) {
        tiles_flat = tiles_flat.concat(tiles);
    });
    cantRest.forEach(function(tile){
        var index = tiles_flat.indexOf(tile);
        if (index >= 0) {
            tiles_flat.splice(index, 1);
        }
    });
    return tiles_flat;
};