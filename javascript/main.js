var gamejs = require('gamejs');
var Scene = require('./scenes').Scene;
var Director = require('./game').Director;


gamejs.preload([
    './static/images/backgrounds/background1.jpg'
]);



function main() {

    var director = new Director();
    var firstScene = new Scene(director, 0);
    director.start(firstScene);
    return;

}

gamejs.ready(main);
