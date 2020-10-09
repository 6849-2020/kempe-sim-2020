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
var VIEW_TILE_WIDTH = VIEW_WIDTH/TILE_WIDTH;
var VIEW_TILE_HEIGHT = VIEW_HEIGHT/TILE_WIDTH;
var VIEW_TILE_WIDTH_HALF = (VIEW_TILE_WIDTH/2)>>0;
var VIEW_TILE_HEIGHT_HALF = (VIEW_TILE_HEIGHT/2)>>0;
var data;
var drawdata;
var selected;
var hilight;
var dragging;
var line_start, line_end;
var edit_mode;
var lastpos;
var RADIUS = 10;
var cx, cy, sx, sy;
var cmx, cmy;
var lines = {};
var equs;
var world;
var bodies;
var mousejoint;
var BOX2DPHYSICS = false;
var USEPHYSICS = true;
var fakingit;
var accuraterender = true;
var fakecolor = {};
var terms;
var anglea, angleb;
var displayhelp  = true;
var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

function kempeStart(kempesim) {
    fakingit = kempesim;
    cvs = document.getElementById("graphics-canvas");
    errordisplay = document.getElementById("error-display");
    checkboxeditMode = document.getElementById("checkboxeditMode");
    checkboxphysicsMode = document.getElementById("checkboxphysics");
    ctx = cvs.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0,0,500,500);
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

    init();

    if (fakingit)
        initlinkage();
    tick();
}

