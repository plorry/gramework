var gamejs = require('gamejs');
var config = require('./config');

var sounds = [
	config.STATIC_PATH + 'sounds/pulse_low.wav',
	config.STATIC_PATH + 'sounds/gunshot.wav'
];

var images = [
	config.STATIC_PATH + 'images/backgrounds/background1.jpg',
	config.STATIC_PATH + 'images/sprites/peter.png',
	config.STATIC_PATH + 'images/sprites/thug.png',
	config.STATIC_PATH + 'images/sprites/doors.png',
	'./static/maps/tileset-boardroom.png',
	config.STATIC_PATH + 'images/ui/test.png',
	config.STATIC_PATH + 'images/sprites/john-woo.png',
	config.STATIC_PATH + 'images/sprites/chow-yun-fat.png',
	config.STATIC_PATH + 'images/sprites/enemy-suit01.png',
	config.STATIC_PATH + 'images/sprites/enemy-suit02.png',
	config.STATIC_PATH + 'images/sprites/shot.png',
	'./static/images/backgrounds/office-boardroom.png'
];

var resources = exports.resources = sounds.concat(images);

console.log(resources);

