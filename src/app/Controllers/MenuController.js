define(
[
	'jquery',
	'underscore',
	'backbone',
	'Controllers/TravelController',
  'Controllers/MoonMenuController',
	'Modules/TemplateLoader',
  'Models/Planet',
  'Models/Moon'
],
function(
  $,
  _,
  Backbone,
  TravelController,
  MoonMenuController,
  TemplateLoader,
  Planet,
  Moon,
  MoonData
) {
  'use strict';

  const ORBIT_COLOR_DEFAULT = '#ffffff';
  const ORBIT_COLOR_HIGHLIGHT = '#ffffff';
  const ORBIT_COLOR_ACTIVE = '#ffffff';

  return Backbone.View.extend({
    events: {
      'click a[data-id]': 'onClick',
      'mouseenter a[data-id]': 'onMouseEnter',
      'mouseleave a[data-id]': 'onMouseLeave'
    },

    toRadians: function(angle) {
      return angle * (Math.PI / 180);
    },

    toDegrees: function(angle) {
      return angle * (180 / Math.PI);
    },

    initialize: function(options) {
      this.scene = options.scene || null;
      this.camera = this.scene ? this.scene.camera : null;
      this.data = options.data || {};
      this.sceneObjects = options.sceneObjects || [];
      this.travelController = new TravelController(this.scene);
      this.templateLoader = new TemplateLoader();
      this.moonDataModel = null;
      this.isTraveling = false;
      this.hasTraveled = false;

      console.log(this.scene.children);

      var scene2 = this.scene;

      var loader = new THREE.OBJLoader();

      var spaceship;

      var so = this.sceneObjects;


      VolumetricFire.texturePath = '/SmokoOno/src/assets/textures/';

      var width = window.innerWidth;
      var height = window.innerHeight;

      var fireWidth  = 2391016;
      var fireHeight = 2391016;
      var fireDepth  = 2;
      var sliceSpacing = 0.5;

      var fire = new VolumetricFire(
        fireWidth,
        fireHeight,
        fireDepth,
        sliceSpacing,
        this.camera
      );

      fire.mesh.name = "fire!";
      scene2.add( fire.mesh );
      scene2._fire = fire;
      console.log(fire);
      // you can set position, rotation and scale
      // fire.mesh accepts THREE.mesh features
      fire.mesh.position.set( 0, fireHeight / 2, 0 );


      // load a resource
      spaceship = loader.load(
        // resource URL
        'http://grlindburg.com/SmokoSystem/src/assets/img/ufo.obj',
        // called when resource is loaded
        function ( object ) {

          console.log('hey now');

          object.position.set(0, -35, -100);

          var ufoMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: scene2._cubeCamera.renderTarget.texture, reflectivity: 0.9 } );
          object.children[0].material = ufoMaterial;
          object.children[1].material = ufoMaterial;


          scene2.camera.add( object );
          scene2.camera.lookAt(object.position);


          //scene2._cubeCamera.position.copy(object.position );

          object.add(scene2._cubeCamera);

          //console.log(object);
          spaceship = object;
          //so['ship'] = spaceship;

          setInterval(function(){
            spaceship.children[0].rotation.y += .03;
            spaceship.children[1].rotation.y += .03;
          }, 1)


          return spaceship;

        },
        // called when loading is in progresses
        function ( xhr ) {


        },
        // called when loading has errors
        function ( error ) {


        }
      );      

      var target = this.matchTarget(3);

      //scene2.add(cubeCamera);


      //this.travelController.travelToObject(
      //  this.scene.camera.parent.position,
      //  target,
      //  target.threeDiameter * 2.5
      //);

      //this.travelController.travelToObject(
      //  spaceship.position,
      //  target,
      //  target.threeDiameter * 2.5
      //);

      this.currentTarget = options.currentTarget || this.sceneObjects[0];
      this.template = this.templateLoader.get('planets', 'http://grlindburg.com/SmokoSystem/src/app/Views/menu.twig').then((template)=> {
        this.template = template;
        this.render();
        this.initializePlugins();
        this.initializeListeners();

        this.moonMenuController = new MoonMenuController({
          el: $('#moons'),
          scene: this.scene,
          data: this.data,
          sceneObjects: this.sceneObjects.moons
        });
      });

      var loader = new THREE.FontLoader();

      var controller = this;

      loader.load( 'http://grlindburg.com/SmokoSystem/src/assets/fonts/helvetiker_bold.typeface.json', function ( font ) {

          var textGeo = new THREE.TextGeometry( "Superstar Moves", {

              font: font,

              size: .15,
              height: .05
              //curveSegments: 12,

              //bevelThickness: 2,
              //bevelSize: 5,
              //bevelEnabled: true

          } );

          var textMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff } );

          var mesh = new THREE.Mesh( textGeo, textMaterial );
          //mesh.position.set(-.2, .55, 0);
          mesh.position.set(0,0,0);
          mesh.geometry.translate(-.7, 0, 1);
          //mesh.rotation.set(controller.toRadians(90), controller.toRadians(180), 0);


          //so.planets[2].threeObject.add( mesh );

      } );

      loader.load( 'http://grlindburg.com/SmokoSystem/src/assets/fonts/helvetiker_bold.typeface.json', function ( font ) {

          var textGeo = new THREE.TextGeometry( "COMING SOON", {

              font: font,

              size: .15,
              height: .05
              //curveSegments: 12,

              //bevelThickness: 2,
              //bevelSize: 5,
              //bevelEnabled: true

          } );

          var textMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff } );

          var mesh = new THREE.Mesh( textGeo, textMaterial );
          //mesh.position.set(-.7, 1, 0);
          mesh.position.set(0,0,0);
          mesh.geometry.translate(-.7, 0, 1);
          //mesh.rotation.set(controller.toRadians(90), controller.toRadians(180), 0);


          //so.planets[1].threeObject.add( mesh );

      } );


    },

    initializePlugins: function() {
      //this.accordion = new Foundation.Accordion(this.$('.accordion'), { allowAllClosed: true });
    },

    render: function() {
      this.$el.html(this.template.render({ planets: this.data.planets }));
    },

    onClick: function(e) {
      var id = Number.parseInt(e.currentTarget.dataset.id);
      var target = this.matchTarget(id);

      if (this.isCurrentTarget(target)) {
        e.stopImmediatePropagation();
        return false;
      }

      if(id == 2) {
        $('input').fadeIn();
        $('textarea').fadeIn();
        $('button').fadeIn();
        $('input').addClass('contact');
        $('textarea').addClass('contact');
        $('button').addClass('contact');
      } else {
        $('input').fadeOut();
        $('textarea').fadeOut();
        $('button').fadeOut();
        $('input').removeClass('contact');
        $('textarea').removeClass('contact');
        $('button').removeClass('contact');

      }

      this.travelToObject(target);
    },

    onMouseEnter: function(e) {
      var id = Number.parseInt(e.currentTarget.dataset.id);
      var target = this.matchTarget(id);
    },

    onMouseLeave: function(e) {
      var id = Number.parseInt(e.currentTarget.dataset.id);
      var target = this.matchTarget(id);
    },

    travelToObject: function(target) {
      // Return old target to default orbit line color
      if (this.currentTarget && this.currentTarget.orbitLine) {
        this.currentTarget.orbitLine.orbit.material.color = new THREE.Color(ORBIT_COLOR_DEFAULT);
      }

      // Change new target orbit line color
      target.orbitLine.orbit.material.color = new THREE.Color(ORBIT_COLOR_ACTIVE); // same color as hover and active state
      target.orbitLine.orbit.material.needsUpdate = true;

      this.travelController.travelToObject(
        this.scene.camera.parent.position,
        target,
        target.threeDiameter * 2.5
      );

      this.currentTarget = target;
    },

    matchTarget: function(id) {
      var target = null;

      for (var i = 0; i < this.sceneObjects.planets.length; i++) {
        if (this.sceneObjects.planets[i].id === id) {
          return this.sceneObjects.planets[i];
      	}
      }

      return target;
    },

    isCurrentTarget: function(target) {
      return this.currentTarget && _.isEqual(this.currentTarget.id, target.id);
    },

  	highlightObject: function(e) {
		  var target = this.matchTarget(Number.parseInt(e.currentTarget.dataset.id));

      this.highlightTarget(target);
      this.highlightOrbit(target);
    },

    unhighlightObject: function(e) {
      var target = this.matchTarget(Number.parseInt(e.currentTarget.dataset.id));

      this.unhighlightTarget(target);
      this.unhighlightOrbit(target);
    },

    highlightTarget: function(target) {
      var distanceTo = this.scene.camera.position.distanceTo(target.threeObject.position);
      var highlightDiameter = distanceTo * 0.011; // 1.1% of distance to target

      target.highlight = highlightDiameter;
      target.highlight.material.opacity = 0.9;
    },

    highlightOrbit: function(target) {
      var hightlightColor = '#ffffff'; // target.orbitHighlightColor || #216883

      target.orbitLine.orbit.material.color = new THREE.Color(ORBIT_COLOR_HIGHLIGHT); // new THREE.Color('#d3d3d3');
      target.orbitLine.orbit.material.needsUpdate = true;
    },

    unhighlightTarget: function(target) {
      target.core.remove(target.highlight);
    },

    unhighlightOrbit: function(target) {
      target.orbitLine.orbit.material.color = new THREE.Color(ORBIT_COLOR_DEFAULT);
      target.orbitLine.orbit.material.needsUpdate = true;
    },

    initializeListeners: function() {
      document.addEventListener('solarsystem.travel.planet.start', this.handleTravelStart.bind(this));
      document.addEventListener('solarsystem.travel.planet.complete', this.handleTravelComplete.bind(this));
      document.addEventListener('solarsystem.focalpoint.change', this.handleTravelComplete.bind(this));
    },

    handleTravelStart: function(e) {
      this.isTraveling = true;

      $('#current-target-title').removeClass('active').html('');
    },

    handleTravelComplete: function(e) {
      var object = e.detail;

      $('#current-target-title').html(object.name).addClass('active');

      this.moonMenuController.setModel(object._moons);
      this.isTraveling = false;
    }
  });
});
