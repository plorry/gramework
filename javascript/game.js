var gamejs = require('gamejs');
var config = require('./project/config');

exports.Director = function() {
	var onAir = false;
	var currentScene = null;

	function tick(msDuration) {
		if (!onAir) return;

		gamejs.event.get().forEach(function(event){
			currentScene.handleEvent(event);
		});
		currentScene.update(msDuration);
		//console.log(display);
		currentScene.draw(display);
		
		var canv = document.getElementById("gjs-canvas");
		//cq(canv).blend("#000000", "hardLight", 0.8);
		
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

    var display = gamejs.display.setMode([config.WIDTH * config.SCALE, config.HEIGHT * config.SCALE]);
    //var display = gamejs.display.setMode([config.WIDTH, config.HEIGHT]);
	display._context.webkitImageSmoothingEnabled = false;
	if (config.DEBUG) {
		console.log('DEBUG');
	}
	
    gamejs.time.fpsCallback(tick, this, 60);
    return this;

};
