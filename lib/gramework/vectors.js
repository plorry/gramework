/*jslint es5: true*/
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
        return [args[0].x, args[0].y];
    } else {
        return [0, 0];
    }
}

// Help get vector (well, any) lengths down to 0
var dampen = exports.dampen = function(length, amount, min) {
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
    // Expiremental getter and setter support.
    get x() {
        return this._vec[0];
    },

    set x(value) {
        this._vec[0] = value;
    },

    get y() {
        return this._vec[1];
    },

    set y(value) {
        this._vec[1] = value;
    },

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

    unpack: function() {
        return [this._vec[0], this._vec[1]];
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
            return this.set(utils.vectors.multiply(this._vec, right._vec));
        }
        // Passed a number.
        else {
            return this.multiplyByScalar(right);
        }
    },

    magnitude: function() {
        return Math.sqrt(
            (this._vec[0] * this._vec[0]) +
            (this._vec[1] * this._vec[1])
        );
    },

    // Limit the length of a vector.
    truncate: function(length) {
        return this.set(utils.vectors.truncate(this._vec, length));
    },

    // Multiply by a provided number.
    multiplyByScalar: function(n) {
        this._vec[0] *= n;
        this._vec[1] *= n;
        return this;
    },

    normalized: function() {
        return this.set(this.multiplyByScalar(1, this.magnitude())._vec);
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

    create: function(args) {
        return new this.Vector(parseArgs(args));
    }
};

