var gamejs = require('gamejs');
var config = require('./project/config');
var draw = require('gamejs/draw');
var objects = require('gamejs/utils/objects');
var Animation = require('/animate').Animation;
var palettes = require('./palettes').palettes;

var GRAVITY = 9.8;

var Object = exports.Object = function(pos, spriteSheet, animation) {
    this.pos = pos || [0,0];
	this.spriteSheet = spriteSheet || null;
	if (spriteSheet) {
		this.width = spriteSheet.width;
		this.height = spriteSheet.height;
	} else {
		this.width = 15;
		this.height = 15;
	}
	this.rect = new gamejs.Rect(pos, [this.width, this.height]);
	this.realRect = new gamejs.Rect(this.rect);
	
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
    
	if (animation) {
		this.animation = new Animation(spriteSheet, animation, 20);
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
	return;
};

Object.prototype.arcTo = function(dest) {
	return;
};

Object.prototype.draw = function(display) {
	this.image._context.webkitImageSmoothingEnabled = false;
	
	if (this.spriteSheet) {	
		gamejs.sprite.Sprite.prototype.draw.apply(this, arguments);
	} else {
		draw.rect(display, "#000FFF", new gamejs.Rect(this.pos, [5,5]));
	}
	
	if (config.DEBUG) {
		draw.rect(display, "#000FFF", this.rect, 3);
	}
	
	return;
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

var FourDirection = exports.FourDirection = function(pos, spriteSheet, animation, playerControlled, controlMapping, walkSpeed) {
	FourDirection.superConstructor.apply(this, arguments);
	this._groups = [];
	this.playerControlled = playerControlled || false;
	this.controlMapping = controlMapping || defaultMapping;
	this.walkSpeed = walkSpeed || 2;
	this.xMultiplier = 1;
	this.yMultiplier = 1;
	this.dest = null;
	this.choiceCounter = 0;
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

FourDirection.prototype.lookAt = function(obj) {
	this.lookingAt = obj;
	return;
};

FourDirection.prototype.update = function(msDuration) {
	Object.prototype.update.apply(this, arguments);
	
	//AI for NPCs
	if (!this.playerControlled) {
		this.choiceCounter++;
		
		
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
	}
	if (this.movingLeft) {
		this.movingRight = false;
		this.x_speed = -this.walkSpeed * this.xMultiplier;
	}
	if (this.movingUp) {
		this.movingDown = false;
		this.y_speed = -this.walkSpeed * this.yMultiplier;
	}
	if (this.movingDown) {
		this.movingUp = false;
		this.y_speed = this.walkSpeed * this.yMultiplier;
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
	
	if (this.choiceCounter == 200) {
		xPos = Math.floor((Math.random() * 100) + 1);
		yPos = Math.floor((Math.random() * 100) + 1);
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