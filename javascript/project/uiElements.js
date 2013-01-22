var config = require('./config');
var Element = require('../ui').Element;
var TextArea = require('../ui').TextArea;
var Animation = require('../animate').Animation;
var SpriteSheet = require('../animate').SpriteSheet;

var getElements = exports.getElements = function() {
	var elements = [];

	var testFile = config.STATIC_PATH + 'images/ui/test.png';
	var testDims = {width:30, height: 30};
	var testSheet = new SpriteSheet(testFile, testDims);
	var testAnims = {
		'static': [0]
	};

	var testElementOpts = {
		animation: testAnims,
		spriteSheet: testSheet,
		pos: "bottom-left",
		margin: 5,
	};
	
	var textOpts = {
		pos: "bottom-right",
		size: [200,35],
		margin: 5,
		text: "We're in big trouble!",
		scrolling: true
	};
	
	var test = new Element(testElementOpts);
	var text = new TextArea(textOpts);
	console.log('i');
	elements.push(test);
	elements.push(text);
	
	return elements;
};