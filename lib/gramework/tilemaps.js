/*jshint es5:true */
/*
 * Tilemap module.
 *
 */
var gamejs = require('gamejs'),
    extend = gamejs.utils.objects.extend,
    tmx = gamejs.tmx;

var Tile = function(rect, properties) {
    Tile.superConstructor.apply(this, arguments);

    this.rect = rect;
    this.properties = properties;
    //gamejs.log("Tile", properties, this.rect.center[0]);
    return this;
};
extend(Tile, gamejs.sprite.Sprite);

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
    };

    // Initialize.
    var self = this;
    var map = new tmx.Map(url);

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
    }
    this.draw = function(display, offset) {
        // `blit` basically means draw.
        display.blit(this.surface, offset);
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
                var tile = new Tile(tileRect, tileProperties);
                map.tiles.push(tile);

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