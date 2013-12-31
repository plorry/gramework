var gamejs = require('gamejs');
var Sprite = gamejs.sprite.Sprite;
var draw = gamejs.draw;
var objects = gamejs.utils.objects;
var SpriteSheet = require('./animate').SpriteSheet;
var Animation = require('./animate').Animation;

var Actor = exports.Actor = function(options) {
	Actor.superConstructor.apply(this, arguments);
	this.init(options);
    return this;
};
objects.extend(Actor, Sprite);

Actor.prototype.init = function(options) {
	this.scale = options.scale || 1;
	this.x = options.x || 0;
	this.y = options.y || 0;
	this.height = options.height || 5;
	this.width = options.width || 5;
	this.angle = options.angle * (Math.PI / 180) || 0;
	this.density = options.density || 2;
	this.startingAnimation = options.startingAnimation || 'static';
    this.speed = 1000;

	this.rect = new gamejs.Rect(
		[(this.x - this.width / 2) * this.scale, (this.y - this.height / 2) * this.scale],
		[this.width * this.scale, this.height * this.scale]);
	this.realRect = new gamejs.Rect(this.rect);
	this.collisionRect = new gamejs.Rect(
		[(this.x - this.width / 2) * this.scale, (this.y - this.height / 2) * this.scale],
		[options.collisionRect.width * this.scale, options.collisionRect.height * this.scale]);	
	if (options.spriteSheet) {
        this.spriteSheet = new SpriteSheet(options.spriteSheet[0], options.spriteSheet[1]) || null;
        var animations = options.animations;
        this.animation = new Animation(this.spriteSheet, animations);
        this.animation.start(this.startingAnimation);
    }

	return;
};

Actor.prototype.update = function(msDuration) {
	
	if (this.animation) {
		this.animation.update(msDuration);
		this.image = this.animation.image;
	}

	return;
};

Actor.prototype.handleEvent = function(event) {
	return;
};

Actor.prototype.draw = function(display) {
	//cq(this.image._canvas).matchPalette(palettes.simple);
	
	gamejs.draw.rect(display, '#000', this.collisionRect, 1);

	return;
};
