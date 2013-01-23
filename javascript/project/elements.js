var gamejs = require('gamejs');
var config = require('./config');
var FourDirection = require('../object').FourDirection;
var Animation = require('../animate').Animation;
var SpriteSheet = require('../animate').SpriteSheet;
var extendShooter = require('./extendSprites').extendShooter;

/*
Here is where we'll generate all the sprites to be used in the game
*/

var p2_controls = {
	'LEFT': gamejs.event.K_a,
	'RIGHT': gamejs.event.K_d,
	'UP': gamejs.event.K_w,
	'DOWN': gamejs.event.K_s,
	'BUTTON1': gamejs.event.K_z,
	'BUTTON2': gamejs.event.K_c
};

var getSprites = exports.getSprites = function() {
	var sprites = [];
	//Specifically turn our 4D objects into shooters
	extendShooter(FourDirection);

	var peter_file = config.STATIC_PATH + 'images/sprites/peter.png';
	var peter_dims = {width:14, height: 24};
	var peter_sheet = new SpriteSheet(peter_file, peter_dims);
	var peter_anims = {
		'static': [0],
		'walking': [0,3],
	};
	peter = new FourDirection([0,0], peter_sheet, peter_anims, true);
	peter_2 = new FourDirection([40,40], peter_sheet, peter_anims, true, p2_controls);
	
	var thug_file = config.STATIC_PATH + 'images/sprites/thug.png';
	var thug_sheet = new SpriteSheet(thug_file, peter_dims);
	var thug_anims = {
		'static': [0]
	};
	
	thug = new FourDirection([15,15], thug_sheet, thug_anims, false, null, 1);
	thug_2 = new FourDirection([35,35], thug_sheet, thug_anims, false, null, 1);
	
	thug.lookAt(peter);
	thug_2.lookAt(peter);
	
	sprites.push(peter);
	sprites.push(peter_2);
	sprites.push(thug);
	sprites.push(thug_2);
	
	return sprites;
};

var getPlayers = exports.getPlayers = function() {
	var sprites = [];
	
	sprites.push(peter);
	sprites.push(peter_2);
	
	return sprites;
};