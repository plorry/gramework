var gamejs = require('gamejs');

exports.WIDTH = 256;
exports.HEIGHT = 224;

exports.DEBUG = false;

exports.STATIC_PATH = '../static/';

exports.SCALE = 2;

var triggers = require('./triggerElements').triggers;

exports.scenes = {
	'debug': {
		'image': exports.STATIC_PATH + 'images/backgrounds/office-boardroom.png',
		'triggers': triggers
	}
};