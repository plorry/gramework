var gamejs = require('gamejs');

var imgfy = exports.imgfy = function(path) {
    return gamejs.image.load(path);
};
