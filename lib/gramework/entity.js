// A stripped down, simpler Actors module.
var gamejs = require('gamejs'),
    extend = gamejs.utils.objects.extend,
    Sprite = gamejs.sprite.Sprite;

var Entity = exports.Entity = function(options) {
    Entity.superConstructor.apply(this, arguments);

    this.x = options.x;
    this.y = options.y;
    this.w = options.width;
    this.h = options.height;
    this.rect = new gamejs.Rect(this.center(), [this.w, this.h]);
};
extend(Entity, Sprite);

Entity.prototype.move = function(x, y) {
    this.x += x;
    this.y += y;
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
