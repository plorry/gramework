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
    jump: -13,
    speed: 5,
    maxSpeed: 55
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
    this.maxSpeed = -4;

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
    gamejs.log("New CoinEmitter");
    this.alive = true;
    this.count = _.random(5, 15);
    this.world = options.world;

    this.currentDuration = 0;
    this.duration = this.randomDuration();

    this.endDelay = _.random(5, 8);

};
CoinEmitter.prototype = {
    randomDuration: function() {
        return 1.0 + (0.0-1.0)*Math.random();
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
                this.velocity.setY(GLOBALS.jump);
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
        gamejs.log("Score is", this.world.score);
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
            this.world.totalCoins = 0;
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

    // Total amount of coins in this world before we are done.
    this.maxCoins = 15;
    this.totalCoins = 0;

    this.layers = [
        new Scrollable('./assets/background.png', [1, 0], {speed: 1}),
        new Scrollable('./assets/foreground.png', [-100, 145], {speed: 55}),
        new Scrollable('./assets/foreground.png', [660, 145], {speed: 55}),
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
        this.velocity = this.velocity.truncate(GLOBALS.maxSpeed);

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

        if (this.totalCoins >= this.maxCoins) {
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
    './assets/coin.png',
    './assets/runner.png',
    './assets/background.png',
    './assets/foreground.png',
]);
gamejs.ready(main);
