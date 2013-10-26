var Transition = function() {
    console.log("Transition occuring.");
};

var Dispatcher = function(options) {
    options = (options || {});

    this.stack = [];
    this.defaultTransition = Transition;
    if (options.initial) {
        this.push(options.initial);
    }
};

Dispatcher.prototype.reset = function(initial) {
    this.stack = [];
    this.push(initial);
};

Dispatcher.prototype.push = function(state) {
    state.dispatcher = this;
    this.stack.push(state);
};

Dispatcher.prototype.top = function() {
    return this.stack[this.stack.length - 1];
};

Dispatcher.prototype.parent = function() {
    return this.stack[this.stack.length - 2];
};

Dispatcher.prototype.send = function(eventType) {
    current = this.top();
    if (typeof current[eventType] === "undefined") return;
    current[eventType].apply(current, Array.prototype.slice.call(arguments, 1));
};

Dispatcher.prototype.update = function(dt) {
    this.send("update", dt);
};

Dispatcher.prototype.event = function(ev) {
    this.send("event", ev);
};

Dispatcher.prototype.draw = function(surface) {
    this.send("draw", surface);
};

exports.Dispatcher = Dispatcher;
