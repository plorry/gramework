// A stripped down, simpler Actors module.
var gamejs = require('gamejs'),
    extend = gamejs.utils.objects.extend,
    Sprite = gamejs.sprite.Sprite;

var Entity = exports.Entity = function(options) {
    Entity.superConstructor.apply(this, arguments);

    this.x = options.x;
    this.y = options.y;
    this.w = options.width || 32;
    this.h = options.height || 32;
    this.rect = new gamejs.Rect(this.center(), [this.w, this.h]);
};
extend(Entity, Sprite);

Entity.prototype.move = function(x, y) {
    this.lastX = this.rect.x;
    this.lastY = this.rect.y;

    this.rect.x += x;
    this.rect.y += y;
};

Entity.prototype.topLeft = function() {
    return [this.x, this.y];
};

Entity.prototype.center = function() {
    return [
        this.x + this.w / 2,
        this.y + this.h / 2
    ];
};

Entity.prototype.setPos = function(x, y) {
    this.x = x;
    this.y = y;
};
