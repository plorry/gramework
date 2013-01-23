var gamejs = require('gamejs');
var config = require('./config');

var sounds = [
	config.STATIC_PATH + 'sounds/pulse_low.wav',
];

var images = [
	config.STATIC_PATH + 'images/backgrounds/background1.jpg',
	config.STATIC_PATH + 'images/sprites/peter.png',
	config.STATIC_PATH + 'images/sprites/thug.png',
	config.STATIC_PATH + 'images/ui/test.png'
];

var resources = exports.resources = sounds.concat(images);

console.log(resources);