var gamejs = require('gamejs');
var config = require('./config');

var Camera = exports.Camera = function(scene) {

	this.display = new gamejs.Surface([config.WIDTH, config.HEIGHT]);
	this.rect = new gamejs.Rect([0,0], [config.WIDTH, config.HEIGHT]);
	this.scene = scene;
	this.center = null;
	this.dest = null;
	this.xSpeed = 0;
	this.ySpeed = 0;
	this.zoom = 1;
	this.zoom_multiplier = 1;
	
	console.log(this.scene.view.getSize());
	console.log(this.rect);
	console.log(this.display.getSize());
	
	return this;
};

Camera.prototype.update = function(msDuration) {
	//pan to dest
	if (this.dest !== null) {
		if (this.rect.center[0] < this.dest[0]) {this.rect.moveIp(this.xSpeed,0);}
		if (this.rect.center[0] > this.dest[0]) {this.rect.moveIp(this.xSpeed,0);}
		if (this.rect.center[1] < this.dest[1]) {this.rect.moveIp(0,this.ySpeed);}
		if (this.rect.center[1] > this.dest[1]) {this.rect.moveIp(0,this.ySpeed);}
		
		this.xSpeed = (this.dest[0] - this.rect.center[0]) / 10;
		this.ySpeed = (this.dest[1] - this.rect.center[1]) / 10;
				
		if (this.dest == this.rect.center) {
			this.dest = null;
			this.xSpeed = 0;
			this.ySpeed = 0;
		}
	}
	if (this.center !==null) {
		this.dest = this.center.rect.center;
	}
	
	this.zoom = this.zoom * this.zoom_multiplier;
	this.rect.width = config.WIDTH / this.zoom;
	this.rect.height = config.HEIGHT / this.zoom;
	
	scene_size = this.scene.view.getSize();
	
	//The camera cannot pan beyond the extents of the scene
	if (this.rect.top < 0) {this.rect.top = 0;}
	if (this.rect.left < 0) {this.rect.left = 0;}
	if (this.rect.bottom > scene_size[1]) {this.rect.bottom = scene_size[1];}
	if (this.rect.right > scene_size[0]) {this.rect.right = scene_size[0];}
	
	//The camera's extent cannot be bigger than the current scene's size
	if (this.rect.width > scene_size[0]) {this.rect.width = scene_size[0];}
	if (this.rect.height > scene_size[1]) {this.rect.height = scene_size[1];}
	
	view = new gamejs.Surface(this.rect);
	view.blit(this.scene.view, [0,0], this.rect);
	
	this.display = gamejs.transform.scale(view, [
		this.rect.width * this.zoom,
		this.rect.height * this.zoom]);
		
	return;
}

Camera.prototype.draw = function() {
	return this.display;
};

Camera.prototype.panto = function(pos) {
	this.dest = [pos[0], pos[1]];
};

Camera.prototype.follow = function(obj) {
	this.center = obj;
}