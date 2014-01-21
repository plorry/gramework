var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('../../../gramework'),
    animate = gramework.animate,
    imgfy = gramework.image.imgfy,
    Background = gramework.layers.Background,
    Dispatcher = gramework.Dispatcher,
    Entity = gramework.Entity,
    Scene = gramework.Scene,
    Vec2d = gramework.vectors.Vec2d;

var Player = function(options) {
    Entity.apply(this, arguments);

    this.world = options.world;
    this.sprite = new animate.SpriteSheet('./assets/player.png', 32, 45);
    this.anim = new animate.Animation(this.sprite, "static", {
        static: {frames: [0, 1, 2, 3, 4], rate: 1.5}
    });
};
_.extend(Player.prototype, Entity.prototype, {
    update: function(dt) {
        this.anim.update(dt);
        this.image = this.anim.update(dt);
    }
});

var World = function(options) {
    Scene.apply(this, arguments);

    this.game = options.game;
    this.speed = 10;
    this.player = new Player({
        x: 0, y: 235,
        width: 32, height: 45,
        world: this
    });
    this.actors.add(this.player);
    this.accel = 5;
    this.speed = 5;
    this.maxSpeed = 55;

    this.layers = [
        new Background('./assets/bgfar1.png', [1, 0], {speed: 1}),
        new Background('./assets/bgnear2.png', [-100, 0], {speed: 55}),
        new Background('./assets/bgnear2.png', [660, 0], {speed: 55}),
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
    './assets/player.png',
    './assets/bgfar1.png',
    './assets/bgnear2.png'
]);
gamejs.ready(main);
