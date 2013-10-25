var gamejs = require('gamejs');
var Camera = require('./camera').Camera;

var font = new gamejs.font.Font('20px Lucida Console');

//Scene Class

var Scene = exports.Scene = function(options) {
    this.camera = new Camera(this, true);
    this._elapsed = 0;
    this.init(options);
};

Scene.prototype.init = function(options) {
    this.width = options.width;
    this.height = options.height;
    this.actors = new gamejs.sprite.Group();
    this.layers = [];
    this.view = new gamejs.Surface([this.width, this.height]);      
};

Scene.prototype.getElapsedTime = function() {
    return this._elapsed;
};

Scene.prototype.addLayer = function(layer) {
    this.layers.push(layer);
};

Scene.prototype.update = function(dt) {
    this.actors.update(dt);
    this.camera.update(dt);

    this._elapsed += dt;
};


Scene.prototype.draw = function(display) {
    display.fill("#F0A30F");
    this.layers.forEach(function(layer) {
        layer.draw(this.view);
    }, this);
    this.actors.draw(this.view);
    //var screen = this.camera.draw();
    //var size = screen.getSize();
    //var scaledScreen = gamejs.transform.scale(screen, [size[0] * config.SCALE, size[1] * config.SCALE]);
    display.blit(this.view);
};

Scene.prototype.handleEvent = function(event) {

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