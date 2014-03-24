/*jshint es5:true */
/*
 * Tilemap module.
 *
 */
var gamejs = require('gamejs'),
    tmx = gamejs.tmx,
    inherits = require('super');

var Tile = function(rect, properties, coords) {
    gamejs.sprite.Sprite.apply(this, arguments);

    this.rect = rect;
    this.properties = properties;
    this.coords = coords;
    this.selected = false;
    this.glowing = false;
    this.occupants = [];
    this._available = true;
    //gamejs.log("Tile", properties, this.rect.center[0]);
    return this;
};
Tile.extend = inherits.extend;
inherits(Tile, gamejs.sprite.Sprite);

Tile = Tile.extend({
    glow: function() {
        this.glowing = true;
    },

    deglow: function() {
        this.glowing = false;
    },

    select: function() {
        this.selected = true;
        this.glow();
    },

    deselect: function() {
        this.selected = false;
        this.deglow();
    },

    isAvailable: function() {
        return this._available;
    },

    notAvailable: function() {
        this._available = false;
    },

    occupiedBy: function() {
        return this.occupants;
    },

    addOccupant: function(occupant) {
        this.occupants.push(occupant);
    },

    removeOccupant: function(occupant) {
        var i = this.occupants.indexOf(occupant);
        this.occupants.splice(i, 1);
    }

});


// Loads the Map at `url` and holds all layers.
var TileMap = exports.TileMap = function(url, options) {
    this.tiles = [];

    var callbacks = options.callbacks || {};

    // Draw each layer
    this.draw = function(display, camera) {
        // If a layer has a z value != 0, it will be offset relative to the camera
        // The offset creates a parallax effect
        // As the z value -> infinity, the scrolling relative to the camera -> 0
        // ie. a greater z value means the layer is further in the distance
        layerViews.forEach(function(layerView) {
            var z = layerView.zValue;
            var offset = [
                camera.rect.left * z / (z+1),
                camera.rect.top * z / (z+1)
            ];
            layerView.draw(display, offset);
        }, this);

        this.tiles.forEach(function(tilex) {
            tilex.forEach(function(tile){
                if (tile.selected) {
                    gamejs.draw.rect(display, "rgba(220,255,120,0.5)", tile.rect);
                } else if (tile.glowing) {
                    gamejs.draw.rect(display, "rgba(0,255,255,0.5)", tile.rect);
                }
            }, this);

        }, this);
    };

    this.getTile = function(x, y){
        return this.tiles[x][y];
    };

    this.deselectAll = function() {
        this.tiles.forEach(function(tilex){
            tilex.forEach(function(tile){
               tile.deselect();
            }, this);
        }, this);
    };

    // Initialize.
    var self = this;
    var map = new tmx.Map(url);

    this.getNeighbours = function(x, y) {
        var neighbours = [];
        if (x < map.width - 1) {
            neighbours.push(this.getTile(x+1, y));
        }
        if (y < map.height - 1) {
            neighbours.push(this.getTile(x, y+1));
        }
        if (x > 0) {
            neighbours.push(this.getTile(x-1, y));
        }
        if (y > 0) {
            neighbours.push(this.getTile(x, y-1));
        }
        return neighbours;
    };

    // Given the TMX Map we've loaded, go through each layer (via map.layers,
    // provided by gamejs), and return a LayerView that we can deal with.
    var layerViews = map.layers.map(function(layer) {
        return new LayerView(self, layer, {
            tileWidth: map.tileWidth,
            tileHeight: map.tileHeight,
            width: map.width,
            height: map.height,
            tiles: map.tiles,
            callbacks: callbacks
        });
    });
    return this;
};

var LayerView = function(map, layer, opts) {
    if (layer.properties) {
        this.zValue = layer.properties.z || 0;
        this.doDraw = layer.properties.draw || true;
        this.solid = layer.properties.solid || false;
    } else {
        this.zValue = 0;
        this.doDraw = true;
        this.solid = false;
    }
    this.draw = function(display, offset) {
        if (this.doDraw === true) display.blit(this.surface, offset);
    };

    // Initialize.
    this.surface = new gamejs.Surface(
        opts.width * opts.tileWidth,
        opts.height * opts.tileHeight
    );
    this.surface.setAlpha(layer.opacity);

    // Note how below we look up the "gid" of the tile images in the TileSet 
    // from the Map ('opt.tiles') to get the actual Surfaces.
    layer.gids.forEach(function(row, i) {
        row.forEach(function(gid, j) {
            if (!map.tiles[j]) {
                map.tiles[j] = [];
            }
            if (gid === 0) {
                return;
            }

            var tileProperties = opts.tiles.getProperties(gid);
            var tileSurface = opts.tiles.getSurface(gid);
            if (tileSurface) {
                var tilePos = [j * opts.tileWidth, i * opts.tileHeight];
                var tileRect = new gamejs.Rect(
                  tilePos,
                  [opts.tileWidth, opts.tileHeight]
                );
                this.surface.blit(tileSurface, tileRect);
                var coords = [j, i];
                var tile = new Tile(tileRect, tileProperties, coords);
                map.tiles[j][i] = tile;

                // Tile property callbacks.
                Object.keys(tileProperties).forEach(function(prop) {
                    Object.keys(opts.callbacks).forEach(function(fn) {
                        if (prop === fn) opts.callbacks[fn](tileRect);
                    });
                });
            } else {
                gamejs.log('No GID ', gid, i, j, 'layer', i);
            }
        }, this);
    }, this);
    return this;
};
