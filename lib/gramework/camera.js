/*
 * Create a camera around a display.
 *
 * Create a constrainted view around a specific region, and/or 
 * follow specific positions on the map.
 *
 * Example usage:
 *
 *  var gamejs = require('gamejs')
 *      , Camera = require('gramework/camera');
 *
 *  var surfaceWidth = 640
 *      , surfaceHeight = 480;
 *
 *  var display = gamejs.display.setMode([surfaceWidth, surfaceHeight]);
 *  var surface = new gamejs.Surface([surfaceWidth, surfaceHeight]);
 *  var camera = new Camera(surface, {
 *      width: surfaceWidth / 2,
 *      height: surfaceHeight / 2
 *  })
 *
 *  And, on tick:
 *
 *  var tick = function(msDuration) {
 *      camera.update(msDuration);
 *
 *      // Draw all your actors, backgrounds, etc on primary surface.
 *      display.clear()
 *      surface.blit(aBackground);
 *      actors.draw(surface);
 *
 *      // Then, given the camera has the surface which you've blitted
 *      // everything onto, it will create a constrained view of the surface, which
 *      // you can blit back onto the screen. Performance should be ideal.
 *      var view = camera.draw();
 *      display.blit(view);
 *  };
 */

var gamejs = require('gamejs'),
    _ = require('underscore');

/* Camera initialization.
 *
 * `surface`, an instance of gamejs.Surface.
 * `options`, a hash containing optional keys for `width` and `height`
 *      of the camera. As well as a `zoom` level (default: 1).
 *
 *
 */

var Camera = module.exports = function(sceneExtents, options) {
    this.initialize(sceneExtents, options);
};

_.extend(Camera.prototype, {
    initialize: function(sceneExtents, options) {
        this.width = options.width || 400;
        this.height = options.height || 300;
        this.zoom = options.zoom || 1;
        this.rect = new gamejs.Rect([0,0], [this.width, this.height]);

        this.sceneExtents = sceneExtents;

        this.center = null;
        this.dest = null;
        this.xSpeed = 0;
        this.ySpeed = 0;
        this.zoom_multiplier = 1;
        this.targetZoom = null;
        this.sharp = options.sharp || true;

        // Our constrainted camera view
        this.view = new gamejs.Surface(this.rect);
        return this;
    },

    update: function(dt) {
        // Pan to dest
        if (this.dest !== null) {
            if (this.rect.center[0] < this.dest[0]) {this.rect.moveIp(this.xSpeed,0);}
            if (this.rect.center[0] > this.dest[0]) {this.rect.moveIp(this.xSpeed,0);}
            if (this.rect.center[1] < this.dest[1]) {this.rect.moveIp(0,this.ySpeed);}
            if (this.rect.center[1] > this.dest[1]) {this.rect.moveIp(0,this.ySpeed);}

            this.xSpeed = (this.dest[0] - this.rect.center[0]) / 10;
            this.ySpeed = (this.dest[1] - this.rect.center[1]) / 10;

            if (this.dest == this.rect.center) {
                this.dest = null;
                this.xSpeed = 0;
                this.ySpeed = 0;
            }
        }
        if (this.center !==null) {
            this.dest = this.center.center();
        }

        if (this.targetZoom !== null) {
            if (this.targetZoom > this.zoom) {
                this.zoom_multiplier = 1 + ((this.targetZoom - this.zoom) * 0.1);
            }
            if (this.targetZoom < this.zoom) {
                this.zoom_multiplier = 1 + ((this.targetZoom - this.zoom) * 0.1);
            }
            if (this.targetZoom == this.zoom) {
                this.targetZoom = null;
                this.zoom_multiplier = 1;
            }
        }

        if (this.rect.width <= this.sceneExtents.width && this.rect.height <= this.sceneExtents.height) {
            this.zoom = this.zoom * this.zoom_multiplier;
        }
        this.rect.width = this.width / this.zoom;
        this.rect.height = this.height / this.zoom;

        if (this.sharp) {
            this.rect.left = Math.round(this.rect.left);
            this.rect.top = Math.round(this.rect.top);
        }

        // The camera's extent cannot be bigger than the current surface's size
        if (this.rect.width > this.sceneExtents.width) {
            this.rect.width = this.sceneExtents.width;
        }

        if (this.rect.height > this.sceneExtents.height) {
            this.rect.height = this.sceneExtents.height;
        }

        // The camera cannot pan beyond the extents of the scene
        if (this.rect.top < 0) {
            this.rect.top = 0;
        }
        if (this.rect.left < 0) {
            this.rect.left = 0;
        }
        if (this.rect.bottom > this.sceneExtents.height) {
            this.rect.bottom = this.sceneExtents.height;
        }
        if (this.rect.right > this.sceneExtents.width) {
            this.rect.right = this.sceneExtents.width;
        }
    },

    draw: function(source, destination) {
        destination.blit(source, destination.rect, this.rect);
    },

    panTo: function(pos) {
        this.dest = pos;
        return;
    },

    follow: function(rect) {
        this.center = rect;
        return;
    },

    unfollow: function() {
        this.center = null;
        return;
    },

    // TODO: What does this accept exactly?
    zoomTo: function(zoom) {
        this.targetZoom = zoom;
        return;
    }
});
