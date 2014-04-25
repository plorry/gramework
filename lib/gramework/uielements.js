/*jshint es5:true */
/*
 * Interface Entity module.
 *
 */
var gamejs = require('gamejs');
var Entity = require('./entity'),
    inherits = require('super'),
    _ = require('underscore');

var Element = exports.Element = function(options) {
    Entity.apply(this, arguments);
};

_.extend(Element.prototype, Entity.prototype, {
    initialize: function(options) {
        // TODO: Allow borderWidth to accept array to differentiate between vertical width and horizontal width
        this.borderWidth = options.borderWidth || 0;

        if (options.color) {
            if (options.color.length === 3) {
                this.color = 'rgb(' + options.color.join(',') + ')';
            } else if (options.color.length === 4) {
                this.color = 'rgba(' + options.color.join(',') + ')';
            }
        } else {
            this.color = '#000';
        }

        if (options.borderColor) {
            if (options.borderColor.length === 3) {
                this.borderColor = 'rgb(' + options.borderColor.join(',') + ')';
            } else if (options.borderColor.length === 4) {
                this.borderColor = 'rgba(' + options.borderColor.join(',') + ')';
            }
        } else {
            this.borderColor = '#000';
        }

        if (options.borderImage) {
            this.borderImage = new BorderImage({
                slice: options.borderImageSlice,
                imgPath: options.borderImage,
                repeat: options.borderImageRepeat,
                width: this.w + this.borderWidth,
                height: this.h + this.borderWidth,
                x: this.rect.left - (this.borderWidth / 2),
                y: this.rect.top - (this.borderWidth / 2),
                //size: [width + 2 * this.borderWidth, height + 2 * this.borderWidth],
                //position: [this.position[0] - this.borderWidth, this.position[1] - this.borderWidth],
                borderWidth: this.borderWidth
            });
        }

        if (options.image) {
            this.image = gamejs.image.load(options.image);
        }
    },

    update: function(dt) {

    },

    draw: function(surface) {
        if (this.image) {

        } else {
            gamejs.draw.rect(surface, this.color, this.rect);
        }

        if (this.borderImage) {
            this.borderImage.draw(surface);
        } else if (this.borderWidth > 0){
            gamejs.draw.rect(
                surface,
                this.borderColor,
                this.rect,
                this.borderWidth
            );
        }

    }
});

var BorderImage = function(options) {
    Entity.apply(this, arguments);
};

