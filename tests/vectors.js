var assert = require("assert"),
    vectors = require('../lib/gramework/vectors');

var Vec2d = vectors.Vec2d;

describe('Vec2d', function() {
    it("should parseArgs", function() {
        var vector = new Vec2d({
            x: 1,
            y: 2
        });
        assert.equal(vector.x, 1);
        assert.equal(vector.y, 2);

        vector = new Vec2d(1, 2);
        assert.equal(vector.x, 1);
        assert.equal(vector.y, 2);

        vector = new Vec2d([1, 2]);
        assert.equal(vector.x, 1);
        assert.equal(vector.y, 2);
    });


});
