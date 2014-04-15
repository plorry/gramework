/*global document*/
var _ = require('underscore'),
    inherits = require('super');

function DispatcherException(message) {
    this.message = message;
    this.name = "DispatcherException";
}

// TODO: Transitions!
var Dispatcher = module.exports = function(gamejs, options) {
    options = (options || {});

    this.stack = [];
    if (options.initial) {
        this.push(options.initial);
    }

    options.canvas = (options.canvas || {});
    var canvas;
    if (options.canvas.id) {
        canvas = document.getElementById(options.canvas.id);
    } else {
        canvas = document.getElementById("gjs-canvas");
    }

    if (typeof canvas === "undefined") {
        throw new DispatcherException(
            "No canvas element could be found in the document.");
    }

    var surfaceFlag = options.canvas.flag || undefined;
    this.mainSurface = this._setSurface(gamejs, canvas, surfaceFlag);

    gamejs.onTick(this.onTick, this);
    gamejs.onEvent(this.onEvent, this);

    this.initialize.apply(this, arguments);
};

Dispatcher.extend = inherits.extend;
_.extend(Dispatcher.prototype, {
    // Internal function to set surface from canvas. Overrided in tests until we
    // can better figure out how to mock a *real* canvas.
    _setSurface: function(gamejs, canvas, surfaceFlag) {
        var surface = gamejs.display.setMode(
        [canvas.width, canvas.height], surfaceFlag);
        return surface;
    },

    // An empty function by default. Override it with your own initialization logic
    initialize: function(options) { },

    onTick: function(dt) {
        this.update(dt);
        this.draw(this.mainSurface);
    },

    onEvent: function(ev) {
        this.event(ev);
    },

    reset: function(initial) {
        this.stack = [];
        this.push(initial);
    },

    push: function(state, transition) {
        state.dispatcher = this;
        this.stack.push(state);
    },

    top: function() {
        return this.stack[this.stack.length - 1];
    },

    parent: function() {
        return this.stack[this.stack.length - 2];
    },

    send: function(eventType) {
        var current = this.top();
        if (typeof current[eventType] === "undefined") return;
        current[eventType].apply(current, Array.prototype.slice.call(arguments, 1));
    },

    update: function(dt) {
        this.send("update", dt);
    },

    event: function(ev) {
        this.send("event", ev);
    },

    draw: function(surface) {
        this.send("draw", surface);
    }
});
