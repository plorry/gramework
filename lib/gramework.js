var gamejs = require('gamejs');

exports.camera = require('./gramework/camera');
exports.animate = require('./gramework/animate');
exports.tilemap = require('./gramework/tilemap');
exports.actors = require('./gramework/actors');
exports.scenes = require('./gramework/scenes');
exports.physics = require('./gramework/physics');
exports.dispatcher = require('./gramework/dispatcher');
exports.input = require('./gramework/input');
exports.particles = require('./gramework/particles');

var textures = exports.textures = {
	//TODO: Replace this hard-coded path
	simpleParticleBlurred: './node_modules/gramework/lib/textures/simpleParticleBlurred.png'
};

var texturePaths = Object.keys(textures).map(function(img) {
    return textures[img];
});

exports.init = function() {
	gamejs.preload(texturePaths);
};