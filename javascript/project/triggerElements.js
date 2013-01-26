var elements = require('./elements');
var FourDirection = require('../object').FourDirection;

var testCondition = function(scene) {
	return (scene.camera.rect.center[0] >= 200);
};

var testUpdate = function(msDuration, scene) {
	scene.camera.unfollow();
	scene.camera.panto([200,0]);
	scene.spawn(FourDirection, [200,0], elements.thug_opts);
	scene.spawn(FourDirection, [300,0], elements.thug_opts);
	scene.spawn(FourDirection, [250,200], elements.thug_opts);
	scene.spawn(FourDirection, [200,200], elements.thug_opts);
	scene.spawn(FourDirection, [300,50], elements.thug_opts);
	scene.spawn(FourDirection, [200,50], elements.thug_opts);
	scene.spawn(FourDirection, [100,224], elements.thug_opts);
	scene.spawn(FourDirection, [100,224], elements.thug_opts);
	scene.spawn(FourDirection, [150,224], elements.thug_opts);
	scene.spawn(FourDirection, [100,224], elements.thug_opts);
	scene.spawn(FourDirection, [100,224], elements.thug_opts);

	this.kill = true;
	return;
};

var testKill = function(scene) {
	return (this.kill);
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