var gamejs = require('gamejs');

exports.WIDTH = 256;
exports.HEIGHT = 224;

exports.DEBUG = false;

exports.STATIC_PATH = '../static/';

exports.SCALE = 2;

var triggers = require('./triggerElements').triggers;

exports.scenes = {
	'title': {
		'image': exports.STATIC_PATH + 'images/backgrounds/test.png',
		'triggers': null,
		'cutscene': true,
		'level': null,
		'next': 'level1'
	},
	'level1': {
		'image': exports.STATIC_PATH + 'images/backgrounds/office-boardroom.png',
		'triggers': triggers.level_1,
		'level': 1
	}
};