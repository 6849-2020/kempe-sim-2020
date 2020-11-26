var cvs;
var ctx;
var errordisplay;

var starttime = new Date().getTime();

var objs = [];
var ply = {};
var NUM_OBJECTS = 10;
var FPS = 60.0/3;
var PLY_SPEED = 100.0/FPS;
var TILE_WIDTH = 50;
var map = {};
var view = {};
var VIEW_WIDTH = 500;
var VIEW_HEIGHT = 500;
var data;
var drawdata;
var selected;
var highlight;
var dragging;
var line_start, line_end;
var edit_mode;
var lastpos;
var RADIUS = 16;
var cx, cy, sx, sy;
var cmx, cmy;
var lines = {};
var equs;
var world;
var bodies;
var mousejoint = null;
var BOX2DPHYSICS = false;
var USEPHYSICS = true;
var equationCurve;
var accuraterender = true;
var fakecolor = {};
var terms;
var anglea, angleb;
var displayhelp  = true;
var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

var drawTrace = false;
var traceHistory = [];


function kempeStart(globals) {
    equationCurve = false;
    BOX2DPHYSICS = (globals.physicsEngine == "box2d");
    cvs = document.getElementById("graphics-canvas");
    ctx = cvs.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    //ctx.fillRect(0,0,500,500);
    ctx.fillStyle = "#000000";
    pos = [0,0];
    corners = [ [0,0],
                [500,0],
                [0,500]];

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    cvs.addEventListener('mousedown', handleMouseDown);
    cvs.addEventListener('mouseup', handleMouseUp);
    cvs.addEventListener('mousemove', handleMouseMove);
    cvs.addEventListener('mousewheel', handleMouseWheel);
    cvs.addEventListener('mousemove', handleMouseHover);
    cvs.addEventListener('mouseout', handleMouseOut);
    cvs.addEventListener('click', handleMouseClick);

    recalcViewDimentions();

    cvs.onselectstart = function () { return false; } // ie
    cvs.onmousedown = function () { return false; } // mozilla

    ctx.fillStyle = 'red';

    initKempe(globals);

    if (equationCurve)
        initlinkage();
    tick();
}

var last_doc_width;
var last_doc_length;
function recalcViewDimentions()
{
    var widthminus = -19
    var heightminus = -80;
    if (equationCurve)
    {
        widthminus = -19;
        heightminus = -90;
    }
    widthminus = 0;
    heightminus = 0;
    cvs.width = window.innerWidth+widthminus;
    cvs.height = window.innerHeight+heightminus;
    VIEW_WIDTH = cvs.width;+widthminus;
    VIEW_HEIGHT = cvs.height+heightminus;
    last_doc_width = window.innerWidth+widthminus;
    last_doc_length = window.innerHeight+heightminus;
}


function pushToTrace(x, y) {
  if (!drawTrace)
    return;
  if (traceHistory.length == 0) {
    traceHistory.push([x, y]);
  } else {
    // only add point if it's far enough than previous point
    var lastPoint = traceHistory[traceHistory.length - 1]
    var dist = Math.sqrt((lastPoint[0] - x) ** 2 + (lastPoint[1] - y) ** 2);
    if (dist > 0.01) {
      traceHistory.push([x, y]);
    }
  }
  if (traceHistory.length > 1000) {
    traceHistory.shift();
  }
}

