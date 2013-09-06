var config = require('./project/config');
var gamejs = require('gamejs');

var Cutscene = exports.Cutscene = function(director, cutsceneId) {

	this.handleEvent = function(event) {
		if (event.type === gamejs.event.KEY_DOWN || event.type === gamejs.event.MOUSE_DOWN) {

		}
	};

	this.update = function(msDuration) {
		elapsed += msDuration;
		if ((elapsed >= duration) && cutsceneId != TITLE_SCREEN){
			currentPanel += 1;
			if (currentPanel >= panels.length) {
			}
			elapsed = 0;
			image = gamejs.image.load(panels[currentPanel].image);
			if (panels[currentPanel].sound != ''){
				sound = new gamejs.mixer.Sound(panels[currentPanel].sound);
				sound.play();
			}
			duration = panels[currentPanel].duration;

		//	director.replaceScene(new Cutscene(director, cutsceneId));
		}
		if (duration == 'nope'){
			duration = sound.getLength() * 1000;
		}

		if (!(duration > 0 && duration < 7000)){
			duration = sound.getLength() * 1000;
		}

	};

	this.draw = function(display) {
		display.blit(image, [0,0], image_rect);
	};

	this.setLevelDump = function(dump) {
		try {
			var cutsceneConfig = JSON.parse(dump);
			initCutscene(cutsceneConfig);
		} catch (e) {
			gamejs.log(e);
		}
		return;
	};

	function initCutscene(cutsceneConfig) {
		//music = cutsceneConfig.music;
		panels = [];
		cutsceneConfig.panels.forEach(function(panel){
			panels.push(panel);
		});
		image = gamejs.image.load(panels[currentPanel].image);
		if (panels[currentPanel].sound != ''){
			sound = new gamejs.mixer.Sound(panels[currentPanel].sound);
			sound.play();
		}
		duration = panels[currentPanel].duration;
		if (duration == null){
			duration = sound.getLength();
		}
		//image = gamejs.image.load('./static/backgrounds/death1b.png');
		return;
	};

	var cutsceneId = cutsceneId || 0;
	var cutsceneConfig = config.scenes[cutsceneId];
	var elapsed = 0;
	var currentPanel = 0;
	var music, image, sound, duration;
	initCutscene(cutsceneConfig);

	return this;
}
