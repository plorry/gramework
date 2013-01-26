var gamejs = require('gamejs');
var config = require('./config');
var Throwaway = require('../object').Throwaway;
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

var dims = {width:16, height:20};

var thug_file = config.STATIC_PATH + 'images/sprites/enemy-suit01.png';
var shot_file = config.STATIC_PATH + 'images/sprites/shot.png';
var woo_file = config.STATIC_PATH + 'images/sprites/john-woo.png';
var chow_file = config.STATIC_PATH + 'images/sprites/chow-yun-fat.png';

var thug_anims = {
	'static': [0],
	'walking': [1,4],
	'hurt1': [5]
};
var woo_anims = {
	'static': [0],
	'walking': [3,6],
};
var shot_anims = {
	fps: 12,
	'static': [0,2]
};

var thug_opts = exports.thug_opts = {
	spriteSheet: [thug_file, dims],
	animation: thug_anims,
	playerControlled: false,
	walkSpeed: 1
};

var shot_opts = exports.shot_opts = {
	spriteSheet: [shot_file, {width:11, height:7}],
	animation: shot_anims
};
var woo_opts = {
	spriteSheet: [woo_file, dims],
	animation: woo_anims,
	playerControlled: true
};

var spawnShot = exports.spawnShot = function(obj) {
	shot = new Throwaway(obj.hotspot, shot_opts);
	shot.setScene(obj.scene);
	obj.scene.objects_list.add(shot);
	shot.lookingRight = !(obj.lookingRight);
};

var getSprites = exports.getSprites = function() {
	var sprites = [];
	//Specifically turn our 4D objects into shooters
	extendShooter(FourDirection);
	
	woo = new FourDirection([0,0], woo_opts);
	
	var chow_opts = woo_opts;
	chow_opts.controlMapping = p2_controls;
	chow_opts.spriteSheet = [chow_file, dims];
	
	chow = new FourDirection([35,35], chow_opts);
		
	thug = new FourDirection([15,15], thug_opts);
	thug_2 = new FourDirection([35,35], thug_opts);
	
	thug.lookAt(woo);
	thug_2.lookAt(woo);

	// var doors_file = config.STATIC_PATH + 'images/sprites/doors.png';
	// var doors_dims = {width:32, height: 32};
	// var doors_sheet = new SpriteSheet(doors_file, doors_dims);
	// var doors_anims = {
	// 	'static': [0],
	// 	'opening': [1,2,3],
	// 	'closing': [4,5,6],
	// };
	// doors = new Object([100,0], doors_sheet, doors_anims);
	
	sprites.push(peter);
	sprites.push(peter_2);
	sprites.push(thug);
	sprites.push(thug_2);
	// sprites.push(doors);
	
	return sprites;
};

var getPlayers = exports.getPlayers = function() {
	var sprites = [];
	
	sprites.push(woo);
	sprites.push(chow);
	
	return sprites;
};

var getNPCs = exports.getNPCs = function() {
	var npcs = [];
	
	npcs.push(thug);
	npcs.push(thug_2);
	
	return npcs;
};
