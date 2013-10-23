var gamejs = require('gamejs');
var Sprite = gamejs.sprite.Sprite;
var draw = gamejs.draw;
var objects = gamejs.utils.objects;
var SpriteSheet = require('./animate').SpriteSheet;
var Animation = require('./animate').Animation;

var Body = require('./physics').Body;

var Actor = exports.Actor = function(options) {
	Actor.superConstructor.apply(this, arguments);
	this.init(options);
    return this;
};
objects.extend(Actor, Sprite);

Actor.prototype.init = function(options) {
	this.scale = options.scale || 10;
	this.x = options.x || 0;
	this.y = options.y || 0;
	this.height = options.height || 5;
	this.width = options.width || 5;
	this.angle = options.angle * (Math.PI / 180) || 0;
	this.density = options.density || 2;

	this.physics = options.physics || null;

	this.startingAnimation = options.startingAnimation || 'static';

	this.rect = new gamejs.Rect(
		[(this.x - this.width / 2) * this.scale, (this.y - this.height / 2) * this.scale],
		[this.width * this.scale, this.height * this.scale]);
	this.realRect = new gamejs.Rect(this.rect);
	//this.collisionRect = new gamejs.Rect([this.rect.left+1, this.rect.top+1],[this.rect.width-2, this.rect.height-2]);
	
	if (options.spriteSheet) {
        this.spriteSheet = new SpriteSheet(options.spriteSheet[0], options.spriteSheet[1]) || null;
        var animations = options.animations;
        this.animation = new Animation(this.spriteSheet, animations);
        this.animation.start(this.startingAnimation);
    }
    
    if (this.physics) {
        this.body = new Body(this.physics, {
            type: options.type || 'dynamic',
            x: this.x,
            y: this.y,
            height: options.height,
            width: options.width,
            angle: this.angle,
            density: this.density,
            fixedRotation: options.fixedRotation || false
        });
    }

	return;
};

Actor.prototype.update = function(msDuration) {
	
	if (this.physics) {
		this.realRect.center = [this.body.body.GetPosition().x * this.scale, this.body.body.GetPosition().y * this.scale];
		this.rect.height = (Math.abs(this.height * Math.sin(this.body.body.GetAngle()) * this.scale) + Math.abs(this.width * Math.cos(this.body.body.GetAngle()) * this.scale));
		this.rect.width = (Math.abs(this.height * Math.cos(this.body.body.GetAngle()) * this.scale) + Math.abs(this.width * Math.sin(this.body.body.GetAngle()) * this.scale));
		
		this.rect.top = (Math.round(this.realRect.top) + 0.5 - (this.rect.height) / 2) + (this.height * this.scale);
		this.rect.left = (Math.round(this.realRect.left) + 0.5 - (this.rect.width) / 2) + (this.width * this.scale);
	}

	if (this.animation) {
		this.animation.update(msDuration);
		this.image = this.animation.image;
	}

	//this.body.body.
	return;
};

Actor.prototype.handleEvent = function(event) {
	return;
};

Actor.prototype.draw = function(display) {
	//cq(this.image._canvas).matchPalette(palettes.simple);
	
	if (this.spriteSheet) {
		if (this.image) {
			gamejs.sprite.Sprite.prototype.draw.apply(this, arguments);
		}
	} else {
		//draw.rect(display, "#000FFF", new gamejs.Rect(this.pos, [5,5]));
	}
	return;
};
