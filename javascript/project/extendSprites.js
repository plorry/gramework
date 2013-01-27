var gamejs = require('gamejs');
var config = require('./config');
var sounds = require('./soundElements').sounds;
var elements = require('./elements');

var extendShooter = exports.extendShooter = function(obj) {
	/*
	Extend a sprite class to allow it to shoot
	Sprites shoot Lines of a given range, which can harm enemy units
	*/
	var Line = function(pointA, pointB, owner, playerShot) {
		this.pointA = pointA;
		this.pointB = pointB;
		this.time = 0;
		this.playerShot = playerShot || false;
		this.active = true;
		this.owner = owner;
		this.dir = this.owner.lookingRight;
		return this;
	};
	
	Line.prototype.getLength = function() {
		length = Math.sqrt(Math.pow(this.pointA[0] - this.pointB[0], 2) + Math.pow(this.pointA[1] - this.pointB[1], 2));
		return length;
	};
	//Update our line
	Line.prototype.update = function(msDuration) {
		this.time += msDuration;
		if (this.time >= 600) {
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
	obj.prototype.dying = 0;
	obj.prototype.damage = 0;
	obj.prototype._hurt = 0;
	obj.prototype.nextGun = 0;
	obj.prototype.shotCounter = 0;
	obj.prototype._canShoot = true;
	obj.prototype._isShooting = false;
	obj.prototype.hurtTime = 100;
	obj.prototype.canShoot = function() {
		return this._canShoot;
	};
	obj.prototype.isShooting = function() {
		return this._isShooting;
	};
	
	obj.prototype.hasGun = function() {
		return this.guns.length > 0;
	};
	
	obj.prototype.checkEmpty = function() {
		if (this.guns.length > 0) {
			if (this.guns[0] <= 0) {
				this.guns.splice(0,1);
			}
			if (this.guns[1] <= 0) {
				this.guns.splice(1,1);
			}
		}
		return;
	};
	
	obj.prototype.action1 = function() {
		var _name = "shoot";
		
		if (this.canShoot() && !this.isHurt() && (!this.playerControlled || this.hasGun())) {
			this.shotCounter = 300;
			if (this.playerControlled && this.guns.length > 0) {
				this.shotCounter = 300 * (1/this.guns.length);
			}
			this._isShooting = true;
			this._canShoot = false;
			if (this.guns.length > 0) {
				this.guns[0] -= 1;
			}
			sounds.shoot();
			elements.spawnShot(this);

			if (this.lookingRight) {
				var xPointB = this.rect.center[0] + this.range;
			} else {
				var xPointB = this.rect.center[0] - this.range;
			}
			
			var pointA =  this.rect.center;
			var pointB = [xPointB, this.rect.center[1]];
			
			var playerShot = this.scene.player_objects.has(this);
			
			var shot = new Line(pointA, pointB, this, playerShot);
			this.shots.push(shot);
		}
		this._lifted1 = false;
		return;
	};
	
	obj.prototype.lift1 = function() {
		this._lifted1 = true;
		return;
	};
	
	obj.prototype.isHurt = function() {
		return this._hurt > 0;
	};
	
	obj.prototype.hurt = function() {
		this._hurt = this.hurtTime;
		return;
	};
	
	//Extend the original update function
	var oldUpdate = obj.prototype.update;
		
	obj.prototype.update = function(msDuration) {
		oldUpdate.call(this, msDuration);
		
		this.checkEmpty();
		
		if (this.shotCounter > 0) {
			this.stop();
			this.ignoreControl();
			this._canShoot = false;
			this.shotCounter -= msDuration;
		}
		
		if (this._hurt > 0) {
			this._hurt -= msDuration;
			this._canShoot = false;
			if ('hurt1' in this.animation.spec) {
				this.animation.start('hurt1');
			}
		}
		if (this._hurt <= 0) {
			this._hurt = 0;
			if (this.shotCounter <= 0) {
				this.restoreControl();
				this.shotCounter = 0;
				if(this._lifted1 == true) {
					this._canShoot = true;
				}
			}
		}
		
		for (var i = 0; i < this.shots.length; i++) {
			this.shots[i].update(msDuration);
			if (this.shots[i].active == false) {
				this.shots.splice(i,1);
			}
		}
		if (this.scene) {
			var cam = this.scene.camera;
			var boundRect = new gamejs.Rect([cam.rect.left, 90], [cam.rect.width, 70]);
			this.setBoundary(boundRect);
		}
		
		if (this.playerControlled) {
			for (var i = 0; i < this.scene.npc_list.sprites().length; i++) {
				var npc = this.scene.npc_list.sprites()[i];
				
				for (var j = 0; j < npc.shots.length; j++) {
					if (this.collisionRect.collideLine(npc.shots[j].pointA, npc.shots[j].pointB)
						&& !this.isHurt() && npc.shots[j].playerShot == false) {
						this.crouch();
					}
				}
			}
			
			var collisions = gamejs.sprite.spriteCollide(this, this.scene.objects_list, false);
				
			for (var i = 0; i < collisions.length; i++) {
				if (collisions[i].type == 'gun') {
					if (this.guns.length < 2) {
						collisions[i].kill();
						console.log(this);
						this.guns.push(Math.floor(Math.random() * 10) + 2);
						console.log(this.scene.player_objects.sprites()[0].guns);
						console.log(this.scene.player_objects.sprites()[1].guns);
					}
				}
			}
		}
		
		if (!this.playerControlled) {
			this._lifted1 = true;
			for (var i = 0; i < this.scene.player_objects.sprites().length; i++) {
				var player = this.scene.player_objects.sprites()[i];
				
				for (var j = 0; j < player.shots.length; j++) {
					if (this.collisionRect.collideLine(player.shots[j].pointA, player.shots[j].pointB)
						&& !this.isHurt() && this.damage < this.maxHealth && player.shots[j].playerShot == true) {
						this.recoil();
						this.damage += 1;
					}
				}
				
				if (this.inControl()) {
					if (this.rect.center[1] < player.rect.center[1] + 5
						&& this.rect.center[1] > player.rect.center[1] - 5) {
						var random = Math.floor(Math.random() * 30);
						if (random == 5 && this.canShoot()) {
							this.action1();
						}
					}
				}
			}			
		}
		
		if (this.damage >= this.maxHealth) {
			this.lookAt(null);
			this.dying += msDuration;
			if (this.animation.currentAnimation != 'dying') {
				this.stop();
				this.animation.start('dying');
			}
		}
		
		if (this.dying >= 800) {
			var allGuns = this.scene.player_objects.sprites()[0].guns.length;
			allGuns += this.scene.player_objects.sprites()[1].guns.length;
			var chance = Math.floor(Math.random() * (5 - allGuns));
			console.log(chance);
			if (chance == 0) {
				elements.spawnGun(this);
			}
			this.die();
		}
		
		return;
	};
	
	obj.prototype.recoil = function() {
		this.stop();
		this.ignoreControl();
		if (this.lookingRight) {
			var offset = -20;
			this.x_speed = -2
		} else {
			var offset = 20;
			this.x_speed = 2;
		}
		var dest = [this.realRect.center[0] + offset,  this.realRect.center[1]];
		this.goTo(dest);
		this.hurt();
		return;
	};
	
	obj.prototype.crouch = function() {
		this.stop();
		this.ignoreControl();
		this.hurt();
		return;
	};
	
	//Extend the original draw function
	var oldDraw = obj.prototype.draw;
	
	obj.prototype.draw = function(display) {
		oldDraw.call(this, display);
		if (config.DEBUG) {
			for (var k = 0; k < this.shots.length; k++) {
				this.shots[k].draw(display);
			}
		}
		return;
	};
	
	return;
};