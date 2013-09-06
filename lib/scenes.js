var gamejs = require('gamejs');
var config = require('./project/config');
var Camera = require('./camera').Camera;
var elements = require('./project/elements');
var uiElements = require('./project/uiElements');
var soundElements = require('./project/soundElements');
var TextArea = require('./ui').TextArea;

var font = new gamejs.font.Font('20px Lucida Console');

//Scene Class

var Scene = exports.Scene = function(director, sceneConfig) {
	this.objects_list = new gamejs.sprite.Group();
	this.director = director;
	this.player_objects = new gamejs.sprite.Group();
	this.npc_list = new gamejs.sprite.Group();
	this.uiElements = new gamejs.sprite.Group();
	this.objects_list.add(elements.getSprites(sceneConfig.level));
	this.npc_list.add(elements.getNPCs(sceneConfig.level));
	this.player_objects.add(elements.getPlayers(sceneConfig.level));
	this.uiElements.add(uiElements.getElements(sceneConfig.level));
	soundElements.loadSounds();
	this.camera = new Camera(this, true);
	this._frozen = false;
	this.scroll = true;

	var sceneId = sceneId || 0;
	this.elapsed = 0;
	this.image = null;
	this.initScene(sceneConfig);
	
	return this;
};

Scene.prototype.initScene = function(sceneConfig) {
	this.cutscene = sceneConfig.cutscene || false;
	this.image = gamejs.image.load(sceneConfig.image);
	this.next = sceneConfig.next || null;
	
	/*
	this.textArea = new TextArea({
		scrolling: true,
		text: "test test"
	});
	*/
	this.triggers = [];
	
	for (trigger in sceneConfig.triggers) {
		var trig = new Trigger(sceneConfig.triggers[trigger]);
		this.triggers.push(trig);
	}
	
	var imageSize = this.image.getSize();
    this.view = new gamejs.Surface([imageSize[0], 224]);
		
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
	//this.textArea.draw(screen);
	
	var size = screen.getSize();
	
	var scaledScreen = gamejs.transform.scale(screen, [size[0] * config.SCALE, size[1] * config.SCALE]);
	
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
			if (this.cutscene) {
				this.director.replaceScene(new Scene(this.director, config.scenes[this.next]));
			} else {
				//LOG STUFF HERE
				this.camera.zoomTo(2);
				console.log(this.player_objects.sprites()[0].guns);
				console.log(this.player_objects.sprites()[1].guns);
			}
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

Scene.prototype.spawn_many = function(obj, num, lvl) {	
	for (var i = 0; i < num; i ++) {
		var randOpts = Math.floor(Math.random() * elements.randomEnemies.length);
		var opts = elements.randomEnemies[randOpts];
		var side = Math.floor(Math.random() * 2);
		var y_pos = Math.floor(Math.random() * 70) + 90;
		var x_pos = (this.camera.rect.left - 10) + (side * (this.camera.rect.width + 10));
		this.spawn(obj, [x_pos, y_pos], opts);
	}
	
	return;
};

var order = function(a,b) {
	return a.rect.top-b.rect.top;
};

Scene.prototype.update = function(msDuration) {
	//reorder the sprites so the lower ones appear in foreground
	var scene = this;
	var triggers = this.triggers;
	//this.textArea.update(msDuration);
	//Check each trigger for its activating condition - update active triggers - kill triggers that are done
	this.triggers.forEach(function(trigger){
		var index = triggers.indexOf(trigger);
		if (trigger.condition(scene)) {
			trigger.activate();
		}
		if (trigger.isActive()){
			trigger.update(msDuration, scene);
		}
		if (trigger.killCondition(scene) && trigger.isActive()) {
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
	
	if (this.scroll) {
		this.camera.follow([x_pos, y_pos]);
	}
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