var gamejs = require('gamejs');
var resources = require('./project/resources').resources;

gamejs.preload(
	resources
);
console.log('loaded');

var Scene = require('./scenes').Scene;
var Director = require('./game').Director;
var config = require('./project/config');

function main() {
    var director = new Director();
    var firstScene = new Scene(director, config.scenes[0]);
    director.start(firstScene);
    return;
}

gamejs.ready(main);
