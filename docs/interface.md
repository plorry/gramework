Interface Entities
=====

Subset of entities for displaying in-game informational elements, such as score, 
text, gauges and meters, etc.

Usage
----

A basic interface element can be declared with exactly the same arguments as is 
passed into a generic Entity object, namely an options object with both a width 
and height value.

    var gamejs = require('gamejs'),
        Interface = require('gramework').Interface;

    var i = new Interface({
        height: 64,
        width: 64
    });

The Interface object takes a series of further optional arguments:
- borderWidth: the integer width of the border in pixels. Defaults to 'null' (no border).
- borderColor: for now, an array with either 3 elements, for RGB, or 4 for RGBA. Defaults to '[0,0,0]' (black).
- borderImage: a string that is a relative path to a valid image 9-patch file. Defaults to 'null'.
- borderImageSlice: either an integer representing the width/height of the border in the 9-patch image, or an array of two integers, representing the width, then height of the border in the 9-patch. Defaults to this.borderWidth.
- borderImageRepeat: one of two strings, either 'stretch' or 'repeat', to determine how border image handles
- image: a string representing the relative path to an image file to be displayed