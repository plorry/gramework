var gamejs = require('gamejs');
var Sprite = require('gamejs/sprite').Sprite;
var config = require('./project/config');
var draw = require('gamejs/draw');
var objects = require('gamejs/utils/objects');
var SpriteSheet = require('./animate').SpriteSheet;
var Animation = require('/animate').Animation;
var palettes = require('./palettes').palettes;

var GRAVITY = 9.8;

var Object = exports.Object = function(pos, options) {
	Object.superConstructor.apply(this, arguments);
    this.pos = pos || [0,0];
	this.spriteSheet = new SpriteSheet(options.spriteSheet[0], options.spriteSheet[1]) || null;
	this.dest = null;
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
	
	this._inControl = true;
	this.isArcing = false;
	
	this.count = 0;
    
	if (options.animation) {
		this.animation = new Animation(this.spriteSheet, options.animation);
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
objects.extend(Object, Sprite);

Object.prototype.setScene = function(scene) {
	this.scene = scene;
};

Object.prototype.ignoreControl = function() {
	this._inControl = false;
	return;
};

Object.prototype.restoreControl = function() {
	this._inControl = true;
	return;
};

Object.prototype.update = function(msDuration) {
	this.x_accel = 0;
    this.y_accel = 0;
	
	if (this.isArcing) {
		this.y_accel = 0.2;
	}
	
    for (var i = 0; i < this.behaviours.length; i++) {
        this.behaviours[i].update(this);
    }
    
    this.y_speed += this.y_accel;    
    this.x_speed += this.x_accel;
	
	this.realRect.moveIp(this.x_speed * 50 * (msDuration/1000), this.y_speed * 50 * (msDuration/1000));
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
	
	this.collisionRect.top = this.rect.top + 2;
	this.collisionRect.left = this.rect.left + 2;
	return;
};

Object.prototype.arcTo = function(dest) {
	this.isArcing = true;
	this.y_speed = -3;
	this.x_speed = 1;
	
	return;
};

Object.prototype.inControl = function() {
	return this._inControl;
};

Object.prototype.draw = function(display) {
	//cq(this.image._canvas).matchPalette(palettes.simple);
	
	if (this.spriteSheet) {
		if (this.image) {
			gamejs.sprite.Sprite.prototype.draw.apply(this, arguments);
		};
	} else {
		draw.rect(display, "#000FFF", new gamejs.Rect(this.pos, [5,5]));
	}
	
	if (config.DEBUG) {
		var color = "#000FFF";
		if (!this._inControl) {
			var color = "#555000";
		}
		draw.rect(display, color, this.collisionRect, 3);
	}
	
	return;
};

Object.prototype.die = function() {
	this.scene.objects_list.remove(this);
	this.scene.npc_list.remove(this);
};

var defaultMapping = {
	'LEFT': gamejs.event.K_LEFT,
	'RIGHT': gamejs.event.K_RIGHT,
	'UP': gamejs.event.K_UP,
	'DOWN': gamejs.event.K_DOWN,
	'BUTTON1': gamejs.event.K_p,
	'BUTTON2': gamejs.event.K_l
};

/*
FOUR-DIRECTION OBJECT
An object, player-controlled or NPC, moving on a 2-dimensional plane
*/

var Throwaway = exports.Throwaway = function(pos, options, parent) {
	Throwaway.superConstructor.apply(this, arguments);
	this.lifespan = options.lifespan || null;
	this.parent = parent || null;
	this.life = 0;
};
objects.extend(Throwaway, Object);

Throwaway.prototype.update = function(msDuration) {
	Object.prototype.update.apply(this, arguments);
	this.life += msDuration;
	
	if (this.parent) {
		this.rect.topleft = this.parent.hotspot;
	}
	
	if (this.lifespan == null) {
		if (this.animation.loopFinished) {
			this.kill();
		}
	} else {
		if (this.life >= this.lifespan) {
			this.kill();
		}
	}
	
	return;
};

Throwaway.prototype.draw = function(display) {
	if (this.image) {
		Object.prototype.draw.apply(this, arguments);
	}
	return;
};

var FourDirection = exports.FourDirection = function(pos, options) {
	FourDirection.superConstructor.apply(this, arguments);
	this.playerControlled = options.playerControlled || false;
	this.controlMapping = options.controlMapping || defaultMapping;
	this.walkSpeed = options.walkSpeed || 1;
	this.xMultiplier = 1;
	this.yMultiplier = 1;
	this.guns = [];
	this.choiceCounter = 0;
	this.boundaryRect = null;
	this.maxHealth = options.maxHealth || 3;
	this.hotspot = null;
	this.holding = null;
	
	if (this.playerControlled) {
		this.guns = [10];
	}
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
	this.animation.start(this.static_anim);
	return;
};

Object.prototype.setBoundary = function(rect) {
	this.boundaryRect = rect;
	return;
};

FourDirection.prototype.clearBoundary = function() {
	this.boundaryRect = null;
	return;
};

Object.prototype.lookAt = function(obj) {
	this.lookingAt = obj;
	return;
};

FourDirection.prototype.moveLeft = function() {
	this.movingLeft = true;
	this.movingRight = false;
};

FourDirection.prototype.moveRight = function() {
	this.movingLeft = false;
	this.movingRight = true;
};

FourDirection.prototype.moveUp = function() {
	this.movingUp = true;
	this.movingDown = false;
};

FourDirection.prototype.moveDown = function() {
	this.movingUp = false;
	this.movingDown = true;
};

FourDirection.prototype.update = function(msDuration) {
	
	if (!this.playerControlled) {
		this.guns = [];
	}
	
	if (this.guns.length > 2) {
		var over = this.guns.length - 2;
		this.guns.splice(2, over);
	}
	
	this.walking_anim = 'walking';
	this.static_anim = 'static';
	if (this.guns.length > 0) {
		this.walking_anim += this.guns.length;
		this.static_anim += this.guns.length;
	}
	
	var topleft = this.rect.topleft;
	if (this.lookingRight) {
		this.hotspot = [topleft[0] + 14, topleft[1] + 5];
	} else {
		this.hotspot = [topleft[0] - 8, topleft[1] + 5];
	}
	
	//AI for NPCs
	if (!this.playerControlled) {
		this.choiceCounter += msDuration;
		
		if (!this.lookingAt && this.animation.currentAnimation != 'dying') {
			this.lookingAt = this.scene.player_objects.sprites()[0];
		}
	}
	
	//Get to the destination
	if (this.dest){
		if (this.realRect.center[0] < this.dest[0]) {
			this.moveRight();
			if (this.x_speed < 0) {
				this.movingRight = false;
			}
		}
		if (this.realRect.center[0] > this.dest[0]) {
			this.moveLeft();
			if (this.x_speed > 0) {
				this.movingLeft = false;
			}
		}
		if (this.realRect.center[1] > this.dest[1]) {
			this.moveUp();
			if (this.y_speed > 0) {
				this.movingUp = false;
			}
		}
		if (this.realRect.center[1] < this.dest[1]) {
			this.moveDown();
			if (this.y_speed > 0) {
				this.movingDown = false;
			}
		}
		
		var arrive = (this.rect.collidePoint(this.dest));

		if (arrive) {
			this.stop();
			this.restoreControl();
		}
	}
	
	if (this._inControl) {
		if (this.movingRight) {
			this.movingLeft = false;
			this.x_speed = this.walkSpeed * this.xMultiplier;
			if (this.boundaryRect && this.rect.right >= this.boundaryRect.right) {
				this.x_speed = 0;
			}
			if (this.animation.currentAnimation != this.walking_anim) {
				this.animation.start(this.walking_anim);
			}
		}
		if (this.movingLeft) {
			this.movingRight = false;
			this.x_speed = -this.walkSpeed * this.xMultiplier;
			if (this.boundaryRect && this.rect.left <= this.boundaryRect.left) {
				this.x_speed = 0;
			}
			if (this.animation.currentAnimation != this.walking_anim) {
				this.animation.start(this.walking_anim);
			}
		}
		if (this.movingUp) {
			this.movingDown = false;
			this.y_speed = -this.walkSpeed * this.yMultiplier;
			if (this.boundaryRect && this.rect.top <= this.boundaryRect.top) {
				this.y_speed = 0;
			}
			if (this.animation.currentAnimation != this.walking_anim) {
				this.animation.start(this.walking_anim);
			}
		}
		if (this.movingDown) {
			this.movingUp = false;
			this.y_speed = this.walkSpeed * this.yMultiplier;
			if (this.boundaryRect && this.rect.bottom >= this.boundaryRect.bottom) {
				this.y_speed = 0;
			}
			if (this.animation.currentAnimation != this.walking_anim) {
				this.animation.start(this.walking_anim);
			}
		}
	}
	if (!this.movingRight && !this.movingLeft) {
		this.x_speed = 0;
	}
	if (!this.movingUp && !this.movingDown) {
		this.y_speed = 0;
	}
	
	if (this.animation.spec[this.walking_anim]){
		if ((this.movingUp || this.movingDown || this.movingRight || this.movingLeft) && this.animation.currentAnimation == this.static_anim) {
			this.animation.start(this.walking_anim);
		}
	}
	
	if (!this.movingUp && !this.movingDown && !this.movingLeft && !this.movingRight) {
		if (this.animation.currentAnimation == this.walking_anim) {
			this.animation.start(this.static_anim);
		}
	}
	
	if (this.choiceCounter >= 1000) {
		xPos = Math.floor((Math.random() * this.scene.camera.rect.width) + 1) + this.scene.camera.rect.left;
		yPos = Math.floor((Math.random() * this.scene.camera.rect.height) + 1) + this.scene.camera.rect.top;
		this.goTo([xPos, yPos]);
		this.choiceCounter = 0;
	}
	
	Object.prototype.update.apply(this, arguments);
};

Object.prototype.goTo = function(pos) {
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
				this.moveRight();
				this.lookingRight = true;
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

var Pickup = exports.Pickup = function(pos, options, object) {
	Pickup.superConstructor.apply(this, arguments);
	this.parent = object || null;
	this.type = options.type || null;
	this.heldBy = null;
	this.available = true;
};
objects.extend(Pickup, Object);

Pickup.prototype.update = function(msDuration) {
	Object.prototype.update.apply(this, arguments);
	
	if (this.heldBy) {
		if (this.heldBy.lookingRight) {
			var offset = -15;
		} else {
			var offset = 15;
		}
		this.realRect.topleft = [this.heldBy.hotspot[0] + offset, this.heldBy.hotspot[1] + 6];
	}
	
	if (this.isArcing) {
		this.available = false;
	}
};
