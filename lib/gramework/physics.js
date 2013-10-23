var Box2D = require('./box2d');

console.log(Box2D);

  var b2Vec2 = Box2D.b2Vec2;
  var b2BodyDef = Box2D.b2BodyDef;
  var b2Body = Box2D.b2Body;
  var b2FixtureDef = Box2D.b2FixtureDef;
  var b2Fixture = Box2D.b2Fixture;
  var b2World = Box2D.b2World;
  var b2MassData = Box2D.b2MassData;
  var b2PolygonShape = Box2D.b2PolygonShape;
  var b2CircleShape = Box2D.b2CircleShape;
  var b2DebugDraw = Box2D.b2DebugDraw;
  var b2RevoluteJointDef = Box2D.b2RevoluteJointDef;

  BRANCH_CATEGORY = 0x0002;
  OBJECT_CATEGORY = 0x0001;

  BRANCH_MASK = OBJECT_CATEGORY;
  BRANCH_OBJECT = BRANCH_CATEGORY;

  var Physics = exports.Physics = function(element,scale) {
    var gravity = new b2Vec2(0,9.8);
    this.world = new b2World(gravity, true);
    var element = document.getElementById('gjs-canvas');
    this.context = element.getContext("2d");
    this.scale = scale || 10;
    this.dtRemaining = 0;
    this.stepAmount = 1/60;
  };

  Physics.prototype.debug = function() {
    this.debugDraw = new b2DebugDraw();
    this.debugDraw.SetSprite(this.context);
    this.debugDraw.SetDrawScale(this.scale);
    this.debugDraw.SetFillAlpha(0.3);
    this.debugDraw.SetLineThickness(1.0);
    this.debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    this.world.SetDebugDraw(this.debugDraw);
  };

  Physics.prototype.step = function(dt) {
    this.dtRemaining += dt;
    while(this.dtRemaining > this.stepAmount) {
      this.dtRemaining -= this.stepAmount;
      this.world.Step(this.stepAmount, 
                      10, // velocity iterations
                      10);// position iterations
    }
    if(this.debugDraw) {
      this.world.DrawDebugData();
    }
  };


  var Body = exports.Body = function(physics,details) {
    this.details = details = details || {};

    // Create the definition
    this.definition = new b2BodyDef();

    // Set up the definition
    for(var k in this.definitionDefaults) {
      this.definition[k] = details[k] || this.definitionDefaults[k];
    }
    this.definition.position = new b2Vec2(details.x || 0, details.y || 0);
    this.definition.linearVelocity = new b2Vec2(details.vx || 0, details.vy || 0);
    this.definition.userData = this;
    //this.definition.linearDamping = 10;
    this.definition.type = details.type == "static" ? b2Body.b2_staticBody :
                                                      b2Body.b2_dynamicBody;
    this.definition.angle = details.angle || 0;
    this.kind = details.kind;

    // Create the fixture
    this.fixtureDef = new b2FixtureDef();
    for(var l in this.fixtureDefaults) {
      this.fixtureDef[l] = details[l] || this.fixtureDefaults[l];
    }

    // Create the Body
    this.body = physics.world.CreateBody(this.definition);

    details.shape = details.shape || this.defaults.shape;
    /*
    switch(details.shape) {
      case "circle":
        details.radius = details.radius || this.defaults.radius;
        this.fixtureDef.shape = new b2CircleShape(details.radius);
        break;
      case "polygon":
        this.fixtureDef.shape = new b2PolygonShape();
        this.fixtureDef.shape.SetAsArray(details.points,details.points.length);
        break;
      case "block":
        break;
      default:
        details.width = details.width || this.defaults.width;
        details.height = details.height || this.defaults.height;
        this.width = details.width;
        this.height = details.height;

        this.fixtureDef.shape = new b2PolygonShape();
        this.fixtureDef.shape.SetAsBox(details.width,
                                       details.height);
        console.log('made a block');
        break;
    }*/
    this.fixtureDef.shape = new b2PolygonShape();
    this.fixtureDef.shape.SetAsBox(details.width, details.height);
    console.log(this.fixtureDef);

    this.body.CreateFixture(this.fixtureDef);
  };

  Body.prototype.update = function(dt) {    

  };

  Body.prototype.defaults = {
    shape: "block",
    width: 2,
    height: 2,
    radius: 1
  };

  Body.prototype.fixtureDefaults = {
    density: 2,
    friction: 1,
    restitution: 0.2
  };

  Body.prototype.definitionDefaults = {
    active: true,
    allowSleep: true,
    angle: 0,
    angularVelocity: 0,
    awake: true,
    bullet: false,
    fixedRotation: false
  };
/*
  var Joint = exports.Joint = function(physics, details) {
    this.details = details = details || {};
    this.definition = new b2RevoluteJointDef();

    this.physics = physics;

    this.strength_param = details.strength_param || 1;

    this.bodyA = details.bodyA;
    this.bodyB = details.bodyB;

    this.branchNo = 1;

    this.x = details.x;
    this.y = details.y;

    this.homeAngle = details.homeAngle || 0;

    this.definition.Initialize(
      this.bodyA,
      this.bodyB,
      { x: this.x, y: this.y }
    );

    this.definition.enableMotor = true;

    this.joint = physics.world.CreateJoint(this.definition);
  };

  Joint.prototype.getAngle = function() {
    var angle = this.joint.GetJointAngle() * 180 / Math.PI;
    return angle;
  };

  Joint.prototype.update = function(dt) {
    this.compareAngle = this.getAngle();
    
    while (this.compareAngle > 180) {
      this.compareAngle -= 360;
    }
    while (this.compareAngle < -180) {
      this.compareAngle += 360;
    }
    //var sign = (this.compareAngle - this.homeAngle)?(this.compareAngle - this.homeAngle)<0?-1:1:0
    var torque = (this.compareAngle - this.homeAngle) * this.strength_param * (-1) * (this.bodyB.GetMass());
    this.joint.SetMaxMotorTorque(
      torque
    );
    this.joint.SetMotorSpeed(
      1
      //Math.abs((this.getAngle() - this.homeAngle) * (70 / this.branchNo))
    );
    /*
    if (this.getAngle() > (100 / Math.sqrt(this.bodyB.GetMass()))){
      this.physics.world.DestroyJoint(this.joint);
    }*/
  //};

