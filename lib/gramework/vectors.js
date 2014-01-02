/*
 * Vector Utilities
 *
 * For ease of implementing all your 2D Vector needs.
 * Re-uses existing vector functionality available in gamejs
 * with some additional helpful methods to make it easy
 * to work with objects that represent Vectors.
 * */

var gamejs = require('gamejs'),
    _ = require('underscore'),
    utils = gamejs.utils;

/*
 * Parse the arguments passed into Vec2d
 */
function parseArgs(args) {

    // User passed an array
    if (Array.isArray(args[0])) {
        return args[0];
    }
    // User passed x and y
    else if (args.length === 2) {
        return new Array(args[0], args[1]);
    }
    // User passed an object of x and y
    else if (args[0] === Object(args[0])) {
        // Did we just pass an arguments list, which is a pretend object?
        // or an actual object with x & y?
        if (args[0].x && args[0].y) {
            return [args[0].x, args[0].y];
        } else {
            return args[0];
        }
    } else {
        return [0, 0];
    }
}

// Help get vector (well, any) lengths down to 0
var dampen = function(length, amount, min) {
    min = (min || 0);
    if (length > min) {
        return Math.max(min, length - amount);
    } else if (length < -min) {
        return Math.min(-min, length + amount);
    } else {
        return length;
    }
};

var dampenVector = exports.dampenVector = function(vec, amount, min) {
    var length = vec.length();
    if (length === 0) return;

    var newLength = dampen(length, amount, min);

    vec.setX(vec.getX() / length * newLength);
    vec.setY(vec.getY() / length * newLength);
    return vec;
};

var Vector = function(v) {
    this._vec = new Array(v[0], v[1]);
    return this;
};

Vector.prototype = {
    length: function() {
        return utils.vectors.len(this._vec);
    },

    set: function(vec) {
        this._vec[0] = vec[0];
        this._vec[1] = vec[1];
        return this;
    },

    getX: function() {
        return this._vec[0];
    },

    getY: function() {
        return this._vec[1];
    },

    setX: function(x) {
        this._vec[0] = x;
    },

    setY: function(y) {
        this._vec[1] = y;
    },

    add: function(right) {
        // We passed a Vector object
        if (right === Object(right)) {
            right = right._vec;
        }
        // Number.
        else {
            right = [right, right];
        }
        this.set(utils.vectors.add(this._vec, right));
        return this;
    },

    mul: function(right) {
        // We passed a Vector object.
        if (right === Object(right)) {
            right = right._vec;
        }
        // Passed a number.
        else {
            right = [right, right];
        }
        this.set(utils.vectors.multiply(this._vec, right));
        return this;
    },

    // Limit the length of a vector.
    cap: function(length) {
        var current = this.length();
        if (current > length) {
            this._vec[0] = this._vec[0] / current * length;
            this._vec[1] = this._vec[1] / current * length;
        }
        return this;
    },

    isZero: function() {
        return (this._vec[0] === 0 && this._vec[1] === 0);
    }
};

// Primary accessor to Vector interface.
var Vec2d = exports.Vec2d = function() {
    return this.create(arguments);
};

Vec2d.prototype = {
    Vector: Vector,

    create: function() {
        return new this.Vector(parseArgs(arguments));
    }
};

