var gamejs = require('gamejs');
var config = require('./config');
var Throwaway = require('../object').Throwaway;
var FourDirection = require('../object').FourDirection;
var Pickup = require('../object').Pickup;
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
var gun_dims = {width:6, height:5};

var thug_file = config.STATIC_PATH + 'images/sprites/enemy-suit01.png';
var thug2_file = config.STATIC_PATH + 'images/sprites/enemy-suit02.png';
var shot_file = config.STATIC_PATH + 'images/sprites/shot.png';
var woo_file = config.STATIC_PATH + 'images/sprites/john-woo.png';
var chow_file = config.STATIC_PATH + 'images/sprites/chow-yun-fat.png';
var gun_file = config.STATIC_PATH + 'images/sprites/gun.png';
var hostage_file = config.STATIC_PATH + 'images/sprites/enemy-hostagetaker.png';

var default_anims = {
	'static': [0]
};
var thug_anims = {
	'static': [0],
	'walking': [1,4],
	'hurt1': [5],
	'dying': [10, 17, false]
};
var hostage_anims = {
	'static': [0],
	'walking': [1,4],
	'hurt1': [5],
	'dying': [10,11, false]
};
var woo_anims = {
	'static': [0],
	'walking': [3,6],
	'static1': [1],
	'static2': [2],
	'walking1': [7,10],
	'walking2': [11,14],
	'static3': [15],
	'hurt1': [16]
};
var shot_anims = {
	fps: 20,
	'static': [0,2]
};

var thug_opts = exports.thug_opts = {
	spriteSheet: [thug_file, dims],
	animation: thug_anims,
	playerControlled: false,
	walkSpeed: 1
};
var thug2_opts = exports.thug_opts = {
	spriteSheet: [thug2_file, dims],
	animation: thug_anims,
	playerControlled: false,
	walkSpeed: 1
};
var hostage_opts = exports.hostage_opts = {
	spriteSheet: [hostage_file, dims],
	animation: hostage_anims,
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

var gun_opts = {
	spriteSheet: [gun_file, gun_dims],
	animation: default_anims,
	type: 'gun'
};

var spawnShot = exports.spawnShot = function(obj) {
	var shot = new Throwaway(obj.hotspot, shot_opts, obj);
	shot.setScene(obj.scene);
	obj.scene.objects_list.add(shot);
	shot.lookingRight = !(obj.lookingRight);
};

var spawnGun = exports.spawnGun = function(obj) {
	var gun = new Pickup(obj.rect.bottomleft, gun_opts, obj);
	gun.setScene(obj.scene);
	obj.scene.objects_list.add(gun);
};

var randomEnemies = exports.randomEnemies = [
	thug_opts,
	thug2_opts
];

var getSprites = exports.getSprites = function(stage) {
	var sprites = [];
	switch (stage) {
		case 1:
			//Specifically turn our 4D objects into shooters
			extendShooter(FourDirection);
			
			woo = new FourDirection([0,90], woo_opts);
			
			var chow_opts = woo_opts;
			chow_opts.controlMapping = p2_controls;
			chow_opts.spriteSheet = [chow_file, dims];
			
			chow = new FourDirection([35,110], chow_opts);
			thug = new FourDirection([15,120], thug_opts);
			thug_2 = new FourDirection([35,130], thug_opts);
			
			thug.lookAt(woo);
			thug_2.lookAt(woo);
			
			sprites.push(woo);
			sprites.push(chow);
			sprites.push(thug);
			sprites.push(thug_2);
			break;
	}
	return sprites;
};

var getPlayers = exports.getPlayers = function(stage) {
	var sprites = [];
	switch (stage) {
		case 1:
			sprites.push(woo);
			sprites.push(chow);
			break;
	}		
	return sprites;
};

var getNPCs = exports.getNPCs = function(stage) {
	var npcs = [];
	switch (stage) {
		case 1:
			npcs.push(thug);
			npcs.push(thug_2);
			break;
	}
	return npcs;
};