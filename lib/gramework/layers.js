var imgfy = require('./image').imgfy;

// Use for repeating Backgrounds on a screen, adjust speed
// with multiple backgrounds to gain parallax scrolling effect.
var Scrollable = exports.Scrollable = function(img, pos, options) {
    this.img = imgfy(img);
    this.pos = pos;
    this.init(options);
};

Scrollable.prototype = {
    init: function(options) {
        options = (options || {});
        this.speed = (options.speed || 0);
        // Retain original speed.
        this.originalSpeed = this.speed;
    },

    draw: function(display) {
        display.blit(this.img, this.pos);
    },

    update: function(dt) {
        if (this.speed > 0) {
            this.pos[0] -= this.speed * 0.05;

            if (this.pos[0] < -(this.img.rect.width)) {
                this.pos[0] = 860;
            }
        }
    }
};
