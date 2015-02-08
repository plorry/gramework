var gamejs = require('gamejs');

var Particle = exports.Particle = function(position, options) {
    this.x = position.x;
    this.y = position.y;
    this.size = options.size || [8,8];
    this.life = options.life || Infinity;
    this.elapsed = 0;
    this.motion = options.motion || 'linear';
    this.angle = options.angle * Math.PI / 180 || 0;
    this.speed = options.speed || 1;
    this.velocity = [
        this.speed * Math.sin(this.angle),
        -this.speed * Math.cos(this.angle)
    ];
    this.decel = options.decel || 0.05;
    this.accel = options.accel || [0,0];
    this.color = options.color || [255,255,255];
    this.colorString = 'rgb(' + this.color.join(',') + ')';

    if (this.motion == 'radial') {
        this.center = options.center || {x: 0, y: 0};
        this.angle = Math.atan2(this.center.y - this.y, this.center.x - this.x);
    }
    // TODO: We shouldn't force preload these images as they are not necessary
    // for every game. Instead, allow a Particle to have an image defined
    // against it.
    var imageFile = options.imageFile; // || gramework.textures.simpleParticleBlurred;
    this.originalImage = options.image;
    this.image = this.originalImage;
    this.rect = this.image.rect;
    this.width = this.rect.width;
    this.height = this.rect.height;
    this.scale = 1;
};

Particle.prototype.update = function(dt) {
    this.elapsed += dt;
    if (this.elapsed >= this.life) return false;

    if (this.motion == 'linear') {
        this.speed = [
            this.speed[0] + this.accel[0],
            this.speed[1] + this.accel[1]
        ];
        this.x += this.velocity[0];
        this.y += this.velocity[1];

    }

    if (this.motion == 'radial') {
        this.x += this.speed;
        this.angle = Math.atan2(this.y - this.center.y, this.x - this.center.x) - Math.PI / 2;
        this.speed -= this.speed * this.decel;
    }

    this.color[0] -= 3;
    //this.color[3] = 1 - (this.elapsed / this.life);
    //this.image.setAlpha(0.4);

    this.colorString = 'rgb(' + this.color.join(',') + ')';
    this.rect.width = Math.abs(this.width * Math.cos(this.angle)) + Math.abs(this.height * Math.sin(this.angle) * this.scale);
    this.rect.height = Math.abs(this.height * Math.cos(this.angle) * this.scale) + Math.abs(this.width * Math.sin(this.angle));
    return true;
};

Particle.prototype.draw = function(surface) {
    //gamejs.draw.circle(surface, this.colorString, [this.x, this.y], 1, 0);
    var colorSurface = this.image.clone();
    colorSurface.fill(this.colorString);
    this.image = gamejs.transform.rotate(this.originalImage, this.angle * (180 / Math.PI));
    this.image.blit(colorSurface, [0,0], this.rect, 'source-atop');
    if (this.elapsed > this.life / 2) {
        this.image.setAlpha(0.9 + 0.1 * (this.life / (this.elapsed * 2)) );
    } else {
        this.image.setAlpha(0.9 + 0.1 * (this.elapsed * 2 / this.life) );
    }
    surface.blit(this.image, [this.x, this.y], this.rect, 'lighter');
};

var Emitter = exports.Emitter = function(position, options) {
    console.log(options);
    this.particles = [];
    this.x = position.x;
    this.y = position.y;
    // rate in particles per second
    this.rate = options.rate || 1;
    this.elapsed = 0;
    this.rendering = options.rendering || 'source-over';
    this.shape = options.shape || 'point';
    this.maxParticles = options.maxParticles || 1000;
    this.particleImage = options.image;
    this.motion = options.motion;
    this.center = options.center;
    this.scene = options.scene;
    this.scene.pushParticle(this);
};

Emitter.prototype.update = function(dt) {
    this.elapsed += dt;
    while (this.elapsed > 1000 / this.rate && this.particles.length < this.maxParticles) {
        var p = new Particle({x: this.x + Math.random() * 25 + 275, y: this.y}, {
            life: 1000,
            color: [255,255,255],
            motion: this.motion,
            center: this.center,
            image: this.particleImage,
            speed: (Math.random() * 2) - 1
        });
        this.particles.push(p);
        this.elapsed -= (1000 / this.rate);
    }
    this.particles.forEach(function(p, i){
        var update = p.update(dt);
        if (update === false)
            this.particles.splice(i,1);
    }, this);
};

Emitter.prototype.draw = function(surface) {
    this.particles.forEach(function(p) {
        p.draw(surface);
    }, this);
};
