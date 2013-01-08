var gamejs = require('gamejs');
var config = require('./config');
var draw = require('gamejs/draw');
var Object = require('./object').Object;
var Gravity = require('./object').Gravity;
var Bounce = require('./object').Bounce;

var image_rect = [0,0,config.WIDTH,config.HEIGHT];

var font = new gamejs.font.Font('20px Lucida Console');

var sounds = {

};

//Scene Class

var Scene = exports.Scene = function(director, sceneId, objects_list) {
    var objects_list = objects_list || null;
	var debug_val = 0;
    var obj = new Object([14,14]);
    var grav = new Gravity();
    var bounce = new Bounce();
    var view = new gamejs.Surface([800, 600]);
    var subrect = new gamejs.Rect([0,0],[256, 224]);
    
    var zoom = 0.7;
    var zoom_rate = 1;
    obj.assign(grav);
    obj.assign(bounce);
    
	this.handleEvent = function(event) {
		//Gotta re-position the mouse coords based on the scale of the surface
		//event.pos = [event.pos[0] / config.SCALE, event.pos[1] / config.SCALE];
        //pos = event.pos;
        
        if (event.type === gamejs.event.KEY_DOWN) {
            if (event.key === gamejs.event.K_UP) {
                zoom_rate = 1.1;
            }
            if (event.key === gamejs.event.K_DOWN) {
                zoom_rate = 0.9;
            }
        } else if (event.type === gamejs.event.KEY_UP) {    
            zoom_rate = 1;
        }
	};

	this.update = function(msDuration) {
        obj.update(msDuration);
		if (objects_list) {
            
        }
        zoom *= zoom_rate;
	};

	this.draw = function(display) {
		display.fill("#F0A30F");
		if (image) {
    		view.blit(image);
    	}
    	obj.draw(view);

        subrect.width = config.WIDTH / zoom;
        subrect.height = config.HEIGHT / zoom;

        subrect.center = obj.pos;
        
        if (subrect.top < 0) {subrect.top = 0;}
        if (subrect.left < 0 ) {subrect.left = 0;}
        
        view_size = view.getSize();
        if (subrect.width > view_size[0]) {subrect.width = view_size[0];}
        if (subrect.height > view_size[1]) {subrect.height = view_size[1];}
        
        var subview = new gamejs.Surface(subrect);
        
        subview.blit(view,[0,0], subrect);
        scaled_view = gamejs.transform.scale(subview, [subrect.width * zoom, subrect.height * zoom]);
        //scaled_view = subview;
        
        display.blit(scaled_view);
        
        debug_val = font.render(subrect.bottom, '#555');
        display.blit(debug_val);
    };

	function initScene() {
		image = gamejs.image.load(sceneConfig.image);
        //image = gamejs.transform.scale(image, [256,224]);
	};

	var sceneId = sceneId || 0;
	var sceneConfig = config.scenes[sceneId];
	var elapsed = 0;
	var image;
    var pos;
	initScene();

	return this;
};
