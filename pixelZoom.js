window.PixelZoom = (function () {
	var x, xl,
		y, yl;
	var zoomed_size = { width: 0, height: 0 };

	return function PixelZoom(source, factor) {
		// calculate zoomed size
		zoomed_size.width = Math.floor(source.width * factor);
		zoomed_size.height = Math.floor(source.height * factor);

		// create canvas to use for rendering
		var canvas = document.createElement("CANVAS");
		var context = canvas.context = canvas.getContext && canvas.getContext("2d");

		// no 2d canvas support...
		if (!context) {
			// ...so return zoomed image
			var zoomed = source.cloneNode(true);
			zoomed.width = zoomed_size.width;
			zoomed.height = zoomed_size.height;
			return zoomed;
		}

		// set canvas to zoomed size
		canvas.width = zoomed_size.width;
		canvas.height = zoomed_size.height;

		// loop through each pixel
		x = 0; xl = source.width;
		y = 0; yl = source.height;
		while (x < xl) {
			y = 0;
			while (y < yl) {
				// draw the pixel, zoomed in, to the canvas
				context.drawImage(source, x, y, 1, 1, x * factor, y * factor, factor, factor);
				y++;
			}
			x++;
		}

		// return result
		return canvas;
	};
})();