gramework
=========

Modular framework for rapid game development using [GameJs](http://gamejs.org/)

Installation
===

    $ npm install git://github.com/plorry/gramework.git

Current classes available:
- 4-Direction movement object
- Scene object
- Animation class
- camera, for panning/zooming within scene

Test
===

    $ npm install -g mocha
    $ mocha ./tests


Developing locally and using
===

So you don't have to constantly publish the npm module for gramework. You can
simply do this:

    $ cd gramework/
    $ npm pack
    $ cd /path/to/your/project
    $ npm install /path/to/gramework/gramework-0.0.1.tgz
