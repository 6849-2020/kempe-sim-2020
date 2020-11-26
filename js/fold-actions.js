function initImporter(globals) {
  var FOLD = require('fold');
  var reader = new FileReader();

  $("#fileSelector").change(function(e) {
      var files = e.target.files; // FileList object
      if (files.length < 1) {
          return;
      }

      var file = files[0];
      var extension = file.name.split(".");
      var name = extension[0];
      extension = extension[extension.length - 1];

      $(e.target).val("");

      if (extension == "fold"){
          reader.onload = function () {
              return function (e) {
                  if (!reader.result) {
                      globals.warn("Unable to load file.");
                      return;
                  }
                  globals.filename = name;
                  globals.extension = extension;
                  globals.url = null;

                  try {
                      var fold = JSON.parse(reader.result);
                      if (!fold || !fold.vertices_coords || !fold.edges_vertices){
                          globals.warn("Invalid FOLD file, must contain all of: <br/>" +
                              "<br/>vertices_coords<br/>edges_vertices");
                          return;
                      }

                      // populate edge_lengths
                      if (!fold.edges_length) {
                        fold.edges_length = [];
                        for (var i = 0; i < fold.edges_vertices.length; i++) {
                          var v1 = fold.vertices_coords[fold.edges_vertices[i][0]];
                          var v2 = fold.vertices_coords[fold.edges_vertices[i][1]];
                          fold.edges_length.push(FOLD.geom.distsq(v1, v2));
                        }
                      }

                      // if no vertices assignments, assign everything as free
                      if (!fold["vertices_kempe:assignment"]) {
                        fold["vertices_kempe:assignment"] = [];
                        for (var i = 0; i < fold.vertices_coords.length; i++) {
                          fold["vertices_kempe:assignment"].push("F");
                        }
                      }

                      setFoldData(globals, fold);
                  } catch(err) {
                      globals.warn("Unable to parse FOLD json.");
                      console.log(err);
                  }
              }
          }(file);
          reader.readAsText(file);
      } else {
          globals.warn('Unknown file extension: .' + extension);
          return null;
      }

  });
}

function saveFOLD(globals) {
  //var FOLD = require('fold');
  console.log("saving to FOLD");

  // make sure we are in normal control mode
  $("#controlModeNormal").attr('checked', true);
  $("#controlModeNormal").click();

  var d = globals.data;

  if (d.points.length == 0) {
      globals.warn("No linkage to save.");
      return;
  }

  var vertices_coords = [];
  var vertices_assignment = [];
  for (var i = 0; i < d.points.length; i++) {
    vertices_coords.push([d.points[i][0], d.points[i][1]]);
    if (d.points[i][2]) {
      vertices_assignment.push("X"); // fixed
    } else {
      if (d.points[i][3]) {
        vertices_assignment.push("P"); // pen
      } else {
        vertices_assignment.push("F"); // free
      }
    }
  }

  var edges_vertices = [];
  for (var i = 0; i < d.edges.length; i++) {
    edges_vertices.push([d.edges[i][0], d.edges[i][1]]);
  }

  var foldFile = {
    file_spec : 1.1,
    file_creator : "Kempe Simulator v0.1",
    file_author: $("#foldAuthor").val(),
    file_classes : ["singleModel"],
    frame_classes: ["linkage"],
    frame_attributes: ["2D"],
    vertices_coords : vertices_coords,
    "vertices_kempe:assignment" : vertices_assignment,
    edges_vertices : edges_vertices
  }

  if (globals.exportFoldEdgeLengths) {
    var edges_length = [];
    for (var i = 0; i < d.edges.length; i++) {
      edges_length.push(d.edges[i][2])
    }
    foldFile.edges_length = edges_length
  }

  var filename = $("#foldFilename").val();
  if (filename == "") filename = "kempe-simulator";

  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(foldFile));
  var dlAnchorElem = document.getElementById('downloadAnchorElem');
  dlAnchorElem.setAttribute("href",     dataStr     );
  dlAnchorElem.setAttribute("download", filename + ".fold");
  dlAnchorElem.click();
}
