UI Elements
=====

Subset of entities for displaying in-game informational UI elements, such as score, 
text, gauges and meters, etc.

Usage
----

A basic UI element can be declared with exactly the same arguments as is 
passed into a generic Entity object, namely an options object with a width 
and height value, and an x and y value (position).

    var gamejs = require('gamejs'),
        Interface = require('gramework').Interface;

    var i = new Element({
        height: 64,
        width: 64,
        x: 0,
        y: 0
    });

The Interface object takes a series of further optional arguments:
- borderWidth: the integer width of the border in pixels. Defaults to 0 (no border).
- borderColor: for now, an array with either 3 elements, for RGB, or 4 for RGBA. Defaults to '[0,0,0]' (black). This will be overridden if there is a borderImage
- borderImage: a string representing the relative path to a valid image 9-patch file. Defaults to 'null'. (For more info on how to design a 9-patch see http://9-patch.com/).
- borderImageSlice: either an integer representing the width/height of the border in the 9-patch image, or an array of two integers, representing the width, then height of the border in the 9-patch. Defaults to this.borderWidth.
- borderImageRepeat: one of two strings, either 'stretch' or 'repeat', to determine how border image handles
- image: a string representing the relative path to an image file to be displayed in the element's background.
- color: For now, an array with either 3 elements, for RGB, or 4 for RGBA. Defaults to '[0,0,0]' (black). This will be the block element's background color.

A more full-fledged example, then, would look something like this:

    var i = new Element({
        height: 64,
        width: 64,
        x: 25,
        y: 25,
        borderWidth: 6,
        borderImage: 'path/to/image',
        borderImageSlice: [2, 2]
    });

Drawing this will now give us a bordered black box element, with our border image file.



Text Box
=====

The text box extends from the UI Element class. This is used to display text on screen with a number of options for customization. In addition to the options accepted by the UI Element class, it takes a few more optional arguments:

- 