function createPhysicsWorld() {
    var   b2Vec2 = Box2D.Common.Math.b2Vec2
       ,  b2AABB = Box2D.Collision.b2AABB
       ,  b2BodyDef = Box2D.Dynamics.b2BodyDef
       ,  b2Body = Box2D.Dynamics.b2Body
       ,  b2FixtureDef = Box2D.Dynamics.b2FixtureDef
       ,  b2Fixture = Box2D.Dynamics.b2Fixture
       ,  b2World = Box2D.Dynamics.b2World
       ,  b2MassData = Box2D.Collision.Shapes.b2MassData
       ,  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
       ,  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
       ,  b2DebugDraw = Box2D.Dynamics.b2DebugDraw
       ,  b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
       ,  b2DistanceJoint = Box2D.Dynamics.Joints.b2DistanceJoint
       ,  b2DistanceJointDef = Box2D.Dynamics.Joints.b2DistanceJointDef
       ,  b2RevolveJoint = Box2D.Dynamics.Joints.b2RevoluteJoint
       ,  b2RevolveJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef
       ;
    world = new b2World(
          new b2Vec2(0, 0)    //gravity
       ,  true                 //allow sleep
    );
    bodies = [];

    var emptyvec = new b2Vec2();

    var fixDef = new b2FixtureDef;
    fixDef.density = 1.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;

    fixDef.shape = new b2CircleShape(RADIUS);
    fixDef.filter.categoryBits = 1;
    fixDef.filter.maskBits = 0;

    var bodyDef = new b2BodyDef;

    // for (var i=data.length-1; i>=0; i--)
    for (var i=0; i<data.points.length; i++)
    {

        if (data.points[i][2] == 'X')
            bodyDef.type = b2Body.b2_staticBody;
        else
            bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.x = data.points[i][0];
        bodyDef.position.y = data.points[i][1];
        var bod = world.CreateBody(bodyDef);
        bod.CreateFixture(fixDef);

        bodies.push(bod);
        bod.m_angularDamping = 30.0;
        bod.m_linearDamping = 30.0;
    }

    var distJointDef = new b2DistanceJointDef;
    distJointDef.collideConnected = false;
    var revJointDef = new b2RevolveJointDef;
    revJointDef.collideConnected = false;

    // distJointDef.frequencyHz = 30;
    // distJointDef.dampingRatio = 1;

    bodyDef.type = b2Body.b2_dynamicBody;
    var j;

    for (var i=0; i<data.edges.length; i++)
    {
        // fixDef.shape = new b2PolygonShape;
        // fixDef.shape.SetAsEdge(new b2Vec2(0, 0),
        //                         new b2Vec2(data.points[data.edges[i][1]][0]-data.points[data.edges[i][0]][0],
        //                                     data.points[data.edges[i][1]][1]-data.points[data.edges[i][0]][1]));
        // bodyDef.position.x = data.points[data.edges[i][0]][0];
        // bodyDef.position.y = data.points[data.edges[i][0]][1];
        // var bod = world.CreateBody(bodyDef);
        // bod.CreateFixture(fixDef);
        // revJointDef.Initialize(bod, bodies[data.edges[i][0]], bodies[data.edges[i][0]].GetWorldCenter());
        // j = world.CreateJoint(revJointDef);
        // revJointDef.Initialize(bod, bodies[data.edges[i][1]], bodies[data.edges[i][1]].GetWorldCenter());
        // j = world.CreateJoint(revJointDef);

        distJointDef.Initialize(bodies[data.edges[i][0]],
            bodies[data.edges[i][1]],
            bodies[data.edges[i][0]].GetWorldCenter(),
            bodies[data.edges[i][1]].GetWorldCenter());
        j = world.CreateJoint(distJointDef);

    }
}

function initProcessLinesAndPoints() {
    lines = {};
    // console.log(data);
    for (var i=0; i<data.edges.length; i++)
    {
        if (data.edges[i][0] == data.edges[i][1])
            continue;

        if (data.points[data.edges[i][0]][2] == 'X' && data.points[data.edges[i][1]][2] == 'X') continue;

        if (data.edges[i][0] < data.edges[i][1])
            lines[data.edges[i][0]+" "+data.edges[i][1]] = true;
        else
            lines[data.edges[i][1]+" "+data.edges[i][0]] = true;

    }

    data.edges = [];
    for (var k in lines)
    {
        var s = k.split(" ");
        var p1 = parseInt(s[0]);
        var p2 = parseInt(s[1]);
        if (data.points[p1][2] == 'X' && data.points[p2][2] == 'X') continue;
        var x = data.points[p1][0]-data.points[p2][0];
        var y = data.points[p1][1]-data.points[p2][1];
        data.edges.push([p1, p2, Math.sqrt(x*x+y*y)]);
    }

    for (var i=0; i<data.edges.length; i++)
    {
        lines[data.edges[i][0]+" "+data.edges[i][1]] = i;
    }

    for (var i=0; i<data.points.length; i++)
    {
        for (var j=data.points[i].length; j<5; j++)
            data.points[i].push(0);
    }

    if (BOX2DPHYSICS)
        createPhysicsWorld();
}

function hasLine(l) {
    if (l[0] < l[1])
        return lines[l[0]+" "+l[1]] !== undefined;
    else
        return lines[l[1]+" "+l[0]] !== undefined;
}

function addLine(l) {
    if (hasLine(l))
        return;
    if (l[0] < l[1])
        lines[l[0]+" "+l[1]] = data.edges.length;
    else
        lines[l[1]+" "+l[0]] = data.edges.length;
    data.edges.push([l[0],l[1]]);
}

function removeLine(l) {
    if (!hasLine(l))
        return;
    var index = 0;
    if (l[0] < l[1])
    {
        index = lines[l[0]+" "+l[1]];
        lines[l[0]+" "+l[1]] = false;
        delete lines[l[0]+" "+l[1]];
    } else
    {
        index = lines[l[1]+" "+l[0]];
        lines[l[0]+" "+l[1]] = false;
        delete lines[l[1]+" "+l[0]];
    }

    if (index == data.edges.length-1)
        data.edges.splice(data.edges.length-1,1);
    else
    {
        var old = data.edges[data.edges.length-1];
        data.edges[index] = old;
        lines[old[0]+" "+old[1]] = index;
        data.edges.splice(data.edges.length-1,1);
    }
}

