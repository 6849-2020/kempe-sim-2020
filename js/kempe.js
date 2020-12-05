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
var drawLines = {};
var equs;
var world;
var bodies;
var joints;
var mousejoint = null;
var BOX2DPHYSICS = false;
var equationCurve;
var accuraterender = true;
var fakecolor = {};
var terms;
var anglea, angleb;
var displayhelp  = true;
var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

var drawTrace = true;
var traceHistory = {};
var traceHistoryEdges = {};
var showLinkage = true;
var t = 0;
var paperRotationFrequency = 0.05;


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
    cvs.addEventListener('auxclick', handleMouseAuxClick);

    recalcViewDimentions();

    cvs.onselectstart = function () { return false; } // ie
    cvs.onmousedown = function () { return false; } // mozilla

    ctx.fillStyle = 'red';

    initKempe(globals);

    tick();
}

function setViewMode(viewMode) {
  if (viewMode == "drawing") {
    showLinkage = false;
  } else {
    showLinkage = true;
  }
}

var last_doc_width;
var last_doc_length;
function recalcViewDimentions()
{
    var widthminus = 0;
    var heightminus = 0;
    cvs.width = window.innerWidth+widthminus;
    cvs.height = window.innerHeight+heightminus;
    VIEW_WIDTH = cvs.width;+widthminus;
    VIEW_HEIGHT = cvs.height+heightminus;
    last_doc_width = window.innerWidth+widthminus;
    last_doc_length = window.innerHeight+heightminus;
}


function pushToTrace(x, y, point) {
  var trace_x = Math.cos(t * paperRotationFrequency) * x - Math.sin(t * paperRotationFrequency) * y;
  var trace_y = Math.sin(t * paperRotationFrequency) * x + Math.cos(t * paperRotationFrequency) * y;
  if (!drawTrace)
    return;
  if (!traceHistory[point]) {
    traceHistory[point] = [[trace_x, trace_y]];
  } else {
    // only add point if it's far enough than previous point
    var lastPoint = traceHistory[point][traceHistory[point].length - 1]
    var dist = Math.sqrt((lastPoint[0] - trace_x) ** 2 + (lastPoint[1] - trace_y) ** 2);
    if (dist > 0.005) {
      traceHistory[point].push([trace_x, trace_y]);
    }
  }
  // if (traceHistory[point].length > 10000) {
  //   traceHistory[point].shift();
  // }
}

function pushLineToTrace(x1, y1, x2, y2, edge) {
  if (!drawTrace)
    return;
  if (!traceHistoryEdges[edge]) {
    traceHistoryEdges[edge] = [[x1, y1, x2, y2]];
  } else {
    // only add edge if it's far enough than previous point
    var lastEdge = traceHistoryEdges[edge][traceHistoryEdges[edge].length - 1]
    var dist1 = Math.sqrt((lastEdge[0] - x1) ** 2 + (lastEdge[1] - y1) ** 2);
    var dist2 = Math.sqrt((lastEdge[2] - x2) ** 2 + (lastEdge[3] - y2) ** 2);
    if (dist1 > 0.01 || dist2 > 0.01) {
      traceHistoryEdges[edge].push([x1, y1, x2, y2]);
    }
  }
  if (traceHistoryEdges[edge].length > 5000) {
    traceHistoryEdges[edge].shift();
  }
}

function createPhysicsWorld(globals) {
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
    var g = new b2Vec2(0, 0);
    if (globals.box2dGravity) {
      g = new b2Vec2(0, -1);
    }
    world = new b2World(
          g    //gravity
       ,  true                 //allow sleep
    );

    bodies = [];
    joints = [];

    var emptyvec = new b2Vec2();

    var fixDef = new b2FixtureDef;
    fixDef.density = 1.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;

    fixDef.shape = new b2CircleShape(RADIUS);
    fixDef.filter.categoryBits = 1;
    fixDef.filter.maskBits = 0;

    var bodyDef = new b2BodyDef;

    for (var i=0; i<data.points.length; i++)
    {

        if (data.points[i][2] == 'X')
            bodyDef.type = b2Body.b2_kinematicBody;
        else
            bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.x = data.points[i][0];
        bodyDef.position.y = data.points[i][1];
        var bod = world.CreateBody(bodyDef);
        bod.CreateFixture(fixDef);

        bodies.push(bod);



        if (globals.box2dDamping) {
          bod.m_angularDamping = 30.0;
          bod.m_linearDamping = 30.0;
        } else {
          bod.m_angularDamping = 0.0;
          bod.m_linearDamping = 0.0;
        }

        if (i == 3) {
          //bod.SetLinearVelocity(new b2Vec2(1, 1));
          //bod.SetAngularVelocity(1000);
          // bod.m_angularDamping = 0.0;
        }
    }

    var distJointDef = new b2DistanceJointDef;
    distJointDef.collideConnected = false;

    bodyDef.type = b2Body.b2_dynamicBody;
    var j;

    for (var i=0; i<data.edges.length; i++)
    {
        distJointDef.Initialize(bodies[data.edges[i][0]],
            bodies[data.edges[i][1]],
            bodies[data.edges[i][0]].GetWorldCenter(),
            bodies[data.edges[i][1]].GetWorldCenter());
        distJointDef.frequencyHz = 0;
        distJointDef.dampingRatio = 1;
        console.log(distJointDef);
        j = world.CreateJoint(distJointDef);
        joints.push(j);
    }
}

