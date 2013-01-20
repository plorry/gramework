var gamejs = require('gamejs');
var config = require('./config');
var draw = require('gamejs/draw');
var objects = require('gamejs/utils/objects');
var Animation = require('/animate').Animation;

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
    this.x_speed = 0;
    this.y_speed = 0;
    this.x_accel = 0;
    this.y_accel = 0;
    this.y_max = 10;
    this.bounce = 0.8;
    
	if (animation) {
		this.animation = new Animation(spriteSheet, animation, 12);
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

Object.prototype.update = function(msDuration) {
	this.x_accel = 0;
    this.y_accel = 0;
    for (var i = 0; i < this.behaviours.length; i++) {
        this.behaviours[i].update(this);
    }
    
    this.y_speed += this.y_accel;    
    this.x_speed += this.x_accel;
	
	this.rect.moveIp(this.x_speed, this.y_speed);
    
    if (this.y_speed <= 0) {
        this.is_falling = false;
    } else {
        this.is_falling = true;
    }
	
	if (this.animation) {
		this.animation.update(msDuration);
		this.image = this.animation.image;
	}
	return;
};

Object.prototype.draw = function(display) {
	if (this.spriteSheet) {	
		gamejs.sprite.Sprite.prototype.draw.apply(this, arguments);
	} else {
		draw.rect(display, "#000FFF", new gamejs.Rect(this.pos, [5,5]));
	}
	return;
};

/*
var Behaviour = function(object) {
    this.object = object;
    return this;
};
*/

var Gravity = exports.Gravity = function() {
    //Behaviour.call(this, object);
    this.accel = 0.2;
    
    this.set_accel = function(accel) {
        this.accel = accel;
    };
    
    this.update = function(object) {
        if (object.y_speed < object.y_max) {
            object.y_speed += this.accel;
        }
    };
    return this;
};

var Bounce = exports.Bounce = function() {
    this.update = function(object) {
        if (object.pos[1] > config.HEIGHT && object.is_falling == true) {
            object.y_speed = -(object.y_speed) * object.bounce;
        }
    };
    return this;
};

var defaultMapping = {
	'LEFT': gamejs.event.K_LEFT,
	'RIGHT': gamejs.event.K_RIGHT,
	'UP': gamejs.event.K_UP,
	'DOWN': gamejs.event.K_DOWN,
	'BUTTON1': gamejs.event.K_CTRL,
	'BUTTON2': gamejs.event.K_SHIFT
};

var FourDirection = exports.FourDirection = function(pos, spriteSheet, animation, playerControlled, controlMapping) {
	FourDirection.superConstructor.apply(this, arguments);
	this.playerContolled = playerControlled || null;
	this.controlMapping = controlMapping || defaultMapping;
};
objects.extend(FourDirection, Object);

FourDirection.prototype.handleEvent = function(event) {
	if (event.type === gamejs.event.KEY_DOWN) {
		switch (event.key) {
			case this.controlMapping['LEFT']:
				console.log('left');
				this.x_speed = -2;
				break;
			case this.controlMapping['RIGHT']:
			console.log('right');
				this.x_speed = 2;
				break;
		}
	} else if (event.type === gamejs.event.KEY_UP) {
		switch (event.key) {
			case this.controlMapping['LEFT']:
			case this.controlMapping['RIGHT']:
				this.x_speed = 0;
				break;			
		}
	}
};