var gamejs = require('gamejs');
var objects = require('gamejs/utils/objects');
var config = require('./project/config');
var Animation = require('/animate').Animation;

var Element = exports.Element = function(options) {
	Element.superConstructor.apply(this, arguments);
	this.image = options.image || null;
	if (options.animation){
		this.animation = new Animation(options.spriteSheet, options.animation, 12) || null;
	}
	this.size = options.size || [10,10];
	this.spriteSheet = options.spriteSheet || null;
	this.margin = options.margin || 0;
	this.active = options.active || true;
	if (this.spriteSheet) {
		this.size[0] = this.spriteSheet.width;
		this.size[1] = this.spriteSheet.height;
	}
	if (typeof options.pos == "object") {
		this.pos = options.pos || [0,0];
	} else if (typeof options.pos == "string") {
		this.pos = [];
		if (options.pos.match('bottom')) {
			this.pos[1] = config.HEIGHT - this.size[1] - this.margin;
		}
		if (options.pos.match('top')) {
			this.pos[1] = this.margin;
		}
		if (options.pos.match('left')) {
			this.pos[0] = this.margin;
		}
		if (options.pos.match('right')) {
			this.pos[0] = config.WIDTH - this.size[0] - this.margin;
		}
		if (options.pos.match('center')) {
			this.pos[0] = (config.WIDTH / 2) - (this.size[0] / 2);
		}
		if (options.pos.match('middle')) {
			this.pos[1] = (config.HEIGHT / 2) - (this.size[1] / 2);
		}
	}
	this.rect = new gamejs.Rect(this.pos, this.size);
	
	if (this.animation) {
		this.animation.start('static');
	}
		
	return this;
};
objects.extend(Element, gamejs.sprite.Sprite);

Element.prototype.update = function(msDuration) {
	if (this.animation) {
		this.animation.update(msDuration);
		this.image = this.animation.image;
		this.image._context.webkitImageSmoothingEnabled = false;
	}
	return;
};

Element.prototype.start = function() {
	this.active = true;
	return;
};

Element.prototype.hide = function() {
	this.active = false;
};

var font = new gamejs.font.Font('8px Ebit');

var TextArea = exports.TextArea = function(options) {
	TextArea.superConstructor.apply(this, arguments);
	
	this.background = options.background || '#000000';
	this.color = options.color || '#FFFFFF';
	this.text = options.text || null;
	this.scrolling = options.scrolling || false;
	this.scrollSpeed = options.scrollSpeed || 3;
	if (this.scrolling) {
		this.currentText = " ";
	} else {
		this.currentText = this.text;
	}
	this.textSurface = new gamejs.Surface(this.rect);
	this.currentChar = 1;
	this.counter = 0;
	
	return this;
};
objects.extend(TextArea, Element);

TextArea.prototype.update = function(msDuration) {
	if (this.scrolling) {
		this.counter++;
		if (this.counter >= 12 / this.scrollSpeed) {
			this.currentChar++;
			this.counter = 0;
		}
		this.currentText = this.text.substring(0, this.currentChar);
	}
	return;
};

TextArea.prototype.draw = function(display) {
	this.textSurface.fill(this.background);
	this.textSurface.setAlpha(0.35);
	this.textSurface._context.webkitImageSmoothingEnabled = false;
	display.blit(this.textSurface, this.pos);
	this.fontSurface = font.render(this.currentText, this.color);
	this.fontSurface._context.webkitImageSmoothingEnabled = false;
	display.blit(this.fontSurface, this.pos);
	return;
};

TextArea.prototype.start = function(text) {
	this.currentText = " ";
	this.text = text;
};