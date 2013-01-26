var gamejs = require('gamejs');
var config = require('./config');
var Object = require('../object').Object;
var FourDirection = require('../object').FourDirection;
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

var dims = {width:14, height:24};

var thug_file = config.STATIC_PATH + 'images/sprites/thug.png';

var thug_anims = {
	'static': [0]
};

var thug_opts = exports.thug_opts = {
	spriteSheet: [thug_file, dims],
	animation: thug_anims,
	playerControlled: false,
	walkSpeed: 1
};

var getSprites = exports.getSprites = function() {
	var sprites = [];
	//Specifically turn our 4D objects into shooters
	extendShooter(FourDirection);
	
	var peter_file = config.STATIC_PATH + 'images/sprites/peter.png';
	var peter_dims = {width:14, height: 24};
	
	var peter_anims = {
		'static': [0],
		'walking': [0,3],
	};
	
	var peter_opts = {
		spriteSheet: [peter_file, peter_dims],
		animation: peter_anims,
		playerControlled: true
	};
	
	peter = new FourDirection([0,0], peter_opts);
	
	var peter_2_opts = peter_opts;
	peter_2_opts.controlMapping = p2_controls;
	
	peter_2 = new FourDirection([35,35], peter_2_opts);
		
	thug = new FourDirection([15,15], thug_opts);
	thug_2 = new FourDirection([35,35], thug_opts);
	
	thug.lookAt(peter);
	thug_2.lookAt(peter);
	
	var doors_file = config.STATIC_PATH + 'images/sprites/doors.png';
	var doors_dims = {width:32, height: 32};
	var doors_sheet = new SpriteSheet(doors_file, doors_dims);
	var doors_anims = {
		'static': [0],
		'opening': [1,2,3],
		'closing': [4,5,6],
	};
	doors = new Object([100,0], doors_sheet, doors_anims);

	sprites.push(peter);
	sprites.push(peter_2);
	sprites.push(thug);
	sprites.push(thug_2);
	console.log(doors);
	sprites.push(doors);
	
	return sprites;
};

var getPlayers = exports.getPlayers = function() {
	var sprites = [];
	
	sprites.push(peter);
	sprites.push(peter_2);
	
	return sprites;
};

var getNPCs = exports.getNPCs = function() {
	var npcs = [];
	
	npcs.push(thug);
	npcs.push(thug_2);
	
	return npcs;
};