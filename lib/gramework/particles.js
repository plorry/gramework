var gamejs = require('gamejs');
var gramework = require('gramework');

var Particle = exports.Particle = function(position, options) {
    this.x = position.x;
    this.y = position.y;
    this.size = options.size || [8,8];
    this.life = options.life || 0;
    this.elapsed = 0;
    this.speed = options.speed || [0,0];
    this.accel = options.accel || [0,0];
    this.color = options.color || [0,0,0,1];
    this.colorString = 'rgba(' + this.color.join(',') + ')';
    var imageFile = gramework.textures.simpleParticleBlurred;
    this.image = gamejs.image.load(imageFile);
    this.rect = this.image.rect;
};

Particle.prototype.update = function(dt) {
    this.elapsed += dt;
    if (this.elapsed >= this.life) return false;

    this.speed = [
        this.speed[0] + this.accel[0],
        this.speed[1] + this.accel[1]
    ];

    this.x += this.speed[0];
    this.y += this.speed[1];

    this.color[0] -= 3;
    //this.color[3] = 1 - (this.elapsed / this.life);
    this.image.setAlpha((this.elapsed / this.life));

    this.colorString = 'rgba(' + this.color.join(',') + ')';
    return true;
};

Particle.prototype.draw = function(surface) {
    //gamejs.draw.circle(surface, this.colorString, [this.x, this.y], 1, 0);
    var colorSurface = this.image.clone()
    colorSurface.fill(this.colorString);
    this.image.blit(colorSurface, [0,0], this.rect, 'source-atop');
    surface.blit(this.image, [this.x, this.y], this.rect, 'lighter');
};

var Emitter = exports.Emitter = function(position, options) {
    this.particles = [];
    this.x = position.x;
    this.y = position.y;
    // rate in particles per second
    this.rate = options.rate || 1;
    this.elapsed = 0;
};

Emitter.prototype.update = function(dt) {
    this.elapsed += dt;
    if (this.elapsed > 1000 / this.rate) {
        var p = new Particle({x: this.x, y: this.y}, {
            life: 1000,
            speed: [Math.random() - 0.5, Math.random() - 0.8],
            accel: [0, -0.01],
            color: [255,50,50,1]
        });
        this.particles.push(p);
        this.elapsed = 0;
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