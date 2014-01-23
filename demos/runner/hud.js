var gamejs = require('gamejs'),
    Font = gamejs.font.Font,
    _ = require('underscore');

var Hud = module.exports = function(position, dimensions, options) {
    gamejs.Rect.apply(this, position, dimensions);
    this.dimensions = dimensions;
    this.world = options.world;
    this.font = new Font('24px monospace');
};
_.extend(Hud.prototype, gamejs.Rect.prototype, {
    draw: function(display) {
        display.blit(this.font.render("Score: " + this.world.score),
            [this.dimensions[0] - 140, this.dimensions[1] - 50]);
    }
});
