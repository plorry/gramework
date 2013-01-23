var gamejs = require('gamejs');
var config = require('./project/config');
var Camera = require('./camera').Camera;
var elements = require('./project/elements');
var uiElements = require('./project/uiElements');

var font = new gamejs.font.Font('20px Lucida Console');

//Scene Class

var Scene = exports.Scene = function(director, sceneConfig) {
	this.objects_list = new gamejs.sprite.Group();
	this.player_objects = new gamejs.sprite.Group();
	this.uiElements = new gamejs.sprite.Group();
	this.objects_list.add(elements.getSprites());
	this.player_objects.add(elements.getPlayers());
	console.log(this.uiElements);
	this.uiElements.add(uiElements.getElements());
    this.view = new gamejs.Surface([800, 600]);
	this.view._context.webkitImageSmoothingEnabled = false;
	this.camera = new Camera(this);

	var sceneId = sceneId || 0;
	var elapsed = 0;
	this.image = null;
	this.initScene(sceneConfig);
		
	this.camera.follow(peter);
	
	return this;
};

Scene.prototype.initScene = function(sceneConfig) {
	this.image = gamejs.image.load(sceneConfig.image);
	this.image._context.webkitImageSmoothingEnabled = false;
	return;
};

Scene.prototype.draw = function(display) {
	display.fill("#F0A30F");
	if (this.image) {
		this.view.blit(this.image);
	}
	this.objects_list.draw(this.view);
	
	var screen = this.camera.draw();
	this.uiElements.draw(screen);
	screen._context.webkitImageSmoothingEnabled = false;
	
	var size = screen.getSize();
	
	var scaledScreen = gamejs.transform.scale(screen, [size[0] * config.SCALE, size[1] * config.SCALE]);
	scaledScreen._context.webkitImageSmoothingEnabled = false;
	
	display.blit(scaledScreen);
	
	return;
};

Scene.prototype.handleEvent = function(event) {
	this.player_objects.forEach(function(player){
		player.handleEvent(event);
	});
	
	if (event.type === gamejs.event.KEY_DOWN) {
		if (event.key === gamejs.event.K_SPACE) {
			//LOG STUFF HERE
			this.camera.zoomTo(2);
			console.log('1');
		}
	}
	if (event.type === gamejs.event.KEY_UP) {
		if (event.key === gamejs.event.K_SPACE) {
			this.camera.zoomTo(1);
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
	this.uiElements.forEach(function(element){
		if (element.active) {
			element.update(msDuration);
		}
	});
	return;
};