_.extend(BorderImage.prototype, Entity.prototype, {
    initialize: function(options) {
        this.imgPath = options.imgPath;
        this.ninePatch = gamejs.image.load(this.imgPath);

        if (Array.isArray(options.slice) && options.slice.length === 2) {
            this.vSlice = options.slice[1];
            this.hSlice = options.slice[0];
        } else if (typeof options.slice === 'number') {
            this.vSlice = this.hSlice = options.slice
        }
        this.repeat = options.repeat || 'repeat';
        this.position = options.position || [0,0];
        this.borderWidth = options.borderWidth || 0;

        /*
        This is where the BorderImage object breaks apart the image file into nine sections and creates
        the respective surfaces for the corners and sides. These will be drawn around the parent element
        object at the time of rendering
        */

        var imgSize = this.ninePatch.getSize();
        if (this.vSlice > imgSize[1]) throw new Error("vert slice greater than image height");
        if (this.hSlice > imgSize[0]) throw new Error("horz slice greater than image width");

        var columnHeight = imgSize[1] - (2 * this.vSlice);
        var rowWidth = imgSize[0] - (2 * this.hSlice);
        var cornerRect = new gamejs.Rect(0,0,this.borderWidth,this.borderWidth);
        var columnRect = new gamejs.Rect(0,0,this.borderWidth,columnHeight);
        var rowRect = new gamejs.Rect(0,0,rowWidth,this.borderWidth);

        this.leftBorderFull = new gamejs.Surface(this.borderWidth, this.h - 2 * this.borderWidth);
        this.rightBorderFull = new gamejs.Surface(this.borderWidth, this.h - 2 * this.borderWidth);
        this.topBorderFull = new gamejs.Surface(this.w - 2 * this.borderWidth, this.borderWidth);
        this.bottomBorderFull = new gamejs.Surface(this.w - 2 * this.borderWidth, this.borderWidth);

        this.topLeft = new gamejs.Surface(this.borderWidth, this.borderWidth);
        this.topRight = new gamejs.Surface(this.borderWidth, this.borderWidth);
        this.bottomLeft = new gamejs.Surface(this.borderWidth, this.borderWidth);
        this.bottomRight = new gamejs.Surface(this.borderWidth, this.borderWidth);

        this.leftBorder = new gamejs.Surface(this.borderWidth, columnHeight);
        this.rightBorder = new gamejs.Surface(this.borderWidth, columnHeight);
        this.topBorder = new gamejs.Surface(rowWidth, this.borderWidth);
        this.bottomBorder = new gamejs.Surface(rowWidth, this.borderWidth);

        var topLeftRect = new gamejs.Rect(0,0,this.hSlice,this.vSlice);
        var topRightRect = new gamejs.Rect(imgSize[0]-this.hSlice,0,this.hSlice,this.vSlice);
        var bottomLeftRect = new gamejs.Rect(0, imgSize[1]-this.vSlice,this.hSlice,this.vSlice);
        var bottomRightRect = new gamejs.Rect(imgSize[0]-this.hSlice,imgSize[1]-this.vSlice,this.hSlice,this.vSlice);

        this.topLeft.blit(this.ninePatch, cornerRect, topLeftRect);
        this.topRight.blit(this.ninePatch, cornerRect, topRightRect);
        this.bottomLeft.blit(this.ninePatch, cornerRect, bottomLeftRect);
        this.bottomRight.blit(this.ninePatch, cornerRect, bottomRightRect);
        
        var leftRect = new gamejs.Rect(0,this.vSlice,this.hSlice,columnHeight);
        var rightRect = new gamejs.Rect(imgSize[0]-this.hSlice,this.vSlice,this.hSlice,columnHeight);
        var topRect = new gamejs.Rect(this.hSlice,0,rowWidth,this.vSlice);
        var bottomRect = new gamejs.Rect(this.hSlice,imgSize[1]-this.vSlice,rowWidth,this.vSlice);

        this.leftBorder.blit(this.ninePatch, columnRect, leftRect);
        this.rightBorder.blit(this.ninePatch, columnRect, rightRect);
        this.topBorder.blit(this.ninePatch, rowRect, topRect);
        this.bottomBorder.blit(this.ninePatch, rowRect, bottomRect);

        this.image = new gamejs.Surface(this.rect);

        console.log(this.x + ' ' + this.y);
        
        for (var i=0;i*this.leftBorder.getSize()[1] < this.h;i++) {
            this.leftBorderFull.blit(this.leftBorder, [0,(i*this.leftBorder.getSize()[1])]);
            this.rightBorderFull.blit(this.rightBorder, [0,(i*this.leftBorder.getSize()[1])]);
        }

        this.image.blit(this.leftBorderFull, [0, this.borderWidth]);
        this.image.blit(this.rightBorderFull, [this.w-this.borderWidth, this.borderWidth]);

        for (var i=0;i*this.topBorder.getSize()[0] < this.w;i++) {
            this.topBorderFull.blit(this.topBorder, [(i*this.topBorder.getSize()[0]),0]);
            this.bottomBorderFull.blit(this.bottomBorder, [(i*this.topBorder.getSize()[0]),0]);
        }

        this.image.blit(this.topBorderFull, [this.borderWidth, 0]);
        this.image.blit(this.bottomBorderFull, [this.borderWidth, this.h-this.borderWidth]);

        this.image.blit(this.topLeft);
        this.image.blit(this.topRight, [this.w-this.borderWidth,0]);
        this.image.blit(this.bottomLeft, [0,this.h - this.borderWidth]);
        this.image.blit(this.bottomRight, [this.w-this.borderWidth,this.h - this.borderWidth]);

        console.log(this.image);
    },

    update: function() {

    }
});

var gradientSurface = function(surface, options) {
    var gradSurface = surface.clone();

    var colors = options.colors || [[255, 255, 255]];
    var steps = options.steps || 1;

    var segHeight = gradSurface.height / this.steps;

    if (colors.length === 1){
        gradSurface.fill(colors[0]);
        return gradSurface;
    }
    var subSteps = steps / (colors.length - 1);
    colors.forEach(function(color, i) {
        if (colors[i+1] === undefined){}
        var nextColor = colors[i+1];
        var rStep = (color[0] - nextColor[0]) / subSteps;
        var gStep = (color[1] - nextColor[1]) / subSteps;
        var bStep = (color[2] - nextColor[2]) / subSteps;

        for (var i=0; i < subSteps; i++) {
            var subRect = new gamejs.Rect(
                [0, Math.floor(segHeight * i)],
                [gradSurface.width, Math.ceil(segHeight)]);
            var thisColor = [
                Math.floor(Math.abs(color[0] - (i * rStep))),
                Math.floor(Math.abs(color[1] - (i * gStep))),
                Math.floor(Math.abs(color[2] - (i * bStep)))
            ];

            var thisColor = 'rgb(' + thisColor.join(',') + ')';
            gamejs.draw.rect(gradSurface, thisColor, subRect, 0);
        }
    });

    return gradSurface;
};

