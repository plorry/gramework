var gamejs = require('gamejs');
var draw = require('gamejs/draw');
var config = require('./config');
var draw = require('gamejs/draw');
var Object = require('./object').Object;
var FourDirection = require('./object').FourDirection;
var Gravity = require('./object').Gravity;
var Bounce = require('./object').Bounce;
var Camera = require('./camera').Camera;
var SpriteSheet = require('./animate').SpriteSheet;
var Animation = require('./animate').Animation;

var image_rect = [0,0,config.WIDTH,config.HEIGHT];

var font = new gamejs.font.Font('20px Lucida Console');



var sounds = {

};

//Scene Class

var Scene = exports.Scene = function(director, sceneId, objects_list) {
	
	this.peter_anims = {
		'static': [0]
	};
 
	this.objects_list = objects_list || null;
	this.debug_val = 0;
	this.obj = new Object([14,14]);
	this.guy = new FourDirection([5,5]);
    this.grav = new Gravity();
    this.bounce = new Bounce();
    this.view = new gamejs.Surface([800, 600]);
	this.camera = new Camera(this);

    this.obj.assign(this.grav);
    this.obj.assign(this.bounce);

	var sceneId = sceneId || 0;
	var sceneConfig = config.scenes[sceneId];
	var elapsed = 0;
	this.image = null;
    var pos;
	this.initScene(sceneConfig);

	return this;
};

Scene.prototype.initScene = function(sceneConfig) {
	this.peter_file = './static/images/sprites/peter.png';
	this.peter = new SpriteSheet(this.peter_file, {width:14, height:24});
	this.guy = new FourDirection([5,5], this.peter, this.peter_anims);
	this.camera.follow(this.guy);
	
	this.image = gamejs.image.load(sceneConfig.image);
	return;
};

Scene.prototype.draw = function(display) {
	display.fill("#F0A30F");
	if (this.image) {
		this.view.blit(this.image);
	}
	//draw.rect(this.view, "#000444", new gamejs.Rect([0,0], [256,224]));
	this.obj.draw(this.view);
	this.guy.draw(this.view);

	display.blit(this.camera.draw());
	
    var debug_val = font.render(this.obj.pos, '#555');
    //display.blit(debug_val);
};


Scene.prototype.handleEvent = function(event) {
	this.guy.handleEvent(event);
	
	if (event.type === gamejs.event.KEY_DOWN) {
		if (event.key === gamejs.event.K_SPACE) {
			console.log(this.camera.dest);
			console.log(this.guy.rect.center);
		}
	}
	
	return;
};

Scene.prototype.update = function(msDuration) {
    this.obj.update(msDuration);
	this.guy.update(msDuration);
	if (this.objects_list) {
        
    }
	this.camera.update(msDuration);
    //this.zoom *= this.zoom_rate;
	return;
};

