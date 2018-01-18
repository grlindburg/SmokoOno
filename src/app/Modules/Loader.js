define(
[
  'vendor/httprequest/httprequest',
  'Modules/ThirdPartyScripts',
  'Modules/Detector',
  'Modules/TemplateLoader',
  'Factory/SolarSystemFactory',
  'vendor/ajaxrequest/dist/ajaxrequest'
],
function(
  HttpRequest,
  ThirdPartyScripts,
  Detector,
  TemplateLoader,
  SolarSystemFactory,
  AjaxRequest
) {
  'use strict';

  function notifyGa(category, action, label) {
    ga('send', 'event', category, action, label);

    console.log('Event:', category, '-', action, '-',label);
  }

  if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
    notifyGa('Compatibility Check', 'Fail', window.navigator.userAgent);
    return;
  }

  notifyGa('Compatibility Check', 'Pass', window.navigator.userAgent);

  var solarSystemData = null;
  var templateLoader = new TemplateLoader();
  var dataRequest = new HttpRequest(
    'GET',
    'src/data/solarsystem.json',
    true
  );

  dataRequest.send().then((data)=> {
    solarSystemData = data;

    var updateUserInterfaceEvent = new CustomEvent('solarsystem.update.ui', { detail: data });
    var solarSystemFactory = new SolarSystemFactory(solarSystemData);
    var introScreen = $('.intro-screen');
    var renderButton = $('#render-scene');
    var solarsystem = $('#solar-system');
    var progressPrompt = $('#loading-prompt');
    var progressBar = $('#progress-bar');

    solarsystem.fadeOut();

      //$('.inner').slideUp(500, ()=> {
        progressPrompt.addClass('active');

        solarSystemFactory.build(solarSystemData).then(()=> {
          introScreen.remove();
          solarsystem.fadeIn(2000, ()=> {
          });
        });
      //});
  });
});
