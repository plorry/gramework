(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"../../../gramework":3,"gamejs":17,"underscore":46}],2:[function(require,module,exports){
/*global window, GLOBALS*/
var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('../../../gramework'),
    animate = gramework.animate,
    imgfy = gramework.image.imgfy,
    Scrollable = gramework.layers.Scrollable,
    Dispatcher = gramework.Dispatcher,
    GameController = gramework.input.GameController,
    Entity = gramework.Entity,
    Scene = gramework.Scene,
    Vec2d = gramework.vectors.Vec2d;

var Hud = require('./hud');

// Global variables for the kids to modify
window.GLOBALS = {
    jump: 13,
    speed: 5,
    coin: 10
};

var Coin = function(options) {
    Entity.apply(this, arguments);

    this.isCoin = true;
    this.world = options.world;

    this.sprite = new animate.SpriteSheet('./assets/coin.png', 32, 32);
    this.anim = new animate.Animation(this.sprite, "static", {
        static: {frames: _.range(8), rate: 10.5}
    });

    // TODO: Shouldnt need to do this.
    this.image = this.anim.update(0);
    this.maxSpeed = -1;

    this.velocity = new Vec2d(-1, 0);
};
_.extend(Coin.prototype, Entity.prototype, {
    update: function(dt) {
        this.image = this.anim.update(dt);

        var setTo = -(this.world.velocity.magnitude() * 0.025 * (GLOBALS.speed + 1));
        this.velocity.setX(setTo);
        if (this.velocity.getX() >= this.maxSpeed) {
            this.velocity.truncate(this.maxSpeed);
        }

        this.rect.x += this.velocity.getX();
        this.rect.y += this.velocity.getY();
    }
});

var CoinEmitter = function(options) {
    this.alive = true;
    // Spawn coins based on GLOBAL setting, with some padding for randomness
    this.count = _.random(GLOBALS.coin - 5, GLOBALS.coin + 5);
    this.world = options.world;

    this.currentDuration = 0;
    this.duration = this.randomDuration();

    this.endDelay = _.random(5, 8);

};
CoinEmitter.prototype = {
    randomDuration: function() {
        return (1.0 + (0.0-1.0)*Math.random()) / (this.count + 0.1);
    },

    update: function(dt) {
        this.currentDuration += dt;
        if (this.count > 0 && this.currentDuration >= this.duration) {
            this.world.actors.add(new Coin({
                world: this.world,
                x: this.world.width(),
                y: (this.world.height() / 2.6) + _.random(0, 100)
            }));
            this.currentDuration = 0;
            this.count -= 1;
            this.duration = this.randomDuration();
        }

        if (this.count === 0) {
            if (this.currentDuration >= this.endDelay) {
                this.alive = false;
            }
        }
    }
};

var Player = function(options) {
    Entity.apply(this, arguments);

    this.isPlayer = true;

    this.world = options.world;
    this.sprite = new animate.SpriteSheet('./assets/runner.png', 32, 64);
    this.anim = new animate.Animation(this.sprite, "running", {
        running: {frames: _.range(8), rate: 8.5},
        jump: {frames: [1, 0, 1, 4], rate: 2.5}
    });

    this.controller = GameController({
        jump: gamejs.event.K_SPACE
    });

    this.onGround = false;
    this.isJumping = false;
    this.jumpDelay = 0.6;
    this.jumpTimer = 0;
    this.jumpHeight = GLOBALS.jump;

    this.velocity = new Vec2d(0, 0);

};
_.extend(Player.prototype, Entity.prototype, {
    canMove: function(dx, dy) {
        var collidedX = false,
            collidedY = false,
            start;

        if (dx > 0) {
            start = this.rect.x;
            this.rect.x += dx;
            if (this.world.collides(this)) {
                //gamejs.log("World collides with player.");
            }
        } else if (dx < 0) {
        }

        if (dy > 0) {
            start = this.rect.y;
            this.rect.y += dy;
            if (this.world.collides(this)) {
                this.rect.y = Math.floor(this.rect.y);
                while (this.world.collides(this)) {
                    //gamejs.log("Playing colliding on Y");
                    collidedY = true;
                    this.rect.y -= 1;
                }
            }
        } else if (dy < 0) {
            start = this.rect.y;
            this.rect.y -= dy;
        }

        return [collidedX, collidedY];
    },

    update: function(dt) {
        var self = this;

        this.image = this.anim.update(dt);

        // Adjust dt for vectors.
        dt = (dt / 1000);

        this.jumpTimer -= dt;

        if (this.onGround && this.isJumping) {
            if (this.jumpTimer <= 0) {
                this.velocity.setY(-GLOBALS.jump);
                this.jumpTimer = this.jumpDelay;
            }
        }

        var vec = new Vec2d().add(this.world.gravity);
        this.velocity.add(vec.mul(dt));

        this.rect.x += this.velocity.x;
        this.rect.y += this.velocity.y;

        // Are we colliding with any coins?
        this.world.actors.forEach(function(actor) {
            if (actor.isPlayer) return;
            if (!actor.isCoin) return;
            if (self.rect.collideRect(actor.rect)) {
                self.collectCoin(actor);
            }
        });

        // Decide next movement with a specialty vector.
        var delta = new Vec2d(0, 0);
        delta.add(this.velocity).mul(dt);

        // unpacking in ES6 cant come sooner.
        var collided = this.canMove.apply(this, delta.unpack()),
            collidedX = collided[0],
            collidedY = collided[1];

        if (collidedY) {
            this.velocity.setY(0);
            if (delta.getY() > 0) {
                //gamejs.log("onGround");
                this.onGround = true;
            }
        } else {
            if (Math.floor(delta.getY()) !== 0) {
                //gamejs.log("not onGround");
                this.onGround = false;
            }
        }

        if (this.onGround === false) {
            this.anim.setState("jump");
        } else {
            this.anim.setState("running");
        }

        this.isJumping = false;
    },

    collectCoin: function(coin) {
        coin.kill();
        this.world.score += 1;
    },

    event: function(ev) {
        var key = this.controller.handle(ev);
        if (key === this.controller.controls.jump) {
            this.isJumping = true;
        }

    }
});

var EndScreen = function(options) {
    Scene.apply(this, arguments);
    this.world = options.world;
    this.image = imgfy('./assets/suchwin.png');
    this.numbers = new animate.SpriteSheet('./assets/numbers.png', 60, 80);
    this.controller = GameController({
        reset: gamejs.event.K_r
    });
};
_.extend(EndScreen.prototype, Scene.prototype, {
    draw: function(display) {
        var self = this;
        this.view.blit(this.image);
        _.each(String(this.world.score).split(""), function(score, index) {
            self.view.blit(self.numbers.get(score), [200 + (55 * index), 110]);
        });
        this.camera.draw(this.view, display);
    },
    event: function(ev) {
        if (this.controller.handle(ev) === this.controller.controls.reset) {
            this.world.timeLeft = 40;
            this.world.score = 0;
            this.world.velocity = new Vec2d(0, 0);
            this.dispatcher.push(this.dispatcher.parent());
        }
    }
});

var World = function(options) {
    Scene.apply(this, arguments);

    this.game = options.game;
    this.score = 0;
    this.hud = new Hud([0, 0], [this.width(), 60], {world: this});

    this.player = new Player({
        x: 0, y: 135,
        width: 32, height: 64,
        world: this
    });
    this.actors.add(this.player);
    this.accel = 2;
    this.speed = 5;
    this.maxSpeed = 55;
    this.gravity = new Vec2d(0, 50);

    this.timeLeft = 40;
    this.totalCoins = 0;

    this.layers = [
        new Scrollable('./assets/background.png', [1, 0], {speed: 1}),
        new Scrollable('./assets/background.png', [560, 0], {speed: 1}),
        new Scrollable('./assets/background.png', [1160, 0], {speed: 1}),
        new Scrollable('./assets/foreground.png', [-100, 145], {speed: 45}),
        new Scrollable('./assets/foreground.png', [660, 145], {speed: 45}),
    ];
    this.velocity = new Vec2d(0, 0);
    this.coins = null;
};
_.extend(World.prototype, Scene.prototype, {
    update: function(dt) {
        Scene.prototype.update.call(this, dt);
        dt = (dt / 1000);

        var accel = new Vec2d(this.accel, 0);
        this.velocity.add(accel.mul(dt).mul(GLOBALS.speed));
        this.velocity = this.velocity.truncate(this.maxSpeed);

        // Adjust the game timer.
        this.timeLeft -= dt;

        // Keep a CoinEmitter spawned.
        if (this.coins && this.coins.alive) {
            this.coins.update(dt);
        } else if (this.coins === null) {
            this.coins = new CoinEmitter({
                world: this
            });
            // Add the total to our max coins so we know when to end the level.
            this.totalCoins += this.coins.count;
        } else if (!this.coins.alive) {
            this.coins = null;
        }

        if (this.timeLeft <= 0) {
            this.onEnd();
        }

        // Send the velocity magnitude to our layers, adjusting their speed
        // based on our velocity
        this.layers.forEach(function(layer) {
            layer.speed = (layer.originalSpeed * (this.velocity.magnitude() * 0.005 * (GLOBALS.speed)));
        }, this);
        return;
    },

    onEnd: function() {
        this.game.dispatcher.push(new EndScreen({
            world: this, width: 800, height: 600
        }));
        return;
    },

    collides: function(entity) {
        // Check if the entity is colliding with other entities, or the world
        // itself.
        if (entity.rect.y >= (this.height() - entity.rect.height)) {
            return true;
        }
    },

    draw: function(display) {
        Scene.prototype.draw.call(this, display);
        this.hud.draw(display);
    },

    event: function(ev) {
        this.player.event(ev);
    }
});

var Game = function() {
    this.world = new World({
        game: this,
        width: 800, height: 600
    });
};
_.extend(Game.prototype, {
    draw: function(display) {
        this.world.draw(display);
    },

    update: function(dt) {
        this.world.update(dt);
    },

    event: function(ev) {
        this.world.event(ev);
    }
});

var main = function() {
    var dispatch = new Dispatcher({
        initial: new Game()
    });

    var mainSurface = gamejs.display.setMode(
        [800, 600], gamejs.display.DISABLE_SMOOTHING);

    gamejs.onTick(function(dt) {
        dispatch.update(dt);
        dispatch.draw(mainSurface);
    }, this, 60);

    gamejs.onEvent(function(ev) {
        dispatch.event(ev);
    });
};

gamejs.preload([
    './assets/suchwin.png',
    './assets/numbers.png',
    './assets/numbers-small.png',
    './assets/coin.png',
    './assets/runner.png',
    './assets/background.png',
    './assets/foreground.png',
]);
gamejs.ready(main);

},{"../../../gramework":3,"./hud":1,"gamejs":17,"underscore":46}],3:[function(require,module,exports){
var gamejs = require('gamejs'),
    inherits = require('super');

var textures = exports.textures = {
    //TODO: Replace this hard-coded path
};

var texturePaths = Object.keys(textures).map(function(img) {
    return textures[img];
});

var init = function() {
    gamejs.preload(texturePaths);
};

module.exports = {
    Dispatcher: require('./gramework/dispatcher'),
    Entity: require('./gramework/entity'),
    Camera: require('./gramework/camera'),
    Scene: require('./gramework/scenes').Scene,
    animate: require('./gramework/animate'),
    state: require('./gramework/state'),
    image: require('./gramework/image'),
    input: require('./gramework/input'),
    layers: require('./gramework/layers'),
    particles:  require('./gramework/particles'),
    tilemap: require('./gramework/tilemap'),
    vectors: require('./gramework/vectors'),
    uielements: require('./gramework/uielements'), 
    gamejs: gamejs,
    inherits: inherits,
    init: init
};

//TODO: Kill this in favour of Entity
//exports.actors = require('./gramework/actors');

},{"./gramework/animate":4,"./gramework/camera":5,"./gramework/dispatcher":6,"./gramework/entity":7,"./gramework/image":8,"./gramework/input":9,"./gramework/layers":10,"./gramework/particles":11,"./gramework/scenes":12,"./gramework/state":13,"./gramework/tilemap":14,"./gramework/uielements":15,"./gramework/vectors":16,"gamejs":17,"super":45}],4:[function(require,module,exports){
var gamejs = require('gamejs'),
    inherits = require('super'),
    _ = require('underscore');

/*
 * Prepare a usable image for for a Sprite
 */
var SpriteSheet = exports.SpriteSheet = function(image, w, h) {
    this.width = w;
    this.height = h;

    this.image = gamejs.image.load(image);
    this.surfaceCache = [];

    var imgSize = new gamejs.Rect([0,0],[this.width,this.height]);

    // Extract the cells from the spritesheet image.
    for (var i = 0; i < this.image.rect.height; i += this.height) {
        for (var j = 0; j < this.image.rect.width; j += this.width) {
            var surface = new gamejs.Surface([this.width, this.height]);
            var rect = new gamejs.Rect(j, i, this.width, this.height);
            surface.blit(this.image, imgSize, rect);
            this.surfaceCache.push(surface);
        }
    }

    this.initialize.apply(this, arguments);
};

SpriteSheet.extend = inherits.extend;

// An empty function by default. Override it with your own initialization logic.
SpriteSheet.prototype.initialize = function(options) {};

_.extend(SpriteSheet.prototype, {
    get: function(index) {
        return this.surfaceCache[index];
    }
});

var Animation = exports.Animation = function(spriteSheet, initial, spec) {
    this.spec = spec;

    this.currentFrame = null;
    this.currentFrameDuration = 0;
    this.currentAnimation = null;

    this.spriteSheet = spriteSheet;

    this.image = spriteSheet.get(0);
    this.start(initial);

    this.initialize.apply(this, arguments);
};

Animation.extend = inherits.extend;

// An empty function by default. Override it with your own initialization logic.
Animation.prototype.initialize = function(options) {};


Animation.prototype.start = function(name) {
    this.setState(name);
    this.update(0);
    return;
};

Animation.prototype.setState = function(name) {
    if (this.currentAnimation === name) {
        return;
    }

    this.currentAnimation = name;
    this.currentFrame = this.spec[name].frames[0];
    this.frameIndex = 0;
    this.currentFrameDuration = 0;
    this.frameDuration = 1000 / this.spec[name].rate;
};

Animation.prototype.update = function(msDuration) {
    if (!this.currentAnimation) {
        throw new Error('No animation started.');
    }

    this.currentFrameDuration += msDuration;
    if (this.currentFrameDuration >= this.frameDuration){
        var frames = this.spec[this.currentAnimation].frames;

        this.currentFrame = frames[this.frameIndex++];
        this.currentFrameDuration = 0;

        var length = this.spec[this.currentAnimation].frames.length - 1;
        if (this.frameIndex > length) {
            this.frameIndex = 0;
        }
    }

    this.image = this.spriteSheet.get(this.currentFrame);
    return this.image;
};

},{"gamejs":17,"super":45,"underscore":46}],5:[function(require,module,exports){
/*
 * Create a camera around a display.
 *
 * Create a constrainted view around a specific region, and/or 
 * follow specific positions on the map.
 *
 * Example usage:
 *
 *  var gamejs = require('gamejs')
 *      , Camera = require('gramework/camera');
 *
 *  var surfaceWidth = 640
 *      , surfaceHeight = 480;
 *
 *  var display = gamejs.display.setMode([surfaceWidth, surfaceHeight]);
 *  var surface = new gamejs.Surface([surfaceWidth, surfaceHeight]);
 *  var camera = new Camera(surface, {
 *      width: surfaceWidth / 2,
 *      height: surfaceHeight / 2
 *  })
 *
 *  And, on tick:
 *
 *  var tick = function(msDuration) {
 *      camera.update(msDuration);
 *
 *      // Draw all your actors, backgrounds, etc on primary surface.
 *      display.clear()
 *      surface.blit(aBackground);
 *      actors.draw(surface);
 *
 *      // Then, given the camera has the surface which you've blitted
 *      // everything onto, it will create a constrained view of the surface, which
 *      // you can blit back onto the screen. Performance should be ideal.
 *      var view = camera.draw();
 *      display.blit(view);
 *  };
 */

var gamejs = require('gamejs'),
    _ = require('underscore');

/* Camera initialization.
 *
 * `surface`, an instance of gamejs.Surface.
 * `options`, a hash containing optional keys for `width` and `height`
 *      of the camera. As well as a `zoom` level (default: 1).
 *
 *
 */

var Camera = module.exports = function(sceneExtents, options) {
    this.initialize(sceneExtents, options);
};

_.extend(Camera.prototype, {
    initialize: function(sceneExtents, options) {
        this.width = options.width || 400;
        this.height = options.height || 300;
        this.zoom = options.zoom || 1;
        this.rect = new gamejs.Rect([0,0], [this.width, this.height]);

        this.sceneExtents = sceneExtents;

        this.center = null;
        this.dest = null;
        this.xSpeed = 0;
        this.ySpeed = 0;
        this.zoom_multiplier = 1;
        this.targetZoom = null;
        this.sharp = options.sharp || true;

        // Our constrainted camera view
        this.view = new gamejs.Surface(this.rect);
        return this;
    },

    update: function(dt) {
        // Pan to dest
        if (this.dest !== null) {
            if (this.rect.center[0] < this.dest[0]) {this.rect.moveIp(this.xSpeed,0);}
            if (this.rect.center[0] > this.dest[0]) {this.rect.moveIp(this.xSpeed,0);}
            if (this.rect.center[1] < this.dest[1]) {this.rect.moveIp(0,this.ySpeed);}
            if (this.rect.center[1] > this.dest[1]) {this.rect.moveIp(0,this.ySpeed);}

            this.xSpeed = (this.dest[0] - this.rect.center[0]) / 10;
            this.ySpeed = (this.dest[1] - this.rect.center[1]) / 10;

            if (this.dest == this.rect.center) {
                this.dest = null;
                this.xSpeed = 0;
                this.ySpeed = 0;
            }
        }
        if (this.center !==null) {
            this.dest = this.center.center;
        }

        if (this.targetZoom !== null) {
            if (this.targetZoom > this.zoom) {
                this.zoom_multiplier = 1 + ((this.targetZoom - this.zoom) * 0.1);
            }
            if (this.targetZoom < this.zoom) {
                this.zoom_multiplier = 1 + ((this.targetZoom - this.zoom) * 0.1);
            }
            if (this.targetZoom == this.zoom) {
                this.targetZoom = null;
                this.zoom_multiplier = 1;
            }
        }

        if (this.rect.width <= this.sceneExtents.width && this.rect.height <= this.sceneExtents.height) {
            this.zoom = this.zoom * this.zoom_multiplier;
        }
        this.rect.width = this.width / this.zoom;
        this.rect.height = this.height / this.zoom;

        if (this.sharp) {
            this.rect.left = Math.round(this.rect.left);
            this.rect.top = Math.round(this.rect.top);
        }

        // The camera's extent cannot be bigger than the current surface's size
        if (this.rect.width > this.sceneExtents.width) {
            this.rect.width = this.sceneExtents.width;
        }

        if (this.rect.height > this.sceneExtents.height) {
            this.rect.height = this.sceneExtents.height;
        }

        // The camera cannot pan beyond the extents of the scene
        if (this.rect.top < 0) {
            this.rect.top = 0;
        }
        if (this.rect.left < 0) {
            this.rect.left = 0;
        }
        if (this.rect.bottom > this.sceneExtents.height) {
            this.rect.bottom = this.sceneExtents.height;
        }
        if (this.rect.right > this.sceneExtents.width) {
            this.rect.right = this.sceneExtents.width;
        }
    },

    draw: function(source, destination) {
        destination.blit(source, destination.rect, this.rect);
    },

    panTo: function(pos) {
        this.dest = pos;
        return;
    },

    follow: function(rect) {
        this.center = rect;
        return;
    },

    unfollow: function() {
        this.center = null;
        return;
    },

    // TODO: What does this accept exactly?
    zoomTo: function(zoom) {
        this.targetZoom = zoom;
        return;
    }
});

},{"gamejs":17,"underscore":46}],6:[function(require,module,exports){
/*global document*/
var _ = require('underscore'),
    inherits = require('super'),
    Transition = require('./state').Transition;

function DispatcherException(message) {
    this.message = message;
    this.name = "DispatcherException";
}

var Dispatcher = module.exports = function(gamejs, options) {
    options = (options || {});

    this.stack = [];
    this.defaultTransition = (typeof options.defaultTransition === "undefined" ? Transition : options.defaultTransition);

    if (options.initial) {
        this.push(options.initial);
    }

    options.canvas = (options.canvas || {});
    var canvas;
    if (options.canvas.id) {
        canvas = document.getElementById(options.canvas.id);
    } else {
        canvas = document.getElementById("gjs-canvas");
    }

    if (typeof canvas === "undefined") {
        throw new DispatcherException(
            "No canvas element could be found in the document.");
    }

    var surfaceFlag = options.canvas.flag || undefined;
    this.mainSurface = this._setSurface(gamejs, canvas, surfaceFlag);

    gamejs.onTick(this.onTick, this);
    gamejs.onEvent(this.onEvent, this);

    this.initialize.apply(this, arguments);
};

Dispatcher.extend = inherits.extend;
_.extend(Dispatcher.prototype, {
    // Internal function to set surface from canvas. Overrided in tests until we
    // can better figure out how to mock a *real* canvas.
    _setSurface: function(gamejs, canvas, surfaceFlag) {
        var surface = gamejs.display.setMode(
        [canvas.width, canvas.height], surfaceFlag);
        return surface;
    },

    // An empty function by default. Override it with your own initialization logic
    initialize: function(options) { },

    onTick: function(dt) {
        this.update(dt);
        this.draw(this.mainSurface);
    },

    onEvent: function(ev) {
        this.event(ev);
    },

    reset: function(initial) {
        this.stack = [];
        this.push(initial);
    },

    push: function(state, transition) {
        if (transition !== null) {
            transition = (transition || this.defaultTransition);
        }

        if (transition) {
            var ts = new transition(this.top(), state);
            ts.dispatcher = this;
            this.stack.push(ts);
        } else {
            state.dispatcher = this;
            this.stack.push(state);
        }

    },

    top: function() {
        return this.stack[this.stack.length - 1];
    },

    parent: function() {
        return this.stack[this.stack.length - 2];
    },

    send: function(eventType) {
        var current = this.top();
        if (typeof current[eventType] === "undefined") return;
        current[eventType].apply(current, Array.prototype.slice.call(arguments, 1));
    },

    update: function(dt) {
        this.send("update", dt);
    },

    event: function(ev) {
        this.send("event", ev);
    },

    draw: function(surface) {
        this.send("draw", surface);
    }
});

},{"./state":13,"super":45,"underscore":46}],7:[function(require,module,exports){
// A stripped down, simpler Actors module.
var gamejs = require('gamejs'),
    inherits = require('super'),
    Sprite = gamejs.sprite.Sprite;

/*
 * Required:
 * y: Starting y coordinate
 * x: Starting x coordinate
 * width: Width of sprite rectangle.
 * height: Height of sprite rectangle.
 */
var Entity = module.exports = function(options) {
    Sprite.apply(this, arguments);

    this.w = options.width;
    this.h = options.height;

    this.rect = new gamejs.Rect([
        options.x,
        options.y
    ], [this.w, this.h]);

    this.initialize.apply(this, arguments);
};

Entity.extend = inherits.extend;
inherits(Entity, Sprite);

// An empty function by default. Override it with your own initialization logic.
Entity.prototype.initialize = function(options) {};

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

},{"gamejs":17,"super":45}],8:[function(require,module,exports){
var gamejs = require('gamejs');

var imgfy = exports.imgfy = function(path) {
    return gamejs.image.load(path);
};

},{"gamejs":17}],9:[function(require,module,exports){
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

    this.initialize.apply(this, arguments);
};

GameController.extend = inherits.extend;

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

},{"./vectors":16,"gamejs":17,"super":45,"underscore":46}],10:[function(require,module,exports){
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

},{"./image":8}],11:[function(require,module,exports){
var gamejs = require('gamejs');

var Particle = exports.Particle = function(position, options) {
    this.x = position.x;
    this.y = position.y;
    this.size = options.size || [8,8];
    this.life = options.life || 0;
    this.elapsed = 0;
    this.angle = options.angle * Math.PI / 180 || 0;
    this.speed = options.speed || 1;
    this.velocity = [
        this.speed * Math.sin(this.angle),
        -this.speed * Math.cos(this.angle)
    ];
    this.decel = options.decel || 0.05;
    this.accel = options.accel || [0,0];
    this.color = options.color || [0,0,0];
    this.colorString = 'rgb(' + this.color.join(',') + ')';
    // TODO: We shouldn't force preload these images as they are not necessary
    // for every game. Instead, allow a Particle to have an image defined
    // against it.
    var imageFile = options.imageFile; // || gramework.textures.simpleParticleBlurred;
    this.image = gamejs.image.load(imageFile);
    this.rect = this.image.rect;
};

Particle.prototype.update = function(dt) {
    this.elapsed += dt;
    if (this.elapsed >= this.life) return false;

    this.speed = [
        this.speed[0] + this.accel[0],
        this.speed[1] + this.accel[1]
    ];

    this.x += this.velocity[0];
    this.y += this.velocity[1];

    this.color[0] -= 3;
    //this.color[3] = 1 - (this.elapsed / this.life);
    this.image.setAlpha((this.elapsed / this.life));

    this.colorString = 'rgb(' + this.color.join(',') + ')';
    return true;
};

Particle.prototype.draw = function(surface) {
    //gamejs.draw.circle(surface, this.colorString, [this.x, this.y], 1, 0);
    var colorSurface = this.image.clone();
    colorSurface.fill(this.colorString);
    this.image.blit(colorSurface, [0,0], this.rect, 'source-atop');
    surface.blit(this.image, [this.x, this.y], this.rect, 'lighter');
};

var Emitter = exports.Emitter = function(position, options) {
    this.particles = [];
    this.x = position.x;
    this.y = position.y;
    // rate in particles per second
    this.rate = options.rate || 1;
    this.elapsed = 0;
    this.rendering = options.rendering || 'source-over';
    this.shape = options.shape || 'point';
    this.maxParticles = options.maxParticles || 1000;
};

Emitter.prototype.update = function(dt) {
    this.elapsed += dt;
    while (this.elapsed > 1000 / this.rate && this.particles.length < this.maxParticles) {
        var p = new Particle({x: this.x, y: this.y}, {
            life: 1000,
            color: [255,50,50],
            angle: Math.random() * 30 - 15
        });
        this.particles.push(p);
        this.elapsed -= (1000 / this.rate);
    }
    this.particles.forEach(function(p, i){
        var update = p.update(dt);
        if (update === false)
            this.particles.splice(i,1);
    }, this);
};

Emitter.prototype.draw = function(surface) {
    this.particles.forEach(function(p) {
        p.draw(surface);
    }, this);
};

},{"gamejs":17}],12:[function(require,module,exports){
var gamejs = require('gamejs'),
    inherits = require('super'),
    Camera = require('./camera'),
    _ = require('underscore');

var Scene = exports.Scene = function(options) {
    options = (options || {});

    this._elapsed = 0;
    this._width = options.width;
    this._height = options.height;
    this._pixelScale = options.pixelScale || 1;

    // No options passed, but we can give sensible defaults by getting the games
    // main surface.
    if (!this._width || !this._height) {
        var size = gamejs.display.getSurface().getSize();
        if (this._pixelScale && this._pixelScale !== 1) {
            size = [Math.floor(size[0] / this._pixelScale), Math.floor(size[1] / this._pixelScale)];
        }
        this._width = (Math.floor(this._width / this._pixelScale) || size[0]);
        this._height = (Math.floor(this._height / this._pixelScale) || size[1]);
    }

    // Actors will be deprecated in favour of entities.
    this.actors = new gamejs.sprite.Group();
    this.entities = new gamejs.sprite.Group();

    this.layers = [];
    this.elements = new gamejs.sprite.Group();
    this.view = new gamejs.Surface([this._width, this._height]);

    this.camera = new Camera(this.view.rect, {
        width: this._width,
        height: this._height
    });

    this.surface = new gamejs.Surface(this.camera.rect);

    this.initialize.apply(this, arguments);
};
Scene.extend = inherits.extend;

_.extend(Scene.prototype, {
    // An empty function by default. Override it with your own initialization logic.
    initialize: function(options) {},

    width: function() {
        return this._width;
    },

    height: function() {
        return this._height;
    },

    getElapsedTime: function() {
        return this._elapsed;
    },

    pushEntity: function(entity) {
        this.entities.add(entity);
    },

    pushElement: function(element) {
        this.elements.add(element);
    },

    pushLayer: function(layer) {
        this.layers.push(layer);
    },

    update: function(dt) {
        this.layers.forEach(function(layer) {
            layer.update(dt);
        }, this);

        this.entities.update(dt);
        this.actors.update(dt);
        this.elements.update(dt);
        this.camera.update(dt);
        this._elapsed += dt;
    },

    draw: function(display, options) {
        // TODO: Offer same interface as Sprite groups. No need to iterate
        options = (options || {});

        var defaults = {
            clear: true
        };
        _.extend(defaults, options);

        if (defaults.clear === true) {
            this.view.clear();
            display.clear();
        }

        this.layers.forEach(function(layer) {
            layer.draw(this.view, this.camera);
        }, this);
        this.actors.draw(this.view);
        this.entities.draw(this.view);

        if (this._pixelScale !== 1) {
            this.camera.draw(this.view, this.surface);
            this.elements.draw(this.surface);
            display.blit(this.surface, display.rect);
        } else {
            this.camera.draw(this.view, display);
            this.elements.draw(display);
        }

    }
});

},{"./camera":5,"gamejs":17,"super":45,"underscore":46}],13:[function(require,module,exports){
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
Transition.prototype.update = function(dt) { this.dispatcher.push(this.after, null); };
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

},{"gamejs":17,"super":45}],14:[function(require,module,exports){
/*jshint es5:true */
/*
 * Tilemap module.
 *
 */
var gamejs = require('gamejs'),
    inherits = require('super'),
    Sprite = gamejs.sprite.Sprite,
    extend = gamejs.utils.objects.extend,
    tmx = gamejs.tmx;

var Tile = function(rect, properties, coords) {
    gamejs.sprite.Sprite.apply(this, arguments);

    this.rect = rect;
    this.properties = properties;
    this.coords = coords;

    this.initialize.apply(this, arguments);
};
Tile.extend = inherits.extend;
inherits(Tile, gamejs.sprite.Sprite);

// An empty function by default. Override it with your own initialization logic.
Tile.prototype.initialize = function(options) {};

// Loads the Map at `url` and holds all layers.
var TileMap = exports.TileMap = function(url, options) {
    options = (options || {});
    this.tiles = [];

    var callbacks = options.callbacks || {};

    // Draw each layer
    this.draw = function(display, camera) {
        // If a layer has a z value != 0, it will be offset relative to the camera
        // The offset creates a parallax effect
        // As the z value -> infinity, the scrolling relative to the camera -> 0
        // ie. a greater z value means the layer is further in the distance
        layerViews.forEach(function(layerView) {
            var z = layerView.zValue;
            var offset = [
                camera.rect.left * z / (z+1),
                camera.rect.top * z / (z+1)
            ];
            layerView.draw(display, offset);
        }, this);

    };

    this.getTile = function(x, y){
        return this.tiles[x][y];
    };

    // Initialize.
    var self = this;
    var map = new tmx.Map(url);

    this.getNeighbours = function(x, y) {
        var neighbours = [];
        if (x < map.width - 1) {
            neighbours.push(this.getTile(x+1, y));
        }
        if (y < map.height - 1) {
            neighbours.push(this.getTile(x, y+1));
        }
        if (x > 0) {
            neighbours.push(this.getTile(x-1, y));
        }
        if (y > 0) {
            neighbours.push(this.getTile(x, y-1));
        }
        return neighbours;
    };

    // Given the TMX Map we've loaded, go through each layer (via map.layers,
    // provided by gamejs), and return a LayerView that we can deal with.
    var layerViews = map.layers.map(function(layer) {
        return new LayerView(self, layer, {
            tileWidth: map.tileWidth,
            tileHeight: map.tileHeight,
            width: map.width,
            height: map.height,
            tiles: map.tiles,
            callbacks: callbacks
        });
    });
    return this;
};

var LayerView = function(map, layer, opts) {
    if (layer.properties) {
        this.zValue = layer.properties.z || 0;
        this.doDraw = layer.properties.draw || true;
        this.solid = layer.properties.solid || false;
    } else {
        this.zValue = 0;
        this.doDraw = true;
        this.solid = false;
    }
    this.draw = function(display, offset) {
        if (this.doDraw === true) display.blit(this.surface, offset);
    };

    // Initialize.
    this.surface = new gamejs.Surface(
        opts.width * opts.tileWidth,
        opts.height * opts.tileHeight
    );
    this.surface.setAlpha(layer.opacity);

    // Note how below we look up the "gid" of the tile images in the TileSet 
    // from the Map ('opt.tiles') to get the actual Surfaces.
    layer.gids.forEach(function(row, i) {
        row.forEach(function(gid, j) {
            if (!map.tiles[j]) {
                map.tiles[j] = [];
            }
            if (gid === 0) {
                return;
            }

            var tileProperties = opts.tiles.getProperties(gid);
            var tileSurface = opts.tiles.getSurface(gid);
            if (tileSurface) {
                var tilePos = [j * opts.tileWidth, i * opts.tileHeight];
                var tileRect = new gamejs.Rect(
                  tilePos,
                  [opts.tileWidth, opts.tileHeight]
                );
                this.surface.blit(tileSurface, tileRect);
                var coords = [j, i];
                var tile = new Tile(tileRect, tileProperties, coords);
                map.tiles[j][i] = tile;

                // Tile property callbacks.
                Object.keys(tileProperties).forEach(function(prop) {
                    Object.keys(opts.callbacks).forEach(function(fn) {
                        if (prop === fn) opts.callbacks[fn](tileRect);
                    });
                });
            } else {
                gamejs.log('No GID ', gid, i, j, 'layer', i);
            }
        }, this);
    }, this);
    return this;
};

},{"gamejs":17,"super":45}],15:[function(require,module,exports){
/*jshint es5:true */
/*
 * Interface Entity module.
 *
 */
var gamejs = require('gamejs');
var Entity = require('./entity'),
    inherits = require('super'),
    _ = require('underscore');

var Element = exports.Element = function(options) {
    Entity.apply(this, arguments);
};

_.extend(Element.prototype, Entity.prototype, {
    initialize: function(options) {
        // TODO: Allow borderWidth to accept array to differentiate between vertical width and horizontal width
        this.borderWidth = options.borderWidth || 0;

        if (options.color) {
            if (options.color.length === 3) {
                this.color = 'rgb(' + options.color.join(',') + ')';
            } else if (options.color.length === 4) {
                this.color = 'rgba(' + options.color.join(',') + ')';
            }
        } else {
            this.color = '#000';
        }

        if (options.borderColor) {
            if (options.borderColor.length === 3) {
                this.borderColor = 'rgb(' + options.borderColor.join(',') + ')';
            } else if (options.borderColor.length === 4) {
                this.borderColor = 'rgba(' + options.borderColor.join(',') + ')';
            }
        } else {
            this.borderColor = '#000';
        }

        if (options.borderImage) {
            this.borderImage = new BorderImage({
                slice: options.borderImageSlice,
                imgPath: options.borderImage,
                repeat: options.borderImageRepeat,
                width: this.w + this.borderWidth,
                height: this.h + this.borderWidth,
                x: this.rect.left - (this.borderWidth / 2),
                y: this.rect.top - (this.borderWidth / 2),
                //size: [width + 2 * this.borderWidth, height + 2 * this.borderWidth],
                //position: [this.position[0] - this.borderWidth, this.position[1] - this.borderWidth],
                borderWidth: this.borderWidth
            });
        }

        if (options.image) {
            this.image = gamejs.image.load(options.image);
        }
    },

    update: function(dt) {

    },

    draw: function(surface) {
        if (this.image) {

        } else {
            gamejs.draw.rect(surface, this.color, this.rect);
        }

        if (this.borderImage) {
            this.borderImage.draw(surface);
        } else if (this.borderWidth > 0){
            gamejs.draw.rect(
                surface,
                this.borderColor,
                this.rect,
                this.borderWidth
            );
        }

    }
});

var BorderImage = function(options) {
    Entity.apply(this, arguments);
};

_.extend(BorderImage.prototype, Entity.prototype, {
    initialize: function(options) {
        this.imgPath = options.imgPath;
        this.ninePatch = gamejs.image.load(this.imgPath);

        if (Array.isArray(options.slice) && options.slice.length === 2) {
            this.vSlice = options.slice[1];
            this.hSlice = options.slice[0];
        } else if (typeof options.slice === 'number') {
            this.vSlice = this.hSlice = options.slice
        }
        this.repeat = options.repeat || 'repeat';
        this.position = options.position || [0,0];
        this.borderWidth = options.borderWidth || 0;

        /*
        This is where the BorderImage object breaks apart the image file into nine sections and creates
        the respective surfaces for the corners and sides. These will be drawn around the parent element
        object at the time of rendering
        */

        var imgSize = this.ninePatch.getSize();
        if (this.vSlice > imgSize[1]) throw new Error("vert slice greater than image height");
        if (this.hSlice > imgSize[0]) throw new Error("horz slice greater than image width");

        var columnHeight = imgSize[1] - (2 * this.vSlice);
        var rowWidth = imgSize[0] - (2 * this.hSlice);
        var cornerRect = new gamejs.Rect(0,0,this.borderWidth,this.borderWidth);
        var columnRect = new gamejs.Rect(0,0,this.borderWidth,columnHeight);
        var rowRect = new gamejs.Rect(0,0,rowWidth,this.borderWidth);

        this.leftBorderFull = new gamejs.Surface(this.borderWidth, this.h - 2 * this.borderWidth);
        this.rightBorderFull = new gamejs.Surface(this.borderWidth, this.h - 2 * this.borderWidth);
        this.topBorderFull = new gamejs.Surface(this.w - 2 * this.borderWidth, this.borderWidth);
        this.bottomBorderFull = new gamejs.Surface(this.w - 2 * this.borderWidth, this.borderWidth);

        this.topLeft = new gamejs.Surface(this.borderWidth, this.borderWidth);
        this.topRight = new gamejs.Surface(this.borderWidth, this.borderWidth);
        this.bottomLeft = new gamejs.Surface(this.borderWidth, this.borderWidth);
        this.bottomRight = new gamejs.Surface(this.borderWidth, this.borderWidth);

        this.leftBorder = new gamejs.Surface(this.borderWidth, columnHeight);
        this.rightBorder = new gamejs.Surface(this.borderWidth, columnHeight);
        this.topBorder = new gamejs.Surface(rowWidth, this.borderWidth);
        this.bottomBorder = new gamejs.Surface(rowWidth, this.borderWidth);

        var topLeftRect = new gamejs.Rect(0,0,this.hSlice,this.vSlice);
        var topRightRect = new gamejs.Rect(imgSize[0]-this.hSlice,0,this.hSlice,this.vSlice);
        var bottomLeftRect = new gamejs.Rect(0, imgSize[1]-this.vSlice,this.hSlice,this.vSlice);
        var bottomRightRect = new gamejs.Rect(imgSize[0]-this.hSlice,imgSize[1]-this.vSlice,this.hSlice,this.vSlice);

        this.topLeft.blit(this.ninePatch, cornerRect, topLeftRect);
        this.topRight.blit(this.ninePatch, cornerRect, topRightRect);
        this.bottomLeft.blit(this.ninePatch, cornerRect, bottomLeftRect);
        this.bottomRight.blit(this.ninePatch, cornerRect, bottomRightRect);
        
        var leftRect = new gamejs.Rect(0,this.vSlice,this.hSlice,columnHeight);
        var rightRect = new gamejs.Rect(imgSize[0]-this.hSlice,this.vSlice,this.hSlice,columnHeight);
        var topRect = new gamejs.Rect(this.hSlice,0,rowWidth,this.vSlice);
        var bottomRect = new gamejs.Rect(this.hSlice,imgSize[1]-this.vSlice,rowWidth,this.vSlice);

        this.leftBorder.blit(this.ninePatch, columnRect, leftRect);
        this.rightBorder.blit(this.ninePatch, columnRect, rightRect);
        this.topBorder.blit(this.ninePatch, rowRect, topRect);
        this.bottomBorder.blit(this.ninePatch, rowRect, bottomRect);

        this.image = new gamejs.Surface(this.rect);

        console.log(this.x + ' ' + this.y);
        
        for (var i=0;i*this.leftBorder.getSize()[1] < this.h;i++) {
            this.leftBorderFull.blit(this.leftBorder, [0,(i*this.leftBorder.getSize()[1])]);
            this.rightBorderFull.blit(this.rightBorder, [0,(i*this.leftBorder.getSize()[1])]);
        }

        this.image.blit(this.leftBorderFull, [0, this.borderWidth]);
        this.image.blit(this.rightBorderFull, [this.w-this.borderWidth, this.borderWidth]);

        for (var i=0;i*this.topBorder.getSize()[0] < this.w;i++) {
            this.topBorderFull.blit(this.topBorder, [(i*this.topBorder.getSize()[0]),0]);
            this.bottomBorderFull.blit(this.bottomBorder, [(i*this.topBorder.getSize()[0]),0]);
        }

        this.image.blit(this.topBorderFull, [this.borderWidth, 0]);
        this.image.blit(this.bottomBorderFull, [this.borderWidth, this.h-this.borderWidth]);

        this.image.blit(this.topLeft);
        this.image.blit(this.topRight, [this.w-this.borderWidth,0]);
        this.image.blit(this.bottomLeft, [0,this.h - this.borderWidth]);
        this.image.blit(this.bottomRight, [this.w-this.borderWidth,this.h - this.borderWidth]);

        console.log(this.image);
    },

    update: function() {

    }
});

var gradientSurface = function(surface, options) {
    var gradSurface = surface.clone();

    var colors = options.colors || [[255, 255, 255]];
    var steps = options.steps || 1;

    var segHeight = gradSurface.height / this.steps;

    if (colors.length === 1){
        gradSurface.fill(colors[0]);
        return gradSurface;
    }
    var subSteps = steps / (colors.length - 1);
    colors.forEach(function(color, i) {
        if (colors[i+1] === undefined){}
        var nextColor = colors[i+1];
        var rStep = (color[0] - nextColor[0]) / subSteps;
        var gStep = (color[1] - nextColor[1]) / subSteps;
        var bStep = (color[2] - nextColor[2]) / subSteps;

        for (var i=0; i < subSteps; i++) {
            var subRect = new gamejs.Rect(
                [0, Math.floor(segHeight * i)],
                [gradSurface.width, Math.ceil(segHeight)]);
            var thisColor = [
                Math.floor(Math.abs(color[0] - (i * rStep))),
                Math.floor(Math.abs(color[1] - (i * gStep))),
                Math.floor(Math.abs(color[2] - (i * bStep)))
            ];

            var thisColor = 'rgb(' + thisColor.join(',') + ')';
            gamejs.draw.rect(gradSurface, thisColor, subRect, 0);
        }
    });

    return gradSurface;
};

/*
var font = new gamejs.font.Font('8px Ebit');

var TextBlock = exports.TextBlock = function(pos, dims, options) {
    this.rect = new gamejs.Rect(pos, dims);
    this.surface = new gamejs.Surface(this.rect);
    this.init(options);
};

TextBlock.prototype.init = function(options) {
    var fontName = options.fontName || '8px Ebit';
    this.font = new gamejs.font.Font(fontName);
    this.text = options.text || '';
    this.fontColor = options.fontColor || '#000';
    this.scrolling = options.scrolling || false;
    this.currentText = '';
    this.fontSurface = [];
    this.lines = [];

    if (this.scrolling === false) this.currentText = this.text;
    this.lineSetup();
};

TextBlock.prototype.lineSetup = function() {
    this.words = this.currentText.split(" ");
    var done = false;
    var i = 0;
    this.lines[i] = '';
    //Text line wrapping
    this.words.forEach(function(word) {
        this.fontSurface[i] = this.font.render(
            this.lines[i] + word + ' ',
            this.fontColor);
        fontSurfaceWidth = this.fontSurface[i].getSize();
        if (fontSurfaceWidth[0] > this.width) {
            //Too wide. Time to wrap
            this.fontSurface[i] = this.font.render(
                this.lines[i],
                this.fontColor);
            i++;
            this.lines[i] = '';
        }
        this.lines[i] +=  word + ' ';
    }, this);
};

TextBlock.prototype.update = function(msDuration) {
};

TextBlock.prototype.draw = function(surface) {
    var lineHeight;
    if (this.fontSurface[0]) {
        lineHeight = this.fontSurface[0].getSize()[1] || 0;
    } else {
        lineHeight = 0;
    }
    this.fontSurface.forEach(function(line, idx) {
        this.surface.blit(line, [0, idx * lineHeight]);
    }, this);

    surface.blit(this.surface, this.rect);

    return;
};




var Menu = exports.Menu = function(options){
    this.items = [];
    this.init(options);
};

Menu.prototype.init = function(options){
    this.title = options.title || undefined;
    if (options.width && options.height) {
        if (options.color.length === 4)
            var colorString = "rgba("+options.color.join(',')+")";
        else if (options.color.length === 3)
            var colorString = "rgb("+options.color.join(',')+")";
        else var colorString = "rgb(0,0,0)";
        this.surface = new Element(options.height, options.width, {
            color: colorString,
            position: options.position || [0,0],
            borderWidth: options.borderWidth || 0,
            borderImage: {
                vSlice: options.borderImage.vSlice || 0,
                hSlice: options.borderImage.hSlice || 0
            }
        });
    } else {
        this.surface = undefined;
    }
    if (options.items){
        options.items.forEach(function(item){
            var newItem = new MenuItem(item);
            this.items.push(newItem);
        }, this);
    }

    this._isActive = false;
    this.padding = options.padding || 0;
    if (options.border){

    }
};

Menu.prototype.isActive = function(){
    return this._isActive;
};

Menu.prototype.activate = function(){
    return this._isActive = true; 
};

Menu.prototype.deactivate = function(){
    return this._isActive = false;
};

Menu.prototype.update = function(dt){
    this.surface.update(dt);
};

Menu.prototype.draw = function(surface) {
    this.surface.draw(surface);
    this.items.forEach(function(item) {
        item.draw(this.surface.background);
    }, this);
};

var MenuItem = exports.MenuItem = function(options){
    this.init(options);
};

MenuItem.prototype.init = function(options){
    this.widget = options.widget;
    this.linkedValue = options.linkedValue || undefined;
    this.activate = options.onSelect || undefined;
    this._selected = false;
    this.height;
    this.width;
};

MenuItem.prototype.activate = function(){ 
    this.activate;
};

MenuItem.prototype.isSelected = function(){
    return this._selected;
};

MenuItem.prototype.select = function(){
    this._selected = true;
};

MenuItem.prototype.deselect = function(){
    this._selected = false;
};

MenuItem.prototype.draw = function(){
    this.widget.draw();
};

var MenuWidget = function(options){
    this.init(options);
};

MenuWidget.prototype.init = function(options){

};

var TextWidget = function(options){
    TextWidget.superConstructor.apply(this, arguments);
};
objects.extend(TextWidget, MenuWidget);

TextWidget.prototype.init = function(options){
    this.text = options.text;
};

var SliderWidget = function(options){
    SliderWidget.superConstructor.apply(this, arguments);
};
objects.extend(SliderWidget, MenuWidget);

SliderWidget.prototype.init = function(options){

};

*/
},{"./entity":7,"gamejs":17,"super":45,"underscore":46}],16:[function(require,module,exports){
/*jslint es5: true*/
/*
 * Vector Utilities
 *
 * For ease of implementing all your 2D Vector needs.
 * Re-uses existing vector functionality available in gamejs
 * with some additional helpful methods to make it easy
 * to work with objects that represent Vectors.
 * */

var gamejs = require('gamejs'),
    _ = require('underscore'),
    utils = gamejs.utils;

/*
 * Parse the arguments passed into Vec2d
 */
function parseArgs(args) {
    // User passed an array
    if (Array.isArray(args[0])) {
        return args[0];
    }
    // User passed x and y
    else if (args.length === 2) {
        return new Array(args[0], args[1]);
    }
    // User passed an object of x and y
    else if (args[0] === Object(args[0])) {
        return [args[0].x, args[0].y];
    } else {
        return [0, 0];
    }
}

// Help get vector (well, any) lengths down to 0
var dampen = exports.dampen = function(length, amount, min) {
    min = (min || 0);
    if (length > min) {
        return Math.max(min, length - amount);
    } else if (length < -min) {
        return Math.min(-min, length + amount);
    } else {
        return length;
    }
};

var dampenVector = exports.dampenVector = function(vec, amount, min) {
    var length = vec.length();
    if (length === 0) return;

    var newLength = dampen(length, amount, min);

    vec.setX(vec.getX() / length * newLength);
    vec.setY(vec.getY() / length * newLength);
    return vec;
};

var Vector = function(v) {
    this._vec = new Array(v[0], v[1]);
    return this;
};

Vector.prototype = {
    // Expiremental getter and setter support.
    get x() {
        return this._vec[0];
    },

    set x(value) {
        this._vec[0] = value;
    },

    get y() {
        return this._vec[1];
    },

    set y(value) {
        this._vec[1] = value;
    },

    length: function() {
        return utils.vectors.len(this._vec);
    },

    set: function(vec) {
        this._vec[0] = vec[0];
        this._vec[1] = vec[1];
        return this;
    },

    getX: function() {
        return this._vec[0];
    },

    getY: function() {
        return this._vec[1];
    },

    setX: function(x) {
        this._vec[0] = x;
    },

    setY: function(y) {
        this._vec[1] = y;
    },

    unpack: function() {
        return [this._vec[0], this._vec[1]];
    },

    add: function(right) {
        // We passed a Vector object
        if (right === Object(right)) {
            right = right._vec;
        }
        // Number.
        else {
            right = [right, right];
        }
        this.set(utils.vectors.add(this._vec, right));
        return this;
    },

    mul: function(right) {
        // We passed a Vector object.
        if (right === Object(right)) {
            return this.set(utils.vectors.multiply(this._vec, right._vec));
        }
        // Passed a number.
        else {
            return this.multiplyByScalar(right);
        }
    },

    magnitude: function() {
        return Math.sqrt(
            (this._vec[0] * this._vec[0]) +
            (this._vec[1] * this._vec[1])
        );
    },

    // Limit the length of a vector.
    truncate: function(length) {
        return this.set(utils.vectors.truncate(this._vec, length));
    },

    // Multiply by a provided number.
    multiplyByScalar: function(n) {
        this._vec[0] *= n;
        this._vec[1] *= n;
        return this;
    },

    normalized: function() {
        return this.set(this.multiplyByScalar(1, this.magnitude())._vec);
    },

    isZero: function() {
        return (this._vec[0] === 0 && this._vec[1] === 0);
    }
};

// Primary accessor to Vector interface.
var Vec2d = exports.Vec2d = function() {
    return this.create(arguments); 
};

Vec2d.prototype = {
    Vector: Vector,

    create: function(args) {
        return new this.Vector(parseArgs(args));
    }
};


},{"gamejs":17,"underscore":46}],17:[function(require,module,exports){
var matrix = require('./gamejs/utils/matrix');
var objects = require('./gamejs/utils/objects');
var Callback = require('./gamejs/callback').Callback;

/**
 * @fileoverview This module holds the essential `Rect` and `Surface` classes as
 * well as static methods for preloading assets. `gamejs.ready()` is maybe
 * the most important as it kickstarts your app.
 *
 * Your game should provide callbacks for `gamejs.onEvent` to handle events.
 * To get called continuously, provide a callback to `gamejs.onTick.
 *
 */

var DEBUG_LEVELS = ['info', 'warn', 'error', 'fatal'];
var debugLevel = 2;

/**
 * set logLevel as string or number
 *   * 0 = info
 *   * 1 = warn
 *   * 2 = error
 *   * 3 = fatal
 *
 * @example
 * gamejs.setLogLevel(0); // debug
 * gamejs.setLogLevel('error'); // equal to setLogLevel(2)
 */
exports.setLogLevel = function(logLevel) {
   if (typeof logLevel === 'string' && DEBUG_LEVELS.indexOf(logLevel)) {
      debugLevel = DEBUG_LEVELS.indexOf(logLevel);
   } else if (typeof logLevel === 'number') {
      debugLevel = logLevel;
   } else {
      throw new Error('invalid logLevel ', logLevel, ' Must be one of: ', DEBUG_LEVELS);
   }
   return debugLevel;
};
/**
 * Log a msg to the console if console is enable
 * @param {String} msg the msg to log
 */
var log = exports.log = function() {

   if (gamejs.worker.inWorker === true) {
      gamejs.worker._logMessage(arguments);
      return;
   }

   // IEFIX can't call apply on console
   var args = Array.prototype.slice.apply(arguments, [0]);
   args.unshift(Date.now());
   if (window.console !== undefined && console.log.apply) {
      console.log.apply(console, args);
   }
};
exports.info = function() {
   if (debugLevel <= DEBUG_LEVELS.indexOf('info')) {
      log.apply(this, arguments);
   }
};
exports.warn = function() {
   if (debugLevel <= DEBUG_LEVELS.indexOf('warn')) {
      log.apply(this, arguments);
   }
};
exports.error = function() {
   if (debugLevel <= DEBUG_LEVELS.indexOf('error')) {
      log.apply(this, arguments);
   }
};
exports.fatal = function() {
   if (debugLevel <= DEBUG_LEVELS.indexOf('fatal')) {
      log.apply(this, arguments);
   }
};

/**
 * Normalize various ways to specify a Rect into {left, top, width, height} form.
 *
 */
function normalizeRectArguments() {
   var left = 0;
   var top = 0;
   var width = 0;
   var height = 0;

   if (arguments.length === 2) {
      if (arguments[0] instanceof Array && arguments[1] instanceof Array) {
         left = arguments[0][0];
         top = arguments[0][1];
         width = arguments[1][0];
         height = arguments[1][1];
      } else {
         left = arguments[0];
         top = arguments[1];
      }
   } else if (arguments.length === 1 && arguments[0] instanceof Array) {
      left = arguments[0][0];
      top = arguments[0][1];
      width = arguments[0][2];
      height = arguments[0][3];
   } else if (arguments.length === 1 && arguments[0] instanceof Rect) {
      left = arguments[0].left;
      top = arguments[0].top;
      width = arguments[0].width;
      height = arguments[0].height;
   } else if (arguments.length === 4) {
      left = arguments[0];
      top = arguments[1];
      width = arguments[2];
      height = arguments[3];
   } else {
      throw new Error('not a valid rectangle specification');
   }
   return {left: left || 0, top: top || 0, width: width || 0, height: height || 0};
}

/**
 * Creates a Rect. Rects are used to hold rectangular areas. There are a couple
 * of convinient ways to create Rects with different arguments and defaults.
 *
 * Any function that requires a `gamejs.Rect` argument also accepts any of the
 * constructor value combinations `Rect` accepts.
 *
 * Rects are used a lot. They are good for collision detection, specifying
 * an area on the screen (for blitting) or just to hold an objects position.
 *
 * The Rect object has several virtual attributes which can be used to move and align the Rect:
 *
 *   top, left, bottom, right
 *   topleft, bottomleft, topright, bottomright
 *   center
 *   width, height
 *   w,h
 *
 * All of these attributes can be assigned to.
 * Assigning to width or height changes the dimensions of the rectangle; all other
 * assignments move the rectangle without resizing it. Notice that some attributes
 * are Numbers and others are pairs of Numbers.
 *
 * @example
 * new Rect([left, top]) // width & height default to 0
 * new Rect(left, top) // width & height default to 0
 * new Rect(left, top, width, height)
 * new Rect([left, top], [width, height])
 * new Rect(oldRect) // clone of oldRect is created
 *
 * @property {Number} right
 * @property {Number} bottom
 * @property {Number} center
 *
 * @param {Array|gamejs.Rect} position Array holding left and top coordinates
 * @param {Array} dimensions Array holding width and height
 */
var Rect = exports.Rect = function() {

   var args = normalizeRectArguments.apply(this, arguments);

   /**
    * Left, X coordinate
    * @type Number
    */
   this.left = args.left;

   /**
    * Top, Y coordinate
    * @type Number
    */
   this.top = args.top;

   /**
    * Width of rectangle
    * @type Number
    */
   this.width = args.width;

   /**
    * Height of rectangle
    * @type Number
    */
   this.height = args.height;

   return this;
};

objects.accessors(Rect.prototype, {
   /**
    * Bottom, Y coordinate
    * @name Rect.prototype.bottom
    * @type Number
    */
   'bottom': {
      get: function() {
         return this.top + this.height;
      },
      set: function(newValue) {
         this.top = newValue - this.height;
         return;
      }
   },
   /**
    * Right, X coordinate
    * @name Rect.prototype.right
    * @type Number
    */
   'right': {
      get: function() {
         return this.left + this.width;
      },
      set: function(newValue) {
         this.left = newValue - this.width;
      }
   },
   /**
    * Center Position. You can assign a rectangle form.
    * @name Rect.prototype.center
    * @type Array
    */
   'center': {
      get: function() {
         return [this.left + (this.width / 2) | 0,
                 this.top + (this.height / 2) | 0
                ];
      },
      set: function() {
         var args = normalizeRectArguments.apply(this, arguments);
         this.left = args.left - (this.width / 2) | 0;
         this.top = args.top - (this.height / 2) | 0;
         return;
      }
   },
   /**
    * Top-left Position. You can assign a rectangle form.
    * @name Rect.prototype.topleft
    * @type Array
    */
   'topleft': {
      get: function() {
         return [this.left, this.top];
      },
      set: function() {
         var args = normalizeRectArguments.apply(this, arguments);
         this.left = args.left;
         this.top = args.top;
         return;
      }
   },
   /**
    * Bottom-left Position. You can assign a rectangle form.
    * @name Rect.prototype.bottomleft
    * @type Array
    */
   'bottomleft': {
      get: function() {
         return [this.left, this.bottom];
      },
      set: function() {
         var args = normalizeRectArguments.apply(this, arguments);
         this.left = args.left;
         this.bottom = args.top;
         return;
      }
   },
   /**
    * Top-right Position. You can assign a rectangle form.
    * @name Rect.prototype.topright
    * @type Array
    */
   'topright': {
      get: function() {
         return [this.right, this.top];
      },
      set: function() {
         var args = normalizeRectArguments.apply(this, arguments);
         this.right = args.left;
         this.top = args.top;
         return;
      }
   },
   /**
    * Bottom-right Position. You can assign a rectangle form.
    * @name Rect.prototype.bottomright
    * @type Array
    */
   'bottomright': {
      get: function() {
         return [this.right, this.bottom];
      },
      set: function() {
         var args = normalizeRectArguments.apply(this, arguments);
         this.right = args.left;
         this.bottom = args.top;
         return;
      }
   },
   /**
    * Position x value, alias for `left`.
    * @name Rect.prototype.y
    * @type Array
    */
   'x': {
      get: function() {
         return this.left;
      },
      set: function(newValue) {
         this.left = newValue;
         return;
      }
   },
   /**
    * Position y value, alias for `top`.
    * @name Rect.prototype.y
    * @type Array
    */
   'y': {
      get: function() {
         return this.top;
      },
      set: function(newValue) {
         this.top = newValue;
         return;
      }
   }
});

/**
 * Move returns a new Rect, which is a version of this Rect
 * moved by the given amounts. Accepts any rectangle form.
 * as argument.
 *
 * @param {Number|gamejs.Rect} x amount to move on x axis
 * @param {Number} y amount to move on y axis
 */
Rect.prototype.move = function() {
   var args = normalizeRectArguments.apply(this, arguments);
   return new Rect(this.left + args.left, this.top + args.top, this.width, this.height);
};

/**
 * Move this Rect in place - not returning a new Rect like `move(x, y)` would.
 *
 * `moveIp(x,y)` or `moveIp([x,y])`
 *
 * @param {Number|gamejs.Rect} x amount to move on x axis
 * @param {Number} y amount to move on y axis
 */
Rect.prototype.moveIp = function() {
   var args = normalizeRectArguments.apply(this, arguments);
   this.left += args.left;
   this.top += args.top;
   return;
};

/**
 * Return the area in which this Rect and argument Rect overlap.
 *
 * @param {gamejs.Rect} Rect to clip this one into
 * @returns {gamejs.Rect} new Rect which is completely inside the argument Rect,
 * zero sized Rect if the two rectangles do not overlap
 */
Rect.prototype.clip = function(rect) {
   if(!this.collideRect(rect)) {
      return new Rect(0,0,0,0);
   }

   var x, y, width, height;

   // Left
   if ((this.left >= rect.left) && (this.left < rect.right)) {
      x = this.left;
   } else if ((rect.left >= this.left) && (rect.left < this.right)) {
      x = rect.left;
   }

   // Right
   if ((this.right > rect.left) && (this.right <= rect.right)) {
      width = this.right - x;
   } else if ((rect.right > this.left) && (rect.right <= this.right)) {
      width = rect.right - x;
   }

   // Top
   if ((this.top >= rect.top) && (this.top < rect.bottom)) {
      y = this.top;
   } else if ((rect.top >= this.top) && (rect.top < this.bottom)) {
      y = rect.top;
   }

   // Bottom
   if ((this.bottom > rect.top) && (this.bottom <= rect.bottom)) {
     height = this.bottom - y;
   } else if ((rect.bottom > this.top) && (rect.bottom <= this.bottom)) {
     height = rect.bottom - y;
   }
   return new Rect(x, y, width, height);
};

/**
 * Join two rectangles
 *
 * @param {gamejs.Rect} union with this rectangle
 * @returns {gamejs.Rect} rectangle containing area of both rectangles
 */
Rect.prototype.union = function(rect) {
   var x, y, width, height;

   x = Math.min(this.left, rect.left);
   y = Math.min(this.top, rect.top);
   width = Math.max(this.right, rect.right) - x;
   height = Math.max(this.bottom, rect.bottom) - y;
   return new Rect(x, y, width, height);
};

/**
 * Grow or shrink the rectangle size
 *
 * @param {Number} amount to change in the width
 * @param {Number} amount to change in the height
 * @returns {gamejs.Rect} inflated rectangle centered on the original rectangle's center
 */
Rect.prototype.inflate = function(x, y) {
    var copy = this.clone();

    copy.inflateIp(x, y);

    return copy;
};

/**
 * Grow or shrink this Rect in place - not returning a new Rect like `inflate(x, y)` would.
 *
 * @param {Number} amount to change in the width
 * @param {Number} amount to change in the height
 */
Rect.prototype.inflateIp = function(x, y) {
    // Use Math.floor here to deal with rounding of negative numbers the
    // way this relies on.
    this.left -= Math.floor(x / 2);
    this.top -= Math.floor(y / 2);
    this.width += x;
    this.height += y;
};

/**
 * Check for collision with a point.
 *
 * `collidePoint(x,y)` or `collidePoint([x,y])` or `collidePoint(new Rect(x,y))`
 *
 * @param {Array|gamejs.Rect} point the x and y coordinates of the point to test for collision
 * @returns {Boolean} true if the point collides with this Rect
 */
Rect.prototype.collidePoint = function() {
   var args = normalizeRectArguments.apply(this, arguments);
   return (this.left <= args.left && args.left <= this.right) &&
       (this.top <= args.top && args.top <= this.bottom);
};

/**
 * Check for collision with a Rect.
 * @param {gamejs.Rect} rect the Rect to test check for collision
 * @returns {Boolean} true if the given Rect collides with this Rect
 */
Rect.prototype.collideRect = function(rect) {
   return !(this.left > rect.right || this.right < rect.left ||
      this.top > rect.bottom || this.bottom < rect.top);
};

/**
 * @param {Array} pointA start point of the line
 * @param {Array} pointB end point of the line
 * @returns true if the line intersects with the rectangle
 * @see http://stackoverflow.com/questions/99353/how-to-test-if-a-line-segment-intersects-an-axis-aligned-rectange-in-2d/293052#293052
 *
 */
Rect.prototype.collideLine = function(p1, p2) {
   var x1 = p1[0];
   var y1 = p1[1];
   var x2 = p2[0];
   var y2 = p2[1];

   function linePosition(point) {
      var x = point[0];
      var y = point[1];
      return (y2 - y1) * x + (x1 - x2) * y + (x2 * y1 - x1 * y2);
   }

   var relPoses = [[this.left, this.top],
                   [this.left, this.bottom],
                   [this.right, this.top],
                   [this.right, this.bottom]
                  ].map(linePosition);

   var noNegative = true;
   var noPositive = true;
   var noZero = true;
   relPoses.forEach(function(relPos) {
      if (relPos > 0) {
         noPositive = false;
      } else if (relPos < 0) {
         noNegative = false;
      } else if (relPos === 0) {
         noZero = false;
      }
   }, this);

   if ( (noNegative || noPositive) && noZero) {
      return false;
   }
   return !((x1 > this.right && x2 > this.right) ||
            (x1 < this.left && x2 < this.left) ||
            (y1 < this.top && y2 < this.top) ||
            (y1 > this.bottom && y2 > this.bottom)
            );
};

/**
 * @returns {String} Like "[x, y][w, h]"
 */
Rect.prototype.toString = function() {
   return ["[", this.left, ",", this.top, "]"," [",this.width, ",", this.height, "]"].join("");
};

/**
 * @returns {gamejs.Rect} A new copy of this rect
 */
Rect.prototype.clone = function() {
   return new Rect(this);
};

/**
 * A Surface represents a bitmap image with a fixed width and height. The
 * most important feature of a Surface is that they can be `blitted`
 * onto each other.
 *
 * @example
 * new gamejs.Surface([width, height]);
 * new gamejs.Surface(width, height);
 * new gamejs.Surface(rect);
 * @constructor
 *
 * @param {Array} dimensions Array holding width and height
 */
var Surface = exports.Surface = function() {
   var args = normalizeRectArguments.apply(this, arguments);
   var width = args.left;
   var height = args.top;
   // unless argument is rect:
   if (arguments.length == 1 && arguments[0] instanceof Rect) {
      width = args.width;
      height = args.height;
   }
   // only for rotatation & scale
   /** @ignore */
   this._matrix = matrix.identity();
   /** @ignore */
	this._canvas = document.createElement("canvas");
	this._canvas.width = width;
	this._canvas.height = height;
	/** @ignore */
	this._blitAlpha = 1.0;

   /** @ignore */
   this._context = this._canvas.getContext('2d');
   // using exports is weird but avoids circular require
   if (exports.display._isSmoothingEnabled()) {
      this._smooth();
   } else {
      this._noSmooth();
   }
   return this;
};

/** @ignore */
Surface.prototype._noSmooth = function() {
	// disable image scaling
	// see https://developer.mozilla.org/en/Canvas_tutorial/Using_images#Controlling_image_scaling_behavior
	// and https://github.com/jbuck/processing-js/commit/65de16a8340c694cee471a2db7634733370b941c
	this.context.mozImageSmoothingEnabled = false;
  this.context.webkitImageSmoothingEnabled = false;
   return;
};
/** @ignore */
Surface.prototype._smooth = function() {
  this.context.mozImageSmoothingEnabled = true;
  this.context.webkitImageSmoothingEnabled = true;

};

/**
 * Blits another Surface on this Surface. The destination where to blit to
 * can be given (or it defaults to the top left corner) as well as the
 * Area from the Surface which should be blitted (e.g., for cutting out parts of
 * a Surface).
 *
 * @example
 * // blit flower in top left corner of display
 * displaySurface.blit(flowerSurface);
 *
 * // position flower at 10/10 of display
 * displaySurface.blit(flowerSurface, [10, 10])
 *
 * // ... `dest` can also be a rect whose topleft position is taken:
 * displaySurface.blit(flowerSurface, new gamejs.Rect([10, 10]);
 *
 * // only blit half of the flower onto the display
 * var flowerRect = flowerSurface.rect;
 * flowerRect = new gamejs.Rect([0,0], [flowerRect.width/2, flowerRect.height/2])
 * displaySurface.blit(flowerSurface, [0,0], flowerRect);
 *
 * @param {gamejs.Surface} src The Surface which will be blitted onto this one
 * @param {gamejs.Rect|Array} dst the Destination x, y position in this Surface.
 *            If a Rect is given, it's top and left values are taken. If this argument
 *            is not supplied the blit happens at [0,0].
 * @param {gamesjs.Rect|Array} area the Area from the passed Surface which
 *            should be blitted onto this Surface.
 * @param {Number} compositionOperation how the source and target surfaces are composited together; one of: source-atop, source-in, source-out, source-over (default), destination-atop, destination-in, destination-out, destination-over, lighter, copy, xor; for an explanation of these values see: http://dev.w3.org/html5/2dcontext/#dom-context-2d-globalcompositeoperation
 * @returns {gamejs.Rect} Rect actually repainted FIXME actually return something?
 */
Surface.prototype.blit = function(src, dest, area, compositeOperation) {

   var rDest, rArea;

   if (dest instanceof Rect) {
      rDest = dest.clone();
      var srcSize = src.getSize();
      if (!rDest.width) {
         rDest.width = srcSize[0];
      }
      if (!rDest.height) {
         rDest.height = srcSize[1];
      }
    } else if (dest && dest instanceof Array && dest.length == 2) {
      rDest = new Rect(dest, src.getSize());
    } else {
      rDest = new Rect([0,0], src.getSize());
    }
   compositeOperation = compositeOperation || 'source-over';

   // area within src to be drawn
   if (area instanceof Rect) {
      rArea = area;
   } else if (area && area instanceof Array && area.length == 2) {
      var size = src.getSize();
      rArea = new Rect(area, [size[0] - area[0], size[1] - area[1]]);
   } else {
      rArea = new Rect([0,0], src.getSize());
   }

   if (isNaN(rDest.left) || isNaN(rDest.top) || isNaN(rDest.width) || isNaN(rDest.height)) {
      throw new Error('[blit] bad parameters, destination is ' + rDest);
   }

   this.context.save();
   this.context.globalCompositeOperation = compositeOperation;
   // first translate, then rotate
   var m = matrix.translate(matrix.identity(), rDest.left, rDest.top);
   m = matrix.multiply(m, src._matrix);
   this.context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
   // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
   this.context.globalAlpha = src._blitAlpha;
   this.context.drawImage(src.canvas, rArea.left, rArea.top, rArea.width, rArea.height, 0, 0, rDest.width, rDest.height);
   this.context.restore();
   return;
};

/**
 * @returns {Number[]} the width and height of the Surface
 */
Surface.prototype.getSize = function() {
   return [this.canvas.width, this.canvas.height];
};

/**
 * Obsolte, only here for compatibility.
 * @deprecated
 * @ignore
 * @returns {gamejs.Rect} a Rect of the size of this Surface
 */
Surface.prototype.getRect = function() {
   return new Rect([0,0], this.getSize());
};

/**
 * Fills the whole Surface with a color. Usefull for erasing a Surface.
 * @param {String} CSS color string, e.g. '#0d120a' or '#0f0' or 'rgba(255, 0, 0, 0.5)'
 * @param {gamejs.Rect} a Rect of the area to fill (defauts to entire surface if not specified)
 */
Surface.prototype.fill = function(color, rect) {
   this.context.save();
   this.context.fillStyle = color || "#000000";
   if (rect === undefined) {
       rect = new Rect(0, 0, this.canvas.width, this.canvas.height);
    }

   this.context.fillRect(rect.left, rect.top, rect.width, rect.height);
   this.context.restore();
   return;
};

/**
 * Clear the surface.
 */
Surface.prototype.clear = function(rect) {
   var size = this.getSize();
   rect = rect || new Rect(0, 0, size[0], size[1]);
   this.context.clearRect(rect.left, rect.top, rect.width, rect.height);
   return;
};

objects.accessors(Surface.prototype, {
   /**
    * @type gamejs.Rect
    */
   'rect': {
      get: function() {
         return this.getRect();
      }
   },
   /**
    * @ignore
    */
   'context': {
      get: function() {
         return this._context;
      }
   },
   'canvas': {
      get: function() {
         return this._canvas;
      }
   }
});

/**
 * @returns {gamejs.Surface} a clone of this surface
 */
Surface.prototype.clone = function() {
  var newSurface = new Surface(this.getRect());
  newSurface.blit(this);
  return newSurface;
};

/**
 * @returns {Number} current alpha value
 */
Surface.prototype.getAlpha = function() {
   return (1 - this._blitAlpha);
};

/**
 * Set the alpha value for the whole Surface. When blitting the Surface on
 * a destination, the pixels will be drawn slightly transparent.
 * @param {Number} alpha value in range 0.0 - 1.0
 * @returns {Number} current alpha value
 */
Surface.prototype.setAlpha = function(alpha) {
   if (isNaN(alpha) || alpha < 0 || alpha > 1) {
      return;
   }

   this._blitAlpha = (1 - alpha);
   return (1 - this._blitAlpha);
};

/**
 * The data must be represented in left-to-right order, row by row top to bottom,
 * starting with the top left, with each pixel's red, green, blue, and alpha components
 * being given in that order for each pixel.
 * @see http://dev.w3.org/html5/2dcontext/#canvaspixelarray
 * @returns {ImageData} an object holding the pixel image data {data, width, height}
 */
Surface.prototype.getImageData = function() {
   var size = this.getSize();
   return this.context.getImageData(0, 0, size[0], size[1]);
};

/**
 * @ignore
 */
exports.display = require('./gamejs/display');
/**
 * @ignore
 */
exports.draw = require('./gamejs/draw');
/**
 * @ignore
 */
exports.event = require('./gamejs/event');
/**
 * @ignore
 */
exports.font = require('./gamejs/font');
/**
 * @ignore
 */
exports.http = require('./gamejs/http');
/**
 * @ignore
 */
exports.image = require('./gamejs/image');
/**
 * @ignore
 */
exports.mask = require('./gamejs/mask');
/**
 * @ignore
 */
exports.mixer = require('./gamejs/mixer');
/**
 * @ignore
 */
exports.sprite = require('./gamejs/sprite');
/**
 * @ignore
 */
exports.surfacearray = require('./gamejs/surfacearray');
/**
 * @ignore
 */
exports.time = require('./gamejs/time');
/**
 * @ignore
 */
exports.transform = require('./gamejs/transform');

/**
 * @ignore
 */
exports.utils = {
   arrays: require('./gamejs/utils/arrays'),
   objects: require('./gamejs/utils/objects'),
   matrix: require('./gamejs/utils/matrix'),
   vectors: require('./gamejs/utils/vectors'),
   math: require('./gamejs/utils/math'),
   uri: require('./gamejs/utils/uri'),
   prng: require('./gamejs/utils/prng'),
   base64: require('./gamejs/utils/base64')
};

/**
 * @ignore
 */
exports.pathfinding = {
   astar: require('./gamejs/pathfinding/astar')
};

/**
 * @ignore
 */
exports.worker = require('./gamejs/worker');

/**
 * @ignore
 */
exports.xml = require('./gamejs/xml');

/**
 * @ignore
 */
exports.tmx = require('./gamejs/tmx');

/**
 * @ignore
 */
exports.noise = require('./gamejs/noise');

// preloading stuff
var gamejs = exports;
var RESOURCES = {};

/**
 * ReadyFn is called once all modules and assets are loaded.
 * @param {Function} readyFn the function to be called once gamejs finished loading
 * @name ready
 */
if (gamejs.worker.inWorker === true) {
   exports.ready = function(readyFn) {
      require('./gamejs/worker')._ready();
      gamejs.init();
      readyFn();
   };
} else {
   exports.ready = function(readyFn) {

      var getMixerProgress = null;
      var getImageProgress = null;

      // init time instantly - we need it for preloaders
      gamejs.time.init();

      // 2.
      function _ready() {
         if (!document.body) {
            return window.setTimeout(_ready, 50);
         }
         getImageProgress = gamejs.image.preload(RESOURCES);
         try {
            getMixerProgress = gamejs.mixer.preload(RESOURCES);
         } catch (e) {
            gamejs.debug('Error loading audio files ', e);
         }
         window.setTimeout(_readyResources, 50);
      }

      // 3.
      function _readyResources() {
         if (getImageProgress() < 1 || getMixerProgress() < 1) {
            return window.setTimeout(_readyResources, 100);
         }
         gamejs.display.init();
         gamejs.image.init();
         gamejs.mixer.init();
         gamejs.event.init();
         gamejs.utils.prng.init();
         readyFn();
      }

      // 1.
      window.setTimeout(_ready, 13);

      function getLoadProgress() {
         if (getImageProgress) {
            return (0.5 * getImageProgress()) + (0.5 * getMixerProgress());
         }
         return 0.1;
      }

      return getLoadProgress;
   };
}

/**
 * Initialize all gamejs modules. This is automatically called
 * by `gamejs.ready()`.
 * @returns {Object} the properties of this objecte are the moduleIds that failed, they value are the exceptions
 * @ignore
 */
exports.init = function() {
   var errorModules = {};
   ['time', 'display', 'image', 'mixer', 'event'].forEach(function(moduleName) {
      try {
         gamejs[moduleName].init();
      } catch (e) {
         errorModules[moduleName] = e.toString();
      }
   });
   return errorModules;
};

var resourceBaseHref = function() {
    return (window.$g && window.$g.resourceBaseHref) || document.location.href;
};

/**
 * Preload resources.
 * @param {Array} resources list of resources paths
 * @name preload
 */
var preload = exports.preload = function(resources) {
   var uri = require('./gamejs/utils/uri');
   var baseHref = resourceBaseHref();
   resources.forEach(function(res) {
      RESOURCES[res] = uri.resolve(baseHref, res);
   }, this);
   return;
};

/**
 * The function passsed to `onEvent` will be called whenever
 * an event (mouse, keyboard, etc) was triggered.
 */
exports.onEvent = function(fn, scope) {
  exports.event._CALLBACK = new Callback(fn, scope);
};

/**
 * The function passed to `onTick` will continously be called at a
 * frequency determined by the browser (typically between 1 and 60 times per second).
 * @param {Function} callback the function you want to be called
 * @param {Function} callbackScope optional scope for the function call
 */
exports.onTick = function(fn, scope) {
  exports.time._CALLBACK = new Callback(fn, scope);
};
},{"./gamejs/callback":18,"./gamejs/display":19,"./gamejs/draw":20,"./gamejs/event":21,"./gamejs/font":22,"./gamejs/http":23,"./gamejs/image":24,"./gamejs/mask":25,"./gamejs/mixer":26,"./gamejs/noise":27,"./gamejs/pathfinding/astar":28,"./gamejs/sprite":29,"./gamejs/surfacearray":30,"./gamejs/time":31,"./gamejs/tmx":32,"./gamejs/transform":33,"./gamejs/utils/arrays":34,"./gamejs/utils/base64":35,"./gamejs/utils/math":37,"./gamejs/utils/matrix":38,"./gamejs/utils/objects":39,"./gamejs/utils/prng":40,"./gamejs/utils/uri":41,"./gamejs/utils/vectors":42,"./gamejs/worker":43,"./gamejs/xml":44}],18:[function(require,module,exports){
/**
 * Manage a callback with scope
 */

var Callback = exports.Callback = function(fn, scope) {
	this.fn = fn;
	this.fnScope = scope || {};
	return this;
};

Callback.prototype.trigger = function() {
	this.fn.apply(this.fnScope, arguments);
};
},{}],19:[function(require,module,exports){
var Surface = require('../gamejs').Surface;

/**
 * @fileoverview Methods to create, access and manipulate the display Surface.
 *
 * ## Flags
 *
 * `gamejs.display.setMode()` understands three flags:
 *
 *   * gamejs.display.FULLSCREEN
 *   * gamejs.display.DISABLE_SMOOTHING
 *   * gamejs.display.POINTERLOCK (implies FULLSCREEN)
 *
 *    // disable smoothing
 *    gamejs.display.setMode([800, 600], gamejs.display.DISABLE_SMOOTHING);
 *    // disable smoothing and fullscreen
 *    gamejs.display.setMode([800, 600], gamejs.display.DISABLE_SMOOTHING | gamejs.display.FULLSCREEN);
 *
 * DOM node ids accessed by this module:
 *
 *   * #gjs-canvas - the display surface
 *   * #gjs-loader - loading bar
 *   * #gjs-fullscreen-toggle a clickable element to enable fullscreen
 *   * #gjs-canvas-wrapper this wrapper is added when in fullscreen mode
 *
 * ## Fullscreen mode
 *
 * When `setMode()` is called with the fullscreen flag then the fullscreen mode can be enabled by the
 * player by clicking on the DOM element with id "gjs-fullscreen-toggle". Browser security requires
 * that a user enables fullscreen with a "gesture" (e.g., clicking a button) and we can not enable fullscreen
 * in code.
 *
 * Fullscreen mode can be exited by many keys, e.g., anything window manager related (ALT-TAB) or ESC. A lot
 * of keys will trigger a browser information popup explaining how fullscreen mode can be exited.
 *
 * The following keys are "whitelisted" in fullscreen mode and will not trigger such a browser popup:
 *
 *  * left arrow, right arrow, up arrow, down arrow
 *  * space
 *  * shift, control, alt
 *  * page up, page down
 *  * home, end, tab, meta
 *
 * @see https://developer.mozilla.org/en/DOM/Using_full-screen_mode
 *
 * @example
 * var display = gamejs.display.setMode([800, 600]);
 * // blit sunflower picture in top left corner of display
 * var sunflower = gamejs.image.load("images/sunflower");
 * display.blit(sunflower);
 *
 */

var CANVAS_ID = "gjs-canvas";
var LOADER_ID = "gjs-loader";
var SURFACE = null;

/**
 * Pass this flag to `gamejs.display.setMode(resolution, flags)` to disable
 * pixel smoothing; this is, for example, useful for retro-style, low resolution graphics
 * where you don't want the browser to smooth them when scaling & drawing.
 */
var DISABLE_SMOOTHING = exports.DISABLE_SMOOTHING = 2;
var FULLSCREEN = exports.FULLSCREEN = 4;
var POINTERLOCK = exports.POINTERLOCK = 8;

var _flags = 0;

/**
 * @returns {document.Element} the canvas dom element
 */
var getCanvas = function() {
   var displayCanvas = document.getElementById(CANVAS_ID);
   if (!displayCanvas) {
      displayCanvas = document.createElement("canvas");
      displayCanvas.setAttribute("id", CANVAS_ID);
      document.body.appendChild(displayCanvas);
   }
   return displayCanvas;
};


var getFullScreenToggle = function() {
   var fullScreenButton = document.getElementById('gjs-fullscreen-toggle');
   if (!fullScreenButton) {
      // before canvas
      fullScreenButton = document.createElement('button');
      fullScreenButton.innerHTML = 'Fullscreen';
      fullScreenButton.id = 'gjs-fullscreen-toggle';
      var canvas = getCanvas();
      canvas.parentNode.insertBefore(fullScreenButton, canvas);
      canvas.parentNode.insertBefore(document.createElement('br'), canvas);

   }
   return fullScreenButton;
};

var fullScreenChange = function(event) {
   var gjsEvent ={
      type: isFullScreen() ? require('./event').DISPLAY_FULLSCREEN_ENABLED :
                        require('./event').DISPLAY_FULLSCREEN_DISABLED

   };
   if (isFullScreen()) {
      if (_flags & POINTERLOCK) {
         enablePointerLock();
      }
   }
   require('./event')._triggerCallback(gjsEvent);
};

exports.hasPointerLock = function() {
   return !!(document.pointerLockElement ||
      document.webkitFullscreenElement ||
      document.mozFullscreenElement ||
      document.mozFullScreenElement);
};

/**
 * Create the master Canvas plane.
 * @ignore
 */
exports.init = function() {
   // create canvas element if not yet present
   var canvas = getCanvas();
   if (!canvas.getAttribute('tabindex')) {
      // to be focusable, tabindex must be set
      canvas.setAttribute("tabindex", 1);
      canvas.focus();
   }
   // remove loader if any;
   var $loader = document.getElementById('gjs-loader');
   if ($loader) {
      $loader.style.display = "none";
   }
   return;
};

var isFullScreen = exports.isFullscreen = function() {
   return (document.fullScreenElement || document.mozFullScreen || document.webkitIsFullScreen || document.webkitDisplayingFullscreen);
};

/*
 * Switches the display window normal browser mode and fullscreen.
 * @ignore
 * @returns {Boolean} true if operation was successfull, false otherwise
 */
var enableFullScreen = function(event) {
   var wrapper = getCanvas();
   wrapper.requestFullScreen = wrapper.requestFullScreen || wrapper.mozRequestFullScreen || wrapper.webkitRequestFullScreen;
   if (!wrapper.requestFullScreen) {
      return false;
   }
   // @xbrowser chrome allows keboard input onl if ask for it (why oh why?)
   if (Element.ALLOW_KEYBOARD_INPUT) {
      wrapper.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
   } else {
      wrapper.requestFullScreen();
   }
   return true;
};

var enablePointerLock = function() {
   var wrapper = getCanvas();
   wrapper.requestPointerLock = wrapper.requestPointerLock || wrapper.mozRequestPointerLock || wrapper.webkitRequestPointerLock;
   if (wrapper.requestPointerLock) {
      wrapper.requestPointerLock();
   }
};

/** @ignore **/
exports._hasFocus = function() {
   return document.activeElement == getCanvas();
};

/**
 * Set the width and height of the Display. Conviniently this will
 * return the actual display Surface - the same as calling [gamejs.display.getSurface()](#getSurface)
 * later on.
 * @param {Array} dimensions [width, height] of the display surface
 * @param {Number} flags gamejs.display.DISABLE_SMOOTHING | gamejs.display.FULLSCREEN | gamejs.display.POINTERLOCK
 */
exports.setMode = function(dimensions, flags) {
   SURFACE = null;
   var canvas = getCanvas();
   canvas.width = dimensions[0];
   canvas.height = dimensions[1];
   _flags = _flags || flags;
   // @ xbrowser firefox allows pointerlock only if fullscreen
   if (_flags & POINTERLOCK) {
      _flags = _flags | FULLSCREEN;
   }
   if (_flags & FULLSCREEN) {
      // attach fullscreen toggle checkbox
      var fullScreenToggle = getFullScreenToggle();
      fullScreenToggle.removeEventListener('click', enableFullScreen, false);
      fullScreenToggle.addEventListener('click', enableFullScreen, false);
      // @@ xbrowser
      document.removeEventListener('fullScreenchange',fullScreenChange, false);
      document.removeEventListener('webkitfullscreenchange',fullScreenChange, false);
      document.removeEventListener('mozfullscreenchange',fullScreenChange, false);
      document.addEventListener('fullscreenchange', fullScreenChange, false);
      document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
      document.addEventListener('mozfullscreenchange', fullScreenChange, false);
   }
   return getSurface();
};

/**
 * Set the Caption of the Display (document.title)
 * @param {String} title the title of the app
 * @param {gamejs.Image} icon FIXME implement favicon support
 */
exports.setCaption = function(title, icon) {
   document.title = title;
};

/** @ignore **/
exports._isSmoothingEnabled = function() {
   return !(_flags & DISABLE_SMOOTHING);
};

/**
 * The Display (the canvas element) is most likely not in the top left corner
 * of the browser due to CSS styling. To calculate the mouseposition within the
 * canvas we need this offset.
 * @see gamejs/event
 * @ignore
 *
 * @returns {Array} [x, y] offset of the canvas
 */

exports._getCanvasOffset = function() {
   var boundRect = getCanvas().getBoundingClientRect();
   return [boundRect.left, boundRect.top];
};

/**
 * Drawing on the Surface returned by `getSurface()` will draw on the screen.
 * @returns {gamejs.Surface} the display Surface
 */
var getSurface = exports.getSurface = function() {
   if (SURFACE === null) {
      var canvas = getCanvas();
      SURFACE = new Surface([canvas.clientWidth, canvas.clientHeight]);
      SURFACE._canvas = canvas;
      SURFACE._context = canvas.getContext('2d');
      if (!(_flags & DISABLE_SMOOTHING)) {
         SURFACE._smooth();
      } else {
         SURFACE._noSmooth();
      }
   }
   return SURFACE;
};

},{"../gamejs":17,"./event":21}],20:[function(require,module,exports){
/**
 * @fileoverview Utilities for drawing geometrical objects to Surfaces. If you want to put images on
 * the screen see gamejs/image.
 *
 * There are several ways to specify colors. Whenever the docs says "valid #RGB string"
 * you can pass in any of the following formats.
 *
 *
 * @example
 *     "#ff00ff"
 *     "rgb(255, 0, 255)"
 *     "rgba(255,0, 255, 1)"
 * @see gamejs/image
 */

// FIXME all draw functions must return a minimal rect containing the drawn shape

/**
 * @param {gamejs.Surface} surface the Surface to draw on
 * @param {String} color valid #RGB string, e.g., "#ff0000"
 * @param {Array} startPos [x, y] position of line start
 * @param {Array} endPos [x, y] position of line end
 * @param {Number} width of the line, defaults to 1
 */
exports.line = function(surface, color, startPos, endPos, width) {
   var ctx = surface.context;
   ctx.save();
   ctx.beginPath();
   ctx.strokeStyle = color;
   ctx.lineWidth = width || 1;
   ctx.moveTo(startPos[0], startPos[1]);
   ctx.lineTo(endPos[0], endPos[1]);
   ctx.stroke();
   ctx.restore();
   return;
};

/**
 * Draw connected lines. Use this instead of indiviudal line() calls for
 * better performance
 *
 * @param {gamejs.Surface} surface the Surface to draw on
 * @param {String} color a valid #RGB string, "#ff0000"
 * @param {Boolean} closed if true the last and first point are connected
 * @param {Array} pointlist holding array [x,y] arrays of points
 * @param {Number} width width of the lines, defaults to 1
 */
exports.lines = function(surface, color, closed, pointlist, width) {
   closed = closed || false;
   var ctx = surface.context;
   ctx.save();
   ctx.beginPath();
   ctx.strokeStyle = ctx.fillStyle = color;
   ctx.lineWidth = width || 1;
   pointlist.forEach(function(point, idx) {
      if (idx === 0) {
         ctx.moveTo(point[0], point[1]);
      } else {
         ctx.lineTo(point[0], point[1]);
      }
   });
   if (closed) {
      ctx.lineTo(pointlist[0][0], pointlist[0][1]);
   }
   ctx.stroke();
   ctx.restore();
   return;
};

/**
 * Draw a circle on Surface
 *
 * @param {gamejs.Surface} surface the Surface to draw on
 * @param {String} color a valid #RGB String, #ff00cc
 * @param {Array} pos [x, y] position of the circle center
 * @param {Number} radius of the circle
 * @param {Number} width width of the circle, if not given or 0 the circle is filled
 */
exports.circle = function(surface, color, pos, radius, width) {
   if (!radius) {
      throw new Error('[circle] radius required argument');
   }
   if (!pos || !(pos instanceof Array)) {
      throw new Error('[circle] pos must be given & array' + pos);
   }

   var ctx = surface.context;
   ctx.save();
   ctx.beginPath();
   ctx.strokeStyle = ctx.fillStyle = color;
   ctx.lineWidth = width || 1;
   ctx.arc(pos[0], pos[1], radius, 0, 2*Math.PI, true);
   if (width === undefined || width === 0) {
      ctx.fill();
   } else {
      ctx.stroke();
   }
   ctx.restore();
   return;
};

/**
 * @param {gamejs.Surface} surface the Surface to draw on
 * @param {String} color a valid #RGB String, #ff00cc
 * @param {gamejs.Rect} rect the position and dimension attributes of this Rect will be used
 * @param {Number} width the width of line drawing the Rect, if 0 or not given the Rect is filled.
 */
exports.rect = function(surface, color, rect, width) {
   var ctx =surface.context;
   ctx.save();
   ctx.beginPath();
   ctx.strokeStyle = ctx.fillStyle = color;
   if (isNaN(width) || width === 0) {
      ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
   } else {
      ctx.lineWidth = width || 1;
      ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
   }
   ctx.restore();
};

/**
 * @param {gamejs.Surface} surface the Surface to draw on
 * @param {String} color a valid #RGB String, #ff00cc
 * @param {gamejs.Rect} rect the position and dimension attributes of this Rect will be used
 * @param {Number} startAngle
 * @param {Number} stopAngle
 * @param {Number} width the width of line, if 0 or not given the arc is filled.
 */
exports.arc= function(surface, color, rect, startAngle, stopAngle, width) {
   var ctx = surface.context;
   ctx.save();
   ctx.beginPath();
   ctx.strokeStyle = ctx.fillStyle = color;
   ctx.arc(rect.center[0], rect.center[1],
            rect.width/2,
            startAngle * (Math.PI/180), stopAngle * (Math.PI/180),
            false
         );
   if (isNaN(width) || width === 0) {
      ctx.fill();
   } else {
      ctx.lineWidth = width || 1;
      ctx.stroke();
   }
   ctx.restore();
};

/**
 * Draw a polygon on the surface. The pointlist argument are the vertices
 * for the polygon.
 *
 * @param {gamejs.Surface} surface the Surface to draw on
 * @param {String} color a valid #RGB String, #ff00cc
 * @param {Array} pointlist array of vertices [x, y] of the polygon
 * @param {Number} width the width of line, if 0 or not given the polygon is filled.
 */
exports.polygon = function(surface, color, pointlist, width) {
   var ctx = surface.context;
   ctx.save();
   ctx.fillStyle = ctx.strokeStyle = color;
   ctx.beginPath();
   pointlist.forEach(function(point, idx) {
      if (idx == 0) {
         ctx.moveTo(point[0], point[1]);
      } else {
         ctx.lineTo(point[0], point[1]);
      }
   });
   ctx.closePath();
   if (isNaN(width) || width === 0) {
      ctx.fill();
   } else {
      ctx.lineWidth = width || 1;
      ctx.stroke();
   }
   ctx.restore();
};

/**
 * Draw a quadratic curve with one control point on the surface.
 * The control point position defines the shape of the quadratic curve.
 *
 * @param {gamejs.Surface} surface the Surface to draw on
 * @param {String} color valid #RGB string, e.g., "#ff0000"
 * @param {Array} startPos [x, y] the start position for the quadratic curve
 * @param {Array} endPos [x, y] the end position for the quadratic curve
 * @param {Array} controlPos [x, y] position of the control point
 * @param {Number} width of the quadratic curve, defaults to 1
 */
exports.quadraticCurve = function(surface, color, startPos, endPos, controlPos, width) {
   if (!startPos || !(startPos instanceof Array)) {
      throw new Error('[quadratic_curve] startPos must be defined!');
   }
   if (!endPos || !(endPos instanceof Array)) {
      throw new Error('[quadratic_curve] endPos must be defined!');
   }
   if (!controlPos || !(controlPos instanceof Array)) {
      throw new Error('[quadratic_curve] controlPos must be defined!');
   }

   var ctx = surface.context;
   ctx.save();
   ctx.fillStyle = ctx.strokeStyle = color;
   ctx.lineWidth = width || 1;

   ctx.beginPath();
   ctx.moveTo(startPos[0], startPos[1]);
   ctx.quadraticCurveTo(controlPos[0], controlPos[1], endPos[0], endPos[1]);
   ctx.stroke();

   ctx.restore();
};

/**
 * Draw a bezier curve with two control points on the surface.
 * The control point positions define the shape of the bezier curve.
 *
 * @param {gamejs.Surface} surface the Surface to draw on
 * @param {String} color valid #RGB string, e.g., "#ff0000"
 * @param {Array} startPos [x, y] the start position for the bezier curve
 * @param {Array} endPos [x, y] the end position for the bezier curve
 * @param {Array} ct1Pos [x, y] position of the first control point
 * @param {Array} ct2Pos [x, y] position of the second control point
 * @param {Number} width of the bezier curve, defaults to 1
 */
exports.bezierCurve = function(surface, color, startPos, endPos, ct1Pos, ct2Pos, width) {
   if (!startPos || !(startPos instanceof Array)) {
      throw new Error('[bezier_curve] startPos must be defined!');
   }
   if (!endPos || !(endPos instanceof Array)) {
      throw new Error('[bezier_curve] endPos must be defined!');
   }
   if (!ct1Pos || !(ct1Pos instanceof Array)) {
      throw new Error('[bezier_curve] ct1Pos must be defined!');
   }
   if (!ct2Pos || !(ct2Pos instanceof Array)) {
      throw new Error('[bezier_curve] ct2Pos must be defined!');
   }
   var ctx = surface.context;
   ctx.save();
   ctx.fillStyle = ctx.strokeStyle = color;
   ctx.lineWidth = width || 1;

   ctx.beginPath();
   ctx.moveTo(startPos[0], startPos[1]);
   ctx.bezierCurveTo(ct1Pos[0], ct1Pos[1], ct2Pos[0], ct2Pos[1], endPos[0], endPos[1]);
   ctx.stroke();

   ctx.restore();
};
},{}],21:[function(require,module,exports){
var display = require('./display');
var Callback = require('./callback').Callback;

exports._CALLBACK = new Callback(function(){}, {});

/** @ignore **/
exports._triggerCallback = function() {
  exports._CALLBACK.trigger.apply(exports._CALLBACK, arguments);
};


/**
 * @fileoverview
 * Mouse and keyboard events.
 *
 * All events have a type identifier. This event type is in between the values
 * of NOEVENT and NUMEVENTS. Each event has a constant in `gamejs.event.*`
 * All user defined events can have the value of USEREVENT or higher.
 * Make sure your custom event ids* follow this system.
 *
 * @example
 *     gamejs.onEvent(function(event) {
 *        if (event.type === gamejs.event.MOUSE_UP) {
 *          gamejs.log(event.pos, event.button);
 *        } else if (event.type === gamejs.event.KEY_UP) {
 *          gamejs.log(event.key);
 *        }
 *     });
 *
 */
// key constants
exports.K_UP = 38;
exports.K_DOWN = 40;
exports.K_RIGHT = 39;
exports.K_LEFT = 37;

exports.K_SPACE = 32;
exports.K_BACKSPACE = 8;
exports.K_TAB = 9;
exports.K_ENTER = 13;
exports.K_SHIFT = 16;
exports.K_CTRL = 17;
exports.K_ALT = 18;
exports.K_ESC = 27;

exports.K_0 = 48;
exports.K_1 = 49;
exports.K_2 = 50;
exports.K_3 = 51;
exports.K_4 = 52;
exports.K_5 = 53;
exports.K_6 = 54;
exports.K_7 = 55;
exports.K_8 = 56;
exports.K_9 = 57;
exports.K_a = 65;
exports.K_b = 66;
exports.K_c = 67;
exports.K_d = 68;
exports.K_e = 69;
exports.K_f = 70;
exports.K_g = 71;
exports.K_h = 72;
exports.K_i = 73;
exports.K_j = 74;
exports.K_k = 75;
exports.K_l = 76;
exports.K_m = 77;
exports.K_n = 78;
exports.K_o = 79;
exports.K_p = 80;
exports.K_q = 81;
exports.K_r = 82;
exports.K_s = 83;
exports.K_t = 84;
exports.K_u = 85;
exports.K_v = 86;
exports.K_w = 87;
exports.K_x = 88;
exports.K_y = 89;
exports.K_z = 90;

exports.K_KP1 = 97;
exports.K_KP2 = 98;
exports.K_KP3 = 99;
exports.K_KP4 = 100;
exports.K_KP5 = 101;
exports.K_KP6 = 102;
exports.K_KP7 = 103;
exports.K_KP8 = 104;
exports.K_KP9 = 105;

// event type constants
exports.NOEVENT = 0;
exports.NUMEVENTS = 32000;

exports.DISPLAY_FULLSCREEN_ENABLED = 300;
exports.DISPLAY_FULLSCREEN_DISABLED = 301;

exports.QUIT = 0;
exports.KEY_DOWN = 1;
exports.KEY_UP = 2;
exports.MOUSE_MOTION = 3;
exports.MOUSE_UP = 4;
exports.MOUSE_DOWN = 5;
exports.MOUSE_WHEEL = 6;
exports.USEREVENT = 2000;



/**
 * Holds all information about an event.
 * @class
 */

exports.Event = function() {
    /**
     * The type of the event. e.g., gamejs.event.QUIT, KEYDOWN, MOUSEUP.
     */
    this.type = null;
    /**
     * key the keyCode of the key. compare with gamejs.event.K_a, gamejs.event.K_b,...
     */
    this.key = null;
    /**
     * relative movement for a mousemove event
     */
    this.rel = null;
    /**
     * the number of the mousebutton pressed
     */
    this.button = null;
    /**
     * pos the position of the event for mouse events
     */
    this.pos = null;
};

/**
 * @ignore
 */
exports.init = function() {

   var lastPos = [];

   // anonymous functions as event handlers = memory leak, see MDC:elementAddEventListener

   function onMouseDown (ev) {
      var canvasOffset = display._getCanvasOffset();
      exports._CALLBACK.trigger({
         'type': exports.MOUSE_DOWN,
         'pos': [ev.clientX - canvasOffset[0], ev.clientY - canvasOffset[1]],
         'button': ev.button,
         'shiftKey': ev.shiftKey,
         'ctrlKey': ev.ctrlKey,
         'metaKey': ev.metaKey
      });
   }

   function onMouseUp (ev) {
      var canvasOffset = display._getCanvasOffset();
      exports._CALLBACK.trigger({
         'type':exports.MOUSE_UP,
         'pos': [ev.clientX - canvasOffset[0], ev.clientY - canvasOffset[1]],
         'button': ev.button,
         'shiftKey': ev.shiftKey,
         'ctrlKey': ev.ctrlKey,
         'metaKey': ev.metaKey
      });
   }

   function onKeyDown (ev) {
      var key = ev.keyCode || ev.which;
      exports._CALLBACK.trigger({
         'type': exports.KEY_DOWN,
         'key': key,
         'shiftKey': ev.shiftKey,
         'ctrlKey': ev.ctrlKey,
         'metaKey': ev.metaKey
      });

      // if the display has focus, we surpress default action
      // for most keys
      if (display._hasFocus() && (!ev.ctrlKey && !ev.metaKey &&
         ((key >= exports.K_LEFT && key <= exports.K_DOWN) ||
         (key >= exports.K_0    && key <= exports.K_z) ||
         (key >= exports.K_KP1  && key <= exports.K_KP9) ||
         key === exports.K_SPACE ||
         key === exports.K_TAB ||
         key === exports.K_ENTER)) ||
         key === exports.K_ALT ||
         key === exports.K_BACKSPACE) {
        ev.preventDefault();
      }
   }

   function onKeyUp (ev) {
      exports._CALLBACK.trigger({
         'type': exports.KEY_UP,
         'key': ev.keyCode,
         'shiftKey': ev.shiftKey,
         'ctrlKey': ev.ctrlKey,
         'metaKey': ev.metaKey
      });
   }

   function onMouseMove (ev) {
      var canvasOffset = display._getCanvasOffset();
      var currentPos = [ev.clientX - canvasOffset[0], ev.clientY - canvasOffset[1]];
      var relativePos = [];
      if (lastPos.length) {
         relativePos = [
            lastPos[0] - currentPos[0],
            lastPos[1] - currentPos[1]
         ];
      }
      exports._CALLBACK.trigger({
         'type': exports.MOUSE_MOTION,
         'pos': currentPos,
         'rel': relativePos,
         'buttons': null, // FIXME, fixable?
         'timestamp': ev.timeStamp,
         'movement': [ev.movementX       ||
                      ev.mozMovementX    ||
                      ev.webkitMovementX || 0,
                      ev.movementY       ||
                      ev.mozMovementY    ||
                      ev.webkitMovementY || 0
                      ]
      });
      lastPos = currentPos;
      return;
   }

   function onMouseScroll(ev) {
      var canvasOffset = display._getCanvasOffset();
      var currentPos = [ev.clientX - canvasOffset[0], ev.clientY - canvasOffset[1]];
      exports._CALLBACK.trigger({
         type: exports.MOUSE_WHEEL,
         pos: currentPos,
         delta: ev.detail || (- ev.wheelDeltaY / 40)
      });
      return;
   }

   function onBeforeUnload (ev) {
      exports._CALLBACK.trigger({
         'type': exports.QUIT
      });
      return;
   }

   // IEFIX does not support addEventListener on document itself
   // MOZFIX but in moz & opera events don't reach body if mouse outside window or on menubar
   var canvas = display.getSurface()._canvas;
   document.addEventListener('mousedown', onMouseDown, false);
   document.addEventListener('mouseup', onMouseUp, false);
   document.addEventListener('keydown', onKeyDown, false);
   document.addEventListener('keyup', onKeyUp, false);
   document.addEventListener('mousemove', onMouseMove, false);
   canvas.addEventListener('mousewheel', onMouseScroll, false);
   // MOZFIX
   // https://developer.mozilla.org/en/Code_snippets/Miscellaneous#Detecting_mouse_wheel_events
   canvas.addEventListener('DOMMouseScroll', onMouseScroll, false);
   canvas.addEventListener('beforeunload', onBeforeUnload, false);

};

},{"./callback":18,"./display":19}],22:[function(require,module,exports){
var Surface = require('../gamejs').Surface;
var objects = require('./utils/objects');

/**
 * @fileoverview Methods for creating Font objects which can render text
 * to a Surface.
 *
 * @example
 *     // create a font
 *     var font = new Font('20px monospace');
 *     // render text - this returns a surface with the text written on it.
 *     var helloSurface = font.render('Hello World')
 */

/**
 * Create a Font to draw on the screen. The Font allows you to
 * `render()` text. Rendering text returns a Surface which
 * in turn can be put on screen.
 *
 * @constructor
 * @property {Number} fontHeight the line height of this Font
 *
 * @param {String} fontSettings a css font definition, e.g., "20px monospace"
 * @param {STring} backgroundColor valid #rgb string, "#ff00cc"
 */
var Font = exports.Font = function(fontSettings, backgroundColor) {
    /**
     * @ignore
     */
   this.sampleSurface = new Surface([10,10]);
   this.sampleSurface.context.font = fontSettings;
   this.sampleSurface.context.textAlign = 'start';
   // http://diveintohtml5.org/canvas.html#text
   this.sampleSurface.context.textBaseline = 'bottom';
   this.backgroundColor = backgroundColor || false;
   return this;
};

/**
 * Returns a Surface with the given text on it.
 * @param {String} text the text to render
 * @param {String} color a valid #RGB String, "#ffcc00"
 * @returns {gamejs.Surface} Surface with the rendered text on it.
 */
Font.prototype.render = function(text, color) {
   var dims = this.size(text);
   var surface = new Surface(dims);
   var ctx = surface.context;
   ctx.save();
   if ( this.backgroundColor ) {
       ctx.fillStyle = this.backgroundColor;
       ctx.fillRect(0, 0, surface.rect.width, surface.rect.height);
   }
   ctx.font = this.sampleSurface.context.font;
   ctx.textBaseline = this.sampleSurface.context.textBaseline;
   ctx.textAlign = this.sampleSurface.context.textAlign;
   ctx.fillStyle = ctx.strokeStyle = color || "#000000";
   ctx.fillText(text, 0, surface.rect.height, surface.rect.width);
   ctx.restore();
   return surface;
};

/**
 * Determine the width and height of the given text if rendered
 * with this Font.
 * @param {String} text the text to measure
 * @returns {Array} the [width, height] of the text if rendered with this Font
 */
Font.prototype.size = function(text) {
   var metrics = this.sampleSurface.context.measureText(text);
   // FIXME measuretext is buggy, make extra wide
   return [metrics.width, this.fontHeight];
};

/**
 * Height of the font in pixels.
 */
objects.accessors(Font.prototype, {
   'fontHeight': {
      get: function() {
         // Returns an approximate line height of the text
         // »This version of the specification does not provide a way to obtain
         // the bounding box dimensions of the text.«
         // see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-measuretext
         return this.sampleSurface.context.measureText('M').width * 1.5;
      }
   }

});

},{"../gamejs":17,"./utils/objects":39}],23:[function(require,module,exports){
/**
 * @fileoverview Make synchronous http requests to your game's serverside component.
 *
 * If you configure a ajax base URL you can make http requests to your
 * server using those functions.

 * The most high-level functions are `load()` and `save()` which take
 * and return a JavaScript object, which they will send to / recieve from
 * the server-side in JSON format.
 *
 * @example
 *
 *     <script>
 *     // Same Origin policy applies! You can only make requests
 *     // to the server from which the html page is served.
 *      var $g = {
 *         ajaxBaseHref: "http://the-same-server.com/ajax/"
 *      };
 *      </script>
 *      <script src="./public/gamejs-wrapped.js"></script>
 *      ....
 *      typeof gamejs.load('userdata/') === 'object'
 *      typeof gamejs.get('userdata/') === 'string'
 *      ...
 *
 */

/**
 * Response object returned by http functions `get` and `post`. This
 * class is not instantiable.
 *
 * @param{String} responseText
 * @param {String} responseXML
 * @param {Number} status
 * @param {String} statusText
 */
exports.Response = function() {
   /**
    * @param {String} header
    */
   this.getResponseHeader = function(header)  {
   };
   throw new Error('response class not instantiable');
};

/**
 * Make http request to server-side
 * @param {String} method http method
 * @param {String} url
 * @param {String|Object} data
 * @param {String|Object} type "Accept" header value
 * @return {Response} response
 */
var ajax = exports.ajax = function(method, url, data, type) {
   data = data || null;
   var response = new XMLHttpRequest();
   response.open(method, url, false);
   if (type) {
      response.setRequestHeader("Accept", type);
   }
   if (data instanceof Object) {
      data = JSON.stringify(data);
      response.setRequestHeader('Content-Type', 'application/json');
   }
   response.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
   response.send(data);
   return response;
};

/**
 * Make http GET request to server-side
 * @param {String} url
 */
var get = exports.get = function(url) {
   return ajax('GET', url);
};

/**
 * Make http POST request to server-side
 * @param {String} url
 * @param {String|Object} data
 * @param {String|Object} type "Accept" header value
 * @returns {Response}
 */
var post = exports.post = function(url, data, type) {
   return ajax('POST', url, data, type);
};

function stringify(response) {
   // eval is evil
   return eval('(' + response.responseText + ')');
}

function ajaxBaseHref() {
    return (window.$g && window.$g.ajaxBaseHref) || './';
}

/**
 * Load an object from the server-side.
 * @param {String} url
 * @return {Object} the object loaded from the server
 */
exports.load = function(url) {
   return stringify(get(ajaxBaseHref() + url));
};

/**
 * Send an object to a server-side function.
 * @param {String} url
 * @param {String|Object} data
 * @param {String|Object} type "Accept" header value
 * @returns {Object} the response object
 */
exports.save = function(url, data, type) {
   return stringify(post(ajaxBaseHref() + url, {payload: data}, type));
};

},{}],24:[function(require,module,exports){
var gamejs = require('../gamejs');

/**
 * @fileoverview Load images as Surfaces.
 *
 * Sounds & Images are loaded relative to your game's html page
 * (the html which includes the GameJs code) or relative to the
 * property `window.$g.resourceBaseHref`
 * if it is set.
 *
 *
 */

var CACHE = {};

/**
 * need to export preloading status for require
 * @ignore
 */
var _PRELOADING = false;

/**
 * Load image and return it on a Surface.
 *
 * All images must be preloaded before they can be used.
 * @example

 *     gamejs.preload(["./images/ship.png", "./images/sunflower.png"]);
 *     // ...later...
 *     display.blit(gamejs.image.load('images/ship.png'))
 *
 * @param {String|dom.Image} uriOrImage resource uri for image
 * @returns {gamejs.Surface} surface with the image on it.
 */
exports.load = function(key) {
   var img;
   if (typeof key === 'string') {
      img = CACHE[key];
      if (!img) {
			throw new Error('Missing "' + key + '", gamejs.preload() all images before trying to load them.');
      }
   } else {
      img = key;
   }
   var canvas = document.createElement('canvas');
   // IEFIX missing html5 feature naturalWidth/Height
   canvas.width = img.naturalWidth || img.width;
   canvas.height = img.naturalHeight || img.height;
   var context = canvas.getContext('2d');
   context.drawImage(img, 0, 0);
   img.getSize = function() { return [img.naturalWidth, img.naturalHeight]; };
   var surface = new gamejs.Surface(img.getSize());
   // NOTE hack setting protected _canvas directly
   surface._canvas = canvas;
   surface._context = context;
   return surface;
};


/**
 * add all images on the currrent page into cache
 * @ignore
 */
exports.init = function() {
   return;
};

/**
 * preload the given img URIs
 * @returns {Function} which returns 0-1 for preload progress
 * @ignore
 */
exports.preload = function(imgIdents) {

   var countLoaded = 0;
   var countTotal = 0;

   function incrementLoaded() {
      countLoaded++;
      if (countLoaded == countTotal) {
         _PRELOADING = false;
      }
      if (countLoaded % 10 === 0) {
         gamejs.log('gamejs.image: preloaded  ' + countLoaded + ' of ' + countTotal);
      }
   }

   function getProgress() {
      return countTotal > 0 ? countLoaded / countTotal : 1;
   }

   function successHandler() {
      addToCache(this);
      incrementLoaded();
   }
   function errorHandler() {
      incrementLoaded();
      throw new Error('Error loading ' + this.src);
   }

   var key;
   for (key in imgIdents) {
      var lowerKey = key.toLowerCase();
      if (lowerKey.indexOf('.png') == -1 &&
            lowerKey.indexOf('.jpg') == -1 &&
            lowerKey.indexOf('.jpeg') == -1 &&
            lowerKey.indexOf('.svg') == -1 &&
            lowerKey.indexOf('.gif') == -1) {
         continue;
      }
      var img = new Image();
      img.addEventListener('load', successHandler, true);
      img.addEventListener('error', errorHandler, true);
      img.src = imgIdents[key];
      img.gamejsKey = key;
      countTotal++;
   }
   if (countTotal > 0) {
      _PRELOADING = true;
   }
   return getProgress;
};

/**
 * add the given <img> dom elements into the cache.
 * @private
 */
var addToCache = function(img) {
   CACHE[img.gamejsKey] = img;
   return;
};

},{"../gamejs":17}],25:[function(require,module,exports){
var gamejs = require('../gamejs');
var objects = require('./utils/objects');

/**
 * @fileoverview Image masks. Usefull for pixel perfect collision detection.
 */

/**
 * Creates an image mask from the given Surface. The alpha of each pixel is checked
 * to see if it is greater than the given threshold. If it is greater then
 * that pixel is set as non-colliding.
 *
 * @param {gamejs.Surface} surface
 * @param {Number} threshold 0 to 255. defaults to: 255, fully transparent
 */
exports.fromSurface = function(surface, threshold) {
   threshold = (threshold && (255 - threshold)) || 255;
   var imgData = surface.getImageData().data;
   var dims = surface.getSize();
   var mask = new Mask(dims);
   var i;
   for (i=0;i<imgData.length;i += 4) {
      // y: pixel # / width
      var y = parseInt((i / 4) / dims[0], 10);
      // x: pixel # % width
      var x = parseInt((i / 4) % dims[0], 10);
      var alpha = imgData[i+3];
      if (alpha >= threshold) {
         mask.setAt(x, y);
      }
   }
   return mask;
};

/**
 * Image Mask
 * @param {Array} dimensions [width, height]
 *
 */
var Mask = exports.Mask = function(dims) {
   /**
    * @ignore
    */
   this.width = dims[0];
   /**
    * @ignore
    */
   this.height = dims[1];
   /**
    * @ignore
    */
   this._bits = [];
   var i,j;
   for (i=0;i<this.width;i++) {
      this._bits[i] = [];
      for (j=0;j<this.height;j++) {
         this._bits[i][j] = false;
      }
   }
   return;
};

/**
 * @param {gamejs.mask.Mask} otherMask
 * @param {Array} offset [x,y]
 * @returns the overlapping rectangle or null if there is no overlap;
 */
Mask.prototype.overlapRect = function(otherMask, offset) {
   var arect = this.rect;
   var brect = otherMask.rect;
   if (offset) {
      brect.moveIp(offset);
   }
   // bounding box intersect
   if (!brect.collideRect(arect)) {
      return null;
   }
   var xStart = Math.max(arect.left, brect.left);
   var xEnd = Math.min(arect.right, brect.right);

   var yStart = Math.max(arect.top, brect.top);
   var yEnd = Math.min(arect.bottom, brect.bottom);

   return new gamejs.Rect([xStart, yStart], [xEnd - xStart, yEnd - yStart]);
};

/**
 *
 * @returns True if the otherMask overlaps with this map.
 * @param {Mask} otherMask
 * @param {Array} offset
 */
Mask.prototype.overlap = function(otherMask, offset) {
   var overlapRect = this.overlapRect(otherMask, offset);
   if (overlapRect === null) {
      return false;
   }

   var arect = this.rect;
   var brect = otherMask.rect;
   if (offset) {
      brect.moveIp(offset);
   }

   var count = 0;
   var x,y;
   for (y=overlapRect.top; y<=overlapRect.bottom; y++) {
      for (x=overlapRect.left; x<=overlapRect.right; x++) {
         if (this.getAt(x - arect.left, y - arect.top) &&
             otherMask.getAt(x - brect.left, y - brect.top)) {
             return true;
         }
      }
   }
   // NOTE this should not happen because either we bailed out
   // long ago because the rects do not overlap or there is an
   // overlap and we should not have gotten this far.
   // throw new Error("Maks.overlap: overlap detected but could not create mask for it.");
   return false;
};

/**
 * @param {gamejs.mask.Mask} otherMask
 * @param {Array} offset [x,y]
 * @returns the number of overlapping pixels
 */
Mask.prototype.overlapArea = function(otherMask, offset) {
   var overlapRect = this.overlapRect(otherMask, offset);
   if (overlapRect === null) {
      return 0;
   }

   var arect = this.rect;
   var brect = otherMask.rect;
   if (offset) {
      brect.moveIp(offset);
   }

   var count = 0;
   var x,y;
   for (y=overlapRect.top; y<=overlapRect.bottom; y++) {
      for (x=overlapRect.left; x<=overlapRect.right; x++) {
         if (this.getAt(x - arect.left, y - arect.top) &&
             otherMask.getAt(x - brect.left, y - brect.top)) {
             count++;
         }
      }
   }
   return count;
};

/**
 * @param {gamejs.mask.Mask} otherMask
 * @param {Array} offset [x,y]
 * @returns a mask of the overlapping pixels
 */
Mask.prototype.overlapMask = function(otherMask, offset) {
   var overlapRect = this.overlapRect(otherMask, offset);
   if (overlapRect === null) {
      return 0;
   }

   var arect = this.rect;
   var brect = otherMask.rect;
   if (offset) {
      brect.moveIp(offset);
   }

   var mask = new Mask([overlapRect.width, overlapRect.height]);
   var x,y;
   for (y=overlapRect.top; y<=overlapRect.bottom; y++) {
      for (x=overlapRect.left; x<=overlapRect.right; x++) {
         if (this.getAt(x - arect.left, y - arect.top) &&
             otherMask.getAt(x - brect.left, y - brect.top)) {
             mask.setAt(x, y);
         }
      }
   }
   return mask;
};

/**
 * Set bit at position.
 * @param {Number} x
 * @param {Number} y
 */
Mask.prototype.setAt = function(x, y) {
   this._bits[x][y] = true;
};

/**
 * Get bit at position.
 *
 * @param {Number} x
 * @param {Number} y
 */
Mask.prototype.getAt = function(x, y) {
   x = parseInt(x, 10);
   y = parseInt(y, 10);
   if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return false;
   }
   return this._bits[x][y];
};


/**
 * Flip the bits in this map.
 */
Mask.prototype.invert = function() {
   this._bits = this._bits.map(function(row) {
      return row.map(function(b) {
         return !b;
      });
   });
};

/**
 * @returns {Array} the dimensions of the map
 */
Mask.prototype.getSize = function() {
   return [this.width, this.height];
};

objects.accessors(Mask.prototype, {
   /**
    * Rect of this Mask.
    */
   'rect': {
      get: function() {
         return new gamejs.Rect([0, 0], [this.width, this.height]);
      }
   },
   /**
    * @returns {Number} number of set pixels in this mask.
    */
   'length': {
      get: function() {
         var c = 0;
         this._bits.forEach(function(row) {
            row.forEach(function(b) {
               if (b) {
                  c++;
               }
            });
         });
         return c;
      }
   }
});

},{"../gamejs":17,"./utils/objects":39}],26:[function(require,module,exports){
var gamejs = require('../gamejs');

/**
 * @fileoverview Playing sounds with the html5 audio tag. Audio files must be preloaded
 * with the usual `gamejs.preload()` function. Ogg, wav and webm supported.
 *
 * Sounds & Images are loaded relative to './'.
 */

var CACHE = {};

/**
 * need to export preloading status for require
 * @ignore
 */
var _PRELOADING = false;

/**
 * @ignore
 */
var NUM_CHANNELS = 8;

/**
 * Sets the number of available channels for the mixer. The default value is 8.
 */
exports.setNumChannels = function(count) {
   NUM_CHANNELS = parseInt(count, 10) || NUM_CHANNELS;
};

exports.getNumChannels = function() {
   return NUM_CHANNELS;
};

/**
 * put all audios on page in cache
 * if same domain as current page, remove common href-prefix
 * @ignore
 */
exports.init = function() {
   var audios = Array.prototype.slice.call(document.getElementsByTagName("audio"), 0);
   addToCache(audios);
   return;
};

/**
 * Preload the audios into cache
 * @param {String[]} List of audio URIs to load
 * @returns {Function} which returns 0-1 for preload progress
 * @ignore
 */
exports.preload = function(audioUrls, showProgressOrImage) {
   var countTotal = 0;
   var countLoaded = 0;

   function incrementLoaded() {
      countLoaded++;
      if (countLoaded == countTotal) {
         _PRELOADING = false;
      }
   }

   function getProgress() {
      return countTotal > 0 ? countLoaded / countTotal : 1;
   }

   function successHandler() {
      addToCache(this);
      incrementLoaded();
   }
   function errorHandler() {
      incrementLoaded();
      throw new Error('Error loading ' + this.src);
   }

   for (var key in audioUrls) {
      if (key.indexOf('wav') == -1 && key.indexOf('ogg') == -1 && key.indexOf('webm') == -1) {
         continue;
      }
      countTotal++;
      var audio = new Audio();
      audio.addEventListener('canplay', successHandler, true);
      audio.addEventListener('error', errorHandler, true);
      audio.src = audioUrls[key];
      audio.gamejsKey = key;
      audio.load();
   }
   if (countTotal > 0) {
      _PRELOADING = true;
   }
   return getProgress;
};

/**
 * @ignore
 */
exports.isPreloading = function() {
   return _PRELOADING;
};

/**
 * @param {dom.ImgElement} audios the <audio> elements to put into cache
 * @ignore
 */
function addToCache(audios) {
   if (!(audios instanceof Array)) {
      audios = [audios];
   }

   var docLoc = document.location.href;
   audios.forEach(function(audio) {
      CACHE[audio.gamejsKey] = audio;
   });
   return;
}

/**
 * Sounds can be played back.
 * @constructor
 * @param {String|dom.AudioElement} uriOrAudio the uri of <audio> dom element
 *                of the sound
 */
exports.Sound = function Sound(uriOrAudio) {
   var cachedAudio;
   if (typeof uriOrAudio === 'string') {
      cachedAudio = CACHE[uriOrAudio];
   } else {
      cachedAudio = uriOrAudio;
   }
   if (!cachedAudio) {
      // TODO sync audio loading
      throw new Error('Missing "' + uriOrAudio + '", gamejs.preload() all audio files before loading');
   }

   var channels = [];
   var i = NUM_CHANNELS;
   while (i-->0) {
      var audio = new Audio();
      audio.preload = "auto";
      audio.loop = false;
      audio.src = cachedAudio.src;
      channels.push(audio);
   }
   /**
    * start the sound
    * @param {Boolean} loop whether the audio should loop for ever or not
    */
   this.play = function(loop) {
      channels.some(function(audio) {
         if (audio.ended || audio.paused) {
            audio.loop = !!loop;
            audio.play();
            return true;
         }
         return false;
      });
   };

   /**
    * Stop the sound.
    * This will stop the playback of this Sound on any active Channels.
    */
   this.stop = function() {
      channels.forEach(function(audio) {
         audio.stop();
      });
   };

   /**
    * Set volume of this sound
    * @param {Number} value volume from 0 to 1
    */
   this.setVolume = function(value) {
      channels.forEach(function(audio) {
         audio.volume = value;
      });
   };

   /**
    * @returns {Number} the sound's volume from 0 to 1
    */
   this.getVolume = function() {
      return channels[0].volume;
   };

   /**
    * @returns {Number} Duration of this sound in seconds
    */
   this.getLength = function() {
      return channels[0].duration;
   };

   return this;
};

},{"../gamejs":17}],27:[function(require,module,exports){
/**
 * @fileoverview
 * A noise generator comparable to Perlin noise, which is useful
 * for generating procedural content.
 * @see gamejs/utils/prng
 */

// Ported to JS by by zz85 <https://github.com/zz85> from Stefan
// Gustavson's java implementation
// <http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf>
// Read Stefan's excellent paper for details on how this code works.
//
// Sean McCullough banksean@gmail.com

/**
 * This implementation provides 2D and 3D noise. You can optionally
 * pass a seedable pseudo-random number generator to its constructor. This
 * generator object is assumed to have a `random()` method; `Math` is used
 * per default.
 *
 * Also see `gamejs/utils/prng` for a seedable pseudo random number generator
 *
 * @param {Object} prng the random number generator to use; most provide `random()` method
 * @usage
 *  var simplex = new gamejs.noise.Simplex();
 *  simplex.get(x, y);
 *  // or for 3d noise
 *  simple.get(x, y, y);
 */
var Simplex = exports.Simplex = function(r) {
  if (r == undefined) {
    r = Math;
  }
  /** @ignore */
  this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
               [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
               [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  /** @ignore */
  this.p = [];
  var i;
  for (i=0; i<256; i++) {
   this.p[i] = Math.floor(r.random()*256);
  }
  // To remove the need for index wrapping, double the permutation table length
  /** @ignore */
  this.perm = [];
  for(i=0; i<512; i++) {
    this.perm[i]=this.p[i & 255];
  }

  // A lookup table to traverse the simplex around a given point in 4D.
  // Details can be found where this table is used, in the 4D noise method.
  /** @ignore */
  this.simplex = [
    [0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],
    [0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],
    [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],
    [1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],
    [1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],
    [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],
    [2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],
    [2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]];
};

/** @ignore */
Simplex.prototype.dot = function(g, x, y) {
   return g[0]*x + g[1]*y;
};

/**
 * @param {Number} x
 * @param {Number} y
 * @returns {Number} noise for given position, in range [-1, 1]
 */
Simplex.prototype.get = function(xin, yin) {
  var n0, n1, n2; // Noise contributions from the three corners
  // Skew the input space to determine which simplex cell we're in
  var F2 = 0.5*(Math.sqrt(3.0)-1.0);
  var s = (xin+yin)*F2; // Hairy factor for 2D
  var i = Math.floor(xin+s);
  var j = Math.floor(yin+s);
  var G2 = (3.0-Math.sqrt(3.0))/6.0;
  var t = (i+j)*G2;
  var X0 = i-t; // Unskew the cell origin back to (x,y) space
  var Y0 = j-t;
  var x0 = xin-X0; // The x,y distances from the cell origin
  var y0 = yin-Y0;
  // For the 2D case, the simplex shape is an equilateral triangle.
  // Determine which simplex we are in.
  var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
  if(x0>y0) {i1=1; j1=0;} // lower triangle, XY order: (0,0)->(1,0)->(1,1)
  else {i1=0; j1=1;} // upper triangle, YX order: (0,0)->(0,1)->(1,1)
  // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
  // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
  // c = (3-sqrt(3))/6
  var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
  var y1 = y0 - j1 + G2;
  var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
  var y2 = y0 - 1.0 + 2.0 * G2;
  // Work out the hashed gradient indices of the three simplex corners
  var ii = i & 255;
  var jj = j & 255;
  var gi0 = this.perm[ii+this.perm[jj]] % 12;
  var gi1 = this.perm[ii+i1+this.perm[jj+j1]] % 12;
  var gi2 = this.perm[ii+1+this.perm[jj+1]] % 12;
  // Calculate the contribution from the three corners
  var t0 = 0.5 - x0*x0-y0*y0;
  if(t0<0) {
    n0 = 0.0;
  } else {
    t0 *= t0;
    n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0); // (x,y) of grad3 used for 2D gradient
  }
  var t1 = 0.5 - x1*x1-y1*y1;
  if(t1<0) {
    n1 = 0.0;
  } else {
    t1 *= t1;
    n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
  }
  var t2 = 0.5 - x2*x2-y2*y2;
  if(t2<0) {
    n2 = 0.0;
  } else {
    t2 *= t2;
    n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
  }
  // Add contributions from each corner to get the final noise value.
  // The result is scaled to return values in the interval [-1,1].
  return 70.0 * (n0 + n1 + n2);
};


/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} y
 * @returns {Number} noise for given position, in range [-1, 1]
 */
Simplex.prototype.get3d = function(xin, yin, zin) {
  var n0, n1, n2, n3; // Noise contributions from the four corners
  // Skew the input space to determine which simplex cell we're in
  var F3 = 1.0/3.0;
  var s = (xin+yin+zin)*F3; // Very nice and simple skew factor for 3D
  var i = Math.floor(xin+s);
  var j = Math.floor(yin+s);
  var k = Math.floor(zin+s);
  var G3 = 1.0/6.0; // Very nice and simple unskew factor, too
  var t = (i+j+k)*G3;
  var X0 = i-t; // Unskew the cell origin back to (x,y,z) space
  var Y0 = j-t;
  var Z0 = k-t;
  var x0 = xin-X0; // The x,y,z distances from the cell origin
  var y0 = yin-Y0;
  var z0 = zin-Z0;
  // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
  // Determine which simplex we are in.
  var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
  var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
  if(x0>=y0) {
    if(y0>=z0)
      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; } // X Y Z order
      else if(x0>=z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; } // X Z Y order
      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; } // Z X Y order
    }
  else { // x0<y0
    if(y0<z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; } // Z Y X order
    else if(x0<z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; } // Y Z X order
    else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; } // Y X Z order
  }
  // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
  // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
  // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
  // c = 1/6.
  var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
  var y1 = y0 - j1 + G3;
  var z1 = z0 - k1 + G3;
  var x2 = x0 - i2 + 2.0*G3; // Offsets for third corner in (x,y,z) coords
  var y2 = y0 - j2 + 2.0*G3;
  var z2 = z0 - k2 + 2.0*G3;
  var x3 = x0 - 1.0 + 3.0*G3; // Offsets for last corner in (x,y,z) coords
  var y3 = y0 - 1.0 + 3.0*G3;
  var z3 = z0 - 1.0 + 3.0*G3;
  // Work out the hashed gradient indices of the four simplex corners
  var ii = i & 255;
  var jj = j & 255;
  var kk = k & 255;
  var gi0 = this.perm[ii+this.perm[jj+this.perm[kk]]] % 12;
  var gi1 = this.perm[ii+i1+this.perm[jj+j1+this.perm[kk+k1]]] % 12;
  var gi2 = this.perm[ii+i2+this.perm[jj+j2+this.perm[kk+k2]]] % 12;
  var gi3 = this.perm[ii+1+this.perm[jj+1+this.perm[kk+1]]] % 12;
  // Calculate the contribution from the four corners
  var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
  if(t0<0) {
    n0 = 0.0;
  } else {
    t0 *= t0;
    n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0, z0);
  }
  var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
  if(t1<0) {
    n1 = 0.0;
  } else {
    t1 *= t1;
    n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1, z1);
  }
  var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
  if(t2<0) {
    n2 = 0.0;
  } else {
    t2 *= t2;
    n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2, z2);
  }
  var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
  if(t3<0) {
    n3 = 0.0;
  } else {
    t3 *= t3;
    n3 = t3 * t3 * this.dot(this.grad3[gi3], x3, y3, z3);
  }
  // Add contributions from each corner to get the final noise value.
  // The result is scaled to stay just inside [-1,1]
  return 32.0*(n0 + n1 + n2 + n3);
};

},{}],28:[function(require,module,exports){
/**
 * @fileoverview
 * AStar Path finding algorithm
 *
 * Use the `findRoute(map, from, to, [timeout])` function to get the linked list
 * leading `from` a point `to` another on the given `map`.
 *
 * The map must implement interface `gamejs.pathfinding.Map`. This
 * class really holds an example implementation & data for you to study. If you
 * understand what this calls provides, you understand this module.
 *
 * Optionally, the search is cancelled after `timeout` in millseconds.
 *
 * If there is no route `null` is returned.
 *
 * @see http://eloquentjavascript.net/chapter7.html
 */
var BinaryHeap = require('../utils/binaryheap').BinaryHeap;

/**
 * helper function for A*
 */
function ReachedList(hashFn) {
   var list = {};

   this.store = function(point, route) {
      list[hashFn(point)] = route;
      return;
   };

   this.find = function(point) {
      return list[hashFn(point)];
   };
   return this;
}


/** A* search function.
 *
 * This function expects a `Map` implementation and the origin and destination
 * points given. If there is a path between the two it will return the optimal
 * path as a linked list. If there is no path it will return null.
 *
 * The linked list is in reverse order: the first item is the destination and
 * the path to the origin follows.
 *
 * @param {Map} map map instance, must follow interface defined in {Map}
 * @param {Array} origin
 * @param {Array} destination
 * @param {Number} timeout milliseconds after which search should be canceled
 * @returns {Object} the linked list leading from `to` to `from` (sic!).
 **/
exports.findRoute = function(map, from, to, timeout) {
   var open = new BinaryHeap(routeScore);
   var hashFn = typeof map.hash === 'function' ? map.hash : defaultHash;
   var reached = new ReachedList(hashFn);

   function routeScore(route) {
      if (route.score === undefined) {
         route.score = map.estimatedDistance(route.point, to) + route.length;
      }
      return route.score;
   }
   function addOpenRoute(route) {
      open.push(route);
      reached.store(route.point, route);
   }

   function processNewPoints(direction) {
      var known = reached.find(direction);
      var newLength = route.length + map.actualDistance(route.point, direction);
      if (!known || known.length > newLength){
         if (known) {
            open.remove(known);
         }
         addOpenRoute({
            point: direction,
            from: route,
            length: newLength
         });
      }
   }
   var startMs = Date.now();
   var route = null;
   addOpenRoute({
      point: from,
      from: null,
      length: 0
   });
   var equalsFn = typeof map.equals === 'function' ? map.equals : defaultEquals;
   while (open.size() > 0 && (!timeout || Date.now() - startMs < timeout)) {
      route = open.pop();
      if (equalsFn(to, route.point)) {
         return route;
      }
      map.adjacent(route.point).forEach(processNewPoints);
   } // end while
   return null;
};

var defaultEquals = function(a, b) {
   return a[0] === b[0] && a[1] === b[1];
};

var defaultHash = function(a) {
   return a[0] + '-' + a[1];
};

/**
 * This is the interface for a Map that can be passed to the `findRoute()`
 * function. `Map` is not instantiable - see the unit tests for an example
 * implementation of Map.
 */
var Map = exports.Map = function() {
   throw new Error('not instantiable, this is an interface');
};

/**
 * @param {Array} origin
 * @returns {Array} list of points accessible from given Point
 */
Map.prototype.adjacent = function(origin) {
};

/**
 * @param {Object} a one of the points ot test for equality
 * @param {Object} b ... the other point
 * @returns Wheter the two points are equal.
 */
Map.prototype.equals = defaultEquals;

/**
 * @param {Object} a point
 * @returns {String} hash for the point
 */
Map.prototype.hash = defaultHash;

/**
 * Estimated lower bound distance between two points.
 * @param {Object} pointA
 * @param {Object} pointB
 * @returns {Number} the estimated distance between two points
 */
Map.prototype.estimatedDistance = function(pointA, pointB) {
   return 1;
};

/**
 * Actual distance between two points.
 * @param {Object} pointA
 * @param {Object} pointB
 * @returns {Number} the actual distance between two points
 */
Map.prototype.actualDistance = function(pointA, pointB) {
   return 1;
};

},{"../utils/binaryheap":36}],29:[function(require,module,exports){
var gamejs = require('../gamejs');
var arrays = require('./utils/arrays');
var $o = require('./utils/objects');
var $v = require('./utils/vectors');

/**
 * @fileoverview Provides `Sprite` the basic building block for any game and
 * `SpriteGroups`, which are an efficient
 * way for doing collision detection between groups as well as drawing layered
 * groups of objects on the screen.
 *
 */

/**
 * Your visible game objects will typically subclass Sprite. By setting it's image
 * and rect attributes you can control its appeareance. Those attributes control
 * where and what `Sprite.draw(surface)` will blit on the the surface.
 *
 * Your subclass should overwrite `update(msDuration)` with its own implementation.
 * This function is called once every game tick, it is typically used to update
 * the status of that object.
 * @constructor
 */
var Sprite = exports.Sprite = function() {
   /** @ignore */
   this._groups = [];
   /** @ignore */
   this._alive = true;

   /**
    * Image to be rendered for this Sprite.
    * @type gamejs.Surface
    */
   this.image = null;
   /**
    * Rect describing the position of this sprite on the display.
    * @type gamejs.Rect
    */
   this.rect = null;

   /**
    * List of all groups that contain this sprite.
    */
   $o.accessor(this, 'groups', function() {
      return this._groups;
   });

   return this;
};

/**
 * Kill this sprite. This removes the sprite from all associated groups and
 * makes future calls to `Sprite.isDead()` return `true`
 */
Sprite.prototype.kill = function() {
   this._alive = false;
   this._groups.forEach(function(group) {
      group.remove(this);
   }, this);
   return;
};

/**
 * Remove the sprite from the passed groups
 * @param {Array|gamejs.sprite.Group} groups One or more `gamejs.Group`
 * instances
 */
Sprite.prototype.remove = function(groups) {
   if (!(groups instanceof Array)) {
      groups = [groups];
   }

   groups.forEach(function(group) {
      group.remove(this);
   }, this);
   return;
};

/**
 * Add the sprite to the passed groups
 * @param {Array|gamejs.sprite.Group} groups One or more `gamejs.sprite.Group`
 * instances
 */
Sprite.prototype.add = function(groups) {
   if (!(groups instanceof Array)) {
      groups = [groups];
   }

   groups.forEach(function(group) {
      group.add(this);
   }, this);
   return;
};


/**
 * Returns an array of all the Groups that contain this Sprite.
 * @returns {Array} an array of groups
 */
Sprite.prototype.groups = function() {
   return this._groups.slice(0);
};

/**
 * Draw this sprite onto the given surface. The position is defined by this
 * sprite's rect.
 * @param {gamejs.Surface} surface The surface to draw on
 */
Sprite.prototype.draw = function(surface) {
   surface.blit(this.image, this.rect);
   return;
};

/**
 * Update this sprite. You **should** override this method with your own to
 * update the position, status, etc.
 */
Sprite.prototype.update = function() {};

/**
 * @returns {Boolean} True if this sprite has had `Sprite.kill()` called on it
 * previously, otherwise false
 */
Sprite.prototype.isDead = function() {
   return !this._alive;
};

/**
 * Sprites are often grouped. That makes collision detection more efficient and
 * improves rendering performance. It also allows you to easly keep track of layers
 * of objects which are rendered to the screen in a particular order.
 *
 * `Group.update()` calls `update()` on all the contained sprites; the same is true for `draw()`.
 * @constructor
 */
var Group = exports.Group = function() {
   /** @ignore */
   this._sprites = [];


   if (arguments[0] instanceof Sprite ||
      (arguments[0] instanceof Array &&
       arguments[0].length &&
       arguments[0][0] instanceof Sprite
   )) {
      this.add(arguments[0]);
   }
   return this;
};

/**
 * Update all the sprites in this group. This is equivalent to calling the
 * update method on each sprite in this group.
 */
Group.prototype.update = function() {
   var updateArgs = arguments;

   this._sprites.forEach(function(sp) {
      sp.update.apply(sp, updateArgs);
   }, this);
   return;
};

/**
 * Add one or more sprites to this group
 * @param {Array|gamejs.sprite.Sprite} sprites One or more
 * `gamejs.sprite.Sprite` instances
 */
Group.prototype.add = function(sprites) {
   if (!(sprites instanceof Array)) {
      sprites = [sprites];
   }

   sprites.forEach(function(sprite) {
      this._sprites.push(sprite);
      sprite._groups.push(this);
   }, this);
   return;
};

/**
 * Remove one or more sprites from this group
 * @param {Array|gamejs.sprite.Sprite} sprites One or more
 * `gamejs.sprite.Sprite` instances
 */
Group.prototype.remove = function(sprites) {
   if (!(sprites instanceof Array)) {
      sprites = [sprites];
   }

   sprites.forEach(function(sp) {
      arrays.remove(sp, this._sprites);
      arrays.remove(this, sp._groups);
   }, this);
   return;
};

/**
 * Check for the existence of one or more sprites within a group
 * @param {Array|gamejs.sprite.Sprite} sprites One or more
 * `gamejs.sprite.Sprite` instances
 * @returns {Boolean} True if every sprite is in this group, false otherwise
 */
Group.prototype.has = function(sprites) {
   if (!(sprites instanceof Array)) {
      sprites = [sprites];
   }

   return sprites.every(function(sp) {
      return this._sprites.indexOf(sp) !== -1;
   }, this);
};

/**
 * Get the sprites in this group
 * @returns {Array} An array of `gamejs.sprite.Sprite` instances
 */
Group.prototype.sprites = function() {
   return this._sprites;
};

/**
 * Draw all the sprites in this group. This is equivalent to calling each
 * sprite's draw method.
 */
Group.prototype.draw = function() {
   var args = arguments;
   this._sprites.forEach(function(sprite) {
      sprite.draw.apply(sprite, args);
   }, this);
   return;
};

/**
 * Draw background (`source` argument) over each sprite in the group
 * on the `destination` surface.
 *
 * This can, for example, be used to clear the
 * display surface to a a static background image in all the places
 * occupied by the sprites of all group.
 *
 * @param {gamejs.Surface} destination the surface to draw on
 * @param {gamejs.Surface} source surface
 */
Group.prototype.clear = function(destination, source) {
   this._sprites.forEach(function(sprite) {
      destination.blit(source, sprite.rect);
   }, this);
};

/**
 * Remove all sprites from this group
 */
Group.prototype.empty = function() {
   this._sprites = [];
   return;
};

/**
 * Splice the elements of the group
 */
Group.prototype.splice = function(indexToRemove, numberToRemove) {
  this._sprites.splice(indexToRemove, numberToRemove);
  return;
};

/**
 * Shift the sprites in the group
 * Deletes the oldest sprite in the group, useful to limit size of groups
 */
Group.prototype.shift = function() {
  this._sprites.shift();
  return;
};


/**
 * @returns {Number} of sprites in the group
 * Used hand in hand with splice method (see above)
 */
Group.prototype.length = function() {
  return this._sprites.length;
};



/**
 * @returns {Array} of sprites colliding with the point
 */
Group.prototype.collidePoint = function() {
   var args = Array.prototype.slice.apply(arguments);
   return this._sprites.filter(function(sprite) {
      return sprite.rect.collidePoint.apply(sprite.rect, args);
   }, this);
};

/**
 * Loop over each sprite in this group. This is a shortcut for
 * `group.sprites().forEach(...)`.
 */
Group.prototype.forEach = function(callback, thisArg) {
   return this._sprites.forEach(callback, thisArg);
};

/**
 * Check whether some sprite in this group passes a test. This is a shortcut
 * for `group.sprites().some(...)`.
 */
Group.prototype.some = function(callback, thisArg) {
   return this._sprites.some(callback, thisArg);
};

/**
 * Find sprites in a group that intersect another sprite
 * @param {gamejs.sprite.Sprite} sprite The sprite to check
 * @param {gamejs.sprite.Group} group The group to check
 * @param {Boolean} doKill If true, kill sprites in the group when collided
 * @param {function} collided Collision function to use, defaults to `gamejs.sprite.collideRect`
 * @returns {Array} An array of `gamejs.sprite.Sprite` instances that collided
 */
exports.spriteCollide = function(sprite, group, doKill, collided) {
   collided = collided || collideRect;
   doKill = doKill || false;

   var collidingSprites = [];
   group.sprites().forEach(function(groupSprite) {
      if (collided(sprite, groupSprite)) {
         if (doKill) {
            groupSprite.kill();
         }
         collidingSprites.push(groupSprite);
      }
   });
   return collidingSprites;
};

/**
 * Find all Sprites that collide between two Groups.
 *
 * @example
 * groupCollide(group1, group2).forEach(function (collision) {
 *    var group1Sprite = collision.a;
 *    var group2Sprite = collision.b;
 *    // Do processing here!
 * });
 *
 * @param {gamejs.sprite.Group} groupA First group to check
 * @param {gamejs.sprite.Group} groupB Second group to check
 * @param {Boolean} doKillA If true, kill sprites in the first group when
 * collided
 * @param {Boolean} doKillB If true, kill sprites in the second group when
 * collided
 * @param {function} collided Collision function to use, defaults to `gamejs.sprite.collideRect`
 * @returns {Array} A list of objects where properties 'a' and 'b' that
 * correspond with objects from the first and second groups
 */
exports.groupCollide = function(groupA, groupB, doKillA, doKillB, collided) {
   doKillA = doKillA || false;
   doKillB = doKillB || false;

   var collideList = [];
   var collideFn = collided || collideRect;
   groupA.sprites().forEach(function(groupSpriteA) {
      groupB.sprites().forEach(function(groupSpriteB) {
         if (collideFn(groupSpriteA, groupSpriteB)) {
            if (doKillA) {
               groupSpriteA.kill();
            }
            if (doKillB) {
               groupSpriteB.kill();
            }

            collideList.push({
               'a': groupSpriteA,
               'b': groupSpriteB
            });
         }
      });
   });

   return collideList;
};

/**
 * Check for collisions between two sprites using their rects.
 *
 * @param {gamejs.sprite.Sprite} spriteA First sprite to check
 * @param {gamejs.sprite.Sprite} spriteB Second sprite to check
 * @returns {Boolean} True if they collide, false otherwise
 */
var collideRect = exports.collideRect = function (spriteA, spriteB) {
   return spriteA.rect.collideRect(spriteB.rect);
};

/**
 * Collision detection between two sprites utilizing the optional `mask`
 * attribute on the sprites. Beware: expensive operation.
 *
 * @param {gamejs.sprite.Sprite} spriteA Sprite with 'mask' property set to a `gamejs.mask.Mask`
 * @param {gamejs.sprite.Sprite} spriteB Sprite with 'mask' property set to a `gamejs.mask.Mask`
 * @returns {Boolean} True if any mask pixels collide, false otherwise
 */
exports.collideMask = function(spriteA, spriteB) {
   if (!spriteA.mask || !spriteB.mask) {
      throw new Error("Both sprites must have 'mask' attribute set to an gamejs.mask.Mask");
   }
   var offset = [
      spriteB.rect.left - spriteA.rect.left,
      spriteB.rect.top - spriteA.rect.top
   ];
   return spriteA.mask.overlap(spriteB.mask, offset);
};

/**
 * Collision detection between two sprites using circles at centers.
 * There sprite property `radius` is used if present, otherwise derived from bounding rect.
 * @param {gamejs.sprite.Sprite} spriteA First sprite to check
 * @param {gamejs.sprite.Sprite} spriteB Second sprite to check
 * @returns {Boolean} True if they collide, false otherwise
 */
exports.collideCircle = function(spriteA, spriteB) {
   var rA = spriteA.radius || Math.max(spriteA.rect.width, spriteA.rect.height);
   var rB = spriteB.radius || Math.max(spriteB.rect.width, spriteB.rect.height);
   return $v.distance(spriteA.rect.center, spriteB.rect.center) <= rA + rB;
};

},{"../gamejs":17,"./utils/arrays":34,"./utils/objects":39,"./utils/vectors":42}],30:[function(require,module,exports){
var gamejs = require('../gamejs');
var accessors = require('./utils/objects').accessors;
/**
 * @fileoverview Fast pixel access.
 *
 * @example
 *
 *   // create array from display surface
 *   var srfArray = new SurfaceArray(display);
 *   // direct pixel access
 *   srfArray.set(50, 100, [255, 0, 0, 100]);
 *   console.log(srfArray.get(30, 50));
 *   // blit modified array back to display surface
 *   blitArray(display, srfArray);
 */

/**
 * Directly copy values from an array into a Surface.
 *
 * This is faster than blitting the `surface` property on a SurfaceArray
 *
 * The array must be the same dimensions as the Surface and will completely
 * replace all pixel values.
 * @param {gamejs.Surface} surface
 * @param {gamejs.surfacearray.SurfaceArray} surfaceArray
 */
exports.blitArray = function(surface, surfaceArray) {
   surface.context.putImageData(surfaceArray.imageData, 0, 0);
   return;
};

/**
 * The SurfaceArray can be constructed with a surface whose values
 * are then used to initialize the pixel array.
 *
 * The surface passed as argument is not modified by the SurfaceArray.
 *
 * If an array is used to construct SurfaceArray, the array must describe
 * the dimensions of the SurfaceArray [width, height].
 *
 * @param {gamejs.Surface|Array} surfaceOrDimensions
 * @see http://dev.w3.org/html5/2dcontext/#pixel-manipulation
 */
var SurfaceArray = exports.SurfaceArray = function(surfaceOrDimensions) {
   var size = null;
   var data = null;
   var imageData = null;

   /**
    * Set rgba value at position x, y.
    *
    * For performance reasons this function has only one signature
    * being Number, Number, Array[4].
    *
    * @param {Number} x x position of pixel
    * @param {Number} y y position of pixel
    * @param {Array} rgba [red, green, blue, alpha] values [255, 255, 255, 255] (alpha, the last argument defaults to 255)
    * @throws Error if x, y out of range
    */
   this.set = function(x, y, rgba) {
      var offset = (x * 4) + (y * size[0] * 4);
      /** faster without
      if (offset + 3 >= data.length || x < 0 || y < 0) {
         throw new Error('x, y out of range', x, y);
      }
      **/
      data[offset] = rgba[0];
      data[offset+1] = rgba[1];
      data[offset+2] = rgba[2];
      data[offset+3] = rgba[3] === undefined ? 255 : rgba[3];
      return;
   };

   /**
    * Get rgba value at position xy,
    * @param {Number} x
    * @param {Number} y
    * @returns {Array} [red, green, blue, alpha]
    */
   this.get = function(x, y) {
      var offset = (x * 4) + (y * size[0] * 4);
      return [
         data[offset],
         data[offset+1],
         data[offset+2],
         data[offset+3]
      ];
   };

   /**
    * a new gamejs.Surface on every access, representing
    * the current state of the SurfaceArray.
    * @type {gamejs.Surface}
    */
   // for jsdoc only
   this.surface = null;

   accessors(this, {
      surface: {
         get: function() {
            var s = new gamejs.Surface(size);
            s.context.putImageData(imageData, 0, 0);
            return s;
         }
      },
      imageData: {
         get: function() {
            return imageData;
         }
      }
   });

   this.getSize = function() {
      return size;
   };

   /**
    * constructor
    */
   if (surfaceOrDimensions instanceof Array) {
      size = surfaceOrDimensions;
      imageData = gamejs.display.getSurface().context.createImageData(size[0], size[1]);
      data = imageData.data;
   } else {
      size = surfaceOrDimensions.getSize();
      imageData = surfaceOrDimensions.getImageData(0, 0, size[0], size[1]);
      data = imageData.data;
   }
   return this;
};

},{"../gamejs":17,"./utils/objects":39}],31:[function(require,module,exports){
/**
 * @fileoverview
 * Only used by GameJs internally to provide a game loop.
 * @ignore
 */

var Callback = require('./callback').Callback;

var TIMER_LASTCALL = null;
var STARTTIME = null;

/** @ignore **/
var _CALLBACK = exports._CALLBACK = new Callback(function(){}, {});
// `window` is not accessible in webworker (would lead to TypeError)
// @@ this cross-browser fuckery has to go away ASAP.
var reqAnimationFrame = typeof(window) != 'undefined' ?
                        window.requestAnimationFrame ||
                        window.webkitRequestAnimationFrame ||
                        window.mozRequestAnimationFrame ||
                        window.oRequestAnimationFrame ||
                        window.msRequestAnimationFrame ||
                        null : null;

var reqAniFrameRecursive = function() {
   perInterval();
   reqAnimationFrame(reqAniFrameRecursive);
};

/**
 * @ignore
 */
exports.init = function() {
   STARTTIME = Date.now();

   if (reqAnimationFrame) {
      reqAnimationFrame(reqAniFrameRecursive);
   } else {
      setInterval(perInterval, 10);
   }
   return;
};

var perInterval = function() {
   var msNow = Date.now();
   exports._CALLBACK.trigger(msNow - (TIMER_LASTCALL || msNow));
   TIMER_LASTCALL = msNow;
   return;
};

},{"./callback":18}],32:[function(require,module,exports){
var gamejs = require('../gamejs');
var objects = require('./utils/objects');
var xml = require('./xml');
var base64 = require('./utils/base64');
var uri = require('./utils/uri');

/**
 * @fileoverview
 * This is a loader for the general purpose tile map editor "Tiled".
 *
 * This module can load all ".tmx" files even if additionally base64 encoded
 * (can be configured in Tiled).
 *
 * This module loads the whole map definition, including the TileSets with
 * all necessary images. For an example on how to render a map loaded with
 * this module, see `examples/tiledmap`.
 *
 * You will typically create a Map instance with `Map(url)` and deal
 * with the layers, tilesets, etc. through the Map instance
 * instead of loading & creating them yourself.
 *
 * Only orthogonol maps are supported (no isometric maps).
 *
 * @see http://www.mapeditor.org/
 * @see https://github.com/bjorn/tiled/wiki/TMX-Map-Format
 */

/**
 * My code is inspired by:
 *   * https://bitbucket.org/maikg/tiled2cocos/
 *   * https://github.com/obiot/melonJS/
 *
 */

/**
 * A Tiled Map holds all layers defined in the tmx file as well
 * as the necessary tiles to render the map.
 * @param {String} url Relative or absolute URL to the tmx file
 */
var Map = exports.Map = function(url) {

   url = uri.resolve(document.location.href, url);
   var xmlDoc = xml.Document.fromURL(url);
   var mapNode = xmlDoc.element('map');

   /**
    * Width of a single tile in pixels
    * @type Number
    */
   this.tileWidth = mapNode.attribute('tilewidth');
   /**
    * Height of a single tile in pixels
    * @type Number
    */
   this.tileHeight = mapNode.attribute('tileheight');
   /**
    * Width of the map in tiles
    * @type Number
    */
   this.width = mapNode.attribute('width');
   /**
    * Height of the map in tiles
    * @type Number
    */
   this.height = mapNode.attribute('height');

   var orientation = mapNode.attribute('orientation');
   if (orientation !== 'orthogonal') {
      throw new Error('only orthogonol maps supported');
   }

   /**
    * Custom properties of the map
    */
   this.properties = {};
   setProperties(this.properties, mapNode);

   /**
    * All tiles of this map.
    * @type TileSets
    */
   this.tiles = new TileSets(mapNode, url);
   this.layers = loadLayers(mapNode);
   return this;
};

/**
 * A Tile. Can not be instantiated. Get a Tile by calling `getTile(gid)`
 * on a `TileSets` instance.
 */
var Tile = exports.Tile = function() {
   throw new Error('Can not be instantiated.');
   /**
    * @type {gamejs.Surface} this tile's Surface
    */
   this.surface = null;
   /**
    * @type {Object} custom properties attach for this tile
    */
   this.properties = null;
   return;
};

/**
 * A TileSets instance holds all tilesets of a map. This class
 * makes it easy to get the image for a certain tile ID. You usually
 * don't care about in which specific TileSet an image is so this
 * class holds them all and deals with the lookup.
 *
 * You don't usually create a `TileSets` instance yourself, instead
 * it is automatically created and attached to a `Map`.
 */
var TileSets = exports.TileSets = function(mapNode, mapUrl) {
   var tileSets = [];

   /**
    * Retrieve the image for a tile ID (gid).
    *
    * @param {Number} gid global tile id to retrieve
    * @returns {gamejs.Surface} the Surface for the gid
    */
   this.getSurface = function(gid) {
      var tile = this.getTile(gid);
      return tile && tile.surface || null;
   };

   /**
    * @param {Number} gid global tile id
    * @returns {Object} the custom properties of this tile
    */
   this.getProperties = function(gid) {
      var tile = this.getTile(gid);
      return tile && tile.properties || {};
   };

   /**
    * @param {Number} gid global tile id
    * @returns {Object} the Tile object for this gid
    */
   this.getTile = function(gid) {
      var tile = null;
      tileSets.some(function(tileSet, idx) {
         if (tileSet.firstGid <= gid) {
            tile = tileSet.tiles[gid - tileSet.firstGid];
            return true;
         }
         return false;
      }, this);
      return tile;
   };

   var loadTileSet = function(tileSetNode) {
      var tiles = [];
      var tileWidth = tileSetNode.attribute('tilewidth');
      var tileHeight = tileSetNode.attribute('tileheight');
      var spacing = tileSetNode.attribute('spacing') || 0;
      // broken in tiled?
      var margin = 0;

      var imageNode = tileSetNode.element('image');
      var imageAtlasFile = imageNode.attribute('source');
      var imageUrl = uri.makeRelative(uri.resolve(mapUrl, imageAtlasFile));
      var atlas = gamejs.image.load(imageUrl);
      // FIXME set transparency if imageNode.attribute('trans') is set

      var tileNodes = tileSetNode.elements('tile');
      var dims = atlas.getSize();
      var imgSize = new gamejs.Rect([0,0], [tileWidth, tileHeight]);
      var idx = 0;
      var y = 0;
      while (y + tileHeight <= dims[1]) {
         x = 0;
         while (x + tileWidth <= dims[0]) {
            var tileImage = new gamejs.Surface(tileWidth, tileHeight);
            var rect = new gamejs.Rect([x, y], [tileWidth, tileHeight]);
            tileImage.blit(atlas, imgSize, rect);
            var tileProperties = {};
            tileNodes.some(function(tileNode) {
               if (tileNode.attribute('id') === idx) {
                  setProperties(tileProperties, tileNode);
                  return true;
               }
            }, this);
            tiles.push({
               surface: tileImage,
               properties: tileProperties
            });
            x += tileWidth + spacing;
            idx++;
         }
         y += tileHeight + spacing;
      }
      return tiles;
   };

   /**
    *
    * constructor
    **/
   mapNode.elements('tileset').forEach(function(tileSetNode) {
      var firstGid = tileSetNode.attribute('firstgid');
      var externalSource = tileSetNode.attribute('source');
      if (externalSource) {
         var tileSetDocument = xml.Document.fromURL(uri.resolve(mapUrl, externalSource));
         tileSetNode = tileSetDocument.element('tileset');
      }
      tileSets.push({
         tiles: loadTileSet(tileSetNode),
         firstGid: firstGid
      });
   });
   tileSets.reverse();

   return this;
};

/**
 * loadLayers
 */
var H_FLIP = 0x80000000;
var V_FLIP = 0x40000000;
var loadLayers = function(mapNode) {
   var layers = [];

   var getGids = function(layerNode) {
      var dataNode = layerNode.element('data');
      var encoding = dataNode.attribute('encoding');
      var compression = dataNode.attribute('compression');
      var data = "";
      dataNode.children().forEach(function(textNode) {
         data += textNode.value();
      });
      var byteData = [];
      if (encoding === 'base64') {
         if (compression) {
            throw new Error('Compression of map data unsupported');
         }
         byteData = base64.decodeAsArray(data, 4);
      } else if (encoding === 'csv') {
         data.trim().split('\n').forEach(function(row) {
            row.split(',', width).forEach(function(entry) {
               byteData.push(parseInt(entry, 10));
            });
         });
      } else {
         // FIXME individual XML tile elements
         throw new Error('individual tile format not supported');
      }
      return byteData;
   };

   var width = mapNode.attribute('width');
   var height = mapNode.attribute('height');
   mapNode.elements('layer').forEach(function(layerNode) {
      // create empty gid matrix
      var gidMatrix = [];
      var i = height;
      while (i-->0) {
         var j = width;
         gidMatrix[i] = [];
         while (j-->0) {
            gidMatrix[i][j] = 0;
         }
      }

      getGids(layerNode).forEach(function(gid, idx) {
         // FIXME flipX/Y currently ignored
         var flipX = gid & H_FLIP;
         var flipY = gid & V_FLIP;
         // clear flags
         gid &= ~(H_FLIP | V_FLIP);
         gidMatrix[parseInt(idx / width, 10)][parseInt(idx % width, 10)] = gid;
      });
      layers.push({
         gids: gidMatrix,
         opacity: layerNode.attribute('opacity'),
         visible: layerNode.attribute('visible'),
         properties: setProperties({}, layerNode)
      });
   });
   return layers;
};

/**
 * set generic <properties><property name="" value="">... on given object
 */
var setProperties = function(object, node) {
   var props = node.element('properties');
   if (!props) {
      return;
   }
   props.elements('property').forEach(function(propertyNode) {
      var name = propertyNode.attribute('name');
      var value = propertyNode.attribute('value');
      object[name] = value;
   });
   return object;
};

},{"../gamejs":17,"./utils/base64":35,"./utils/objects":39,"./utils/uri":41,"./xml":44}],33:[function(require,module,exports){
var Surface = require('../gamejs').Surface;
var matrix = require('./utils/matrix');
var math = require('./utils/math');
var vectors = require('./utils/vectors');

/**
 * @fileoverview Rotate and scale Surfaces.
 */

/**
 * Returns a new surface which holds the original surface rotate by angle degrees.
 * Unless rotating by 90 degree increments, the image will be padded larger to hold the new size.
 * @param {Surface} surface
 * @param {angel} angle Clockwise angle by which to rotate
 * @returns {Surface} new, rotated surface
 */
exports.rotate = function (surface, angle) {
   var origSize = surface.getSize();
   var radians = (angle * Math.PI / 180);
   var newSize = origSize;
   // find new bounding box
   if (angle % 360 !== 0) {
      var rect = surface.getRect();
      var points = [
         [-rect.width/2, rect.height/2],
         [rect.width/2, rect.height/2],
         [-rect.width/2, -rect.height/2],
         [rect.width/2, -rect.height/2]
      ];
      var rotPoints = points.map(function(p) {
         return vectors.rotate(p, radians);
      });
      var xs = rotPoints.map(function(p) { return p[0]; });
      var ys = rotPoints.map(function(p) { return p[1]; });
      var left = Math.min.apply(Math, xs);
      var right = Math.max.apply(Math, xs);
      var bottom = Math.min.apply(Math, ys);
      var top = Math.max.apply(Math, ys);
      newSize = [right-left, top-bottom];
   }
   var newSurface = new Surface(newSize);
   var oldMatrix = surface._matrix;
   surface._matrix = matrix.translate(surface._matrix, origSize[0]/2, origSize[1]/2);
   surface._matrix = matrix.rotate(surface._matrix, radians);
   surface._matrix = matrix.translate(surface._matrix, -origSize[0]/2, -origSize[1]/2);
   var offset = [(newSize[0] - origSize[0]) / 2, (newSize[1] - origSize[1]) / 2];
   newSurface.blit(surface, offset);
   surface._matrix = oldMatrix;
   return newSurface;
};

/**
 * Returns a new surface holding the scaled surface.
 * @param {Surface} surface
 * @param {Array} dimensions new [width, height] of surface after scaling
 * @returns {Surface} new, scaled surface
 */
exports.scale = function(surface, dims) {
   var width = dims[0];
   var height = dims[1];
   if (width <= 0 || height <= 0) {
      throw new Error('[gamejs.transform.scale] Invalid arguments for height and width', [width, height]);
   }
   var oldDims = surface.getSize();
   var ws = width / oldDims[0];
   var hs = height / oldDims[1];
   var newSurface = new Surface([width, height]);
   var originalMatrix = surface._matrix.slice(0);
   surface._matrix = matrix.scale(surface._matrix, [ws, hs]);
   newSurface.blit(surface);
   surface._matrix = originalMatrix;
   return newSurface;
};

/**
 * Flip a Surface either vertically, horizontally or both. This returns
 * a new Surface (i.e: nondestructive).
 * @param {gamejs.Surface} surface
 * @param {Boolean} flipHorizontal
 * @param {Boolean} flipVertical
 * @returns {Surface} new, flipped surface
 */
exports.flip = function(surface, flipHorizontal, flipVertical) {
   var dims = surface.getSize();
   var newSurface = new Surface(dims);
   var scaleX = 1;
   var scaleY = 1;
   var xPos = 0;
   var yPos = 0;
   if (flipHorizontal === true) {
      scaleX = -1;
      xPos = -dims[0];
   }
   if (flipVertical === true) {
      scaleY = -1;
      yPos = -dims[1];
   }
   newSurface.context.save();
   newSurface.context.scale(scaleX, scaleY);
   newSurface.context.drawImage(surface.canvas, xPos, yPos);
   newSurface.context.restore();
   return newSurface;
};

},{"../gamejs":17,"./utils/math":37,"./utils/matrix":38,"./utils/vectors":42}],34:[function(require,module,exports){
/**
 * @fileoverview Utility functions for working with Obiects
 * @param {Object} item
 * @param {Array} array
 * @param {Object} returns removed item or null
 */

exports.remove = function(item, array) {
   var index = array.indexOf(item);
   if (index !== -1) {
      return array.splice(array.indexOf(item), 1);
   }
   return null;
};

/**
 * Shuffles the array *in place*.
 * @see http://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 */
exports.shuffle = function(array) {
    var len = array.length -1;
    for (i = len; i > 0; i--) {
        var idx = parseInt(Math.random() * (i + 1), 10);
        var item = array[i];
        array[i] = array[idx];
        array[idx] = item;
    }
    return array;
};

},{}],35:[function(require,module,exports){
/**
 * @fileoverview
 * Base64 encode / decode
 * @author http://www.webtoolkit.info
 */


var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

/**
 * Decodes a base64 encoded string to a string.
 */
var decode = exports.decode = function(input) {
   var output = [], chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
   input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

   while (i < input.length) {
      enc1 = keyStr.indexOf(input.charAt(i++));
      enc2 = keyStr.indexOf(input.charAt(i++));
      enc3 = keyStr.indexOf(input.charAt(i++));
      enc4 = keyStr.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output.push(String.fromCharCode(chr1));

      if (enc3 != 64) {
         output.push(String.fromCharCode(chr2));
      }
      if (enc4 != 64) {
         output.push(String.fromCharCode(chr3));
      }
   }

   output = output.join('');
   return output;
};

/**
 * Decodes a base64 encoded string into a byte array
 * @param {String} input
 * @param {Array} bytes bytes per character, defaults to 1
 */
exports.decodeAsArray = function(input, bytes) {
   bytes = bytes || 1;
   var decoded = decode(input);
   var len = decoded.length / bytes;
   var array = [];
   var i,j;
   for (i=0; i< len; i++) {
      array[i] = 0;
      for (j = bytes - 1; j >=0; --j) {
         array[i] += decoded.charCodeAt((i * bytes) + j) << (j <<3 );
      }
   }
   return array;
}
;
},{}],36:[function(require,module,exports){
/**
 * Binary Heap
 *
 * @see http://eloquentjavascript.net/appendix2.html
 */
var BinaryHeap = exports.BinaryHeap = function(scoreFunction){
   /**
    * @ignore
    */
   this.content = [];
   /**
    * @ignore
    */
   this.scoreFunction = scoreFunction;
   return this;
};

/**
 * Add element to heap.
 * @param {Object} element
 */
BinaryHeap.prototype.push = function(element) {
   this.content.push(element);
   this.sinkDown(this.content.length - 1);
   return;
};

/**
 * Return first element from heap.
 * @param {Object} element
 * @returns {Object} element
 */
BinaryHeap.prototype.pop = function() {
   // Store the first element so we can return it later.
   var result = this.content[0];
   // Get the element at the end of the array.
   var end = this.content.pop();
   // If there are any elements left, put the end element at the
   // start, and let it bubble up.
   if (this.content.length > 0) {
      this.content[0] = end;
      this.bubbleUp(0);
   }
   return result;
};

/**
 * Remove the given element from the heap.
 * @param {Object} element
 * @throws {Error} if node not found
 */
BinaryHeap.prototype.remove = function(node) {
   // To remove a value, we must search through the array to find
   // it.
   var isFound = this.content.some(function(cNode, idx) {
      if (cNode == node) {
         var end = this.content.pop();
         if (idx != this.content.length) {
            this.content[idx] = end;
            if (this.scoreFunction(end) < this.scoreFunction(node)) {
               this.sinkDown(idx);
            } else {
               this.bubbleUp(idx);
            }
         }
         return true;
      }
      return false;
   }, this);
   if (!isFound) {
      //throw new Error("Node not found.");
   }
   return;
};

/**
 * Number of elements in heap.
 */
BinaryHeap.prototype.size = function() {
   return this.content.length;
};

/**
 * @ignore
 */
BinaryHeap.prototype.sinkDown = function(idx) {
   // Fetch the element that has to be sunk
   var element = this.content[idx];
   // When at 0, an element can not sink any further.
   while (idx > 0) {
      // Compute the parent element's index, and fetch it.
      var parentIdx = Math.floor((idx + 1) / 2) - 1;
      var parent = this.content[parentIdx];
      // Swap the elements if the parent is greater.
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
         this.content[parentIdx] = element;
         this.content[idx] = parent;
         // Update 'n' to continue at the new position.
         idx = parentIdx;
      // Found a parent that is less, no need to sink any further.
      } else {
         break;
      }
   }
   return;
};

/**
 * @ignore
 */
BinaryHeap.prototype.bubbleUp = function(idx) {
   // Look up the target element and its score.
   var length = this.content.length;
   var element = this.content[idx];
   var elemScore = this.scoreFunction(element);

   while(true) {
      // Compute the indices of the child elements.
      var child2Idx = (idx + 1) * 2;
      var child1Idx= child2Idx - 1;
      // This is used to store the new position of the element,
      // if any.
      var swapIdx = null;
      // If the first child exists (is inside the array)...
      if (child1Idx < length) {
         // Look it up and compute its score.
         var child1 = this.content[child1Idx];
         var child1Score = this.scoreFunction(child1);
         // If the score is less than our element's, we need to swap.
         if (child1Score < elemScore) {
            swapIdx = child1Idx;
         }
      }
      // Do the same checks for the other child.
      if (child2Idx < length) {
         var child2 = this.content[child2Idx];
         var child2Score = this.scoreFunction(child2);
         if (child2Score < (swapIdx === null ? elemScore : child1Score)) {
            swapIdx = child2Idx;
         }
      }

      // If the element needs to be moved, swap it, and continue.
      if (swapIdx !== null) {
         this.content[idx] = this.content[swapIdx];
         this.content[swapIdx] = element;
         idx = swapIdx;
      // Otherwise, we are done.
      } else {
         break;
      }
   }
   return;
};

},{}],37:[function(require,module,exports){
/**
 *
 * absolute angle to relative angle, in degrees
 * @param {Number} absolute angle in degrees
 * @returns {Number} relative angle in degrees
 */
exports.normaliseDegrees=function(degrees){
    degrees=degrees % 360;
    if(degrees<0) {
        degrees+=360;
    }
    return degrees;
};

/**
 *
 * absolute angle to relative angle, in radians
 * @param {Number} absolute angle in radians
 * @returns {Number} relative angle in radians
 */
exports.normaliseRadians=function(radians){
    radians=radians % (2*Math.PI);
    if(radians<0) {
        radians+=(2*Math.PI);
    }
    return radians;
};

/**
 *
 * convert radians to degrees
 * @param {Number} radians
 * @returns {Number} degrees
 */
exports.degrees=function(radians) {
    return radians*(180/Math.PI);
};

/**
 *
 * convert degrees to radians
 * @param {Number} degrees
 * @returns {Number} radians
 */
exports.radians=function(degrees) {
    return degrees*(Math.PI/180);
};

/**
 * @returns the center of multipled 2d points
 * @param {Array} first point
 * @param {Array} second point
 * @param {Array} ...
 */
exports.centroid = function() {
   var args = Array.prototype.slice.apply(arguments, [0]);
   var c = [0,0];
   args.forEach(function(p) {
      c[0] += parseInt(p[0], 10);
      c[1] += parseInt(p[1], 10);
   });
   var len = args.length;
   return [
      c[0] / len,
      c[1] / len
   ];
};

},{}],38:[function(require,module,exports){
/**
 * @fileoverview Matrix manipulation, used by GameJs itself. You
 * probably do not need this unless you manipulate a Context's transformation
 * matrix yourself.
 */

// correct way to do scale, rotate, translate
// *  gamejs.utils.matrix will be used in gamejs.transforms, modifing the surfaces.matrix
// * this matrix must be applied to the context in Surface.draw()

/**
 * @returns {Array} [1, 0, 0, 1, 0, 0]
 */
var identiy = exports.identity = function () {
   return [1, 0, 0, 1, 0, 0];
};

/**
 * @param {Array} matrix
 * @param {Array} matrix
 * @returns {Array} matrix sum
 */
var add = exports.add = function(m1, m2) {
   return [
      m1[0] + m2[0],
      m1[1] + m2[1],
      m1[2] + m2[2],
      m1[3] + m2[3],
      m1[4] + m2[4],
      m1[5] + m2[5],
      m1[6] + m2[6]
   ];
};

/**
 * @param {Array} matrix A
 * @param {Array} matrix B
 * @returns {Array} matrix product
 */
var multiply = exports.multiply = function(m1, m2) {
   return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
   ];
};

/**
 * @param {Array} matrix
 * @param {Number} dx
 * @param {Number} dy
 * @returns {Array} translated matrix
 */
var translate = exports.translate = function(m1, dx, dy) {
   return multiply(m1, [1, 0, 0, 1, dx, dy]);
};

/**
 * @param {Array} matrix
 * @param {Number} angle in radians
 * @returns {Array} rotated matrix
 */
var rotate = exports.rotate = function(m1, angle) {
   // radians
   var sin = Math.sin(angle);
   var cos = Math.cos(angle);
   return multiply(m1, [cos, sin, -sin, cos, 0, 0]);
};

/**
 * @param {Array} matrix
 * @returns {Number} rotation in radians
 */
var rotation = exports.rotation = function(m1) {
      return Math.atan2(m1[1], m1[0]);
};

/**
 * @param {Array} matrix
 * @param {Array} vector [a, b]
 * @returns {Array} scaled matrix
 */
var scale = exports.scale = function(m1, svec) {
   var sx = svec[0];
   var sy = svec[1];
   return multiply(m1, [sx, 0, 0, sy, 0, 0]);
};

},{}],39:[function(require,module,exports){
/**
 * @fileoverview Utility functions for working with Objects
 */

/**
 * Put a prototype into the prototype chain of another prototype.
 * @param {Object} subClass
 * @param {Object} superClass
 */
exports.extend = function(subClass, superClass) {
   if (subClass === undefined) {
      throw new Error('unknown subClass');
   }
   if (superClass === undefined) {
      throw new Error('unknown superClass');
   }
   // new Function() is evil
   var f = new Function();
   f.prototype = superClass.prototype;

   subClass.prototype = new f();
   subClass.prototype.constructor = subClass;
   subClass.superClass = superClass.prototype;
   subClass.superConstructor = superClass;
   return;
};

/**
 * Creates a new object as the as the keywise union of the provided objects.
 * Whenever a key exists in a later object that already existed in an earlier
 * object, the according value of the earlier object takes precedence.
 * @param {Object} obj... The objects to merge
 */
exports.merge = function() {
   var result = {};
   var i, property;
      for (i = arguments.length; i > 0; --i) {
         var obj = arguments[i - 1];
         for (property in obj) {
            result[property] = obj[property];
         }
      }
   return result;
};

/**
 * fallback for Object.keys
 * @param {Object} obj
 * @returns {Array} list of own properties
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
 */
var keys = exports.keys = function(obj) {
   if (Object.keys) {
      return Object.keys(obj);
   }

   var ret=[],p;
   for (p in obj) {
      if(Object.prototype.hasOwnProperty.call(obj, p)) {
         ret.push(p);
      }
   }
   return ret;
};

/**
 * Create object accessors
 * @param {Object} object The object on which to define the property
 * @param {String} name name of the property
 * @param {Function} get
 * @param {Function} set
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/defineProperty
 */
var accessor = exports.accessor = function(object, name, get, set) {
   // ECMA5
   if (Object.defineProperty !== undefined) {
      Object.defineProperty(object, name, {
         get: get,
         set: set
      });
   // non-standard
   } else if (Object.prototype.__defineGetter__ !== undefined) {
      object.__defineGetter__(name, get);
      if (set) {
         object.__defineSetter__(name, set);
      }
   }
	return;
};

/**
 * @param {Object} object The object on which to define or modify properties.
 * @param {Object} props An object whose own enumerable properties constitute descriptors for the properties to be defined or modified.
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/defineProperties
 */
exports.accessors = function(object, props) {
   keys(props).forEach(function(propKey) {
      accessor(object, propKey, props[propKey].get, props[propKey].set);
   });
   return;
};

},{}],40:[function(require,module,exports){
/**
 * @fileoverview A seedable random-number generator.
 *
 * A generator is initialized by GameJs and can be used with the
 * static functions (choose, integer, vector,...).
 *
 * You can re-initialize this generator with a different seed by
 * calling `gamejs.utils.prng.init(seed)` after which the static
 * functions in this module will use the new seed.
 *
 * @usage
 *  var prng = require('gamejs/utils/prng');
 *  prng.random(); // 0.6765871671959758
 *  prng.integer(2, 10); // 5
 *  prng.choose([1,2,3,4,5]); // 3
 */
// From http://baagoe.com/en/RandomMusings/javascript/
// Johannes Baagøe <baagoe@baagoe.com>, 2010
// API modified by Simon Oberhammer <simon@nekapuzer.at>, 2012
// discussion of the used algorithms <http://baagoe.org/en/w/index.php/Better_random_numbers_for_javascript>


/* @ignore */
var Mash = function Mash() {
  var n = 0xefc8249d;
  this.hash = function(data) {
    data = data.toString();
    var i;
    for (i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      var h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };

  this.version = 'Mash 0.9';
  return this;
};

/**
 * A seedable pseudo-random number generator.
 * @param {Number|String} seed the seed for generating the numbers
 *
 * @usage
 *  var prng = require('gamejs/utils/prng');
 *  var seed = 'gamejs';
 *  var alea = new prng.Alea(seed);
 *  alea.random(); // 0.6765871671959758
 *  alea.random(); // 0.15881546027958393
 *
 *  // generator with the same seed will generate the same sequence
 *  // of numbers:
 *  var aleaTwo = new prng.Alea(seed);
 *  aleaTwo.random(); // 0.6765871671959758
 *  aleaTwo.random(); // 0.15881546027958393
 */
var Alea = exports.Alea = function Alea() {
   var args = Array.prototype.slice.call(arguments);
   var s0 = 0;
   var s1 = 0;
   var s2 = 0;
   var c = 1;
   if (args.length == 0 || !args[0]) {
     args = [Date.now()];
   }
   var mash = new Mash();
   s0 = mash.hash(' ');
   s1 = mash.hash(' ');
   s2 = mash.hash(' ');

   var i;
   for (i = 0; i < args.length; i++) {
     s0 -= mash.hash(args[i]);
     if (s0 < 0) {
       s0 += 1;
     }
     s1 -= mash.hash(args[i]);
     if (s1 < 0) {
       s1 += 1;
     }
     s2 -= mash.hash(args[i]);
     if (s2 < 0) {
       s2 += 1;
     }
   }
   mash = null;

   /**
    * @returns {Number} the next random number as determined by the seed
    */
   this.random = function() {
     var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
     s0 = s1;
     s1 = s2;
     s2 = t - (c = t | 0);
     return s2;
   };
   return this;
};

// alea instance per gamejs instance
var alea = null;

/**
 * @param {Number} min
 * @param {Number} max
 * @returns {Number} random integer between min and max
 */
var integer = exports.integer = function(min, max){
    return min + parseInt(alea.random() * (max-min+1), 10);
};

/**
 * @param {Array} minVector 2 integers, the minimum vector
 * @param {Array} maxVector 2 integers, the maximum vector
 * @returns {Array} a random vector [min[0]<=x<=max[0], min[1]<=y<=max[1]]
 */
exports.vector = function(min, max){
    return [integer(min[0], max[0]), integer(min[1], max[1])];
};

/**
 * @param {Array} items
 * @returns {Object} random item from items list
 */
exports.choose = function(items){
    return items[integer(0, items.length-1)];
};

/**
 * @returns {Number} next random float between 0 and 1
 */
exports.random = function() {
  return alea.random();
};

/*
 * Re-initialize the per instance random number generator used
 * in the static functions on this module (e.g. vector())
 * @param {Number|String} seed
 */
exports.init = function(seed) {
  alea = new Alea(seed);
};
},{}],41:[function(require,module,exports){
/**
 * @fileoverview Utilies for URI handling.
 *
 */

var URI_REGEX = new RegExp(
    '^' +
    '(?:' +
      '([^:/?#.]+)' +                     // scheme - ignore special characters
                                          // used by other URL parts such as :,
                                          // ?, /, #, and .
    ':)?' +
    '(?://' +
      '(?:([^/?#]*)@)?' +                 // userInfo
      '([\\w\\d\\-\\u0100-\\uffff.%]*)' + // domain - restrict to letters,
                                          // digits, dashes, dots, percent
                                          // escapes, and unicode characters.
      '(?::([0-9]+))?' +                  // port
    ')?' +
    '([^?#]+)?' +                         // path
    '(?:\\?([^#]*))?' +                   // query
    '(?:#(.*))?' +                        // fragment
    '$');

/**
 * Resolve path against URI.
 *
 * @param {String} uri
 * @param {String} path to resolve
 */
var resolve = exports.resolve = function(uri, path) {
   var m = match(uri);
   var n = match(path);
   var host = m[1] + '://' + m[3];
   if (n[1]) {
      return path;
   }
   if (m[4]) {
      host = host + ":" + m[4];
   }
   var absolutePath = m[5];
   if (path.charAt(0) !== '/') {
      var lastSlashIndex = absolutePath.lastIndexOf('/');
      absolutePath = absolutePath.substr(0, lastSlashIndex + 1) + path;
   } else {
      absolutePath = path;
   }
   return host + removeDotSegments(absolutePath);

};

/**
 * Try to match an URI against a regex returning the following
 * capture groups:
 *     $1 = http              scheme
 *     $2 = <undefined>       userInfo -\
 *     $3 = www.ics.uci.edu   domain     | authority
 *     $4 = <undefined>       port     -/
 *     $5 = /pub/ietf/uri/    path
 *     $6 = <undefined>       query without ?
 *     $7 = Related           fragment without #
 *
 * @param {String} uri
 */
var match = exports.match = function(uri) {
   return uri.match(URI_REGEX);
};

/**
 * Make an absolute URI relative to document.location.href
 * @param {String} uri
 * @returns The relative URI or the unchanged URI if it's not
 * possible to make it relative to the path of document.location.href.
 */
var makeRelative = exports.makeRelative = function(uri) {
   var docLocPath = resolve(document.location.href, './');
   if (uri.indexOf(docLocPath) == 0) {
      uri = './' + uri.substring(docLocPath.length);
   }
   return uri;
};

/**
 * Removes dot segments in given path component
 */
var removeDotSegments = function(path) {
   if (path == '..' || path == '.') {
      return '';
   }
   var leadingSlash = path.indexOf('/') > -1;

   var segments = path.split('/');
   var out = [];

   var pos;
   for (pos = 0; pos < segments.length; ) {
      var segment = segments[pos++];

      if (segment == '.') {
         if (leadingSlash && pos == segments.length) {
            out.push('');
         }
      } else if (segment == '..') {
         if (out.length > 1 || out.length == 1 && out[0] != '') {
            out.pop();
         }
         if (leadingSlash && pos == segments.length) {
            out.push('');
         }
      } else {
         out.push(segment);
         leadingSlash = true;
      }
   }
   return out.join('/');
};

},{}],42:[function(require,module,exports){
var math=require('./math');

/**
 * @param {Array} origin point [b0, b1]
 * @param {Array} target point [b0, b1]
 * @returns {Number} distance between two points
 */
exports.distance = function(a, b) {
   return len(subtract(a, b));
};

/**
 * subtracts vectors [a0, a1] - [a0, a1]
 * @param {Array} a
 * @param {Array} b
 * @returns {Array} vector
 */
var subtract = exports.subtract = function(a, b) {
   return [a[0] - b[0], a[1] - b[1]];
};

/**
 * adds vectors [a0, a1] - [a0, a1]
 * @param {Array} a vector
 * @param {Array} b vector
 * @returns {Array} vector
 */
var add = exports.add = function(a, b) {
   return [a[0] + b[0], a[1] + b[1]];
};

/**
 * multiply vector with scalar or other vector
 * @param {Array} vector [v0, v1]
 * @param {Number|Array} vector or number
 * @returns {Number|Array} result
 */
var multiply = exports.multiply = function(a, s) {
   if (typeof s === 'number') {
      return [a[0] * s, a[1] * s];
   }

   return [a[0] * s[0], a[1] * s[1]];
};

/**
 * @param {Array} a vector
 * @param {Number} s
 */
exports.divide = function(a, s) {
   if (typeof s === 'number') {
      return [a[0] / s, a[1] / s];
   }
   throw new Error('only divide by scalar supported');
};

/**
 * @param {Array} vector [v0, v1]
 * @returns {Number} length of vector
 */
var len = exports.len = function(v) {
   return Math.sqrt(v[0]*v[0] + v[1]*v[1]);
};

/**
 *
 * normalize vector to unit vector
 * @param {Array} vector [v0, v1]
 * @returns {Array} unit vector [v0, v1]
 */
var unit = exports.unit = function(v) {
   var l = len(v);
   if(l) {
      return [v[0] / l, v[1] / l];
   }
   return [0, 0];
};

/**
 *
 * rotate vector
 * @param {Array} vector [v0, v1]
 * @param {Number} angle to rotate vector by, radians. can be negative
 * @returns {Array} rotated vector [v0, v1]
 */
exports.rotate=function(v, angle){
   angle=math.normaliseRadians(angle);
   return [v[0]* Math.cos(angle)-v[1]*Math.sin(angle),
           v[0]* Math.sin(angle)+v[1]*Math.cos(angle)];

};

/**
 *
 * calculate vector dot product
 * @param {Array} vector [v0, v1]
 * @param {Array} vector [v0, v1]
 * @returns {Number} dot product of v1 and v2
 */
var dot = exports.dot=function(v1, v2){
   return (v1[0] * v2[0]) + (v1[1] * v2[1]);
};

/**
 *
 * calculate angle between vectors
 * @param {Array} vector [v0, v1]
 * @param {Array} vector [v0, v1]
 * @returns {Number} angle between v1 and v2 in radians
 */
exports.angle=function(v1, v2){
   var perpDot = v1[0] * v2[1] - v1[1] * v2[0];
   return Math.atan2(perpDot, dot(v1,v2));
};

/**
 * @returns {Array} vector with max length as specified.
 */
exports.truncate = function(v, maxLength) {
   if (len(v) > maxLength) {
      return multiply(unit(v), maxLength);
   }
   return v;
};

},{"./math":37}],43:[function(require,module,exports){
var gamejs = require('../gamejs');
var uri = require('./utils/uri');
var Callback = require('./callback').Callback;

/** ignore **/
var _EVENTS = exports._EVENTS = {
   RESULT: 1001,
   ALIVE: 1002,
   LOG: 1004
};

/**
 * @fileoverview
 * Workers are useful to relieve your GameJs application from code which
 * might take long to run. Either expensive algorithms, which might get called
 * every now and then (e.g., path-finding) or another logic being run continously
 * within the rendering loop (e.g., physics engine).
 *
 * A Worker is like a seperate GameJs application being executed - another `main.js`
 * with its own `gamejs.ready()`. The Worker's most important feature is that
 * code executing within it does not block the rendering code. The Worker's
 * greatest limitation is that you can only communicate with it through text
 * messages.
 *
 * See the `examples/workers` directory for a running example.
 *
 * @example
 *  // Create a worker with the main module "./test"
 *  var fooWorker = new Worker('./test');
 *  // Send a message to your worker.
 *  // The Message doesn't have to be a string but it must be `JSON.stringify()`-able
 *  fooWorker.post("foobar");
 *
 *  fooWorker.onEvent(function(event) {
 *      if(event.data.timestamp > ...)
 *  });
 *
 *  // within the worker: you can send
 *  // send results back to the main application
 *  // by posting them:s
 *  gamejs.worker.post({
 *     name: "zarzar",
 *     timestamp: 12232435234
 *  });
 *
 */

/**
 * true if this GameJs instance is being executed within a WebWorker
 * @type Boolean
 */
var inWorker = exports.inWorker = (this.importScripts !== undefined);

/**
 * executed in scope of worker
 * @ignore
 */
exports._ready = function() {
   self.onmessage = function(event) {
      gamejs.event._triggerCallback(event.data);
   };
   self.postMessage({
     type: _EVENTS.ALIVE
   });
};

/**
 * Send an event back to the main script.
 * @param {Object} data to be sent back to main script
 */
exports.post = function(data) {
  if (inWorker) {
    self.postMessage({
       type: _EVENTS.RESULT,
       data: data
    });
  } else {
    throw new Error('gamejs.postMessage only available in a gamejs/worker module');
  }
};

/**
 * Send message to main context for logging
 * @ignore
 **/
exports._logMessage = function() {
   self.postMessage({
      type: _EVENTS.LOG,
      arguments: Array.prototype.slice.apply(arguments)
   });
};


/**
  * executed in scope of worker before user's main module
  * @ignore
  */
var workerPrefix = function workerPrefix() {
   __scripts.forEach(function(script) {
      try {
         importScripts(script);
      } catch (e) {
         // can't help the worker
      }
   });
};

/**
 * Setup a worker which has `require()` defined
 * @ignore
 **/
var create = function(workerModuleId) {
   var moduleRoot = uri.resolve(document.location.href, window.require.getModuleRoot());
   var initialScripts = [];
   Array.prototype.slice.apply(document.getElementsByTagName('script'), [0]).forEach(function(script) {
      if (script.src) {
         initialScripts.push(script.src);
      }
   });

   var URL = window.URL || window.webkitURL;
   var prefixString = workerPrefix.toString();
   // don't be afraid...
   prefixString = prefixString.substring(prefixString.indexOf("{") + 1, prefixString.lastIndexOf("}"));
   var blob = new Blob([
      'var __scripts = ["' + initialScripts.join('","') + '"];',
      prefixString,
      ';self.require.setModuleRoot("' + moduleRoot + '");',
      'self.require.run("'+ workerModuleId +'");'
   ], {type: 'application\/javascript'});

   var blobURL = URL.createObjectURL(blob);
   return new Worker(blobURL);
};

/**
 * The `Worker` constructor takes only one argument: a module id. This module
 * will be executed inside the newly created Worker. It is effectively the
 * main module of the Worker.
 *
 * Inside a Worker, you can use `require()` to import other scripts or
 * GameJs modules.
 *
 * **Note:** A Worker does not have access to the browser's `document`. So
 * a lot of GameJs modules - everything related to drawing to the canvas -
 * do not work in the Worker.
 *
 * You can use `gamejs.time.*`, `gamejs.utils.*`, `gamejs.event.*` and probably others
 * (as well as any module you write yourself for this purpose, of course).
 *
 * @param {String} moduleId The Worker's main module id. The main module will be executed in the worker
 */
exports.Worker = function(moduleId) {
   // FIXME id should be unchangeable
   /**
    * Unique id of this worker
    * @property {Number}
    */
   var id = this.id = guid(moduleId);
   var worker = create(moduleId);
   var deadQueue = [];
   var alive = false;
   var self  = this;
   var _CALLBACK = new Callback(function() {}, {});
   var _ERROR_CALLBACK = new Callback(function() {}, {});

   worker.onmessage = function(event) {
      if (event.data.type === _EVENTS.ALIVE) {
         // if worker says he is alive -> send him the event queue so far
         alive = true;
         deadQueue.forEach(function(data) {
            self.post(data);
         });
      } else if (event.data.type === _EVENTS.LOG) {
         gamejs.log.apply(null, [id].concat(event.data.arguments));
      } else {
         _CALLBACK.trigger(event.data.data);
      }
   };
   worker.onerror = function(event) {
      gamejs.error('Error in worker "' + id + '" line ' + event.lineno + ': ', event.message);
      _ERROR_CALLBACK.trigger({
         data: event.data,
         worker: self,
         event: event
      });
   };

   /**
    *
    */
   this.onEvent = function(fn, scope) {
      _CALLBACK = new Callback(fn, scope);
   };

   this.onError = function(fn, scope) {
      _ERROR_CALLBACK = new Callback(fn, scope);
   };

   /**
    * Send a message to the worker
    *
    * @param {Object} data Payload object which gets sent to the Worker
    */
   this.post = function(data) {
      if (alive) {
         worker.postMessage(data);
      } else {
         deadQueue.push(data);
      }
   };
   return this;
};

/**
 * not a real GUID
 * @ignore
 */
function guid(moduleId) {
   var S4 = function() {
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
   };
   return moduleId + '@' + (S4()+S4());
}
},{"../gamejs":17,"./callback":18,"./utils/uri":41}],44:[function(require,module,exports){
/**
 * @fileoverview
 *
 * Provides facilities for parsing an xml String.
 * 
 * You will typically get a `gamejs.xml.Document` instance
 * by loading the data with one of the two static 
 * `Document.fromString(string)` or `Document.fromUrl(url)`.

 * Querying for `elements(name)` or `children()` will return a
 * new `gamejs.xml.Document` matching your result (or null).
 *
 * Use `attributes(name)` and `value()` to get the data stored
 * in the XML Document.
 */

/**
 * XMLParser
 */
var Parser = exports.Parser = function() {

   var xmlDoc = null;
   var parser = new DOMParser();
   
   this.parseFromString = function(xmlString) {
      xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      return xmlDoc;
   };
   
   return this;
};

/**
 * Instantiate with the static functions `Document.fromString()` and `fromURL()`.
 */
var Document = exports.Document = function(xmlDocument) {   
   if (!xmlDocument || (!xmlDocument instanceof XMLDocument) ) {
      throw new Error('Need a valid xmlDocument.');
   }
   /** @ignore **/
   this._xmlDocument = xmlDocument;
   return this;
};

/**
 * Returns the first element in the current document whose tag-name matches
 * the given 'name'.
 * @returns gamejs.xml.Document
 */
Document.prototype.element = function(name) {
   var elem = this._xmlDocument.getElementsByTagName(name)[0];
   return elem && new Document(elem) || null;
};

/**
 * Returns all elements in the current document whose tag-name matches
 * the given 'name'.
 * @returns an Array of gamejs.xml.Document
 */
Document.prototype.elements = function(name) {
   var elems = this._xmlDocument.getElementsByTagName(name);
   return Array.prototype.slice.apply(elems, [0]).map(function(elem) {
      return new Document(elem);
   });
};

/**
 * Returns the attribute value of this document.
 *
 * @returns String
 */
Document.prototype.attribute = function(name) {
   var attributeValue = this._xmlDocument.getAttribute(name);
   attributeValue = attributeValue ? attributeValue.trim() : null;
   if (attributeValue === null) {
      return null;
   }
   if (attributeValue.toLowerCase() === 'true') {
      return true;
   }
   if (attributeValue.toLowerCase() === 'false') {
      return false;
   }
   var attributeIntValue = parseInt(attributeValue, 10);
   var attributeFloatValue = parseFloat(attributeValue, 10);
   if (!isNaN(attributeIntValue)) {
      if (attributeFloatValue !== attributeIntValue) {
         return attributeFloatValue;
      }
      return attributeIntValue;
   }
   return attributeValue;
};

/**
 * Returns the nodevalue of the current xml document
 * @returns String
 */
Document.prototype.value = function() {
   return this._xmlDocument.nodeValue;
};

/**
 * Returns all children of this xml document
 * @returns Array of gamejs.xml.Document
 */
Document.prototype.children = function() {
   return Array.prototype.slice.apply(this._xmlDocument.childNodes, [0]).map(function(cNode) {
      return new Document(cNode);
   });
};

/**
 * @returns gamejs.xml.Document
 */
Document.fromString = function(xmlString) {
   var parser = new DOMParser();
   var xmlDoc = parser.parseFromString(xmlString, 'text/xml');
   return new Document(xmlDoc);
};

/**
 * @returns gamejs.xml.Document
 */
Document.fromURL = function(url) {
   var response = new XMLHttpRequest();
   response.open('GET', url, false);
   response.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
   response.setRequestHeader('Content-Type', 'text/xml');
   response.overrideMimeType('text/xml');
   response.send();
   return new Document(response.responseXML);
};

},{}],45:[function(require,module,exports){
/**
 * slice
 */

var slice = Array.prototype.slice;

/**
 * Primary export
 */

var exports = module.exports = super_;

/**
 * ### _super (dest, orig)
 *
 * Inherits the prototype methods or merges objects.
 * This is the primary export and it is recommended
 * that it be imported as `inherits` in node to match
 * the auto imported browser interface.
 *
 *     var inherits = require('super');
 *
 * @param {Object|Function} destination object
 * @param {Object|Function} source object
 * @name _super
 * @api public
 */

function super_() {
  var args = slice.call(arguments);
  if (!args.length) return;
  if (typeof args[0] !== 'function') return exports.merge(args);
  exports.inherits.apply(null, args);
};

/**
 * ### extend (proto[, klass])
 *
 * Provide `.extend` mechanism to allow extenion without
 * needing to use dependancy.
 *
 *     function Bar () {
 *       this._konstructed = true;
 *     }
 *
 *     Bar.extend = inherits.extend;
 *
 *     var Fu = Bar.extend({
 *       initialize: function () {
 *         this._initialized = true;
 *       }
 *     });
 *
 *     var fu = new Fu();
 *     fu.should.be.instanceof(Fu); // true
 *     fu.should.be.instanceof(Bar); // true
 *
 * @param {Object} properties/methods to add to new prototype
 * @param {Object} properties/methods to add to new class
 * @returns {Object} new constructor
 * @name extend
 * @api public
 */

exports.extend = function(proto, klass) {
  var self = this
    , child = function () { return self.apply(this, arguments); };
  exports.merge([ child, this ]);
  exports.inherits(child, this);
  if (proto) exports.merge([ child.prototype, proto ]);
  if (klass) exports.merge([ child, klass ]);
  child.extend = this.extend; // prevent overwrite
  return child;
};

/**
 * ### inherits (ctor, superCtor)
 *
 * Inherit the prototype methods from on contructor
 * to another.
 *
 * @param {Function} destination
 * @param {Function} source
 * @api private
 */

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  if (Object.create) {
    ctor.prototype = Object.create(superCtor.prototype,
      { constructor: {
            value: ctor
          , enumerable: false
          , writable: true
          , configurable: true
        }
    });
  } else {
    ctor.prototype = new superCtor();
    ctor.prototype.constructor = ctor;
  }
}

/**
 * Extends multiple objects.
 *
 * @param {Array} array of objects
 * @api private
 */

exports.merge = function (arr) {
  var main = arr.length === 2 ? arr.shift() : {};
  var obj = null;

  for (var i = 0, len = arr.length; i < len; i++) {
    obj = arr[i];
    for (var p in obj) {
      if (!obj.hasOwnProperty(p)) continue;
      main[p] = obj[p];
    }
  }

  return main;
};

},{}],46:[function(require,module,exports){
//     Underscore.js 1.5.2
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.5.2';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? void 0 : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array, using the modern version of the 
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from an array.
  // If **n** is not specified, returns a single random element from the array.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (arguments.length < 2 || guard) {
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, value, context) {
      var result = {};
      var iterator = value == null ? _.identity : lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) {
      return array[array.length - 1];
    } else {
      return slice.call(array, Math.max(array.length - n, 0));
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
    return function() {
      context = this;
      args = arguments;
      timestamp = new Date();
      var later = function() {
        var last = (new Date()) - timestamp;
        if (last < wait) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

},{}]},{},[2])