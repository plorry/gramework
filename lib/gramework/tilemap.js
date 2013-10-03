/*jshint es5:true */
/*
 * Tilemap module.
 *
 * Uses box2d for world.
 */
var gamejs = require('gamejs'),
    box2d = require('box2dweb'),
    objects = gamejs.utils.objects,
    tmx = gamejs.tmx;

var globals = {
    BOX2D_SCALE: 1,
};

var b2Vec2 = box2d.Common.Math.b2Vec2;
var b2World = box2d.Dynamics.b2World;

var Tile = function(rect, properties, world) {
    Tile.superConstructor.apply(this, arguments);

    var tilePadding = 1;

    this.rect = rect;
    this.properties = properties;
    //gamejs.log("Tile", properties, this.rect.center[0]);

    // Define fixture to set on the body eventually.
    var fixDef = new box2d.Dynamics.b2FixtureDef();
    fixDef.density = 1.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;

    // Create a body, setting the initial postion, type.
    var bodyDef = new box2d.Dynamics.b2BodyDef();
    bodyDef.type = box2d.Dynamics.b2Body.b2_staticBody;
    bodyDef.position.x = this.rect.center[0] / globals.BOX2D_SCALE;
    bodyDef.position.y = this.rect.center[1] / globals.BOX2D_SCALE;
    fixDef.shape = new box2d.Collision.Shapes.b2PolygonShape();

    // Create a box around this polygon, with the box centered on the origin
    // of the tile.
    fixDef.shape.SetAsBox(
        (this.rect.width - tilePadding) * 0.5 / globals.BOX2D_SCALE,
        (this.rect.height - tilePadding) * 0.5 / globals.BOX2D_SCALE
    );

    world = new b2World(new b2Vec2(0, 10), true);
    this.b2Body = world.CreateBody(bodyDef);
    this.b2Body.CreateFixture(fixDef);
    this.b2Body.SetUserData(this);

    return this;
};
objects.extend(Tile, gamejs.sprite.Sprite);

// Loads the Map at `url` and holds all layers.
var TileMap = exports.TileMap = function(url, world) {
    this.world = world;

    // Draw each layer
    this.draw = function(display) {
        layerViews.forEach(function(layerView) {
            layerView.draw(display, 100);
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
            tiles: map.tiles
        });
    });
    return this;
};

var LayerView = function(map, layer, opts) {
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
                var tile = new Tile(tileRect, tileProperties, map.world);
            } else {
                gamejs.log('No GID ', gid, i, j, 'layer', i);
            }
        }, this);
    }, this);
    return this;
};
