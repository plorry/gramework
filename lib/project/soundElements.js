var gamejs = require('gamejs');
var config = require('./config');

var loadSounds = exports.loadSounds = function() {
	shoot = new gamejs.mixer.Sound(config.STATIC_PATH + 'sounds/gunshot.wav');
};

var sounds = exports.sounds = {
	'shoot': function() {
		shoot.play();
	},
};