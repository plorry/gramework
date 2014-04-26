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

    //this.image._context.imageSmoothingEnabled = false;
    this.surfaceCache = [];

    var imgSize = new gamejs.Rect([0,0],[this.width,this.height]);

    // Extract the cells from the spritesheet image.
    for (var i = 0; i < this.image.rect.height; i += this.height) {
        for (var j = 0; j < this.image.rect.width; j += this.width) {
            var surface = new gamejs.Surface([this.width, this.height]);
            var rect = new gamejs.Rect(j, i, this.width, this.height);
            //surface._context.imageSmoothingEnabled = false;
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

Animation.prototype.setFrame = function(frame) {
    this.frameIndex = frame;
};

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