function renameLines(a, b) {
    for (var x=0; x<data.edges.length; x++)
    {
        if (data.edges[x][0] == a || data.edges[x][1] == a)
        {
            if (data.edges[x][0] > data.edges[x][1])
            {
                var temp = data.edges[x][0];
                data.edges[x][0] = data.edges[x][1];
                data.edges[x][1] = temp;
            }
            lines[data.edges[x][0]+" "+data.edges[x][1]] = false;
            delete lines[data.edges[x][0]+" "+data.edges[x][1]]
            if (data.edges[x][0] == a) data.edges[x][0] = b;
            else data.edges[x][1] = b;
            if (data.edges[x][0] > data.edges[x][1])
            {
                var temp = data.edges[x][0];
                data.edges[x][0] = data.edges[x][1];
                data.edges[x][1] = temp;
            }
            lines[data.edges[x][0]+" "+data.edges[x][1]] = x;
        }
    }
}

function removePoint(p) {
    var l;
    for (var x=0; x<data.points.length; x++)
    {
        if (x < p)
            removeLine([x,p]);
        else if (x > p)
            removeLine([p,x]);
    }

    if (p == data.points.length-1)
        data.points.splice(data.points.length-1, 1);
    else
    {
        var old = data.points[data.points.length-1];
        data.points[p] = old;
        renameLines(data.points.length-1, p);
        data.points.splice(data.points.length-1,1);
    }

}

function initKempe(globals) {
    var data1 =
    {
      points:
        [
            [0  ,   0 ,   'X'],
            [0  ,   1 ,   'F'],
            [1  ,   1 ,   'P']
        ],
      edges:
        [
            [0, 1,  1],
            [1, 2,  1],
        ]
    };

    var data2 =
    {
      points:
        [
            [0  ,   0   ,   true],
            [0  ,   1 ,   false],
            [1,   0   ,   false],
            [1,   1 ,   false]
        ],
      edges:
        [
            [0, 1,  1],
            [0, 2,  1],
            [2, 3,  1],
            [1, 3,  1],
        ]
    };

    data = data1;

    selected = false;
    dragging = false;
    highlight = false;
    edit_mode = (globals.controlMode == "edit");
    sx = 150;
    sy = -150;
    cx = VIEW_WIDTH/2;
    cy = VIEW_HEIGHT/2;
    lastpos = [0,0];
    line_start = false;
    line_end = [0,0];
    traceHistory = [];

    if (equationCurve)
        data = data2;
    else
        data = data1;

    globals.data = data;

    initProcessLinesAndPoints();
}

function setFoldData(globals, fold) {
  data = {
    points : [],
    edges : []
  }

  for (var i = 0; i < fold.vertices_coords.length; i++) {
    data.points.push([fold.vertices_coords[i][0], fold.vertices_coords[i][1], fold["vertices_kempe:assignment"][i]]);
  }

  for (var i = 0; i < fold.edges_vertices.length; i++) {
    data.edges.push([fold.edges_vertices[i][0], fold.edges_vertices[i][1], fold.edges_length[i]]);
  }

  selected = false;
  dragging = false;
  highlight = false;
  edit_mode = (globals.controlMode == "edit");
  sx = 150; // TODO: find proper scale
  sy = -150; // TODO: find proper scale
  cx = VIEW_WIDTH/2; // TODO: find proper center
  cy = VIEW_HEIGHT/2; // TODO: find proper center
  lastpos = [0,0];
  line_start = false;
  line_end = [0,0];

  globals.data = data;

  initProcessLinesAndPoints();
}


