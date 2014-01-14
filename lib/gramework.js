var gamejs = require('gamejs');

module.exports = {
    Dispatcher: require('./gramework/dispatcher'),
    Entity: require('./gramework/entity'),
    Camera: require('./gramework/camera'),
    Scene: require('./gramework/scenes').Scene,
    animate: require('./gramework/animate'),
    input: require('./gramework/input'),
    particles:  require('./gramework/particles'),
    tilemap: require('./gramework/tilemap'),
    vectors: require('./gramework/vectors')
};

//TODO: Kill this in favour of Entity
//exports.actors = require('./gramework/actors');

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
