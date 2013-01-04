var gamejs = require('gamejs');
var config = require('./config');
var draw = require('gamejs/draw');
var objects = require('gamejs/utils/objects')

var Object = exports.Object = function(pos) {
    this.pos = pos;
    //behaviour = behaviour || null;
    this.draw = function(display) {
        draw.rect(display, "#000FFF", new gamejs.Rect(pos, [5,5]));
    };
    return this;
};
objects.extend(Object, gamejs.sprite.Sprite);