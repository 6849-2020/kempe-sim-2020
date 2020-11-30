/***
    Based on Amanda Ghassaei's Origami Simulator
    https://github.com/amandaghassaei/OrigamiSimulator/blob/master/js/controls.js

*/

function initControls(globals){
  setLink("#about", function(){
      $('#aboutModal').modal('show');
  });

  setLink("#tips", function(){
      $('#tipsModal').modal('show');
  });

  setLink("#kempeLinkage", function(){
      $('#kempeLinkageModal').modal('show');
  });

  setRadio("kempeRenderMode", globals.kempeRenderMode, function() {});

  setLink("#doKempeLinkage", function(){
      var equation = $("#kempeEquation").val();
      globals.equation = equation;
      updateKempeLinkage(globals);
  });

  setLink("#plLinkage", function(){
      plLinkage(globals);
  });

  setLink("#cLinkage", function(){
      cLinkage(globals);
  });

  setLink("#resetBottom", function() {
    globals.data = JSON.parse(JSON.stringify(globals.resetData));
    initKempe(globals);
  });

  setLink("#importFOLD", function(e){
      $("#fileSelector").click();
      $(e.target).blur();
  });

  setLink("#saveFOLD", function() {
    $('#exportFOLDModal').modal('show');
  });

  setLink("#doFOLDsave", function() {
    saveFOLD(globals);
  });

  setCheckbox("#exportFoldEdgeLengths", globals.exportFoldEdgeLengths, function(val){
      globals.exportFoldEdgeLengths = val;
  });

  setLink(".seeMore", function(e){
      var $target = $(e.target);
      if (!$target.hasClass("seeMore")) $target = $target.parent();
      var $div = $("#"+ $target.data("id"));
      if ($target.hasClass("closed")){
          $target.removeClass("closed");
          $target.addClass("open");
          AnimateRotate(-90, 0, $target.children("span"));
          $div.removeClass("hide");
          $div.css('display', 'inline-block');
      } else {
          $target.removeClass("open");
          $target.addClass("closed");
          AnimateRotate(0, -90, $target.children("span"));
          $div.hide();
      }
  });

  if (globals.controlMode == "normal") {
    $("#normalModeOptions").show();
    $("#editModeOptions").hide();
  } else {
    $("#normalModeOptions").hide();
    $("#editModeOptions").show();
  }

  function setControlMode(val){
      globals.controlMode = val;

      if (val == "normal") $("#normalModeOptions").show();
      else $("#normalModeOptions").hide();

      if (val == "edit") $("#editModeOptions").show();
      else $("#editModeOptions").hide();

      $(".radio>input[value="+val+"]").prop("checked", true);

      updateEditMode(globals);
  }
  setRadio("controlMode", globals.controlMode, setControlMode);

  setRadio("physicsEngine", globals.physicsEngine, function(val) {
    globals.physicsEngine = val;
    updatePhysicsMode(globals);
  } );

  setLink("#viewLinkageDrawing", function() {
    setViewMode("linkage_drawing");
  });

  setLink("#viewDrawing", function() {
    setViewMode("drawing");
  });

  function setLink(id, callback){
      $(id).click(function(e){
          e.preventDefault();
          callback(e);
      });
  }

  function setCheckbox(id, state, callback){
      var $input  = $(id);
      $input.on('change', function () {
          if ($input.is(":checked")) callback(true);
          else callback(false);
      });
      $input.prop('checked', state);
  }

  function setRadio(name, val, callback){
      $("input[name=" + name + "]").on('change', function() {
          var state = $("input[name="+name+"]:checked").val();
          callback(state);
      });
      $(".radio>input[value="+val+"]").prop("checked", true);
  }

  function AnimateRotate(from, to, $elem) {
      // we use a pseudo object for the animation
      // (starts from `0` to `angle`), you can name it as you want
      $({deg: from}).animate({deg: to}, {
          duration: 200,
          step: function(now) {
              // in the step-callback (that is fired each step of the animation),
              // you can use the `now` paramter which contains the current
              // animation-position (`0` up to `angle`)
              $elem.css({
                  transform: 'rotate(' + now + 'deg)'
              });
          }
      });
  }

  $('#warningModal').on('hidden.bs.modal', function () {
      $("#warningMessage").html("");
  });
}
