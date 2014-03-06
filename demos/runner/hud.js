var gamejs = require('gamejs'),
    gramework = require('../../../gramework'),
    animate = gramework.animate,
    _ = require('underscore');

var Hud = module.exports = function(position, dimensions, options) {
    gamejs.Rect.apply(this, position, dimensions);
    this.dimensions = dimensions;
    this.world = options.world;

    this.numbers = new animate.SpriteSheet('./assets/numbers.png', 60, 80);
    this.numbersSmall = new animate.SpriteSheet('./assets/numbers-small.png', 30, 40);
};
_.extend(Hud.prototype, gamejs.Rect.prototype, {
    draw: function(display) {
        // Figure out the numbers by splitting up the score.
        var self = this;
        var parts = String(this.world.score).split("");
        _.each(parts, function(score, index) {
            display.blit(self.numbers.get(score), [
                self.dimensions[0] - ((65 * parts.length ) - (55 * index)),
                self.dimensions[1] - 50]
            );
        });

        // Draw the time left.
        var timeLeft = Math.floor(this.world.timeLeft);
        _.each(String(timeLeft).split(""), function(n, index) {
            display.blit(self.numbersSmall.get(n), [10 + (30 * index), 10]);
        });

    }
});
