var gamejs = require('gamejs'),
    inherits = require('super'),
    Camera = require('./camera'),
    _ = require('underscore');

var Scene = exports.Scene = function(options) {
    this._elapsed = 0;
    this._width = options.width;
    this._height = options.height;

    // Actors will be deprecated in favour of entities.
    this.actors = new gamejs.sprite.Group();
    this.entities = new gamejs.sprite.Group();

    this.layers = [];
    this.elements = [];
    this.view = new gamejs.Surface([this._width, this._height]);

    this.camera = new Camera(this.view.rect, {
        width: this._width,
        height: this._height
    });
    this.initialize.apply(this, arguments);
};
Scene.extend = inherits.extend;

_.extend(Scene.prototype, {
    // An empty function by default. Override it with your own initialization logic.
    initialize: function(options) {},

    width: function() {
        return this.camera.rect.width;
    },

    height: function() {
        return this.camera.rect.height;
    },

    getElapsedTime: function() {
        return this._elapsed;
    },

    pushEntity: function(entity) {
        this.entities.add(entity);
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
        this.elements.forEach(function(element){
            element.update(dt);
        }, this);
        this.camera.update(dt);
        this._elapsed += dt;
    },

    draw: function(display) {
        // TODO: Offer same interface as Sprite groups. No need to iterate
        this.view.clear();
        display.clear();
        this.layers.forEach(function(layer) {
            layer.draw(this.view, this.camera);
        }, this);
        this.actors.draw(this.view);
        this.entities.draw(this.view);

        this.elements.forEach(function(element) {
            element.draw(this.view);
        }, this);
        this.camera.draw(this.view, display);
    }
});
