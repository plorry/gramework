var gamejs = require('gamejs');
var config = require('./config');
var sounds = require('./soundElements').sounds;

var extendShooter = exports.extendShooter = function(obj) {
	/*
	Extend a sprite class to allow it to shoot
	Sprites shoot Lines of a given range, which can harm enemy units
	*/
	var Line = function(pointA, pointB, owner) {
		this.pointA = pointA;
		this.pointB = pointB;
		this.time = 0;
		this.active = true;
		this.owner = owner;
		return this;
	};
	
	Line.prototype.getLength = function() {
		length = Math.sqrt(Math.pow(this.pointA[0] - this.pointB[0], 2) + Math.pow(this.pointA[1] - this.pointB[1], 2));
		return length;
	};
	//Update our line
	Line.prototype.update = function(msDuration) {
		this.time++;
		if (this.time >= 10) {
			this.kill();
		}
		return;
	};
	//Line is not longer needed
	Line.prototype.kill = function() {
		this.active = false;
		return;
	};
	
	Line.prototype.draw = function(display) {
		gamejs.draw.line(display, "#EEE222", this.pointA, this.pointB, 3);
		return;
	};
		
	obj.prototype.range = 110;
	obj.prototype.shots = [];
	obj.prototype._canShoot = true;
	obj.prototype._isShooting = false;
	obj.prototype.canShoot = function() {
		return this._canShoot;
	};
	obj.prototype.isShooting = function() {
		return this._isShooting;
	};
	
	obj.prototype.action1 = function() {
		var _name = "shoot";
		if (this.canShoot()) {
			this._isShooting = true;
			this._canShoot = false;
			sounds.shoot();
			
			if (this.lookingRight) {
				var xPointB = this.rect.center[0] + this.range;
			} else {
				var xPointB = this.rect.center[0] - this.range;
			}
			
			var pointA =  this.rect.center;
			var pointB = [xPointB, this.rect.center[1]];
			
			var shot = new Line(pointA, pointB, this);
			this.shots.push(shot);
			
			this.getName = function() {
				return _name;
			};
		}
	};
	
	//Extend the original update function
	var oldUpdate = obj.prototype.update;
		
	obj.prototype.update = function(msDuration) {
		oldUpdate.call(this, msDuration);
		for (var i = 0; i < this.shots.length; i++) {
			this.shots[i].update(msDuration);
			if (this.shots[i].active == false) {
				this.shots.splice(i,1);
			}
		}
		return;
	};
	
	//Extend the original draw function
	var oldDraw = obj.prototype.draw;
	
	obj.prototype.draw = function(display) {
		oldDraw.call(this, display);
		if (config.DEBUG) {
			for (var i = 0; i < this.shots.length; i++) {
				this.shots[i].draw(display);
			}
		};
		return;
	};
	
	return;
};