function initProcessLinesAndPoints(globals) {
    traceHistory = {};
    traceHistoryEdges = {};
    lines = {};
    // console.log(data);
    for (var i=0; i<data.edges.length; i++)
    {
        if (data.edges[i][0] == data.edges[i][1])
            continue;

        //if (data.points[data.edges[i][0]][2] == 'X' && data.points[data.edges[i][1]][2] == 'X') continue;

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
        //if (data.points[p1][2] == 'X' && data.points[p2][2] == 'X') continue;
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

    if (BOX2DPHYSICS) {
        createPhysicsWorld(globals);
    }
}

function hasLine(l) {
    if (l[0] < l[1])
        return lines[l[0]+" "+l[1]] !== undefined;
    else
        return lines[l[1]+" "+l[0]] !== undefined;
}

function addLine(l, drawLine) {
    if (hasLine(l))
        return;
    if (l[0] < l[1]) {
        lines[l[0]+" "+l[1]] = data.edges.length;
    } else {
        lines[l[1]+" "+l[0]] = data.edges.length;
    }
    if (drawLine) {
      drawLines[data.edges.length] = true;
    }
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

    if (drawLines[index]) {
      delete drawLines[index];
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
    console.log("removePoint", p);
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
    data = globals.data;
    globals.resetData = JSON.parse(JSON.stringify(data));

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
    drawLines = globals.drawLines; // TODO: load lines from FOLD
    paperRotationFrequency = globals.paperRotationFrequency;

    initProcessLinesAndPoints(globals);
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


  drawLines = {};
  if (fold.edges_assignment) {
    for (var i = 0; i < fold.edges_assignment.length; i++) {
      if (fold.edges_assignment[i] == "P") {
        drawLines[i] = true;
      }
    }
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
  globals.drawLines = drawLines;
  globals.resetData = JSON.parse(JSON.stringify(globals.data));

  initProcessLinesAndPoints(globals);
}


var LINE_BORDER_WIDTH = 6;
var LINE_WIDTH = 4;
var animate_dash = 0;
function draw() {
    dd = data;
    if (window.innerWidth !== last_doc_width)
        recalcViewDimentions();

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    ctx.translate(cx, cy);
    ctx.rotate(t * paperRotationFrequency);

    ctx.strokeStyle = '#888888';
    ctx.rect(-4 * sx, -4 * sy, 8*sx, 8*sy);
    ctx.stroke();

    // draw pen lines
    var e_idx = 0;
    // seaborn color palette (muted)
    var colors = ['red', '#4878d0', '#ee854a', '#6acc64', '#d65f5f', '#956cb4', '#8c613c', '#dc7ec0', '#797979', '#d5bb67', '#82c6e2'];
    for (var e in traceHistoryEdges) {
      ctx.lineWidth = 5;
      ctx.fillStyle = colors[e_idx % colors.length];
      ctx.beginPath();
      // relative positions because trace should move when we move the linkage
      ctx.moveTo(sx*traceHistoryEdges[e][0][0], sy*traceHistoryEdges[e][0][1]);
      for (var i = 1; i < traceHistoryEdges[e].length; i++) {
        ctx.lineTo(sx*traceHistoryEdges[e][i][0], sy*traceHistoryEdges[e][i][1]);
      }
      ctx.lineTo(sx*traceHistoryEdges[e][traceHistoryEdges[e].length-1][2], sy*traceHistoryEdges[e][traceHistoryEdges[e].length-1][3]);
      for (var i = traceHistoryEdges[e].length - 2; i >= 0; i--) {
        ctx.lineTo(sx*traceHistoryEdges[e][i][2], sy*traceHistoryEdges[e][i][3]);
      }
      ctx.closePath();
      ctx.fill();
      e_idx += 1;
    }

    // draw pen points
    var p_idx = 0;
    for (var p in traceHistory) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = colors[p_idx % colors.length];
      ctx.beginPath();
      // relative positions because trace should move when we move the linkage
      ctx.moveTo(sx*traceHistory[p][0][0], sy*traceHistory[p][0][1]);
      for (var i = 1; i < traceHistory[p].length; i++) {
        ctx.lineTo(sx*traceHistory[p][i][0], sy*traceHistory[p][i][1])
      }
      ctx.stroke();
      p_idx += 1;
    }
    ctx.rotate(-t * paperRotationFrequency);
    ctx.translate(-cx, -cy);

    if (!showLinkage) {
      return;
    }

    // draw forc arrow
    if (!edit_mode && selected) {
      animate_dash += 0.5;
      if (animate_dash > 16) animate_dash = 0;
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#888888';
      ctx.beginPath();
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -animate_dash;
      var i =selected - 1;
      ctx.moveTo(cx+sx*dd.points[i][0],cy+sy*dd.points[i][1]);
      ctx.lineTo(cx+sx*cmx,cy+sy*cmy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;

      // arrow
      var tmp_x = dd.points[i][0] - cmx;
      var tmp_y = dd.points[i][1] - cmy;
      var L = Math.sqrt(tmp_x*tmp_x + tmp_y*tmp_y) * 12;
      var x_left = Math.cos(30 * Math.PI / 180) * tmp_x - Math.sin(30 * Math.PI / 180) * tmp_y;
      var y_left = Math.sin(30 * Math.PI / 180) * tmp_x + Math.cos(30 * Math.PI / 180) * tmp_y;
      var x_right = Math.cos(-30 * Math.PI / 180) * tmp_x - Math.sin(-30 * Math.PI / 180) * tmp_y;
      var y_right = Math.sin(-30 * Math.PI / 180) * tmp_x + Math.cos(-30 * Math.PI / 180) * tmp_y;

      ctx.beginPath();
      ctx.moveTo(cx+sx*(cmx + x_left/L),cy+sy*(cmy + y_left/L));
      ctx.lineTo(cx+sx*cmx,cy+sy*cmy);
      ctx.lineTo(cx+sx*(cmx + x_right/L),cy+sy*(cmy + y_right/L));
      ctx.stroke();
    }

    ctx.fillStyle = 'blue';
    ctx.strokeStyle = 'blue';
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
        if (drawLines[i]) {
          ctx.strokeStyle = '#40E0D0';
          if (!edit_mode) {
            pushLineToTrace(dd.points[dd.edges[i][0]][0], dd.points[dd.edges[i][0]][1], dd.points[dd.edges[i][1]][0], dd.points[dd.edges[i][1]][1], i);
          }
        } else {
          ctx.strokeStyle = '#ec008b';
        }
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
        if (selected == i+1 || highlight == i+1 || line_start == i+1) {
            ctx.fillStyle = '#888888';
         } else {
            if (dd.points[i][2] == 'X') {
                ctx.fillStyle = 'black';
            } else if (dd.points[i][2] == 'P') {
                ctx.fillStyle = '#40E0D0';
            } else {
                ctx.fillStyle = 'blue';
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

        if (!edit_mode && dd.points[i][2] == 'P') {
          pushToTrace(dd.points[i][0], dd.points[i][1], i);
        }
    }


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

function update() {
    if (!edit_mode) {
        t += 0.1;
        if (BOX2DPHYSICS) {
            var BOX_STEP = 1 / 60;
            var b2Vec2 = Box2D.Common.Math.b2Vec2;
            for (var i=0; i<bodies.length; i++) {
                var pos = bodies[i].GetPosition();
                data.points[i][0] = pos.x;
                data.points[i][1] = pos.y;
                // console.log(pos);
                if (data.pointsRotors && data.pointsRotors[i].hasRotor) {
                  // based on https://rotatingcanvas.com/move-box2d-body-in-circular-path-in-libgdx/
                  var velocity=data.pointsRotors[i].frequency;

                  var pivot = bodies[data.pointsRotors[i].fixedTo].GetPosition();
                  var bodyDirection = new b2Vec2(pos.x, pos.y); // substract from ficture point
                  bodyDirection.Subtract(pivot);
                  bodyDirection.Normalize();

                  //to get velocity direction in clockwise motion with respect
                  // to pivot we  need to rotate above direction vector by 90
                  // degrees in anti clockwise  direction
                  var bodyVelocity = new b2Vec2( bodyDirection.y * velocity, -bodyDirection.x * velocity);
                  var tmp = new b2Vec2(pos.x, pos.y);
                  tmp.Subtract(pivot);
                  var distance = tmp.Length();
                  //Convert radius to box dimensions and get the difference
                  var delta=distance - data.pointsRotors[i].radius; //-ConvertToBoxCoordinate(radius);
                  //Here we multiply by -1 to get centripetal direction
                  //Then we divide by BOX_STEP which is equal to frame delta time

                  var centripetlVelocity=new b2Vec2( bodyDirection.x,  bodyDirection.y);
                  centripetlVelocity.Multiply(-1 * delta / BOX_STEP);

                  var rotatingVelocity=new b2Vec2(0, 0);
                  //Add fixed velocity tangent to the circular motion
                  rotatingVelocity.Add( bodyVelocity );
                  //Add centripetal velocity
                  rotatingVelocity.Add(centripetlVelocity);

                  bodies[i].SetLinearVelocity(rotatingVelocity);
                }
            }
            world.Step(BOX_STEP, 10, 10);
            world.ClearForces();
        } else {
            if (selected)
            {
                var dx = cmx-data.points[selected-1][0];
                var dy = cmy-data.points[selected-1][1];
                // data.points[selected-1][0] += 0.0001 * dx;
                // data.points[selected-1][1] += 0.0001 * dy;
                var forces = evalForces3(data, selected-1, dx, dy);
                //RK4step(data, forces, 0.1);
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

function handleMouseAuxClick(e) {
  if (edit_mode && e.button == 1) {
    var mx = (e.offsetX-cx)/sx;
    var my = (e.offsetY-cy)/sy;
    for (var i=0; i<data.points.length; i++)
    {
        if ((Math.abs(data.points[i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data.points[i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
        {
            if (data.points[i][2] == 'X') {
              data.points[i][2] = 'F';
            } else if (data.points[i][2] == 'F') {
              data.points[i][2] = 'P';
            } else if (data.points[i][2] == 'P') {
              data.points[i][2] = 'X';
            }
            break;
        }
    }
  }
}

function handleMouseClick(e) {
    //console.log(currentKeysDown);
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
            } else if (currentKeysDown[32]) { // space
              pointType = 'P';
            } else {
              pointType = 'F';
            }

            data.points.push([mx, my, pointType]);

            return;
        } else if (currentKeysDown[16] && e.altKey) {
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
            if (!data.points[i]) {
                highlight = false;
            } else if (!((Math.abs(data.points[i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data.points[i][1]-my) <= RADIUS/2.0/Math.abs(sy))))
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
    console.log(currentKeysDown);
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

                    if (hasLine(l)) {
                        removeLine(l);
                    } else {
                        addLine(l, currentKeysDown[32]); // space
                    }
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
  console.log(bodies);
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

    //console.log(bodies);


    update();
}


function tick() {
    requestAnimFrame(tick);
    updateAll();
    draw();
}


function updateEditMode(globals) {
    edit_mode = (globals.controlMode == "edit");
    if (!edit_mode) {
        globals.resetData = JSON.parse(JSON.stringify(data));
        initProcessLinesAndPoints(globals);
    }
}

function updatePhysicsMode(globals) {
    BOX2DPHYSICS = (globals.physicsEngine == "box2d");
}

function updateKempeLinkage(globals) {
    var e3 = createEquation(globals.equation);
    console.log(e3);
    equs = e3.genFuncs();
    console.log(equs);
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
    // TODO: generate accurate linkage vs. optimized
    anglea = Math.atan2(8,4);
    angleb = Math.atan2(4,8);
    drawdata = createKempeLinkage(normalize([4,8]),normalize([8,4]),terms, anglea, angleb);
    console.log(drawdata);
    // mul = createKempeLinkage(1,1,terms);
    // data = mul;
    physicsInit(equs);

    //drawdata = createKempeLinkage(normalize([4,8]),normalize([8,4]), terms, anglea, angleb);

    globals.data = drawdata;
    data = drawdata;
    equationCurve = true;
    initKempe(globals);
}
