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
		currentScene.draw(display);
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

    var display = gamejs.display.setMode([config.WIDTH, config.HEIGHT]);
    //gamejs.transform.scale(display, [config.WIDTH * config.SCALE, config.HEIGHT * config.SCALE]);
    gamejs.time.fpsCallback(tick, this, 60);
    return this;

};
