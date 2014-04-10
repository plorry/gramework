var _ = require('underscore'),
    inherits = require('super');

// TODO: Transitions!
var Dispatcher = module.exports = function(gamejs, options) {
    options = (options || {});

    this.stack = [];
    if (options.initial) {
        this.push(options.initial);
    }

    gamejs.onTick(this.onTick, this);
    gamejs.onEvent(this.onEvent, this);

    this.initialize.apply(this, arguments);
};

Dispatcher.extend = inherits.extend;
_.extend(Dispatcher.prototype, {
    // An empty function by default. Override it with your own initialization logic
    initialize: function(options) { },

    onTick: function(dt) {
        this.update(dt);
        this.draw(dt);
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
