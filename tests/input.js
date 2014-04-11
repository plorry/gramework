/* global describe, it*/
var assert = require("assert"),
    gamejs = require('gamejs'),
    gramework = require('../lib/gramework'),
    input = gramework.input;

describe("GameController", function() {
    it("should define default controls", function() {
        var cr = new input.GameController();
        assert.equal(cr.controls.left, gamejs.event.K_LEFT);
        assert.equal(cr.controls.right, gamejs.event.K_RIGHT);
        assert.equal(cr.controls.up, gamejs.event.K_UP);
        assert.equal(cr.controls.down, gamejs.event.K_DOWN);
    });

    it("should allow custom controls", function() {
        var cr = new input.GameController({
            left: 'a', right: 'd', down: 's', up: 'w'
        });

        assert.equal(cr.controls.left, 'a');
        assert.equal(cr.controls.right, 'd');
        assert.equal(cr.controls.up, 'w');
        assert.equal(cr.controls.down, 's');
    });
});

describe("GameController Vector", function() {
    it("should create appropriate vector", function() {
        var cr = new input.GameController();

        cr.handle({
            type: gamejs.event.KEY_DOWN,
            key: gamejs.event.K_UP
        });
        assert.equal(cr.keyDown, gamejs.event.K_UP);

        var v = cr.movementVector();
        assert.equal(v.x, 0);
        assert.equal(v.y, -1);
    });
});