var LINE_BORDER_WIDTH = 6;
var LINE_WIDTH = 4;
function draw() {
    if (equationCurve)
        dd = drawdata;
    else
        dd = data;
    if (window.innerWidth !== last_doc_width)
        recalcViewDimentions();

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    // i moved this before because i don't think we want to trace over the linkage
    // is there a way to make the trace not do that original jump at the very start
    if (traceHistory.length) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'red';
      ctx.beginPath();
      // relative positions because trace should move when we move the linkage
      ctx.moveTo(cx + sx*traceHistory[0][0], cy + sy*traceHistory[0][1]);
      for (var i = 1; i < traceHistory.length; i++) {
        ctx.lineTo(cx + sx*traceHistory[i][0], cy + sy*traceHistory[i][1])
      }
      ctx.stroke();
    }

    ctx.fillStyle = 'blue';
    ctx.strokeStyle = 'blue';
    if (equationCurve)
    {
        ctx.fillStyle = '#8888ff';
        ctx.strokeStyle = '#8888ff';
    }


    for (var i=0; i<dd.edges.length; i++)
    {
        ctx.lineWidth = LINE_BORDER_WIDTH;
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(cx+sx*dd.points[dd.edges[i][0]][0],cy+sy*dd.points[dd.edges[i][0]][1]);
        ctx.lineTo(cx+sx*dd.points[dd.edges[i][1]][0],cy+sy*dd.points[dd.edges[i][1]][1]);
        ctx.closePath();
        ctx.stroke();
        ctx.lineWidth = LINE_WIDTH;
        if (equationCurve)
            ctx.strokeStyle = '#8888ff';
        else
            ctx.strokeStyle = '#ec008b';
        ctx.beginPath();
        ctx.moveTo(cx+sx*dd.points[dd.edges[i][0]][0],cy+sy*dd.points[dd.edges[i][0]][1]);
        ctx.lineTo(cx+sx*dd.points[dd.edges[i][1]][0],cy+sy*dd.points[dd.edges[i][1]][1]);
        ctx.closePath();
        ctx.stroke();
    }

    if (line_start)
    {
        ctx.lineWidth = LINE_BORDER_WIDTH;
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(cx+sx*dd.points[line_start-1][0],cy+sy*dd.points[line_start-1][1]);
        if (highlight && highlight!==line_start)
            ctx.lineTo(cx+sx*dd.points[highlight-1][0],cy+sy*dd.points[highlight-1][1]);
        else
            ctx.lineTo(cx+sx*line_end[0],cy+sy*line_end[1]);
        ctx.closePath();
        ctx.stroke();
        ctx.lineWidth = LINE_WIDTH;
        if (highlight && highlight!==line_start)
        {
            if (hasLine([highlight-1, line_start-1])) {
                ctx.strokeStyle = '#ff4444';
            } else {
                ctx.strokeStyle = '#ec008b';
            }
        } else {
            ctx.strokeStyle = '#ecbed9';
        }
        ctx.beginPath();
        ctx.moveTo(cx+sx*dd.points[line_start-1][0],cy+sy*dd.points[line_start-1][1]);
        if (highlight && highlight!==line_start)
            ctx.lineTo(cx+sx*dd.points[highlight-1][0],cy+sy*dd.points[highlight-1][1]);
        else
            ctx.lineTo(cx+sx*line_end[0],cy+sy*line_end[1]);
        ctx.closePath();
        ctx.stroke();
    }

    for (var i=dd.points.length-1; i>=0; i--)
    {
        if (!equationCurve && (selected == i+1 || highlight == i+1 || line_start == i+1)) {
            ctx.fillStyle = '#888888';
         } else {
            if (dd.points[i][2] == 'X') {
                ctx.fillStyle = 'black';
            } else if (dd.points[i][2] == 'P') {
                ctx.fillStyle = '#40E0D0';
            } else {
                if (equationCurve) {
                    var cccc = fakecolor[""+i];
                    if (cccc == undefined)
                        ctx.fillStyle = '#8888ff';//'blue';
                    else ctx.fillStyle = cccc;
                } else {
                  ctx.fillStyle = 'blue';
                }
            }
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.arc((cx+sx*dd.points[i][0]),
                (cy+sy*dd.points[i][1]),
                RADIUS/2, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (dd.points[i][2] == 'P')
          pushToTrace(dd.points[i][0], dd.points[i][1]);
    }

    if (equationCurve)
    {
        if (drawdata.hasOwnProperty("finalPoints"))
            for (var i=0; i<drawdata.finalPoints.length; i++)
            {
                ctx.fillStyle = fakecolor[""+drawdata.finalPoints[i]];

                ctx.lineWidth = 1;
                ctx.strokeStyle = 'black';
                ctx.beginPath();
                ctx.arc((cx+sx*dd.points[drawdata.finalPoints[i]][0]),
                        (cy+sy*dd.points[drawdata.finalPoints[i]][1]),
                        RADIUS/2, 0, Math.PI*2, true);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

        ctx.fillStyle = 'brown';
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.arc((cx+sx*dd.points[dd.points.length-2][0]),
                (cy+sy*dd.points[dd.points.length-2][1]),
                RADIUS/2, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        for (var i=0; i<data.edges.length; i++)
        {
            ctx.lineWidth = LINE_BORDER_WIDTH;
            ctx.strokeStyle = 'black';
            ctx.beginPath();
            ctx.moveTo(cx+sx*data.points[data.edges[i][0]][0],cy+sy*data.points[data.edges[i][0]][1]);
            ctx.lineTo(cx+sx*data.points[data.edges[i][1]][0],cy+sy*data.points[data.edges[i][1]][1]);
            ctx.closePath();
            ctx.stroke();
            ctx.lineWidth = LINE_WIDTH;
            ctx.strokeStyle = 'blue';
            ctx.beginPath();
            ctx.moveTo(cx+sx*data.points[data.edges[i][0]][0],cy+sy*data.points[data.edges[i][0]][1]);
            ctx.lineTo(cx+sx*data.points[data.edges[i][1]][0],cy+sy*data.points[data.edges[i][1]][1]);
            ctx.closePath();
            ctx.stroke();
        }

        for (var i=0; i<data.points.length; i++)
        {

            if (selected == i+1 || highlight == i+1 || line_start == i+1)
            {
                if (data.points[i][2] == 'X')
                {
                    ctx.fillStyle = '#FF8888'
                }
                else
                {
                    ctx.fillStyle = '#88FF88';
                }


             }
             else
             {
                if (data.points[i][2] == 'X')
                    ctx.fillStyle = 'red'
                else
                {
                    if (i==0)
                        ctx.fillStyle = 'red';
                    else if (i==1)
                        ctx.fillStyle = Colors.rgb2hex(43, 145, 250);
                    else if (i==2)
                        ctx.fillStyle = Colors.rgb2hex(250, 145, 43);
                    else {
                        ctx.fillStyle = 'green';
                    }
                }
            }

            if (i == 3) { // there's no comments on the original code but i think i==3 means that its the drawing vertex
              pushToTrace(data.points[i][0], data.points[i][1]);
            }

            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
            ctx.beginPath();
            ctx.arc((cx+sx*data.points[i][0]),
                    (cy+sy*data.points[i][1]),
                    RADIUS/2, 0, Math.PI*2, true);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }
}

function toggleEditMode() {
    edit_mode = !edit_mode;
    if (!edit_mode)
        initProcessLinesAndPoints();
}

function togglePhysicsMode() {
    var isedit = edit_mode;
    if (!isedit)
        toggleEditMode();
    BOX2DPHYSICS = !BOX2DPHYSICS;
    if (!isedit)
        toggleEditMode();
}

function figureAngles(a, b) {
    var ang1 = Math.atan2(a[1],a[0]);
    var ang2 = Math.atan2(b[1],b[0]);
    var diff1 = (((ang1-anglea)%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
    if (diff1 < Math.PI)
        anglea += diff1;
    else anglea += diff1-Math.PI*2;
    var diff2 = (((ang2-angleb)%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
    if (diff2 < Math.PI)
        angleb += diff2;
    else angleb += diff2-Math.PI*2;
}

var count = 0;
function update() {
    if (!edit_mode && USEPHYSICS)
    {
        if (equationCurve)
        {
            if (selected)
            {
                var dx = cmx-data.points[selected-1][0];
                var dy = cmy-data.points[selected-1][1];
                var forces = pgramForces(data, selected-1, dx, dy);
                // RK4step(data, forces, 0.1);
                timeStep(data, forces, 0.1);
                // if (count<=10)
                //     console.log(forces);
            } else
            {
                var i = 0;
                for (i=0; i<data.points.length; i++)
                    if (data.points[i][2] != 'X') break;
                var forces = pgramForces(data, i, 0, 0);
                // RK4step(data, forces, 0.1);
                timeStep(data, forces, 0.1);
                // if (count<=10)
                //     console.log(forces);
            }
            figureAngles(data.points[1], data.points[2]);
            fakecolor = {};

            if (!accuraterender)
                drawdata = createOptimizedKempeLinkage(data.points[1], data.points[2],terms, fakecolor, anglea, angleb);
            else
                drawdata = createKempeLinkage(normalize(data.points[1]),normalize(data.points[2]),terms, anglea, angleb);


        } else
        {
            if (BOX2DPHYSICS)
            {
                for (var i=0; i<bodies.length; i++)
                {
                    var pos = bodies[i].GetPosition();
                    data.points[i][0] = pos.x;
                    data.points[i][1] = pos.y;
                    // console.log(pos);
                }
                world.Step(1 / 60, 10, 10);
                world.ClearForces();
            } else
            {
                count++;
                if (selected)
                {
                    var dx = cmx-data.points[selected-1][0];
                    var dy = cmy-data.points[selected-1][1];
                    var forces = evalForces3(data, selected-1, dx, dy);
                    // RK4step(data, forces, 0.1);
                    timeStep(data, forces, 0.1);
                    // if (count<=10)
                    //     console.log(forces);
                } else
                {
                    var i = 0;
                    for (i=0; i<data.points.length; i++)
                        if (data.points[i][2] != 'X') break;
                    var forces = evalForces3(data, i, 0, 0);
                    // RK4step(data, forces, 0.1);
                    timeStep(data, forces, 0.1);
                    // if (count<=10)
                    //     console.log(forces);
                }
            }
        }
    }
}

function handleMouseClick(e) {
    if (edit_mode)
    {
        // ctrl
        if (currentKeysDown[17]) {
            var mx = (e.offsetX-cx)/sx;
            var my = (e.offsetY-cy)/sy;

            var pointType;
            // shift
            if (currentKeysDown[16]) {
              pointType = 'X';
            } else if (currentKeysDown[18]) { // alt
              pointType = 'P';
            } else {
              pointType = 'F';
            }

            data.points.push([mx, my, pointType]);

            return;
        } else if (currentKeysDown[18]) {
            var mx = (e.offsetX-cx)/sx;
            var my = (e.offsetY-cy)/sy;
            for (var i=0; i<data.points.length; i++)
            {
                if ((Math.abs(data.points[i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data.points[i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
                {
                    removePoint(i);
                    return;
                }
            }
        }
    } else
    {

    }
}

function handleMouseHover(e) {
    var mx = (e.offsetX-cx)/sx;
    var my = (e.offsetY-cy)/sy;
    if (edit_mode)
    {
        // ctrl
        if (currentKeysDown[17]) {
            return;
        }

        if (highlight == false)
        {
            for (var i=0; i<data.points.length; i++)
            {
                if ((Math.abs(data.points[i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data.points[i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
                {
                    highlight = i+1;
                    lastpos[0] = mx;
                    lastpos[1] = my;
                    break;
                }
            }
        } else if (highlight != false) {
            i = highlight-1;
            if (!((Math.abs(data.points[i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data.points[i][1]-my) <= RADIUS/2.0/Math.abs(sy))))
            {
                highlight = false;
            }
        }

    } else {
        if (selected == false && highlight == false)
        {
            for (var i=0; i<data.points.length; i++)
            {
                if (data.points[i][2] == 'X')
                    continue;
                if ((Math.abs(data.points[i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data.points[i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
                {
                    highlight = i+1;
                    lastpos[0] = mx;
                    lastpos[1] = my;
                    break;
                }
            }
        } else if (selected != false) {
            highlight = selected;
        } else if (highlight != false) {
            i = highlight-1;
            if (!((Math.abs(data.points[i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data.points[i][1]-my) <= RADIUS/2.0/Math.abs(sy))))
            {
                highlight = false;
            }
        }
    }
}

function handleMouseWheel(e) {
    if (e.wheelDelta)
    {
        if (edit_mode)
        {
            var w = e.wheelDelta/120;
            if (w>0)
            {
                for (var i=0; i<w; i++)
                {
                    sx /= 0.9;
                    sy /= 0.9;
                    cx = VIEW_WIDTH/2 + (cx-VIEW_WIDTH/2)/0.9
                    cy = VIEW_HEIGHT/2 + (cy-VIEW_HEIGHT/2)/0.9
                }
            } else
            {
                for (var i=0; i<-w; i++)
                {
                    sx *= 0.9;
                    sy *= 0.9;
                    cx = VIEW_WIDTH/2 + (cx-VIEW_WIDTH/2)*0.9
                    cy = VIEW_HEIGHT/2 + (cy-VIEW_HEIGHT/2)*0.9
                }
            }
        } else {
            var w = e.wheelDelta/120;
            if (w>0)
            {
                for (var i=0; i<w; i++)
                {
                    sx /= 0.9;
                    sy /= 0.9;
                    cx = VIEW_WIDTH/2 + (cx-VIEW_WIDTH/2)/0.9
                    cy = VIEW_HEIGHT/2 + (cy-VIEW_HEIGHT/2)/0.9
                }
            } else
            {
                for (var i=0; i<-w; i++)
                {
                    sx *= 0.9;
                    sy *= 0.9;
                    cx = VIEW_WIDTH/2 + (cx-VIEW_WIDTH/2)*0.9
                    cy = VIEW_HEIGHT/2 + (cy-VIEW_HEIGHT/2)*0.9
                }
            }
        }
    }
    e.returnValue = false;
    e.preventDefault();
    return false;
}

function handleMouseDown(e) {
    drawTrace = true;
    if (edit_mode)
    {
        // ctrl
        if (currentKeysDown[17]) {
            return;
        }

        // shift - create line
        if (currentKeysDown[16]) {
            var mx = (e.offsetX-cx)/sx;
            var my = (e.offsetY-cy)/sy;
            for (var i=0; i<data.points.length; i++)
            {
                if ((Math.abs(data.points[i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data.points[i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
                {
                    line_start = i+1;
                    break;
                }
            }
            if (line_start)
            {
                line_end[0] = mx;
                line_end[1] = my;
            }
            return;
        }

        // no keys
        {
            var mx = (e.offsetX-cx)/sx;
            var my = (e.offsetY-cy)/sy;
            for (var i=0; i<data.points.length; i++)
            {
                if ((Math.abs(data.points[i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data.points[i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
                {
                    selected = i+1;
                    lastpos[0] = mx;
                    lastpos[1] = my;
                    break;
                }
            }
            if (selected == false)
            {
                dragging = true;
                lastpos[0] = e.offsetX;
                lastpos[1] = e.offsetY;
            }
        }
    } else {
        var mx = (e.offsetX-cx)/sx;
        var my = (e.offsetY-cy)/sy;
        for (var i=0; i<data.points.length; i++)
        {
            if (data.points[i][2] == 'X')
                continue;
            if ((Math.abs(data.points[i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data.points[i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
            {
                selected = i+1;
                lastpos[0] = mx;
                lastpos[1] = my;
                if (BOX2DPHYSICS)
                {
                    var md = new Box2D.Dynamics.Joints.b2MouseJointDef();
                    md.bodyA = world.GetGroundBody();
                    md.bodyB = bodies[selected-1];
                    md.bodyB.SetAwake(true);
                    md.target.Set(cmx, cmy);
                    md.maxForce = 300.0 * md.bodyB.GetMass();
                    md.collideConnected = false;
                    mousejoint = world.CreateJoint(md);
                }

                break;
            }
        }
        if (selected == false)
        {
            dragging = true;
            lastpos[0] = e.offsetX;
            lastpos[1] = e.offsetY;
        }
    }
}

function handleMouseMove(e) {
    if (edit_mode)
    {
        // ctrl
        if (currentKeysDown[17]) {
            return;
        }

        // shift - create line
        if (currentKeysDown[16]) {
            if (line_start)
            {
                line_end[0] = (e.offsetX-cx)/sx;
                line_end[1] = (e.offsetY-cy)/sy;
            }
            return;
        }

        // no keys
        {
            if (selected != false)
            {
                var mx = (e.offsetX-cx)/sx;
                var my = (e.offsetY-cy)/sy;
                data.points[selected-1][0] += mx-lastpos[0];
                data.points[selected-1][1] += my-lastpos[1];
                lastpos[0] = mx;
                lastpos[1] = my;
            } else if (dragging)
            {
                var mx = e.offsetX;
                var my = e.offsetY;
                cx += mx-lastpos[0];
                cy += my-lastpos[1];
                lastpos[0] = mx;
                lastpos[1] = my;

            }
        }

    } else
    {
        cmx = (e.offsetX-cx)/sx;
        cmy = (e.offsetY-cy)/sy;
        if (selected != false)
        {
            var mx = (e.offsetX-cx)/sx;
            var my = (e.offsetY-cy)/sy;
            cmx = mx;
            cmy = my;
            if (BOX2DPHYSICS)
            {
                mousejoint.SetTarget(new Box2D.Common.Math.b2Vec2(cmx, cmy));
            }
            // var dx = mx-lastpos[0];
            // var dy = my-lastpos[1];
            var dx = mx-data.points[selected-1][0];
            var dy = my-data.points[selected-1][1];
            // data.points[selected-1][0] += dx;
            // data.points[selected-1][1] += dy;
            lastpos[0] = mx;
            lastpos[1] = my;
            // call physics code here
            // var forces = evalForces2(data, selected-1, dx, dy);
            // timeStep(data, forces, 0.1);
        } else if (dragging)
        {
            var mx = e.offsetX;
            var my = e.offsetY;
            cx += mx-lastpos[0];
            cy += my-lastpos[1];
            lastpos[0] = mx;
            lastpos[1] = my;

        }
    }
}

function handleMouseUp(e) {
    if (edit_mode)
    {
        // ctrl
        if (currentKeysDown[17]) {
            return;
        }

        // shift - create line
        if (currentKeysDown[16]) {
            if (line_start)
            {
                var mx = (e.offsetX-cx)/sx;
                var my = (e.offsetY-cy)/sy;
                var endi = false;
                for (var i=0; i<data.points.length; i++)
                {
                    if (i == line_start-1)
                        continue;
                    if ((Math.abs(data.points[i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data.points[i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
                    {
                        endi = i+1;
                        break;
                    }
                }
                if (endi != false)
                {
                    var l;
                    if (line_start < endi)
                        l = [line_start-1, endi-1];
                    else
                        l = [endi-1, line_start-1];

                    if (hasLine(l))
                        removeLine(l);
                    else
                        addLine(l);
                }
            }
            line_start = false;
            return;
        }

        // no keys
        {
            selected = false;
            dragging = false;
        }
    } else
    {
        selected = false;
        dragging = false;
        if (BOX2DPHYSICS)
        {
            if (mousejoint !== null)
            {
                world.DestroyJoint(mousejoint);
                mouseJoint = null;
            }
        }
    }
}

function handleMouseOut(e) {
    if (edit_mode)
    {
        // ctrl
        if (currentKeysDown[17]) {
            return;
        }

        // shift - create line
        if (currentKeysDown[16]) {
            line_start = false;
            highlight = false;
        }

        // no keys
        {
            selected = false;
            dragging = false;
            highlight = false;
        }
    } else
    {
        selected = false;
        dragging = false;
        highlight = false;
        if (mousejoint !== null && BOX2DPHYSICS)
        {
            world.DestroyJoint(mousejoint);
            mouseJoint = null;
        }
    }
}

var currentKeysDown = {};
function handleKeyDown(event) {
    currentKeysDown[event.keyCode] = true;
    handleKeyPress(event);
    switch(event.keyCode){
        case 9:
        // case 37:
        // case 38:
        // case 39:
        // case 40:
            event.preventDefault();
            break;
    }
}

function handleKeyUp(event) {
    currentKeysDown[event.keyCode] = false;
    switch(event.keyCode){
        case 16:
        {
            line_start = false;
        } break;
        case 9:
        // case 37:
        // case 38:
        // case 39:
        // case 40:
            event.preventDefault();
            break;
    }
}

function handleKeyPress(event) {

}

var lastTime = 0;
var deltaTime = 0;
function updateAll() {
    var timeNow = new Date().getTime();
    // console.log(timeNow+" "+lastTime+" "+deltaTime)
    if (lastTime != 0) {
        deltaTime = timeNow - lastTime;
    }
    lastTime = timeNow;

    update();
}


function tick() {
    requestAnimFrame(tick);
    updateAll();
    draw();
}


function updateEditMode(globals) {
    edit_mode = (globals.controlMode == "edit");
    if (!edit_mode)
        initProcessLinesAndPoints();
}

function updatePhysicsMode(globals) {
    var isedit = (globals.controlMode == "edit");
    if (!isedit)
        toggleEditMode();
    BOX2DPHYSICS = (globals.physicsEngine == "box2d");
    if (!isedit)
        toggleEditMode();
}

var inputtextbox;
function updateLinkage() {
    if (!inputtextbox) inputtextbox = document.getElementById("input");
    parent = createParent(1,1,1);
    //document.write(JSON.stringify(parent));
    var e3 = createEquation(input.value);
    equs = e3.genFuncs();
    // console.log(equs);
    var e3e = e3.evalequ('x',createEquation("a+b"))
                            .evalequ('y',createEquation("c+d"));
    var cos = constructCosReporesentation(e3e);
    // output.value = strCos(cos);
    // console.log(e3e);
    // console.log(e3e.str());
    console.log(strCos(cos));
    terms = cos;
    terms.splice(0,1);
    fakecolor = {};
    drawdata = createOptimizedKempeLinkage([4,8],[8,4],terms, fakecolor);
    anglea = Math.atan2(8,4);
    angleb = Math.atan2(4,8);
    console.log(drawdata.finalPoints);
    // mul = createKempeLinkage(1,1,terms);
    // data = mul;
    physicsInit(equs);
    toggleEditMode();
    toggleEditMode();
    traceHistory = [];
}

function initlinkage() {
    var e3 = createEquation("x^2-y+0.3");
    equs = e3.genFuncs();
    // console.log(equs);
    var e3e = e3.evalequ('x',createEquation("a+b"))
                            .evalequ('y',createEquation("c+d"));
    var cos = constructCosReporesentation(e3e);
    // output.value = strCos(cos);
    // console.log(e3e);
    // console.log(e3e.str());
    console.log(strCos(cos));
    terms = cos;
    terms.splice(0,1);
    fakecolor = {};
    drawdata = createOptimizedKempeLinkage([4,8],[8,4],terms, fakecolor);
    anglea = Math.atan2(8,4);
    angleb = Math.atan2(4,8);
    console.log(drawdata.finalPoints);
    // mul = createKempeLinkage(1,1,terms);
    // drawdata = createKempeLinkage(normalize([4,8]),normalize([8,4]),terms);
    // data = mul;
    physicsInit(equs);
    toggleEditMode();
    toggleEditMode();
}
