var gamejs = require('gamejs');

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
    image: require('./gramework/image'),
    input: require('./gramework/input'),
    layers: require('./gramework/layers'),
    particles:  require('./gramework/particles'),
    tilemap: require('./gramework/tilemap'),
    vectors: require('./gramework/vectors'),
    gamejs: gamejs,
    init: init
};

//TODO: Kill this in favour of Entity
//exports.actors = require('./gramework/actors');

