/* global describe, it, window:true, document:true*/
var assert = require("assert"),
    sinon = require('sinon'),
    gamejs = require('gamejs'),
    gramework = require('../lib/gramework'),
    Dispatcher = gramework.Dispatcher;

window = require("jsdom").jsdom().createWindow();
document = window.document;

Dispatcher = Dispatcher.extend({
    // We cannot test with a real canvas yet -- Don't know what works, and
    // simply creating canvas element in jsdom fails since we don't have a
    // getContext implementation. For now, do this and lose some testing
    // coverage.
    _setSurface: function() {
        return {};
    }
});

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

    it("should default a game surface if no config passed", function() {
        // Create a blank canvas element so Dispatcher can attach to it.
        var canvas = document.createElement("canvas");
        canvas.id = "gjs-canvas";
        var body = document.getElementsByTagName('body')[0];
        body.appendChild(canvas);

        var spy = sinon.spy(Dispatcher.prototype, '_setSurface');
        var d = new Dispatcher(gamejs);
        assert.ok(spy.calledWith(gamejs, canvas));
    });

    it("should initialize with stack", function() {
        var d = new Dispatcher(gamejs, {
            initial: 1,
            defaultTransition: null
        });
        assert.deepEqual(d.stack, [1]);
    });

    it("should get top of stack", function() {
        var d = new Dispatcher(gamejs, {
            initial: 1,
            defaultTransition: null
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
            initial: st,
            defaultTransition: null
        });

        assert.equal(st.count, 0);
        d.update(1);
        assert.equal(st.count, 1);
    });
});