var last_doc_width;
var last_doc_length;
function recalcViewDimentions()
{
    var widthminus = -19
    var heightminus = -80;
    if (fakingit)
    {
        widthminus = -19;
        heightminus = -90;
    }
    cvs.width = window.innerWidth+widthminus;
    cvs.height = window.innerHeight+heightminus;
    VIEW_WIDTH = cvs.width+widthminus;
    VIEW_HEIGHT = cvs.height+heightminus;
    last_doc_width = window.innerWidth+widthminus;
    last_doc_length = window.innerHeight+heightminus;
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
    for (var i=0; i<data[0].length; i++)
    {

        if (data[0][i][2])
            bodyDef.type = b2Body.b2_staticBody;
        else
            bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.x = data[0][i][0];
        bodyDef.position.y = data[0][i][1];
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

    for (var i=0; i<data[1].length; i++)
    {
        // fixDef.shape = new b2PolygonShape;
        // fixDef.shape.SetAsEdge(new b2Vec2(0, 0),
        //                         new b2Vec2(data[0][data[1][i][1]][0]-data[0][data[1][i][0]][0], 
        //                                     data[0][data[1][i][1]][1]-data[0][data[1][i][0]][1]));
        // bodyDef.position.x = data[0][data[1][i][0]][0];
        // bodyDef.position.y = data[0][data[1][i][0]][1];
        // var bod = world.CreateBody(bodyDef);
        // bod.CreateFixture(fixDef);
        // revJointDef.Initialize(bod, bodies[data[1][i][0]], bodies[data[1][i][0]].GetWorldCenter());
        // j = world.CreateJoint(revJointDef);
        // revJointDef.Initialize(bod, bodies[data[1][i][1]], bodies[data[1][i][1]].GetWorldCenter());
        // j = world.CreateJoint(revJointDef);

        distJointDef.Initialize(bodies[data[1][i][0]], 
            bodies[data[1][i][1]], 
            bodies[data[1][i][0]].GetWorldCenter(), 
            bodies[data[1][i][1]].GetWorldCenter());
        j = world.CreateJoint(distJointDef);

    }
}

function initProcessLinesAndPoints() {
    lines = {};
    // console.log(data);
    for (var i=0; i<data[1].length; i++)
    {
        if (data[1][i][0] == data[1][i][1])
            continue;

        if (data[0][data[1][i][0]][2] && data[0][data[1][i][1]][2]) continue;

        if (data[1][i][0] < data[1][i][1])
            lines[data[1][i][0]+" "+data[1][i][1]] = true;
        else
            lines[data[1][i][1]+" "+data[1][i][0]] = true;

    }

    data[1] = [];
    for (var k in lines)
    {
        var s = k.split(" ");
        var p1 = parseInt(s[0]);
        var p2 = parseInt(s[1]);
        if (data[0][p1][2] && data[0][p2][2]) continue;
        var x = data[0][p1][0]-data[0][p2][0];
        var y = data[0][p1][1]-data[0][p2][1];
        data[1].push([p1, p2, Math.sqrt(x*x+y*y)]);
    }

    for (var i=0; i<data[1].length; i++)
    {
        lines[data[1][i][0]+" "+data[1][i][1]] = i;
    }

    for (var i=0; i<data[0].length; i++)
    {
        for (var j=data[0][i].length; j<5; j++)
            data[0][i].push(0);
        if (data[0][i][2] === 0)
            data[0][i][2] = false;
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
        lines[l[0]+" "+l[1]] = data[1].length;
    else
        lines[l[1]+" "+l[0]] = data[1].length;
    data[1].push([l[0],l[1]]);
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

    if (index == data[1].length-1)
        data[1].splice(data[1].length-1,1);
    else
    {
        var old = data[1][data[1].length-1];
        data[1][index] = old;
        lines[old[0]+" "+old[1]] = index;
        data[1].splice(data[1].length-1,1);
    }
}

function renameLines(a, b) {
    for (var x=0; x<data[1].length; x++)
    {
        if (data[1][x][0] == a || data[1][x][1] == a)
        {
            if (data[1][x][0] > data[1][x][1])
            {
                var temp = data[1][x][0];
                data[1][x][0] = data[1][x][1];
                data[1][x][1] = temp;
            }
            lines[data[1][x][0]+" "+data[1][x][1]] = false;
            delete lines[data[1][x][0]+" "+data[1][x][1]]
            if (data[1][x][0] == a) data[1][x][0] = b;
            else data[1][x][1] = b;
            if (data[1][x][0] > data[1][x][1])
            {
                var temp = data[1][x][0];
                data[1][x][0] = data[1][x][1];
                data[1][x][1] = temp;
            }
            lines[data[1][x][0]+" "+data[1][x][1]] = x;
        }
    }
}

function removePoint(p) {
    var l;
    for (var x=0; x<data[0].length; x++)
    {
        if (x < p)
            removeLine([x,p]);
        else if (x > p)
            removeLine([p,x]);
    }

    if (p == data[0].length-1)
        data[0].splice(data[0].length-1, 1);
    else
    {
        var old = data[0][data[0].length-1];
        data[0][p] = old;
        renameLines(data[0].length-1, p);
        data[0].splice(data[0].length-1,1);
    }
    
}

function init() {
    data = 
    [
        [
            [0  ,   0   ,   true],
            [0  ,   100 ,   false],
            [100,   0   ,   false],
            [100,   100 ,   false]
        ],
        [
            [0, 1,  1],
            [0, 2,  1],
            [0, 3,  Math.sqrt(2)],
            [1, 2,  Math.sqrt(2)],
            [1, 3,  1],
            [2, 3,  1]
        ]
    ];
    var data1 = 
    [
        [
            [0  ,   0   ,   true],
            [0  ,   1 ,   false]
        ],
        [
            [0, 1,  1],
        ]
    ];

    var data2 = 
    [
        [
            [0  ,   0   ,   true],
            [0  ,   1 ,   false],
            [1,   0   ,   false],
            [1,   1 ,   false]
        ],
        [
            [0, 1,  1],
            [0, 2,  1],
            [2, 3,  1],
            [1, 3,  1],
        ]
    ];

    var data3 = 
    [
        [
            [0, 0, true],
            [1, 0, false],
            [0, 1, false],
            [1, 1, false]
        ],
        [
            [0, 1],
            [0, 2],
            [1, 3],
            [2, 3]
        ],

    ];

    data = data1;


    selected = false;
    dragging = false;
    hilight = false;
    edit_mode = false;
    sx = 150;
    sy = -150;
    cx = VIEW_WIDTH/2;
    cy = VIEW_HEIGHT/2;
    lastpos = [0,0];
    line_start = false;
    line_end = [0,0];

    // data = createAdditor(1, 2, 2, 1);
    // parent = createParent(1,1,1);
    //document.write(JSON.stringify(parent));
    // terms = [
    //             [5.3,5,0,Math.PI/2]
    //             ,   [5.3,3,3,Math.PI/2]
    //             ,   [5.3,4,4,Math.PI/2]
    //                , [6,0,-2,Math.PI/2]
    //             // , [5,1,0,0]
    //             // , [5,0,0,Math.PI/1.2]
    //         ];
    // mul = createKempeLinkage(1,1,terms);
    // data = data1;

    // var d = createOptimizedKempeLinkage([4,8],[8,4],terms, fakecolor);
    // data = d;

    // data = createPLinkage(0,0,10);

    // data = data3;
    // data[0].push([0,0]);
    // data[0].push([8,4]);
    // data[0].push([4,8]);
    // data[0].push([12,12]);
    // data[1].push([0, data[0].length-3]);
    // data = data2;
    if (fakingit)
        data = data2;
    else
        data = data1;

    initProcessLinesAndPoints();
}


var LINE_BORDER_WIDTH = 4;
var LINE_WIDTH = 3;
function draw() {
    if (fakingit)
        dd = drawdata;
    else
        dd = data;
    if (window.innerWidth !== last_doc_width)
        recalcViewDimentions();

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    ctx.fillStyle = 'blue';
    ctx.strokeStyle = 'blue';
    if (fakingit)
    {
        ctx.fillStyle = '#8888ff';
        ctx.strokeStyle = '#8888ff';
    }

    
    for (var i=0; i<dd[1].length; i++)
    {
        ctx.lineWidth = LINE_BORDER_WIDTH;
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(cx+sx*dd[0][dd[1][i][0]][0],cy+sy*dd[0][dd[1][i][0]][1]);
        ctx.lineTo(cx+sx*dd[0][dd[1][i][1]][0],cy+sy*dd[0][dd[1][i][1]][1]);
        ctx.closePath();
        ctx.stroke();
        ctx.lineWidth = LINE_WIDTH;
        if (fakingit)
            ctx.strokeStyle = '#8888ff';
        else
            ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(cx+sx*dd[0][dd[1][i][0]][0],cy+sy*dd[0][dd[1][i][0]][1]);
        ctx.lineTo(cx+sx*dd[0][dd[1][i][1]][0],cy+sy*dd[0][dd[1][i][1]][1]);
        ctx.closePath();
        ctx.stroke();
    }

    if (line_start)
    {
        ctx.lineWidth = LINE_BORDER_WIDTH;
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(cx+sx*dd[0][line_start-1][0],cy+sy*dd[0][line_start-1][1]);
        if (hilight && hilight!==line_start)
            ctx.lineTo(cx+sx*dd[0][hilight-1][0],cy+sy*dd[0][hilight-1][1]);
        else
            ctx.lineTo(cx+sx*line_end[0],cy+sy*line_end[1]);
        ctx.closePath();
        ctx.stroke();
        ctx.lineWidth = LINE_WIDTH;
        if (hilight && hilight!==line_start)
        {
            if (hasLine([hilight-1, line_start-1]))
                ctx.strokeStyle = '#ff4444';
            else
                ctx.strokeStyle = '#8888ff';
        } else
            ctx.strokeStyle = '#000066';
        ctx.beginPath();
        ctx.moveTo(cx+sx*dd[0][line_start-1][0],cy+sy*dd[0][line_start-1][1]);
        if (hilight && hilight!==line_start)
            ctx.lineTo(cx+sx*dd[0][hilight-1][0],cy+sy*dd[0][hilight-1][1]);
        else
            ctx.lineTo(cx+sx*line_end[0],cy+sy*line_end[1]);
        ctx.closePath();
        ctx.stroke();
    }

    for (var i=dd[0].length-1; i>=0; i--)
    {
        if (!fakingit && (selected == i+1 || hilight == i+1 || line_start == i+1))
            if (dd[0][i][2])
                ctx.fillStyle = '#FF8888'
            else
                ctx.fillStyle = '#88FF88';
        else
            if (dd[0][i][2])
                ctx.fillStyle = 'red'
            else
                if (fakingit)
                {
                    var cccc = fakecolor[""+i];
                    if (cccc == undefined)
                        ctx.fillStyle = '#8888ff';//'blue';
                    else ctx.fillStyle = cccc;
                }
                else
                    ctx.fillStyle = 'green';
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.arc((cx+sx*dd[0][i][0]), 
                (cy+sy*dd[0][i][1]), 
                RADIUS/2, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    if (fakingit)
    {
        if (drawdata.length > 2)
            for (var i=0; i<drawdata[2].length; i++)
            {
                // console.log(drawdata[2][i]);
                ctx.fillStyle = fakecolor[""+drawdata[2][i]];

                ctx.lineWidth = 1;
                ctx.strokeStyle = 'black';
                ctx.beginPath();
                ctx.arc((cx+sx*dd[0][drawdata[2][i]][0]), 
                        (cy+sy*dd[0][drawdata[2][i]][1]), 
                        RADIUS/2, 0, Math.PI*2, true);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

        ctx.fillStyle = 'brown';
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.arc((cx+sx*dd[0][dd[0].length-2][0]), 
                (cy+sy*dd[0][dd[0].length-2][1]), 
                RADIUS/2, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        for (var i=0; i<data[1].length; i++)
        {
            ctx.lineWidth = LINE_BORDER_WIDTH;
            ctx.strokeStyle = 'black';
            ctx.beginPath();
            ctx.moveTo(cx+sx*data[0][data[1][i][0]][0],cy+sy*data[0][data[1][i][0]][1]);
            ctx.lineTo(cx+sx*data[0][data[1][i][1]][0],cy+sy*data[0][data[1][i][1]][1]);
            ctx.closePath();
            ctx.stroke();
            ctx.lineWidth = LINE_WIDTH;
            ctx.strokeStyle = 'blue';
            ctx.beginPath();
            ctx.moveTo(cx+sx*data[0][data[1][i][0]][0],cy+sy*data[0][data[1][i][0]][1]);
            ctx.lineTo(cx+sx*data[0][data[1][i][1]][0],cy+sy*data[0][data[1][i][1]][1]);
            ctx.closePath();
            ctx.stroke();
        }

        for (var i=0; i<data[0].length; i++)
        {

            if (selected == i+1 || hilight == i+1 || line_start == i+1)
                if (data[0][i][2])
                    ctx.fillStyle = '#FF8888'
                else
                    ctx.fillStyle = '#88FF88';
            else
                if (data[0][i][2])
                    ctx.fillStyle = 'red'
                else
                {
                    if (i==0)
                        ctx.fillStyle = 'red';
                    else if (i==1)
                        ctx.fillStyle = Colors.rgb2hex(43, 145, 250);
                    else if (i==2)
                        ctx.fillStyle = Colors.rgb2hex(250, 145, 43);
                    else
                        ctx.fillStyle = 'green';
                }
                    
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
            ctx.beginPath();
            ctx.arc((cx+sx*data[0][i][0]), 
                    (cy+sy*data[0][i][1]), 
                    RADIUS/2, 0, Math.PI*2, true);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    if (displayhelp)
    {
        ctx.lineWidth=1;
        ctx.lineStyle="#ffff00";
        ctx.font="18px sans-serif";
        if (!is_chrome) {
            ctx.fillStyle="#AA0000";
            ctx.fillText("  WARNING: Use Chrome for best results", 20, 40);
        }
        ctx.fillStyle="#000000";
        var helptext = "Normal Controls:\n" +
                        "  Drag points to move them\n" +
                        "  Drag screen to move view\n" +
                        "  Scrollwheel to zoom in/out\n" +
                        "  H - toggle this help text"
        var extra_helptext = "\n\n" + 
                        "Edit Mode Controls:\n" +
                        "  Ctrl + click - add free point\n" +
                        "  Ctrl+Shift + click - add fixed point\n" +
                        "  Alt + click - remove point\n" +
                        "  Shift + drag - add line \n" +
                        "  Capslock - toggle edit mode\n" +
                        "  Tab - toggle physics mode"

        var kempe_helptext = "\n"+
                        "  R - Switch linkage construction algorithm.\n" +
                        "      Optimized linkage has less nodes for faster render,\n"+
                        "      but might not result in a proper linkage.\n\n" + 
                        "Tips:\n" +
                        "  Pick functions which can be visualized within\n" +
                        "    the disc of radius 2 centered on the origin\n" +
                        "  Do not pick functions which cross the origin\n" +
                        "  Simple functions might not work correctly\n" +
                        "  Only the unbraced kempe linkage is displayed, this means that\n" +
                        "    the linkage displayed might have more freedoms of movement\n" +
                        "    if realized physically - this is only a visualization"
        if (!fakingit) {
            helptext = helptext + extra_helptext;
        } else {
            helptext = helptext + kempe_helptext;
            if (accuraterender)
                ctx.fillText("Accurate Linkage", 20, 20);
            else
                ctx.fillText("Optimized Linkage", 20, 20);
        }
        var offset = 20;
        text = helptext.split("\n");
        for (var i=0; i<text.length; i++) {
            ctx.fillText(text[i], 20, 60 + i*offset);
        }

    }

    // ctx.fillStyle = 'green';
    // ctx.lineWidth = 1;
    // ctx.strokeStyle = 'black';
    // ctx.beginPath();
    // ctx.arc((cx+sx*data[0][3][0]), 
    //         (cy+sy*data[0][3][1]), 
    //         RADIUS/2, 0, Math.PI*2, true);
    // ctx.closePath();
    // ctx.fill();
    // ctx.stroke();

    
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
    handleKeys();
    if (!edit_mode && USEPHYSICS)
    {
        // for (var i=0; i<data[1].length; i++)
        // {
        //     var x = data[0][data[1][i][0]][0]-data[0][data[1][i][1]][0];
        //     var y = data[0][data[1][i][0]][1]-data[0][data[1][i][1]][1];
        //     var len = Math.sqrt(x*x+y*y);
        //     if (Math.abs(len-data[1][i][2]) > 0.1)
        //     {

        //     }
        // }
        // if (selected)
        // {
        //     if (!(cmx === undefined || cmy === undefined))
        //     {
        //         var dx = cmx-data[0][selected-1][0];
        //         var dy = cmy-data[0][selected-1][1];
        //         if (!(Math.abs(dx) <= RADIUS/2.0/sx && Math.abs(dy) <= RADIUS/2.0/sx))
        //         {
        //             var forces = evalForces2(data, selected-1, dx, dy);
        //             // console.log(cmx,cmy);
        //             timeStep(data, forces, 0.1);
        //         } else
        //         {
        //         }
        //     }
            
        // }
        // var forces = evalForces(data);
        // timeStep(data, forces, 0.1);
        
        if (fakingit)
        {
            if (selected)
            {
                var dx = cmx-data[0][selected-1][0];
                var dy = cmy-data[0][selected-1][1];
                var forces = pgramForces(data, selected-1, dx, dy);
                // RK4step(data, forces, 0.1);
                timeStep(data, forces, 0.1);
                // if (count<=10)
                //     console.log(forces);
            } else
            {
                var i = 0;
                for (i=0; i<data[0].length; i++)
                    if (!data[0][i][2]) break;
                var forces = pgramForces(data, i, 0, 0);
                // RK4step(data, forces, 0.1);
                timeStep(data, forces, 0.1);
                // if (count<=10)
                //     console.log(forces);
            }
            figureAngles(data[0][1], data[0][2]);
            fakecolor = {};

            if (!accuraterender)
                drawdata = createOptimizedKempeLinkage(data[0][1], data[0][2],terms, fakecolor, anglea, angleb);
            else
                drawdata = createKempeLinkage(normalize(data[0][1]),normalize(data[0][2]),terms, anglea, angleb);

        } else
        {
            if (BOX2DPHYSICS)
            {
                for (var i=0; i<bodies.length; i++)
                {
                    var pos = bodies[i].GetPosition();
                    data[0][i][0] = pos.x;
                    data[0][i][1] = pos.y;
                    // console.log(pos);
                }
                world.Step(1 / 60, 10, 10);
                world.ClearForces();
            } else
            {
                count++;
                if (selected)
                {
                    var dx = cmx-data[0][selected-1][0];
                    var dy = cmy-data[0][selected-1][1];
                    var forces = evalForces3(data, selected-1, dx, dy);
                    // RK4step(data, forces, 0.1);
                    timeStep(data, forces, 0.1);
                    // if (count<=10)
                    //     console.log(forces);
                } else
                {
                    var i = 0;
                    for (i=0; i<data[0].length; i++)
                        if (!data[0][i][2]) break;
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

            data[0].push([mx, my, currentKeysDown[16]]);

            return;
        } else if (currentKeysDown[18]) {
            var mx = (e.offsetX-cx)/sx;
            var my = (e.offsetY-cy)/sy;
            for (var i=0; i<data[0].length; i++)
            {
                if ((Math.abs(data[0][i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data[0][i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
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
    if (edit_mode)
    {
        // ctrl
        if (currentKeysDown[17]) {
            return;
        }

        if (hilight == false)
        {
            var mx = (e.offsetX-cx)/sx;
            var my = (e.offsetY-cy)/sy;
            for (var i=0; i<data[0].length; i++)
            {
                if ((Math.abs(data[0][i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data[0][i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
                {
                    hilight = i+1;
                    lastpos[0] = mx;
                    lastpos[1] = my;
                    break;
                }
            }
        } else if (hilight != false)
        {
            i = hilight-1;
            if (!((Math.abs(data[0][i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data[0][i][1]-my) <= RADIUS/2.0/Math.abs(sy))))
            {
                hilight = false;
            }
        }

    } else
    {
        if (selected == false && hilight == false)
        {
            var mx = (e.offsetX-cx)/sx;
            var my = (e.offsetY-cy)/sy;
            for (var i=0; i<data[0].length; i++)
            {
                if (data[0][i][2])
                    continue;
                if ((Math.abs(data[0][i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data[0][i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
                {
                    hilight = i+1;
                    lastpos[0] = mx;
                    lastpos[1] = my;
                    break;
                }
            }
        } else if (selected != false)
            hilight = selected;
        else if (hilight != false)
        {
            i = hilight-1;
            if (!((Math.abs(data[0][i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data[0][i][1]-my) <= RADIUS/2.0/Math.abs(sy))))
            {
                hilight = false;
            }
        }
    }
}

function handleMouseWheel(e) {
    if (edit_mode)
    {
        if (e.wheelDelta)
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
        }
    } else
    {
        if (e.wheelDelta)
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
        }
    }
    e.returnValue = false;
    e.preventDefault();
    return false;
}

function handleMouseDown(e) {
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
            for (var i=0; i<data[0].length; i++)
            {
                if ((Math.abs(data[0][i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data[0][i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
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
            for (var i=0; i<data[0].length; i++)
            {
                if ((Math.abs(data[0][i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data[0][i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
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

    } else
    {
        var mx = (e.offsetX-cx)/sx;
        var my = (e.offsetY-cy)/sy;
        for (var i=0; i<data[0].length; i++)
        {
            if (data[0][i][2])
                continue;
            if ((Math.abs(data[0][i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data[0][i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
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
                data[0][selected-1][0] += mx-lastpos[0];
                data[0][selected-1][1] += my-lastpos[1];
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
            var dx = mx-data[0][selected-1][0];
            var dy = my-data[0][selected-1][1];
            // data[0][selected-1][0] += dx;
            // data[0][selected-1][1] += dy;
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
                for (var i=0; i<data[0].length; i++)
                {
                    if (i == line_start-1)
                        continue;
                    if ((Math.abs(data[0][i][0]-mx) <= RADIUS/2.0/sx) && (Math.abs(data[0][i][1]-my) <= RADIUS/2.0/Math.abs(sy)))
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
            hilight = false;
        }

        // no keys
        {
            selected = false;
            dragging = false;
            hilight = false;
        }
    } else
    {
        selected = false;
        dragging = false;
        hilight = false;
        if (BOX2DPHYSICS)
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
    // tab
    if (event.keyCode == 9)
    {
        if (fakingit)
            return;
        togglePhysicsMode();
        checkboxphysicsMode.checked = BOX2DPHYSICS;
    }
    // shift
    else if (event.keyCode == 16) {
        
    }

    // ctrl
    else if (event.keyCode == 17) {
        
    }

    // capslock
    else if (event.keyCode == 20) {
        if (fakingit)
            return;
        // edit_mode = !edit_mode;
        toggleEditMode();
        checkboxeditMode.checked = edit_mode;
        dragging = false;
        selected = false;
        line_start = false;
    }

    // left
    else if (event.keyCode == 37) {
    }

    // right
    else if (event.keyCode == 39) {
    }

    // up
    else if (event.keyCode == 38) {
        // sx /= 0.9;
        // sy /= 0.9;
    }

    // down
    else if (event.keyCode == 40) {
        // sx *= 0.9;
        // sy *= 0.9;
    }

    else if (event.keyCode == 'A'.charCodeAt()) {
        sx /= 0.9;
        sy /= 0.9;
        cx = VIEW_WIDTH/2 + (cx-VIEW_WIDTH/2)/0.9
        cy = VIEW_HEIGHT/2 + (cy-VIEW_HEIGHT/2)/0.9
    }

    else if (event.keyCode == 'Z'.charCodeAt()) {
        sx *= 0.9;
        sy *= 0.9;
        cx = VIEW_WIDTH/2 + (cx-VIEW_WIDTH/2)*0.9
        cy = VIEW_HEIGHT/2 + (cy-VIEW_HEIGHT/2)*0.9
    }

    else if (event.keyCode == 'H'.charCodeAt()) {
        displayhelp = !displayhelp;
    }

    else if (event.keyCode == 'R'.charCodeAt()) {
        accuraterender = !accuraterender;
    }
}

var angspeed = 0.01;
var speed = 0.1;
function handleKeys() {
    var m = deltaTime/(1000.0/60);
    // if (currentKeysDown['W'.charCodeAt()])
    // {
    // }

    // shift
    if (currentKeysDown[16]) {

    }

    // ctrl
    if (currentKeysDown[17]) {

    }

    // left
    if (currentKeysDown[37]) {
        // ply.x -= PLY_SPEED*m;
    }

    // right
    if (currentKeysDown[39]) {
        // ply.x += PLY_SPEED*m;
    }

    // up
    if (currentKeysDown[38]) {
        // ply.y -= PLY_SPEED*m;
    }

    // down
    if (currentKeysDown[40]) {
        // ply.y += PLY_SPEED*m;
    }
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


var checkboxeditMode;
function updateEditMode() {
    if (!checkboxeditMode) checkboxeditMode = document.getElementById("checkboxeditMode");
    edit_mode = checkboxeditMode.checked;
    if (!edit_mode)
        initProcessLinesAndPoints();
}

var checkboxphysicsMode;
function updatePhysicsMode() {
    if (!checkboxphysicsMode) checkboxphysicsMode = document.getElementById("checkboxphysics");
    var isedit = edit_mode;
    if (!isedit)
        toggleEditMode();
    BOX2DPHYSICS = checkboxphysicsMode.checked;
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
    console.log(drawdata[2]);
    // mul = createKempeLinkage(1,1,terms);
    // data = mul;
    physicsInit(equs);
    toggleEditMode();
    toggleEditMode();
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
    console.log(drawdata[2]);
    // mul = createKempeLinkage(1,1,terms);
    // drawdata = createKempeLinkage(normalize([4,8]),normalize([8,4]),terms);
    // data = mul;
    physicsInit(equs);
    toggleEditMode();
    toggleEditMode();
}

// in case there's no console
fakeconsole = {};
fakeconsole.emptyConsole = {
    assert : function(){},  
    log : function(){},  
    warn : function(){},  
    error : function(){},  
    debug : function(){},  
    dir : function(){},  
    info : function(){}  
};

if (console && console.log);
else console = fakeconsole.emptyConsole;
