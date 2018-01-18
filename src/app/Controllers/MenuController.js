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

      var scene2 = this.scene;

      console.log('hi');
      var loader = new THREE.OBJLoader();

      var spaceship;

      // load a resource
      spaceship = loader.load(
        // resource URL
        'src/assets/img/Low_poly_UFO.obj',
        // called when resource is loaded
        function ( object ) {

          console.log(scene2.camera.position);
          object.position.set(0, -75, -200);
          console.log(object.position);

          scene2.camera.add( object );

          scene2.camera.lookAt(object.position);
          spaceship = object;

          return spaceship;

        },
        // called when loading is in progresses
        function ( xhr ) {

          console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

          console.log( 'An error happened' );

        }
      );

      console.log(this.sceneObjects);
      console.log(this.spaceship);
      var target = this.matchTarget(3);

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
      this.template = this.templateLoader.get('planets', 'src/app/Views/menu.twig').then((template)=> {
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
