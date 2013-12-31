var gamejs = require('gamejs'),
    Camera = require('./camera');

var font = new gamejs.font.Font('20px Lucida Console');

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


Scene.prototype.draw = function(display) {
    this.actors.draw(this.view);
    this.layers.forEach(function(layer) {
        layer.draw(this.view, this.camera);
    }, this);
    this.actors.draw(this.view);
    this.elements.forEach(function(element) {
        element.draw(this.view);
    }, this);
    this.camera.draw(this.view, display);
};

Scene.prototype.event = function(event) {
    if (event.type === gamejs.event.KEY_DOWN) {
    }
};

var Trigger = exports.Trigger = function(options) {
    this._active = false;
    this.condition = options.condition;
    this.update = options.update || function() {return;};
    this.killCondition = options.killCondition || function() {return false;};
    this.killEvent = options.killEvent || function() {return;};
};

Trigger.prototype.activate = function() {
    this._active = true;
};

Trigger.prototype.isActive = function() {
    return this._active;
};

Trigger.prototype.deactivate = function() {
    this._active = false;
};
