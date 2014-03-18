/* global describe, it*/
var assert = require("assert"),
    gramework = require('../lib/gramework'),
    Dispatcher = gramework.Dispatcher;

describe("Dispatcher", function() {
    it("should initialize dispatcher", function() {
        var d = new Dispatcher({});
        assert.deepEqual(d.stack, []);
    });

    it("should initialize with stack", function() {
        var d = new Dispatcher({
            initial: 1
        });
        assert.deepEqual(d.stack, [1]);
    });

    it("should get top of stack", function() {
        var d = new Dispatcher({
            initial: 1
        });

        d.push(2);
        assert.equal(d.top(), 2);
        assert.equal(d.parent(), 1);
    });
});
