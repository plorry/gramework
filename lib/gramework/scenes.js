var gamejs = require('gamejs'),
    inherits = require('super'),
    Camera = require('./camera'),
    _ = require('underscore');

var Scene = exports.Scene = function(options) {
    options = (options || {});

    this._elapsed = 0;

    // Actors will be deprecated in favour of entities.
    this.actors = new gamejs.sprite.Group();
    this.entities = new gamejs.sprite.Group();

    this.layers = [];
    this.elements = new gamejs.sprite.Group();

    this.initialize(options);
};
Scene.extend = inherits.extend;

_.extend(Scene.prototype, {
    initialize: function(options) {
        this._width = options.width;
        this._height = options.height;
        this._pixelScale = options.pixelScale || 4;
        // No options passed, but we can give sensible defaults by getting the game's
        // main surface.
        if (!this._width || !this._height) {
            var size = gamejs.display.getSurface().getSize();
            if (this._pixelScale && this._pixelScale !== 1) {
                size = [Math.floor(size[0] / this._pixelScale), Math.floor(size[1] / this._pixelScale)];
            }
            this._width = (Math.floor(this._width / this._pixelScale) || size[0]);
            this._height = (Math.floor(this._height / this._pixelScale) || size[1]);
        }
        this.view = new gamejs.Surface([this._width, this._height]);
        this.camera = new Camera(this.view.rect, {
            width: options.camWidth,
            height: options.camHeight
        });

        this.surface = new gamejs.Surface(this.camera.rect);

    },

    width: function() {
        return this._width;
    },

    height: function() {
        return this._height;
    },

    getElapsedTime: function() {
        return this._elapsed;
    },

    pushEntity: function(entity) {
        this.entities.add(entity);
    },

    pushElement: function(element) {
        this.elements.add(element);
    },

    pushLayer: function(layer) {
        this.layers.push(layer);
    },

    update: function(dt) {
        
        this.layers.forEach(function(layer) {
            layer.update(dt);
        }, this);
        
        this.entities.update(dt);
        this.actors.update(dt);
        this.elements.update(dt);
        this.camera.update(dt);
        this._elapsed += dt;
        this.camera.zoomTo(1);
    },

    getPixelScale: function() {
        return this._pixelScale;
    },

    draw: function(display, options, callback) {
        // TODO: Offer same interface as Sprite groups. No need to iterate
        options = (options || {});

        var defaults = {
            clear: true
        };
        _.extend(defaults, options);

        if (defaults.clear === true) {
            this.view.clear();
            display.clear();
        }

        if (callback) {
            callback();
            callback();
            callback();
        }

        this.layers.forEach(function(layer) {
            layer.draw(this.view, this.camera, [0,10]);
        }, this);
        this.actors.draw(this.view);
        this.entities.draw(this.view);
        this.layers.forEach(function(layer) {
            layer.draw(this.view, this.camera, [10,Infinity]);
        }, this);

        if (callback) {
            callback();
        }

        if (this._pixelScale !== 1) {
            this.camera.draw(this.view, this.surface);
            this.elements.draw(this.surface);
            display.blit(this.surface, display.rect);
        } else {
            this.camera.draw(this.view, display);
            this.elements.draw(display);
        }

    }
});
