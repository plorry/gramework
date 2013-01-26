var gamejs = require('gamejs');
var config = require('./project/config');
var Camera = require('./camera').Camera;
var elements = require('./project/elements');
var uiElements = require('./project/uiElements');
var soundElements = require('./project/soundElements');

var font = new gamejs.font.Font('20px Lucida Console');

//Scene Class

var Scene = exports.Scene = function(director, sceneConfig) {
	this.objects_list = new gamejs.sprite.Group();
	this.player_objects = new gamejs.sprite.Group();
	this.npc_list = new gamejs.sprite.Group();
	this.uiElements = new gamejs.sprite.Group();
	this.objects_list.add(elements.getSprites());
	this.npc_list.add(elements.getNPCs());
	this.player_objects.add(elements.getPlayers());
	this.uiElements.add(uiElements.getElements());
	soundElements.loadSounds();
	this.camera = new Camera(this, true);
	this._frozen = false;

	var sceneId = sceneId || 0;
	this.elapsed = 0;
	this.image = null;
	this.initScene(sceneConfig);
	
	return this;
};

Scene.prototype.initScene = function(sceneConfig) {
	this.image = gamejs.image.load(sceneConfig.image);
	this.triggers = triggers = [];
	var imageSize = this.image.getSize();
    this.view = new gamejs.Surface([imageSize[0], 224]);

	if (sceneConfig.triggers) {
		sceneConfig.triggers.forEach(function(trigger) {
			triggers.push(new Trigger(trigger));
		});
	}
		
	var scene = this;
	
	this.objects_list.forEach(function(object) {
		object.setScene(scene);
	});
		
	return;
};

Scene.prototype.isFrozen = function() {
	return this._frozen;
};

Scene.prototype.freeze = function() {
	this._frozen = true;
	return;
};

Scene.prototype.unFreeze = function() {
	this._frozen = false;
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
	
	var size = screen.getSize();
	
	var scaledScreen = gamejs.transform.scale(screen, [size[0] * config.SCALE, size[1] * config.SCALE]);
	//var scaledScreen = gamejs.transform.scale(screen, [size[0], size[1]]);
	
	display.blit(scaledScreen);
	
	return;
};

Scene.prototype.handleEvent = function(event) {
	this.player_objects.forEach(function(player){
		if(player.inControl()){
			player.handleEvent(event);
		}
	});
	
	if (event.type === gamejs.event.KEY_DOWN) {
		if (event.key === gamejs.event.K_SPACE) {
			//LOG STUFF HERE
			this.camera.zoomTo(2);
			console.log(this.camera.dest);
		}
	}
	if (event.type === gamejs.event.KEY_UP) {
		if (event.key === gamejs.event.K_SPACE) {
			this.camera.zoomTo(1);
		}
	}
	return;
};

Scene.prototype.spawn = function(obj, pos, options) {
	new_obj = new obj(pos, options);
	new_obj.setScene(this);
	this.objects_list.add(new_obj);
	this.npc_list.add(new_obj);
	return;
};

var order = function(a,b) {
	return a.rect.top-b.rect.top;
};

Scene.prototype.update = function(msDuration) {
	//reorder the sprites so the lower ones appear in foreground
	var scene = this;
	var triggers = this.triggers;
	//Check each trigger for its activating condition - update active triggers - kill triggers that are done
	this.triggers.forEach(function(trigger){
		var index = triggers.indexOf(trigger);
		if (trigger.condition(scene)) {
			trigger.activate();
		}
		if (trigger.isActive()){
			trigger.update(msDuration, scene);
		}
		if (trigger.killCondition(scene)) {
			trigger.killEvent(scene);
			trigger.deactivate();
			scene.triggers.splice(index,1);
		}
	});
	
	this.objects_list._sprites.sort(order);
	if (!this.isFrozen()){
		/*
		this.npc_list.update(msDuration);
		this.player_objects.update(msDuration);
		*/
		this.objects_list.update(msDuration);
	}
	this.camera.update(msDuration);
	this.uiElements.forEach(function(element){
		if (element.active) {
			element.update(msDuration);
		}
	});
	this.elapsed += msDuration;
	
	var x_total = 0;
	var y_total = 0;
	this.player_objects.forEach(function(player) {
		x_total += player.rect.center[0];
		y_total += player.rect.center[1];
	});
	
	var x_pos = x_total / this.player_objects.sprites().length;
	var y_pos = y_total / this.player_objects.sprites().length;
	
	this.camera.follow([x_pos, y_pos]);
	
	return;
};

var Trigger = exports.Trigger = function(options) {
	this._active = false;
	this.condition = options.condition;
	this.update = options.update || function() {return;};
	this.killCondition = options.killCondition || function() {return false;};
	this.killEvent = options.killEvent || function() {return;};
	return this;
};

Trigger.prototype.activate = function() {
	this._active = true;
	return;
};

Trigger.prototype.isActive = function() {
	return this._active;
};

Trigger.prototype.deactivate = function() {
	this._active = false;
	return;
};