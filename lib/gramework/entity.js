// A stripped down, simpler Actors module.
var gamejs = require('gamejs'),
    inherits = require('super'),
    Sprite = gamejs.sprite.Sprite;

/*
 * Required:
 * y: Starting y coordinate
 * x: Starting x coordinate
 * width: Width of sprite rectangle.
 * height: Height of sprite rectangle.
 */
var Entity = module.exports = function(options) {
    Sprite.apply(this, arguments);

    this.w = options.width;
    this.h = options.height;

    this.rect = new gamejs.Rect([
        options.x,// + this.w / 2,
        options.y// + this.h / 2
    ], [this.w, this.h]);

    this.initialize.apply(this, arguments);
};

Entity.extend = inherits.extend;
inherits(Entity, Sprite);

// An empty function by default. Override it with your own initialization logic.
Entity.prototype.initialize = function(options) {};

Entity.prototype.move = function(x, y) {
    this.lastX = this.rect.x;
    this.lastY = this.rect.y;

    this.rect.x += x;
    this.rect.y += y;
};

Entity.prototype.topLeft = function() {
    return [this.rect.x, this.rect.y];
};

Entity.prototype.center = function() {
    return [
        this.rect.x + this.w / 2,
        this.rect.y + this.h / 2
    ];
};

Entity.prototype.setPos = function(x, y) {
    this.rect.x = x;
    this.rect.y = y;
};
