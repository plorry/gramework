var gamejs = require('gamejs'),
    inherits = require('super'),
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
        reset: gamejs.event.K_r,
        action: gamejs.event.K_SPACE,
        cancel: gamejs.event.K_ESC
    };
    _.extend(this.controls, options);
    this.reverseControls = {};

    for (key in this.controls) {
        this.reverseControls[this.controls[key]] = key;
    }

    //this.initialize.apply(this, arguments);
};

GameController.extend = inherits.extend;

_.extend(GameController.prototype, {
    initialize: function() {}
});

// An empty function by default. Override it with your own initialization logic.
GameController.prototype.initialize = function(options) {};

GameController.prototype.handle = function(event) {
    if (event.type === gamejs.event.MOUSE_MOTION) {
        return { mousePos: event.pos };
    }

    if (_.indexOf(_.values(this.controls), event.key) == -1) {
        return;
    }

    if (event.type === gamejs.event.KEY_DOWN) {
        this.keyDown = event.key;
        this.keyUp = null;
        return {
            keyDown: this.keyDown,
            label: this.reverseControls[this.keyDown]
        };
    } else if (event.type === gamejs.event.KEY_UP) {
        this.keyUp = event.key;
        this.keyDown = null;
        return {
            keyUp: this.keyUp,
            label: this.reverseControls[this.keyUp]
        };
    }
};

GameController.prototype.reset = function() {
    if (this.keyDown === this.controls.reset) {
        return true;
    }
    return false;
};

// Given our four directional input, define a vector that'll push us in the
// right direction. 
GameController.prototype.movementVector = function() {
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
