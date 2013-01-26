var gamejs = require('gamejs');
var resources = require('./project/resources').resources;

gamejs.preload(
	resources
);

var Scene = require('./scenes').Scene;
var Director = require('./game').Director;
var config = require('./project/config');

function main() {
    var director = new Director();
    var firstScene = new Scene(director, config.scenes.debug);
    director.start(firstScene);
    return;
}

gamejs.ready(main);