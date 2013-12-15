// A stripped down, simpler Actors module.
var gamejs = require('gamejs'),
    extend = gamejs.utils.objects.extend,
    Sprite = gamejs.sprite.Sprite;

var Entity = exports.Entity = function(options) {
    Entity.superConstructor.apply(this, arguments);

    this.y = options.y;
    this.w = options.width || 32;
    this.h = options.height || 32;

    this.rect = new gamejs.Rect([
        options.x + this.w / 2,
        options.y + this.h / 2
    ], [this.w, this.h]);
};
extend(Entity, Sprite);

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
