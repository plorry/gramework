var gamejs = require('gamejs');
var draw = require('gamejs/draw');
var config = require('./project/config');
var draw = require('gamejs/draw');
var Object = require('./object').Object;
var FourDirection = require('./object').FourDirection;
var Camera = require('./camera').Camera;
var SpriteSheet = require('./animate').SpriteSheet;
var Animation = require('./animate').Animation;
var elements = require('./project/elements');

var font = new gamejs.font.Font('20px Lucida Console');

var sounds = {

};

//Scene Class

var Scene = exports.Scene = function(director, sceneConfig) {
	 
	this.objects_list = new gamejs.sprite.Group();
	this.player_objects = new gamejs.sprite.Group();
	this.objects_list.add(elements.getSprites());
	this.player_objects.add(elements.getPlayers());
    this.view = new gamejs.Surface([800, 600]);
	this.camera = new Camera(this);

	var sceneId = sceneId || 0;
	var elapsed = 0;
	this.image = null;
	this.initScene(sceneConfig);

	return this;
};

Scene.prototype.initScene = function(sceneConfig) {
	this.image = gamejs.image.load(sceneConfig.image);
	return;
};

Scene.prototype.draw = function(display) {
	display.fill("#F0A30F");
	if (this.image) {
		this.view.blit(this.image);
	}
	this.objects_list.draw(this.view);

	display.blit(this.camera.draw());
};

Scene.prototype.handleEvent = function(event) {
	this.player_objects.forEach(function(player){
		player.handleEvent(event);
	});
	
	if (event.type === gamejs.event.KEY_DOWN) {
		if (event.key === gamejs.event.K_SPACE) {
			console.log(this.objects_list);
		}
	}
	
	return;
};

Scene.prototype.update = function(msDuration) {
	var order = function(a,b) {
		return a.rect.top-b.rect.top;
	};
	//reorder the sprites so the lower ones appear in foreground
	this.objects_list._sprites.sort(order);
	this.objects_list.update(msDuration);
	this.camera.update(msDuration);
	return;
};

