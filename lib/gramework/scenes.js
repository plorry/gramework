var gamejs;
var inherits;
var Camera;
gamejs = require('gamejs');
inherits = require('super');
Camera = require('./camera');

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

// An empty function by default. Override it with your own initialization logic.
Scene.prototype.initialize = function(options) {};

Scene.prototype.width = function() {
    return this.camera.rect.width;
};

Scene.prototype.height = function() {
    return this.camera.rect.height;
};

// Deprecate this in favour of simply using this.actors.add
// If we want side-effects, this.actors can become a special list with the same
// API as sprite.Group
Scene.prototype.pushActor = function(actor) {
    this.actors.add(actor);
};

Scene.prototype.pushEntity = function(entity) {
    this.entities.add(entity);
};

Scene.prototype.pushElement = function(element) {
    this.elements.push(element);
};

Scene.prototype.getElapsedTime = function() {
    return this._elapsed;
};

Scene.prototype.pushLayer = function(layer) {
    this.layers.push(layer);
};

Scene.prototype.update = function(dt) {
    this.layers.forEach(function(layer) {
        //layer.update(dt);
    }, this);

    this.entities.update(dt);
    this.actors.update(dt);
    this.elements.forEach(function(element){
        element.update(dt);
    }, this);
    this.camera.update(dt);
    this._elapsed += dt;
};

Scene.prototype.event = function(ev) {

};

Scene.prototype.draw = function(display) {
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
};
