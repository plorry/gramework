var gamejs = require('gramework').gamejs,
    _ = require('underscore');

var Player = exports.Player = function(options) {
    this.units = new gamejs.sprite.Group();

    this._isDone = false;
    this._selected;
    this._isMyTurn = false;
    this.opponents = [];
    this.currentMap;

    this.initialize(options);
};

_.extend(Player.prototype, {
    setMap: function(map) {
        this.currentMap = map;
    },

    isMyTurn: function() {
        return this._isMyTurn;
    },

    startTurn: function() {
        this._isDone = false;
        this._isMyTurn = true;
        this.wakeAll();
    },

    endTurn: function() {
        this._isDone = true;
        this._isMyTurn = false;
    },

    getName: function() {
        return this._name;
    },

    initialize: function(options) {
        this._human = options.human || false;
        this._name = options.name || undefined;
    },

    addOpponent: function(player) {
        this.opponents.push(player);
    },

    isHuman: function(){
        return this._human;
    },

    isDone: function() {
        return this._isDone;
    },

    addUnit: function(unit) {
        this.units.add(unit);
    },

    getAwakeAllyCount: function() {
        var count = 0;
        this.units.forEach(function(unit) {
            if (unit.isAwake()) {
                count++;
            }
        });

        return count;
    },

    getAwakeAllies: function() {
        var allies = [];
        this.units.forEach(function(unit) {
            if (unit.isAwake()) {
                allies.push(unit);
            }
        });

        return allies;
    },

    checkAlly: function(unit) {
        var ally = false;
        this.units.forEach(function(checkUnit){
            if (checkUnit == unit) {
                ally = true;
            }
        }, this);
        return ally;
    },

    getEnemyUnits: function() {
        var units = [];
        this.opponents.forEach(function(opponent) {
            opponent.units.forEach(function(unit) {
                units.push(unit);
                unit.getChildren().forEach(function(child){
                    if (units.indexOf(child) < 0) {
                        units.push(child);
                    }
                });
            });
        });
        return units;
    },

    hasUnitSelected: function() {
        if (this._selected) {
            return true;
        }
        return false;
    },

    getSelectedUnit: function() {
        return this._selected;
    },

    allyOnTile: function(tile) {
        var ally = false;

        tile.contents.forEach(function(unit){
            if (this.checkAlly(unit)){
                ally = unit;
            }
        }, this);
        return ally;
    },

    // UNIT PHASE ORDER METHODS

    select: function(unit){
        // SELECT a UNIT. Only UNEXHAUSTED (AWAKE) UNITS can be SELECTED
        this._selected = unit;
        unit.select();
    },

    deselect: function() {
        this.getSelectedUnit().deselect();
        this._selected = undefined;
    },

    wakeAll: function() {
        this.units.forEach(function(unit){
            unit.wake();
        });
    },

    update: function(dt) {
        if (this.getSelectedUnit() && this.getSelectedUnit().isExhausted()) {
            this.deselect();
        }
    },


    getOccupiedTiles: function(exception) {
        // Returns list of tiles that are occupied by this player's units
        var tiles = [];
        this.units.forEach(function(unit){
            if (unit != exception) {
                tiles.push(unit.getTile());
                if (unit.getChildren()) {
                    unit.getChildren().forEach(function(child) {
                        tiles.push(child.getTile());
                    }, this);
                }
            }
        });
        return tiles;
    }
});

// A HumanPlayer is a user-controlled player
var HumanPlayer = exports.HumanPlayer = _.extend(Player.prototype, {
    action: function(tile) {
        if (this.hasUnitSelected()){
            this.getSelectedUnit().action(tile);
            // Deselect this unit if it is now exhausted
            if(this.getSelectedUnit().isExhausted()) {
                this.deselect();
            }
        } else if (this.allyOnTile(tile) !== false){
            var ally = this.allyOnTile(tile);
            if (!ally.isExhausted()){
                this.select(ally);
            }
        }
    }
});

// A AIPlayer is a Computer-Controlled Player, controlling plant-type units
var AIPlayer = exports.AIPlayer = _.extend(Player.prototype, {
    initialize: function(options) {
        this._human = options.human || false;
        this._name = options.name;
        this._target = options.target;
    },

    setTarget: function(target) {
        this._target = target;
    },

    getTarget: function() {
        return this._target;
    },

    update: function(dt) {
        AIPlayer.super_.prototype.update.apply(this, arguments);

        if (this.isMyTurn()) {
            if (this.getSelectedUnit() && this.getSelectedUnit().isExhausted()) {
                this.deselect();
            }
            if (!this.getSelectedUnit()) {
                if (this.getAwakeAllyCount() > 0) {
                    var ally = _.sample(this.getAwakeAllies());
                    this.select(ally);
                }
            }
            if (this.getSelectedUnit()) {
                var unit = this.getSelectedUnit();
                if (unit.getCurrentPhase() === 'move') {
                    unit.AIMove();
                } else if (unit.getCurrentPhase() === 'activity') {
                    unit.AIActivity();
                } else if (unit.getCurrentPhase() === 'exhausted') {
                    unit.exhaust();
                }
            }
        }
    }
});