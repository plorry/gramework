var gamejs = require('gamejs');
var config = require('./project/config');
var palettes = require('./palettes').palettes;

exports.Director = function() {
	var onAir = false;
	var currentScene = null;

	function tick(msDuration) {
		if (!onAir) return;

		gamejs.event.get().forEach(function(event){
			currentScene.handleEvent(event);
		});
		currentScene.update(msDuration);
		currentScene.draw(display);
		
		var canv = document.getElementById("gjs-canvas");
		//cq(canv).matchPalette(palettes.gameboy);
		
		return;
	};

	this.start = function(scene) {
		onAir = true;
		this.replaceScene(scene);
		return;
	};

	this.replaceScene = function(scene) {
        currentScene = scene;
    };

    this.getScene = function() {
        return currentScene;
    };

    var display = gamejs.display.setMode([config.WIDTH * config.SCALE, config.HEIGHT * config.SCALE], gamejs.display.DISABLE_SMOOTHING);
	if (config.DEBUG) {
		console.log('DEBUG');
	}
	
    gamejs.time.fpsCallback(tick, this, 60);
    return this;
};
