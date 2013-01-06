var gamejs = require('gamejs');
var config = require('./config');
var draw = require('gamejs/draw');
var objects = require('gamejs/utils/objects');

var GRAVITY = 9.8;

var Object = exports.Object = function(pos) {
    this.pos = pos;
    this.x_speed = 0;
    this.y_speed = 0;
    this.x_accel = 0;
    this.y_accel = 0;
    this.y_max = 5;
    this.bounce = 0.8;
    
    this.behaviours = [];
    
    this.is_falling = false;
    
    //collision points
    
    
    this.update = function(msDuration) {
        this.x_accel = 0;
        this.y_accel = 0;
        for (var i = 0; i < this.behaviours.length; i++) {
            this.behaviours[i].update(this);
        }
        
        this.y_speed += this.y_accel;
        this.pos[1] += this.y_speed;
        
        this.x_speed += this.x_accel;
        this.pos[0] += this.x_speed;
        
        if (this.y_speed <= 0) {
            this.is_falling = false;
        } else {
            this.is_falling = true;
        }
    };
    
    this.draw = function(display) {
        draw.rect(display, "#000FFF", new gamejs.Rect(pos, [5,5]));
    };
    
    this.assign = function(behaviour) {
        //Assign a behaviour object to this object
        this.behaviours.push(behaviour);
    };
    return this;
};
objects.extend(Object, gamejs.sprite.Sprite);

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