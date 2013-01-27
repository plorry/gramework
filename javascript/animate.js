var gamejs = require('gamejs');

var Animation = exports.Animation = function(spriteSheet, animationSpec) {
    this.fps = animationSpec.fps || 6;
    this.frameDuration = 1000 / this.fps;
    this.spec = animationSpec;

    this.currentFrame = null;
    this.currentFrameDuration = 0;
    this.currentAnimation = null;

    this.spriteSheet = spriteSheet;

    this.loopFinished = false;

    this.image = spriteSheet.get(0);
    return this;
};

Animation.prototype.start = function(animation) {
	this.loopFinished = false;
    this.currentAnimation = animation;
    this.currentFrame = this.spec[animation][0];
    this.currentFrameDuration = 0;
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

        var aniSpec = this.spec[this.currentAnimation];
        if (aniSpec.length == 1 || this.currentFrame > aniSpec[1]) {
            this.loopFinished = true;
            
            if (aniSpec.length === 3 && aniSpec[2] === false) {
                this.currentFrame--;
            } else {
                this.currentFrame = aniSpec[0];
            }
        }
    }

    this.image = this.spriteSheet.get(this.currentFrame);
    return;
};

var SpriteSheet = exports.SpriteSheet = function(imagePath, sheetSpec) {
   this.get = function(id) {
      return surfaceCache[id];
   };

   this.width = sheetSpec.width;
   this.height = sheetSpec.height;
   var image = gamejs.image.load(imagePath);
   var surfaceCache = [];
   var imgSize = new gamejs.Rect([0,0],[this.width,this.height]);
   // extract the single images from big spritesheet image
	for (var i=0; i<image.rect.height; i+=this.height) {
		for (var j=0;j<image.rect.width;j+=this.width) {
			var surface = new gamejs.Surface([this.width, this.height]);
			var rect = new gamejs.Rect(j, i, this.width, this.height);
			surface.blit(image, imgSize, rect);
			surfaceCache.push(surface);
		}
	}
   return this;
};
