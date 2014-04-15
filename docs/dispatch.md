Dispatcher
=====

Allows for easy management of what is presented to the user, adjusting
that stack, and ensuring the top of the stack is receiving thre three major
game events: update, draw, and input.

Usage
----

The simplest way to start with the dispatcher is give it an initial object to
work with.

    var gamejs = require('gamejs'),
        Dispatcher = require('gramework').Dispatcher;

    // Game is an object with a prototype that implements: update, draw, and
    // event.
    var d = new Dispatcher(gamejs, {
        initial: new Game()
    });

Upon start of game loop, the Dispatcher will send data to the three event
functions if they exist. For every object, these are optional, but you're most
likely going to always need *update* and *draw*, or nothing happens!

By default, the Dispatcher will attach to the first canvas element with the id
`gjs-canvas` it finds on your HTML page, and use its width/height as the main
surface of the game. You can change the lookup element by passing some
configuration options.

    var d = new Dispatcher(gamejs, {
        initial: new Game(),
        canvas: {
            id: "my-game"
        }
    });

Finally, you can optionally pass `flag` into the canvas options hash to set a
gamejs display flag it understands (See: http://docs.gamejs.org/gamejs/display/).

With the dispatcher, your ready code becomes very bare in the simplest cases. It
may look someting like this:

    var gamejs = require('gamejs'),
        Dispatcher = require('gramework').Dispatcher;

    var main = function() {
        // Game is an object with a prototype that implements: update, draw, and
        // event.
        var d = new Dispatcher(gamejs, {
            initial: new Game()
        });
    };

    gamejs.ready(main);


    
