var gamejs = require('gamejs'),
    inherits = require('super');

var Transition = function(before, after, options) {
    options = (options || {});

    this.before = before;
    this.after = after;

    if (!this.time) {
        this.time = (options.time || 2.0);
    }

    if (!this.colour) {
        this.colour = (options.colour || [255, 0, 255]);
    }

    this.p = 0;
    this.initialize.apply(this, arguments);
};

Transition.prototype.initialize = function(before, after, options) {};
Transition.prototype.draw = function(surface) {};
Transition.prototype.update = function(dt) {};
Transition.extend = inherits.extend;

var FadeTransition = Transition.extend({
    time: 2.0,
    colour: [0, 0, 0]
});

FadeTransition.prototype.draw = function(surface) {
    var alpha;
    surface.clear();

    // At the start of the transition, we go from a solid block to 0-alpha, and
    // then we begin showing the new state going from 1-alpha to 0-alpha again.
    if (this.p < (this.time / 2) && this.before) {
        alpha = (this.time - this.p) * this.p;
        this.before.draw(surface);
    } else {
        alpha = (this.time - this.p) / this.p;
        this.after.draw(surface);
    }

    var rgbaString = ["rgba(", this.colour.join(",") + ",", alpha, ")"].join('');
    surface.fill(rgbaString);
};
FadeTransition.prototype.update = function(dt) {
    dt = (dt / 1000);

    this.p += dt;
    if (this.p >= this.time) {
        this.dispatcher.push(this.after, null);
    }
};

module.exports = {
    Transition: Transition,
    FadeTransition: FadeTransition
};
