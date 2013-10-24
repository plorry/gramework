var gamejs = require('gamejs'),
    Camera = require('./camera').Camera,
    Physics = require('./physics').Physics;

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
    this.view = new gamejs.Surface([this.width, this.height]);

    if (options.physics === true) this.physics = new Physics();

    this.camera = new Camera(this.view, {width:800, height:600});    
};

Scene.prototype.pushActor = function(actor) {
    this.actors.add(actor);
    if (this.physics) actor.setPhysics(this.physics);
};

Scene.prototype.getElapsedTime = function() {
    return this._elapsed;
};

Scene.prototype.pushLayer = function(layer) {
    this.layers.push(layer);
};

Scene.prototype.update = function(dt) {
    if (this.physics) this.physics.step(dt);

    this.actors.update(dt);
    this.camera.update(dt);

    this._elapsed += dt;
};


Scene.prototype.draw = function(display) {
    this.layers.forEach(function(layer) {
        layer.draw(this.view);
    }, this);
    this.actors.draw(this.view);
    var screen = this.camera.draw();
    //var size = screen.getSize();
    //var scaledScreen = gamejs.transform.scale(screen, [size[0] * config.SCALE, size[1] * config.SCALE]);
    display.blit(screen);
};

Scene.prototype.event = function(event) {
    if (event.type === gamejs.event.KEY_DOWN) {
        console.log(this.actors.sprites()[0].rect);
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