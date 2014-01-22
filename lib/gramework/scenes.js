var gamejs = require('gamejs'),
    Camera = require('./camera');

//Scene Class
var Scene = exports.Scene = function(options) {
    this._elapsed = 0;
    this.init(options);
};

Scene.prototype.init = function(options) {
    this._width = options.width;
    this._height = options.height;
    this.actors = new gamejs.sprite.Group();
    this.layers = [];
    this.elements = [];
    this.view = new gamejs.Surface([this._width, this._height]);

    this.camera = new Camera(this.view.rect, {
        width: this._width,
        height: this._height
    });
};

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
        layer.update(dt);
    }, this);
    this.actors.update(dt);
    this.elements.forEach(function(element){
        element.update(dt);
    }, this);
    this.camera.update(dt);
    this._elapsed += dt;
};


Scene.prototype.draw = function(display) {
    // TODO: Offer same interface as Sprite groups. No need to iterate
    this.view.clear();
    display.clear();
    this.layers.forEach(function(layer) {
        layer.draw(this.view, this.camera);
    }, this);
    this.actors.draw(this.view);
    this.elements.forEach(function(element) {
        element.draw(this.view);
    }, this);
    this.camera.draw(this.view, display);
};
