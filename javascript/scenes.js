var gamejs = require('gamejs');
var config = require('./config');

var image_rect = [0,0,config.WIDTH,config.HEIGHT];

var font = new gamejs.font.Font('20px Lucida Console');

var sounds = {

};


//Scene Class

var Scene = exports.Scene = function(director, sceneId) {

	var debug_val = 0;

	this.handleEvent = function(event) {
		//Gotta re-position the mouse coords based on the scale of the surface
		//event.pos = [event.pos[0] / config.SCALE, event.pos[1] / config.SCALE];
	};

	this.update = function(msDuration) {
		
	};

	this.draw = function(display) {
		display.fill("#000000");
		/*
		if (image) {
    		display.blit(image);
    	}
    	*/

		debug_val = font.render(debug_val, '#555');
	};

	function initScene() {
		//image = gamejs.image.load(sceneConfig.image);
	};

	var sceneId = sceneId || 0;
	//var sceneConfig = config.scenes[sceneId];
	var elapsed = 0;
	var image;
	//initScene(sceneConfig);

	return this;
}
