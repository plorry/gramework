var gamejs = require('gamejs');
var config = require('./project/config');
var draw = require('gamejs/draw');
var objects = require('gamejs/utils/objects');
var SpriteSheet = require('./animate').SpriteSheet;
var Animation = require('/animate').Animation;
var palettes = require('./palettes').palettes;

var GRAVITY = 9.8;

var Object = exports.Object = function(pos, options) {
	
	this._groups = [];
	this.pos = pos || [0,0];
	this.spriteSheet = new SpriteSheet(options.spriteSheet[0], options.spriteSheet[1]) || null;
	if (this.spriteSheet) {
		this.width = this.spriteSheet.width;
		this.height = this.spriteSheet.height;
	} else {
		this.width = 15;
		this.height = 15;
	}
	this.rect = new gamejs.Rect(this.pos, [this.width, this.height]);
	this.realRect = new gamejs.Rect(this.rect);
	this.collisionRect = new gamejs.Rect([this.rect.left+1, this.rect.top+1],[this.rect.width-2, this.rect.height-2]);
	
	this.scene = null;
	
	this.lookingRight = false;
	this.lookingAt = null;
	
	this.movingRight = false;
	this.movingLeft = false;
	this.movingUp = false;
	this.movingDown = false;
	
    this.x_speed = 0;
    this.y_speed = 0;
    this.x_accel = 0;
    this.y_accel = 0;
    this.y_max = 10;
    this.bounce = 0.8;
	
	this.count = 0;
    
	if (options.animation) {
		this.animation = new Animation(this.spriteSheet, options.animation, 20);
		this.animation.start('static');
	}
	
    this.behaviours = [];
    
    this.is_falling = false;
     
    this.assign = function(behaviour) {
        //Assign a behaviour object to this object
        this.behaviours.push(behaviour);
    };
    return this;
};
objects.extend(Object, gamejs.sprite.Sprite);

Object.prototype.setScene = function(scene) {
	this.scene = scene;
};

Object.prototype.update = function(msDuration) {
	this.x_accel = 0;
    this.y_accel = 0;

    for (var i = 0; i < this.behaviours.length; i++) {
        this.behaviours[i].update(this);
    }
    
    this.y_speed += this.y_accel;    
    this.x_speed += this.x_accel;
	
	this.realRect.moveIp(this.x_speed, this.y_speed);
	this.rect.top = Math.round(this.realRect.top);
	this.rect.left = Math.round(this.realRect.left);
    
    if (this.y_speed <= 0) {
        this.is_falling = false;
    } else {
        this.is_falling = true;
    }
	
	if (this.animation) {
		this.animation.update(msDuration);
		this.image = this.animation.image;
	}
	
	if (this.image) {
		if (this.lookingAt) {
			if (this.lookingAt.rect.center[0] > this.rect.center[0]) {
				this.lookingRight = true;
			} else {
				this.lookingRight = false;
			}
			this.targetDistance = Math.sqrt(
				Math.pow(this.rect.center[0] - this.lookingAt.rect.center[0], 2)
				+ Math.pow(this.rect.center[1] - this.lookingAt.rect.center[1], 2)
			);
		}
		if (this.lookingRight) {
			this.image = gamejs.transform.flip(this.image, true, false);
		}
	}
	
	this.collisionRect = new gamejs.Rect([this.rect.left+2, this.rect.top+2],[this.rect.width-4, this.rect.height-4]);
	return;
};

Object.prototype.arcTo = function(dest) {
	return;
};

Object.prototype.draw = function(display) {
	if (this.image) this.image._context.webkitImageSmoothingEnabled = false;
	//cq(this.image._canvas).matchPalette(palettes.simple);
	
	if (this.spriteSheet) {	
		gamejs.sprite.Sprite.prototype.draw.apply(this, arguments);
	} else {
		draw.rect(display, "#000FFF", new gamejs.Rect(this.pos, [5,5]));
	}
	
	if (config.DEBUG) {
		draw.rect(display, "#000FFF", this.collisionRect, 3);
	}
	
	return;
};

Object.prototype.die = function() {
	var index = this.scene.objects_list.remove(this);
	var index = this.scene.npc_list.remove(this);
};

var defaultMapping = {
	'LEFT': gamejs.event.K_LEFT,
	'RIGHT': gamejs.event.K_RIGHT,
	'UP': gamejs.event.K_UP,
	'DOWN': gamejs.event.K_DOWN,
	'BUTTON1': gamejs.event.K_CTRL,
	'BUTTON2': gamejs.event.K_SHIFT
};

/*
FOUR-DIRECTION OBJECT
An object, player-controlled or NPC, moving on a 2-dimensional plane
*/

var FourDirection = exports.FourDirection = function(pos, options) {
	FourDirection.superConstructor.apply(this, arguments);
	this._groups = [];
	this.playerControlled = options.playerControlled || false;
	this.controlMapping = options.controlMapping || defaultMapping;
	this.walkSpeed = options.walkSpeed || 2;
	this.xMultiplier = 1;
	this.yMultiplier = 1;
	this.dest = null;
	this.choiceCounter = 0;
	this.boundaryRect = null;
};
objects.extend(FourDirection, Object);

FourDirection.prototype.stop = function() {
	this.x_speed = 0;
	this.y_speed = 0;
	this.movingLeft = false;
	this.movingRight = false;
	this.movingUp = false;
	this.movingDown = false;
	this.dest = null;
	return;
};

FourDirection.prototype.setBoundary = function(rect) {
	this.boundaryRect = rect;
	return;
};

