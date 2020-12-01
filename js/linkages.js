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
  },

  jansenLinkage : function (globals) {
    globals.data = jansenLeg();
    var scale = 3;
    for (var i=0; i < globals.data.points.length; i++) {
      globals.data.points[i][0] *= scale;
      globals.data.points[i][1] *= scale;
      globals.data.points[i][0] -= 1;
      globals.data.points[i][1] -= 2.5;
    }
    globals.drawLines = {};
    initKempe(globals);
  },

  strandbeestLinkage : function (globals) {
    var leg1 = jansenLeg();
    var offset = leg1.points[0][0];;
    for (var i=0; i < leg1.points.length; i++) {
      leg1.points[i][0] -= offset;
    }

    // leg 1 reflected
    var leg2 = jansenLeg();

    var scale = 3;

    for (var i=0; i < leg2.points.length; i++) {
      leg2.points[i][0] -= offset;
      leg2.points[i][0] *= -1;
    }

    for (var i=0; i < leg2.edges.length; i++) {
      leg2.edges[i][0] += leg1.points.length;
      leg2.edges[i][1] += leg1.points.length;
    }

    // leg 3

    var leg3 = jansenLegDiffAngle();
    var offset2 = leg3.points[0][0];
    for (var i=0; i < leg3.points.length; i++) {
      leg3.points[i][0] -= offset2;
      leg3.points[i][1] += 2.5;
      leg3.points[i][1] /= scale;
      leg3.points[i][0] /= scale;
    }
    for (var i=0; i < leg3.edges.length; i++) {
      leg3.edges[i][0] += leg1.points.length + leg2.points.length;
      leg3.edges[i][1] += leg1.points.length + leg2.points.length;
    }

    // leg 3

    var leg4 = jansenLegDiffAngle2();
    for (var i=0; i < leg4.points.length; i++) {
      leg4.points[i][0] -= offset2;
      leg4.points[i][1] += 2.5;
      leg4.points[i][1] /= scale;
      leg4.points[i][0] /= scale;
      leg4.points[i][0] *= -1;
    }
    for (var i=0; i < leg4.edges.length; i++) {
      leg4.edges[i][0] += leg1.points.length + leg2.points.length + leg3.points.length;
      leg4.edges[i][1] += leg1.points.length + leg2.points.length + leg3.points.length;
    }

    globals.data = {
      points : leg1.points.concat(leg2.points).concat(leg3.points).concat(leg4.points),
      edges : leg1.edges.concat(leg2.edges).concat(leg3.edges).concat(leg4.edges),
    }
    // connect the legs
    globals.data.edges.push([1,
      1 + leg1.points.length + leg1.points.length + leg2.points.length]);
    globals.data.edges.push([1 + leg1.points.length,
      1 + leg1.points.length + leg2.points.length]);
    globals.data.edges.push([1 + leg1.points.length,
      1 + leg1.points.length + leg2.points.length + leg3.points.length]);
    globals.data.edges.push([1,
      1 + leg1.points.length + leg2.points.length]);

    // scale aand center
    for (var i=0; i < globals.data.points.length; i++) {
      globals.data.points[i][0] *= scale;
      globals.data.points[i][1] *= scale;
      globals.data.points[i][1] -= 2.5;
    }
    globals.drawLines = {};
    initKempe(globals);
  }
}

// https://upload.wikimedia.org/wikipedia/commons/2/23/Strandbeest_Leg_Proportions.svg
function jansenLeg() {
  var points = [
    [0.743, 1.165, 'X'],
    [0.884, 1.137, 'F'],
    [0.517, 1.476, 'F'],
    [0, 1.265, 'F'],
    [0.360, 1.089, 'X'],
    [0.443, 0.707, 'F'],
    [0.128, 0.891, 'F'],
    [0.264, 0.250, 'P'],
  ];
  var edges = [
    [0, 1],  // m
    [1, 2],  // j
    [2, 3],  // e
    [2, 4],  // b
    [3, 4],  // d
    [4, 5],  // c
    [1, 5],  // k
    [5, 6],  // g
    [3, 6],  // k
    [6, 7],  // g
    [5, 7],  // k
  ];

  return {points: points, edges: edges};
}

function jansenLegDiffAngle() {
  var points = [
    [1.229,0.995, 'X'],
    [1.233028445497283,1.4262409670090217, 'F'],
    [-0.15239526366537828,1.9981597952442653, 'F'],
    [-1.1139049641208458,0.6263766141511153, 'F'],
    [0.08,0.767, 'X'],
    [0.5699280828764313,-0.2984986971409324, 'F'],
    [-0.5197678168784405,-0.3999474332465167, 'F'],
    [0.9316116732414128,-1.7258020918194075, 'P']
  ];
  var edges = [
    [0, 1],  // m
    [1, 2],  // j
    [2, 3],  // e
    [2, 4],  // b
    [3, 4],  // d
    [4, 5],  // c
    [1, 5],  // k
    [5, 6],  // g
    [3, 6],  // k
    [6, 7],  // g
    [5, 7],  // k
  ];
  return {points: points, edges: edges};
}

function jansenLegDiffAngle2() {
  var points = [
    [1.229,0.995, 'X'],
    [1.2345222281601709,0.5637755746758455, 'F'],
    [0.5839824897358934,1.9140674130318622, 'F'],
    [-0.9844717501604023,1.3256446930835828, 'F'],
    [0.08,0.767, 'X'],
    [-0.39656805389169963,-0.30454089516447236, 'F'],
    [-1.3662338446847497,0.20288127045868004, 'F'],
    [-0.8691806950418647,-1.6990470053787898, 'P']
  ];
  var edges = [
    [0, 1],  // m
    [1, 2],  // j
    [2, 3],  // e
    [2, 4],  // b
    [3, 4],  // d
    [4, 5],  // c
    [1, 5],  // k
    [5, 6],  // g
    [3, 6],  // k
    [6, 7],  // g
    [5, 7],  // k
  ];
  return {points: points, edges: edges};
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