/*
var font = new gamejs.font.Font('8px Ebit');

var TextBlock = exports.TextBlock = function(pos, dims, options) {
    this.rect = new gamejs.Rect(pos, dims);
    this.surface = new gamejs.Surface(this.rect);
    this.init(options);
};

TextBlock.prototype.init = function(options) {
    var fontName = options.fontName || '8px Ebit';
    this.font = new gamejs.font.Font(fontName);
    this.text = options.text || '';
    this.fontColor = options.fontColor || '#000';
    this.scrolling = options.scrolling || false;
    this.currentText = '';
    this.fontSurface = [];
    this.lines = [];

    if (this.scrolling === false) this.currentText = this.text;
    this.lineSetup();
};

TextBlock.prototype.lineSetup = function() {
    this.words = this.currentText.split(" ");
    var done = false;
    var i = 0;
    this.lines[i] = '';
    //Text line wrapping
    this.words.forEach(function(word) {
        this.fontSurface[i] = this.font.render(
            this.lines[i] + word + ' ',
            this.fontColor);
        fontSurfaceWidth = this.fontSurface[i].getSize();
        if (fontSurfaceWidth[0] > this.width) {
            //Too wide. Time to wrap
            this.fontSurface[i] = this.font.render(
                this.lines[i],
                this.fontColor);
            i++;
            this.lines[i] = '';
        }
        this.lines[i] +=  word + ' ';
    }, this);
};

TextBlock.prototype.update = function(msDuration) {
};

TextBlock.prototype.draw = function(surface) {
    var lineHeight;
    if (this.fontSurface[0]) {
        lineHeight = this.fontSurface[0].getSize()[1] || 0;
    } else {
        lineHeight = 0;
    }
    this.fontSurface.forEach(function(line, idx) {
        this.surface.blit(line, [0, idx * lineHeight]);
    }, this);

    surface.blit(this.surface, this.rect);

    return;
};




var Menu = exports.Menu = function(options){
    this.items = [];
    this.init(options);
};

Menu.prototype.init = function(options){
    this.title = options.title || undefined;
    if (options.width && options.height) {
        if (options.color.length === 4)
            var colorString = "rgba("+options.color.join(',')+")";
        else if (options.color.length === 3)
            var colorString = "rgb("+options.color.join(',')+")";
        else var colorString = "rgb(0,0,0)";
        this.surface = new Element(options.height, options.width, {
            color: colorString,
            position: options.position || [0,0],
            borderWidth: options.borderWidth || 0,
            borderImage: {
                vSlice: options.borderImage.vSlice || 0,
                hSlice: options.borderImage.hSlice || 0
            }
        });
    } else {
        this.surface = undefined;
    }
    if (options.items){
        options.items.forEach(function(item){
            var newItem = new MenuItem(item);
            this.items.push(newItem);
        }, this);
    }

    this._isActive = false;
    this.padding = options.padding || 0;
    if (options.border){

    }
};

Menu.prototype.isActive = function(){
    return this._isActive;
};

Menu.prototype.activate = function(){
    return this._isActive = true; 
};

Menu.prototype.deactivate = function(){
    return this._isActive = false;
};

Menu.prototype.update = function(dt){
    this.surface.update(dt);
};

Menu.prototype.draw = function(surface) {
    this.surface.draw(surface);
    this.items.forEach(function(item) {
        item.draw(this.surface.background);
    }, this);
};

var MenuItem = exports.MenuItem = function(options){
    this.init(options);
};

MenuItem.prototype.init = function(options){
    this.widget = options.widget;
    this.linkedValue = options.linkedValue || undefined;
    this.activate = options.onSelect || undefined;
    this._selected = false;
    this.height;
    this.width;
};

MenuItem.prototype.activate = function(){ 
    this.activate;
};

MenuItem.prototype.isSelected = function(){
    return this._selected;
};

MenuItem.prototype.select = function(){
    this._selected = true;
};

MenuItem.prototype.deselect = function(){
    this._selected = false;
};

MenuItem.prototype.draw = function(){
    this.widget.draw();
};

var MenuWidget = function(options){
    this.init(options);
};

MenuWidget.prototype.init = function(options){

};

var TextWidget = function(options){
    TextWidget.superConstructor.apply(this, arguments);
};
objects.extend(TextWidget, MenuWidget);

TextWidget.prototype.init = function(options){
    this.text = options.text;
};

var SliderWidget = function(options){
    SliderWidget.superConstructor.apply(this, arguments);
};
objects.extend(SliderWidget, MenuWidget);

SliderWidget.prototype.init = function(options){

};

*/