var gamejs = require('gamejs'),
    Camera = require('./camera');

//Scene Class
var Scene = exports.Scene = function(options) {
    this._elapsed = 0;
    this.init(options);
};

Scene.prototype.init = function(options) {
    this.width = options.width;
    this.height = options.height;
    this.actors = new gamejs.sprite.Group();
    this.layers = [];
    this.elements = [];
    this.view = new gamejs.Surface([this.width, this.height]);

    this.camera = new Camera(this.view.rect, {
        width: this.width,
        height: this.height
    });
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
    this.actors.update(dt);
    this.elements.forEach(function(element){
        element.update(dt);
    }, this);
    this.camera.update(dt);
    this._elapsed += dt;
};


// TODO: It's a PITA to simply have a background on here.
Scene.prototype.draw = function(display) {
    // TODO: What exactly is a layer supposed to be? (@plorry)
    // It should be any surface, which does not implement a draw function
    // but can be blitted onto our camera view.
    this.layers.forEach(function(layer) {
        if (layer.draw) {
            layer.draw(this.view, this.camera);
        } else {
            this.view.blit(layer);
        }
    }, this);
    this.actors.draw(this.view);
    this.elements.forEach(function(element) {
        element.draw(this.view);
    }, this);
    this.camera.draw(this.view, display);
};
