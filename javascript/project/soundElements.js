var gamejs = require('gamejs');
var config = require('./config');

var sounds = exports.sounds = {
	'shoot': function() {
		(new gamejs.mixer.Sound(config.STATIC_PATH + 'sounds/pulse_low.wav')).play();
	},
};