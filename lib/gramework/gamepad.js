var _ = require('underscore');

var gamepadConnected = exports.gamepadConnected = function(evt) {
    console.log(evt);
}

var initGamepad = exports.initGamepad = function() {
    window.addEventListener('gamepadconnected', function() {
        console.log('gamepad detected');
        console.log();
    });
}

var Gramepad = exports.Gramepad = function() {
};

_.extend(Gramepad.prototype, {
    getGamepad: function() {
        return navigator.getGamepads()[0]
    }
});