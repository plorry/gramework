var gamejs = require('gamejs'),
    inherits = require('super');

var textures = exports.textures = {
    //TODO: Replace this hard-coded path
};

var texturePaths = Object.keys(textures).map(function(img) {
    return textures[img];
});

var init = function() {
    gamejs.preload(texturePaths);
};

module.exports = {
    Dispatcher: require('./gramework/dispatcher'),
    Entity: require('./gramework/entity'),
    Camera: require('./gramework/camera'),
    Scene: require('./gramework/scenes').Scene,
    animate: require('./gramework/animate'),
    state: require('./gramework/state'),
    image: require('./gramework/image'),
    input: require('./gramework/input'),
    layers: require('./gramework/layers'),
    particles:  require('./gramework/particles'),
    tilemap: require('./gramework/tilemap'),
    vectors: require('./gramework/vectors'),
    uielements: require('./gramework/uielements'), 
    gamejs: gamejs,
    inherits: inherits,
    init: init
};

//TODO: Kill this in favour of Entity
//exports.actors = require('./gramework/actors');