FourDirection.prototype.clearBoundary = function() {
	this.boundaryRect = null;
	return;
};

FourDirection.prototype.lookAt = function(obj) {
	this.lookingAt = obj;
	return;
};

FourDirection.prototype.update = function(msDuration) {
	Object.prototype.update.apply(this, arguments);
	
	//AI for NPCs
	if (!this.playerControlled) {
		this.choiceCounter += msDuration;		
	}
	
	//Get to the destination
	if (this.dest){
		if (this.realRect.center[0] < this.dest[0]) {
			this.movingLeft = false;
			this.movingRight = true;
		}
		if (this.realRect.center[0] > this.dest[0]) {
			this.movingRight = false;
			this.movingLeft = true;
		}
		if (this.realRect.center[1] > this.dest[1]) {
			this.movingDown = false;
			this.movingUp = true;
		}
		if (this.realRect.center[1] < this.dest[1]) {
			this.movingUp = false;
			this.movingDown = true;
		}
		var xClose = (this.realRect.center[0] > this.dest[0] - this.walkSpeed
			&& this.realRect.center[0] < this.dest[0] + this.walkSpeed);
		var yClose = (this.realRect.center[1] > this.dest[1] - this.walkSpeed
			&& this.realRect.center[1] < this.dest[1] + this.walkSpeed);
		if (xClose) {
			this.movingRight = false;
			this.movingLeft = false;
			this.xSpeed = 0;
		}
		if (yClose) {
			this.movingUp = false;
			this.movingDown = false;
			this.ySpeed = 0;
		}
		if (xClose && yClose) {
			this.stop();
		}
	}
	
	if (this.movingRight) {
		this.movingLeft = false;
		this.x_speed = this.walkSpeed * this.xMultiplier;
		if (this.boundaryRect && this.rect.right >= this.boundaryRect.right) {
			this.x_speed = 0;
		}
	}
	if (this.movingLeft) {
		this.movingRight = false;
		this.x_speed = -this.walkSpeed * this.xMultiplier;
		if (this.boundaryRect && this.rect.left <= this.boundaryRect.left) {
			this.x_speed = 0;
		}
	}
	if (this.movingUp) {
		this.movingDown = false;
		this.y_speed = -this.walkSpeed * this.yMultiplier;
		if (this.boundaryRect && this.rect.top <= this.boundaryRect.top) {
			this.y_speed = 0;
		}
	}
	if (this.movingDown) {
		this.movingUp = false;
		this.y_speed = this.walkSpeed * this.yMultiplier;
		if (this.boundaryRect && this.rect.bottom >= this.boundaryRect.bottom) {
			this.y_speed = 0;
		}
	}
	if (!this.movingRight && !this.movingLeft) {
		this.x_speed = 0;
	}
	if (!this.movingUp && !this.movingDown) {
		this.y_speed = 0;
	}
	
	if (this.animation.spec['walking']){
		if ((this.movingUp || this.movingDown || this.movingRight || this.movingLeft) && this.animation.currentAnimation == 'static') {
			this.animation.start('walking');
		}
	}
	
	if (!this.movingUp && !this.movingDown && !this.movingLeft && !this.movingRight) {
		this.animation.start('static');
	}
	
	if (this.choiceCounter >= 200) {
		xPos = Math.floor((Math.random() * this.scene.camera.rect.width) + 1) + this.scene.camera.rect.left;
		yPos = Math.floor((Math.random() * this.scene.camera.rect.height) + 1) + this.scene.camera.rect.top;
		this.goTo([xPos, yPos]);
		this.choiceCounter = 0;
	}
};

FourDirection.prototype.goTo = function(pos) {
	this.dest = pos;
};

FourDirection.prototype.action1 = function() {
	return;
};

FourDirection.prototype.action2 = function() {
	return;
};

FourDirection.prototype.lift1 = function() {
	return;
};

FourDirection.prototype.lift2 = function() {
	return;
};

FourDirection.prototype.handleEvent = function(event) {
	if (event.type === gamejs.event.KEY_DOWN) {
		switch (event.key) {
			case this.controlMapping.LEFT:
				this.movingLeft = true;
				this.lookingRight = false;
				this.movingRight = false;
				this.yMultiplier = 0.707;
				break;
				
			case this.controlMapping.RIGHT:
				this.movingRight = true;
				this.lookingRight = true;
				this.movingLeft = false;
				this.yMultiplier = 0.707;
				break;
				
			case this.controlMapping.UP:
				this.movingUp = true;
				this.movingDown = false;
				this.xMultiplier = 0.707;
				break;
				
			case this.controlMapping.DOWN:
				this.movingDown = true;
				this.movingUp = false;
				this.xMultiplier = 0.707;
				break;
				
			case this.controlMapping.BUTTON1:
				this.action1();
				break;
			
			case this.controlMapping.BUTTON2:
				this.action2();
				break;
		}
	} else if (event.type === gamejs.event.KEY_UP) {
		switch (event.key) {
			case this.controlMapping.LEFT:
				this.movingLeft = false;
				this.yMultiplier = 1;
				break;
				
			case this.controlMapping.RIGHT:
				this.movingRight = false;
				this.yMultiplier = 1;
				break;
				
			case this.controlMapping.UP:
				this.movingUp = false;
				this.xMultiplier = 1;
				break;
				
			case this.controlMapping.DOWN:
				this.movingDown = false;
				this.xMultiplier = 1;
				break;
			
			case this.controlMapping.BUTTON1:
				this.lift1();
				break;
				
			case this.controlMapping.BUTTON2:
				this.lift2();
				break;
		}
	}
};
