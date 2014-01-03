var gamejs = require('gamejs'),
    Vec2d = require('./vectors').Vec2d,
    _ = require('underscore');

// A class to allow the player to control their character.
var GameController = exports.GameController = function(options) {
    this.keyDown = null;
    this.keyUp = null;

    // User can pass an object of controls. The default is
    // simple four directional with the arrow keys.
    this.controls = {
        left: gamejs.event.K_LEFT,
        right: gamejs.event.K_RIGHT,
        up: gamejs.event.K_UP,
        down: gamejs.event.K_DOWN,
        reset: gamejs.event.K_r
    };
    _.extend(this.controls, options);

    this.handle = function(event) {
        if (event.type === gamejs.event.KEY_DOWN) {
            this.keyDown = event.key;
            this.keyUp = null;
        } else if (event.type === gamejs.event.KEY_UP) {
            this.keyUp = event.key;
            this.keyDown = null;
        }
    };

    this.reset = function() {
        if (this.keyDown === this.controls.reset) {
            return true;
        }
        return false;
    };

    // Given our four directional input, define a vector that'll push us in the
    // right direction. 
    this.movementVector = function() {
        var vel = new Vec2d(0, 0);

        if (this.keyDown === this.controls.left) {
            vel.setX(-1);
        } else if (this.keyDown === this.controls.right) {
            vel.setX(1);
        } else {
            vel.setX(0);
        }

        if (this.keyDown === this.controls.up) {
            vel.setY(-1);
        } else if (this.keyDown === this.controls.down) {
            vel.setY(1);
        } else {
            vel.setY(0);
        }
        return vel.normalized();
    };

    return this;
};
