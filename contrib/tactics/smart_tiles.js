var tilemap = require('../../lib/gramework/tilemap'),
    gamejs = require('gamejs'),
    _ = require('underscore');

var SmartTile = tilemap.Tile.extend({
    initialize: function(options){
        this.contents = new gamejs.sprite.Group();
        this._isAvailable = true;
    },

    isAvailable: function() {
        return this._isAvailable;
    },  

    notAvailable: function() {
        this._isAvailable = false;
    },

    getContents: function() {
        return this.contents._sprites;
    },

    isOccupied: function() {
        return this.getContents().length > 0;
    },

    addContent: function(content) {
        this.contents.add(content);
    },

    removeContent: function(content) {
        this.contents.remove(content);
    }
});

var SmartMap = tilemap.TileMap.extend({
    initialize: function(options) {
        this.contents = new gamejs.sprite.Group();
    },

    addContent: function(content) {
        this.contents.add(content);

        tile = this.getTile(content.coords[0], content.coords[1]);
        tile.addContent(content);
    },

    getContents: function() {
        return this.contents;
    },

    update: function(dt) {
        this.tiles.forEach(function(tileRow) {
            tileRow.forEach(function(tile) {
                tile.update(dt);
            }, this);
        }, this);
    },

    draw: function(display, camera) {
        SmartMap.super_.prototype.draw.apply(this, arguments);
    }
});

module.exports = {
    SmartTile: SmartTile,
    SmartMap: SmartMap
}