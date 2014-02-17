/*global describe, it*/
var assert = require("assert"),
    gramework = require("../lib/gramework"),
    Entity = gramework.Entity;

describe('Inherits', function() {
    it('should run root constructor', function() {
        var Foo = Entity.extend({
            initialize: function() {
                this._constructed = true;
            }
        });

        var f = new Foo({
            y: 0, x: 0,
            width: 32, height: 32
        });

        assert.ok(f.rect);
        assert.equal(f._constructed, true);
    });
});
