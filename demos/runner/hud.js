var gamejs = require('gamejs'),
    gramework = require('../../../gramework'),
    animate = gramework.animate,
    _ = require('underscore');

var Hud = module.exports = function(position, dimensions, options) {
    gamejs.Rect.apply(this, position, dimensions);
    this.dimensions = dimensions;
    this.world = options.world;

    this.numbers = new animate.SpriteSheet('./assets/numbers.png', 60, 80);
};
_.extend(Hud.prototype, gamejs.Rect.prototype, {
    draw: function(display) {
        // Figure out the numbers by splitting up the score.
        var self = this;
        _.each(String(this.world.score).split(""), function(score, index) {
            display.blit(self.numbers.get(score), [
                self.dimensions[0] - (140 - (55 * index)),
                self.dimensions[1] - 50]
            );
        });
    }
});
