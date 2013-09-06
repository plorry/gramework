var elements = require('./elements');
var FourDirection = require('../object').FourDirection;

var x200 = function(scene) {
	return (scene.camera.rect.center[0] >= 200);
};

var enemiesClear = function(scene) {
	return (scene.npc_list.sprites().length == 0);s
};

var spawn12 = function(msDuration, scene) {
	scene.camera.unfollow();
	if (this.enemies === undefined) {
		this.enemies = 12;
	}
	if (scene.npc_list.sprites().length < 4) {
		scene.spawn_many(FourDirection, 1);
		this.enemies--;
	}

	return;
};

var unlockCamera = function(msDuration, scene) {
	scene.scroll = true;
	this.deactivate();
	return;
};

var enemiesDone = function(scene) {
	return (this.enemies <= 0);
};

var testKillEvent = function(scene) {
	return;
};

exports.triggers = {
	level_1: {
		testTrigger: {
			'condition': x200,
			'update': spawn12,
			'killCondition': enemiesDone,
			'killEvent': testKillEvent
		},
		clearScroll: {
			'condition': enemiesClear,
			'update': unlockCamera
		}
	}
};