var gamejs = require('gamejs');
var config = require('./config');
var draw = require('gamejs/draw');
var Object = require('./object').Object;

var image_rect = [0,0,config.WIDTH,config.HEIGHT];

var font = new gamejs.font.Font('20px Lucida Console');

var sounds = {

};

//Scene Class

var Scene = exports.Scene = function(director, sceneId, objects_list) {
    var objects_list = objects_list || null;
	var debug_val = 0;
    var obj = new Object([14,14]);
    
	this.handleEvent = function(event) {
		//Gotta re-position the mouse coords based on the scale of the surface
		event.pos = [event.pos[0] / config.SCALE, event.pos[1] / config.SCALE];
        pos = event.pos;
	};

	this.update = function(msDuration) {
		if (objects_list) {
            
        }
	};

	this.draw = function(display) {
		display.fill("#F0A30F");
		if (image) {
    		display.blit(image);
    	}
    	obj.draw(display);

		debug_val = font.render(obj.pos, '#555');
        display.blit(debug_val);
	};

	function initScene() {
		//image = gamejs.image.load(sceneConfig.image);
        var obj = new Object();
	};

	var sceneId = sceneId || 0;
	//var sceneConfig = config.scenes[sceneId];
	var elapsed = 0;
	var image;
    var pos;
	initScene();

	return this;
}
