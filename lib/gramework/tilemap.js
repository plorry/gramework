/*jshint es5:true */
/*
 * Tilemap module.
 *
 */
var gamejs = require('gamejs'),
    inherits = require('super'),
    Sprite = gamejs.sprite.Sprite,
    extend = gamejs.utils.objects.extend,
    _ = require('underscore'),
    tmx = gamejs.tmx;

var Tile = function(rect, properties, coords) {
    gamejs.sprite.Sprite.apply(this, arguments);

    this.rect = rect;
    this.properties = properties;
    this.coords = coords;

    this.initialize.apply(this, arguments);
};
Tile.extend = inherits.extend;
inherits(Tile, gamejs.sprite.Sprite);

// An empty function by default. Override it with your own initialization logic.
Tile.prototype.initialize = function(options) {}

// Loads the Map at `url` and holds all layers.
var TileMap = exports.TileMap = function(url, options) {
    options = (options || {});

    var tileModel = options.tileModel || Tile;
    this.tiles = [];

    var callbacks = options.callbacks || {};

    this.getTile = function(x, y){
        return this.tiles[x][y];
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
    this.layerViews = map.layers.map(function(layer) {
        return new LayerView(self, layer, {
            tileWidth: map.tileWidth,
            tileHeight: map.tileHeight,
            width: map.width,
            height: map.height,
            tiles: map.tiles,
            callbacks: callbacks,
            tileModel: tileModel
        });
    });

    this.initialize(options);

    return this;
};

TileMap.extend = inherits.extend;

TileMap.prototype.draw = function(display, camera, zRange) {
            // If a layer has a z value != 0, it will be offset relative to the camera
        // The offset creates a parallax effect
        // As the z value -> infinity, the scrolling relative to the camera -> 0
        // ie. a greater z value means the layer is further in the distance
        if (!zRange) {
            zRange = [-Infinity, Infinity];
        }

        this.layerViews.forEach(function(layerView) {
            var z = layerView.zValue,
                zOrder = layerView.zOrder;
            var offset = [
                camera.rect.left * z / (z+1),
                camera.rect.top * z / (z+1)
            ];
            if (zOrder >= zRange[0] && zOrder < zRange[1]){
                layerView.draw(display, offset);
            }
        }, this);
};

TileMap.prototype.update = function(dt) {
    this.layerViews.forEach(function(layerView) {
        layerView.update(dt);
    }, this);
};

var LayerView = function(map, layer, opts) {
    this.name = layer.name;
    if (layer.properties) {
        this.zValue = layer.properties.z || 0;
        this.zOrder = layer.properties.zOrder || 0;
        this.doDraw = layer.properties.draw || true;
        this.solid = layer.properties.solid || false;
        this.animated = layer.properties.animated || false;
    } else {
        this.zValue = 0;
        this.zOrder = 0;
        this.doDraw = true;
        this.solid = false;
        this.animated = false;
    }

    this.tileModel = opts.tileModel || Tile;

    this.draw = function(display, offset) {
        if (this.doDraw === true) display.blit(this.surface, offset);
    };

    this.update = function(dt) {
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
                    var tile = new this.tileModel(tileRect, tileProperties, coords);
                    if (!map.tiles[j][i]) {
                        map.tiles[j][i] = tile;
                    } else {
                        // Tile already exists, let's extend it
                        if (map.tiles[j][i].properties) {
                            _.extend(map.tiles[j][i].properties, tile.properties);
                        }
                    }

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
    };

    // Initialize.
    this.surface = new gamejs.Surface(
        opts.width * opts.tileWidth,
        opts.height * opts.tileHeight
    );
    this.surface.setAlpha(layer.opacity);
    this.update(0);
    
    return this;
};

module.exports = {
    Tile: Tile,
    TileMap: TileMap
};
