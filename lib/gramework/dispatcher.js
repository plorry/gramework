var _ = require('underscore');

var Transition = function() {
    console.log("Transition occuring.");
};

var Dispatcher = module.exports = function(options) {
    this.initialize(options);
};

_.extend(Dispatcher.prototype, {
    initialize: function(options) {
        options = (options || {});

        this.stack = [];
        this.defaultTransition = Transition;
        if (options.initial) {
            this.push(options.initial);
        }
    },

    reset: function(initial) {
        this.stack = [];
        this.push(initial);
    },

    push: function(state) {
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
        current = this.top();
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
