var gamejs = require('gamejs');

var Particle = exports.Particle = function(position, options) {
    this.x = position.x;
    this.y = position.y;
    this.size = options.size || [8,8];
    this.life = options.life || Infinity;
    this.elapsed = 0;
    this.motion = options.motion || 'linear';
    this.angle = options.angle * Math.PI / 180 || 0;
    this.speed = options.speed || 0;
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
        this.angle = Math.atan2(this.center.y - this.y, this.center.x - this.x) + Math.PI/2;
    }
    // TODO: We shouldn't force preload these images as they are not necessary
    // for every game. Instead, allow a Particle to have an image defined
    // against it.
    var imageFile = options.imageFile; // || gramework.textures.simpleParticleBlurred;
    this.originalImage = options.image;
    this.image = this.originalImage;
    this.rect = this.image.rect.clone();
    this.width = this.rect.width;
    this.height = this.rect.height;
    this.scale = 1 * Math.random() + 1;
    // this.image = this.originalImage;
    this.image = gamejs.transform.rotate(this.originalImage, this.angle * (180 / Math.PI));
    this.rect.width = Math.abs(this.width * Math.cos(this.angle)) + Math.abs(this.height * Math.sin(this.angle) * this.scale);
    this.rect.height = Math.abs(this.height * Math.cos(this.angle) * this.scale) + Math.abs(this.width * Math.sin(this.angle));
    if (options.alpha) {
        this.image.setAlpha(options.alpha);
    }
    if (options.zValue) {
        this.zValue = options.zValue;
        this.scaleFactor = 20 / (this.zValue + 20);
        this.scrollFactor = this.zValue / (this.zValue + 20);
        this.rect.width *= this.scaleFactor;
        this.rect.height *= this.scaleFactor;
    }
    this.follow = options.follow;
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
        this.speed -= this.speed * this.decel;
    }

    //this.color[3] = 1 - (this.elapsed / this.life);
    //this.image.setAlpha(0.4);

    this.colorString = 'rgb(' + this.color.join(',') + ')';
    return true;
};

Particle.prototype.draw = function(surface, camera) {
    // if (this.follow.y || this.follow.x) {
        var offset = [
            (camera.rect.center[0] - this.x) * (this.scrollFactor),
            (camera.rect.center[1] - this.y) * (this.scrollFactor)
        ];

        if (this.follow.x) {
            offset[0] = camera.rect.left;
        }
        if (this.follow.y) {
            offset[1] = camera.rect.top;
        }
        var destRect = new gamejs.Rect([this.x + offset[0] - (this.rect.width / 2), this.y + offset[1]], [this.rect.width, this.rect.height]);
    // } else {
        // var destRect = new gamejs.Rect([this.x, this.y], [this.size[0], this.size[1]]);
    // }
    
    if (destRect.collideRect(camera.rect)) {
        surface.blit(this.image, destRect, this.image.rect, 'lighter');
    }
};

var Emitter = exports.Emitter = function(position, options) {
    this.particles = [];
    this.x = position.x;
    this.y = position.y;
    this.type = 'Emitter';
    // rate in particles per second
    this.rate = options.rate || 1;
    this.life = options.life || 500;
    this.elapsed = 0;
    this.rendering = options.rendering || 'source-over';
    this.shape = options.shape || 'point';
    this.maxParticles = options.maxParticles || 1000;
    this.particleImage = options.image;
    if (options.imageFile) {
        this.particleImage = gamejs.image.load(options.imageFile);
    }
    this.motion = options.motion;
    this.center = options.center;
    this.scene = options.scene;
    this.follow = options.follow || {x: false, y: false};
    this.scene.pushLayer(this);
    this.alpha = options.alpha || 0;
    this.zRange = options.zRange || [0,0];
    this.xWidth = options.xWidth || 10;
};

Emitter.prototype.update = function(dt) {
    this.elapsed += dt;
    while (this.elapsed > 1000 / this.rate && this.particles.length < this.maxParticles) {
        var zValue = Math.pow(Math.random(), 2) * (this.zRange[1] - this.zRange[0]) + this.zRange[0];
        if (Math.random() >= 0.5) {
            zValue = zValue - this.zRange[0];
        }
        var scaleFactor = 20 / (zValue + 20);
        var zOffMid = (((this.zRange[1] + this.zRange[0]) / 2) - zValue);
        var maxX = Math.sqrt(125 - (Math.pow(zOffMid, 2))) * this.xWidth;
        var xOffset = Math.pow(Math.random(), 3) * maxX * scaleFactor;
        if (Math.random() >= 0.5) {
            xOffset = -xOffset;
        }
        var p = new Particle({x: this.x + xOffset, y: this.y}, {
            life: this.life,
            color: [255,255,255],
            motion: this.motion,
            center: this.center,
            image: this.particleImage,
            speed: 0,
            alpha: this.alpha,
            zValue: zValue,
            follow: this.follow
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

Emitter.prototype.draw = function(surface, camera) {
    this.particles.forEach(function(p) {
        p.draw(surface, camera);
    }, this);
};
