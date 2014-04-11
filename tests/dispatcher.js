/* global describe, it*/
var assert = require("assert"),
    gamejs = require('gamejs'),
    gramework = require('../lib/gramework'),
    Dispatcher = gramework.Dispatcher;

describe("Dispatcher", function() {
    it("should initialize dispatcher", function() {
        var d = new Dispatcher(gamejs);
        assert.deepEqual(d.stack, []);
    });

    it("should allow extending", function() {
        var MyDispatcher = Dispatcher.extend({
            initialize: function() {
                this.count = 0;
            },

            onTick: function(dt) {
                this.count += 1;
            }
        });

        var d = new MyDispatcher(gamejs);
        assert.equal(d.count, 0);
        d.onTick(1);
        assert.equal(d.count, 1);
    });

    it("should initialize with stack", function() {
        var d = new Dispatcher(gamejs, {
            initial: 1
        });
        assert.deepEqual(d.stack, [1]);
    });

    it("should get top of stack", function() {
        var d = new Dispatcher(gamejs, {
            initial: 1
        });

        d.push(2);
        assert.equal(d.top(), 2);
        assert.equal(d.parent(), 1);
    });

    it("should send update to top of stack", function() {
        var ST = function() {
            this.count = 0;
        };
        ST.prototype.update = function(dt) {
            this.count += 1;
        };

        var st = new ST();
        var d = new Dispatcher(gamejs, {
            initial: st
        });

        assert.equal(st.count, 0);
        d.update(1);
        assert.equal(st.count, 1);
    });
});
