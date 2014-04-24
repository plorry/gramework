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


Transitions
====

When pushing new scenes into the Dispatcher, you may want a transition, so it's
not so sudden! There are some conveniences setup for you to make this simple.

By default, the Dispatcher references a no-op Transition class as
`defaultTransition`

But you can easily adjust this to implement your own, or use one of the
built-ins. Currently, we provide a simple `FadeTransition` class. You'd set it
like so:

    var gamejs = require('gamejs'),
        gramework = require('gramework'),
        Dispatcher = gramework.Dispatcher,
        FadeTransition = gramework.state.FadeTransition;

    var d = new Dispatcher(gamejs, {
        defaultTransition: FadeTransition
    });

Now, upon using `push` to adjust the dispatch stack, the FadeTransition will run
between states and you'll have some smooth transitions.

You'll notice the default FadeTransition uses fades in and out to black, but
this may not be ideal. You can easily adjust the default values by extending a
transition.

    var MyTransition = FadeTransition.extend({
        colour: [255, 0, 255],
        time: 4.0
    });

Finally, you can create your own. Just extend the base `Transition` object and
implement the following spec as you need.

    var MyTransition = Transition.extend({
        initialize: function(before, after, options) {},
        draw: function(surface) {},
        update: function(dt) {}
    });
