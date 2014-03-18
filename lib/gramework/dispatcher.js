var _ = require('underscore'),
    inherits = require('super');

var FadeTransition = function(options) {
};

var Dispatcher = module.exports = function(options) {
    options = (options || {});
    this.stack = [];
    if (options.initial) {
        this.push(options.initial);
    }

    this.initialize.apply(this, arguments);
};

Dispatcher.extend = inherits.extend;

Dispatcher.prototype.initialize = function(options) {};

_.extend(Dispatcher.prototype, {
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
