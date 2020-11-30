var LINKAGES = {
  // just an empty linkage
  empty : function (globals) {
    globals.data = {
      points : [
        [0, 0, 'X'],
      ],
      edges: [
      ]
    }
    globals.drawLines = {};
    initKempe(globals);
  },

  //Peaucellier–Lipkin linkage
  peaucellierLipkin : function (globals) {
    globals.data = {
      points : [
        [-1, 0, 'X'],   // 0
        [0, 0, 'X'],    // 1
        [1, 0, 'F'],    // 2
        [1.5, 0.5, 'F'],    // 3
        [1.5, -0.5, 'F'],   // 4
        [2, 0, 'P'],    // 5
        [0, -1, 'X'],   // 6
        [0, 1, 'F'],    // 7
        [0.5, 1.5, 'F'],    // 8
        [-0.5, 1.5, 'F'],   // 9
        [0, 2, 'P'],    // 10
      ],
      edges: [
        [2, 7],
        [1, 2, null],
        [0, 3, null],
        [0, 4, null],
        [2, 3, null],
        [2, 4, null],
        [3, 5, null],
        [4, 5, null],
        [1, 7, null],
        [6, 8, null],
        [6, 9, null],
        [7, 8, null],
        [7, 9, null],
        [8, 10, null],
        [9, 10, null]
      ]
    }
    globals.drawLines = {};
    initKempe(globals);
  },

  peaucellierLipkin2 : function (globals) {
    globals.data = {
      points : [
        [-1, 0, 'X'],
        [0, 0, 'X'],
        [1, 0, 'F'],
        [2, 1, 'F'],
        [2, -1, 'F'],
        [3, 0, 'P']
      ],
      edges: [
        [1, 2, null],
        [0, 3, null],
        [0, 4, null],
        [2, 3, null],
        [2  , 4, null],
        [3, 5, null],
        [4, 5, null]
      ]
    }
    globals.drawLines = {};
    initKempe(globals);
  },

  fontLinkageC : function (globals) {
    globals.data = {
      points : [
        [-0.5, 0, 'X'],
        [0, 0, 'X'],
        [Math.sqrt(2), -Math.sqrt(2), 'F'],
        [(Math.sqrt(2) - 0.5) / 2, -Math.sqrt(2) / 2, 'F'],
        [Math.sqrt(2) + 0.2, -Math.sqrt(2) + 0.6, 'F']
      ],
      edges: [
        [1, 2, null],
        [0, 3, null],
        [2, 3, null],
        [2, 4, null],
      ]
    }
    globals.drawLines = {3 : true};
    initKempe(globals);
  },

  fontLinkageO : function (globals) {
    globals.data = {
      points : [
        [0, 0, 'X'],
        [1, 0, 'P'],
      ],
      edges: [
        [0, 1, null],
      ]
    };
    globals.drawLines = {};
    initKempe(globals);
  }
}

function multiplierLinkage(globals) {
  var angle = 0.5;
  var a = [0, 0, 'X'];
  var b = [1, 1, 'F'];
  var edge_length = 1.0 //
  var ret = createMLinkage(angle, a, b, edge_length);
  globals.data = {
    points : ret[0],
    edges: ret[1]
  }
  console.log(ret);
  initKempe(globals);
}
