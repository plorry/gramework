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

var Player = function(options) {
    Entity.apply(this, arguments);

    this.world = options.world;
    this.sprite = new animate.SpriteSheet('./assets/runner.png', 32, 64);
    this.anim = new animate.Animation(this.sprite, "running", {
        running: {frames: [0, 1, 2, 3, 4, 6, 7], rate: 5.5},
        jump: {frames: [1, 0, 1, 4], rate: 2.5}
    });

    this.controller = GameController({
        jump: gamejs.event.K_SPACE
    });

    this.onGround = false;
    this.isJumping = false;
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
                console.log("World collides with player.");
            }
        } else if (dx < 0) {
        }

        if (dy > 0) {
            start = this.rect.y;
            this.rect.y += dy;
            if (this.world.collides(this)) {
                this.rect.y = Math.floor(this.rect.y);
                while (this.world.collides(this)) {
                    console.log("Playing colliding on Y");
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
        this.anim.update(dt);
        this.image = this.anim.update(dt);

        // Adjust dt for vectors.
        dt = (dt / 1000);

        if (this.onGround && this.isJumping) {
            this.velocity.setY(-15);
        } else {
            var vec = new Vec2d().add(this.world.gravity);
            this.velocity.add(vec.mul(dt));
        }

        this.rect.x += this.velocity.x;
        this.rect.y += this.velocity.y;

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
                gamejs.log("onGround");
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

    event: function(ev) {
        var key = this.controller.handle(ev);
        if (key === this.controller.controls.jump) {
            this.isJumping = true;
        }

    }
});

var World = function(options) {
    Scene.apply(this, arguments);

    this.game = options.game;
    this.player = new Player({
        x: 0, y: 135,
        width: 32, height: 45,
        world: this
    });
    this.actors.add(this.player);
    this.accel = 5;
    this.speed = 5;
    this.maxSpeed = 55;
    this.gravity = new Vec2d(0, 50);

    this.layers = [
        new Scrollable('./assets/background.png', [1, 0], {speed: 1}),
        new Scrollable('./assets/bgnear2.png', [-100, 0], {speed: 55}),
        new Scrollable('./assets/bgnear2.png', [660, 0], {speed: 55}),
    ];
    this.velocity = new Vec2d(0, 0);
};
_.extend(World.prototype, Scene.prototype, {
    update: function(dt) {
        Scene.prototype.update.call(this, dt);
        dt = (dt / 1000);

        var accel = new Vec2d(this.accel, 0);
        this.velocity.add(accel.mul(dt).mul(this.speed));
        this.velocity = this.velocity.truncate(this.maxSpeed);

        // Send the velocity magnitude to our layers, adjusting their speed
        // based on our velocity
        this.layers.forEach(function(layer) {
            layer.speed = (layer.originalSpeed * (this.velocity.magnitude() / (4 * this.speed)));
        }, this);
        return;
    },

    collides: function(entity) {
        // Check if the entity is colliding with other entities, or the world
        // itself.
        if (entity.rect.y >= (this.height() - entity.rect.height)) {
            return true;
        }
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
    './assets/runner.png',
    './assets/background.png',
    './assets/bgnear2.png'
]);
gamejs.ready(main);
