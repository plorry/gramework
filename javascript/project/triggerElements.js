var testCondition = function(scene) {
	return (scene.camera.rect.center[0] >= 200);
};

var testUpdate = function(msDuration, scene) {
	scene.camera.unfollow();
	scene.camera.panto([200,300]);
	return;
};

var testKill = function(scene) {
	return (false);
};

var testKillEvent = function(scene) {
	return;
};

exports.triggers = {
	'testTrigger': {
		'condition': testCondition,
		'update': testUpdate,
		'killCondition': testKill,
		'killEvent': testKillEvent
	}
};