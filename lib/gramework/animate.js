var gamejs = require('gamejs'),
    _ = require('underscore');

var imgfy = exports.imgfy = function(path) {
    return gamejs.image.load(path);
};

/*
 * Prepare a usable image for for a Sprite
 */
var SpriteSheet = exports.SpriteSheet = function(image, w, h) {
    this.width = w;
    this.height = h;

    this.image = imgfy(image);
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
    return this;
};

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

    this.loopFinished = false;

    this.image = spriteSheet.get(0);
    this.start(initial);

    return this;
};

Animation.prototype.start = function(animation) {
    this.loopFinished = false;
    this.currentAnimation = animation;
    this.currentFrame = this.spec[animation].frames[0];
    this.currentFrameDuration = 0;
    this.frameDuration = 1000 / this.spec[animation].rate;
    this.update(0);
    return;
};

Animation.prototype.update = function(msDuration) {
    if (!this.currentAnimation) {
        throw new Error('No animation started.');
    }

    this.currentFrameDuration += msDuration;
    if (this.currentFrameDuration >= this.frameDuration){
        this.currentFrame++;
        this.currentFrameDuration = 0;

        var length = this.spec[this.currentAnimation].frames.length - 1;
        if (this.currentFrame > length) {
            this.currentFrame = 0;
        }
    }

    this.image = this.spriteSheet.get(this.currentFrame);
    return this.image;
};
