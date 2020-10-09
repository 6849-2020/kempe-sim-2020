/*
   hi
function ParticleSystem() {
        particles = new Array();
        particles[0] = new Particle(100,100);
        particles[1] = new Force(0,0);


        this.evalF = function(state) {
                var f = new Array();
                for (var i = 0; i < state.length; i++) {
                        if (i % 2 === 0) {
                                // x' = v
                                f[i] = new Velocity(state[i+1].x, state[i+1].y);
                        } else {
                                // x'' = v'
                                f[i] = new Force(-state[i-1].y, state[i-1].x);
                        }
                }
                return f;

        };

        
        this.getState = function() {
                return particles;
        };

        this.setState = function(newState) {
                particles = newState;
        };
        

}
*/


function evalForces(data) {
    var state = data[0];
    var edges = data[1];
    var f = new Array();
    var node;

    var kdrag = 50;
    for (var i = 0; i < state.length; i++) {
        node = state[i];


        // drag force
        f[i] = [node[3], node[4], node[2], -kdrag*node[3], -kdrag*node[4]];
        

        // nulify force and velocity on fixed nodes
        if (node[2]) {
            f[i] = [0, 0, node[2], 0, 0];
        }
        
    }

    //spring forces
    var kspring = 1000;
    for (var i = 0; i < edges.length; i++) {
        var edge = edges[i]; 
        var pt1 = state[edge[0]];
        var pt2 = state[edge[1]];
        var r = edge[2]
        var d = Math.sqrt(Math.pow(pt1[0]-pt2[0],2) + Math.pow(pt1[1] - pt2[1],2));
        var fx = kspring*(d - r) * (pt2[0] - pt1[0])/d;
        var fy = kspring*(d - r) * (pt2[1] - pt1[1])/d;

        // add spring force to pt1
        f[edge[0]][3] += fx;
        f[edge[0]][4] += fy;

        // add spring force to pt2
        f[edge[1]][3] -= fx;
        f[edge[1]][4] -= fy;
    }
    
    



    return f;

}

function evalForces2(data, fi, fx, fy) {
    // fx = fx/Math.abs(fx)*Math.min(Math.abs(fx),10);
    // fy = fy/Math.abs(fy)*Math.min(Math.abs(fy),10);
    var flen = Math.sqrt(fx*fx+fy*fy);

    if (flen > 0.1)
    {
        fx = fx/flen;
        fy = fy/flen;
    }
    flen = Math.min(flen, 10);
    fx *= flen;
    fy *= flen;

    var p = data[0];
    var e = data[1];
    var qf = [0,0,0,0];
    qf[fi*2] = fx;
    qf[fi*2+1] = fy;
    qf[0] += p[0][3]*(-5);
    qf[1] += p[0][4]*(-5);
    qf[2] += p[1][3]*(-5);
    qf[3] += p[1][4]*(-5);

    var j = [   p[0][0]-p[1][0], 
                p[0][1]-p[1][1],
                p[1][0]-p[0][0],
                p[1][1]-p[0][1]];
    var jd = [  p[0][3]-p[1][3], 
                p[0][4]-p[1][4],
                p[1][3]-p[0][3],
                p[1][4]-p[0][4]];



    var node;
    var c = (p[0][0]-p[1][0])*(p[0][0]-p[1][0])+(p[0][1]-p[1][1])*(p[0][1]-p[1][1])-1;
    var cdot = j[0]*p[0][3]+j[1]*p[0][4]+j[2]*p[1][3]+j[3]*p[1][4];

    var w = 1;

    var lambda = (-w*(jd[0]*p[0][3]+jd[1]*p[0][4]+jd[2]*p[1][3]+jd[3]*p[1][4])
        -(j[0]*qf[0]+j[1]*qf[1]+j[2]*qf[2]+j[3]*qf[3])  - 5*c -10*cdot  )/(j[0]*j[0]+j[1]*j[1]+j[2]*j[2]+j[3]*j[3]);


    var jtl = [ j[0]*lambda,
                j[1]*lambda,
                j[2]*lambda,
                j[3]*lambda];

    qf[0] += jtl[0];
    qf[1] += jtl[1];
    qf[2] += jtl[2];
    qf[3] += jtl[3];



    var f = [];
    f.push([p[0][3], p[0][4], false, qf[0], qf[1]]);
    f.push([p[1][3], p[1][4], false, qf[2], qf[3]]);

    return f;
}

var ccccc = 0;
function evalForces3(data, fi, fx, fy) {
    // fx = fx/Math.abs(fx)*Math.min(Math.abs(fx),10);
    // fy = fy/Math.abs(fy)*Math.min(Math.abs(fy),10);
    var flen = Math.sqrt(fx*fx+fy*fy);

    if (flen > 0.1)
    {
        fx = fx/flen;
        fy = fy/flen;
    }
    flen = Math.min(flen, 10);
    fx *= flen;
    fy *= flen;

    var p = data[0];
    var e = data[1];

    var m = [];
    var mr = [];
    var mi = 0;
    for (var i=0; i<p.length; i++)
    {
        if (!p[i][2])
        {
            mr.push(m.length);
            m.push(i);
        } else mr.push(-1);
    }

    var qf = [];
    for (var i=0; i<m.length; i++)
    {
        qf.push(p[m[i]][3]*(-5));
        qf.push(p[m[i]][4]*(-5));
    }
    
    qf[mr[fi]*2] += fx;
    qf[mr[fi]*2+1] += fy;

    var j = [];
    var jd = [];
    for (var i=0; i<e.length; i++)
    {
        j.push([]);
        jd.push([]);
        for (var ii=0; ii<m.length; ii++)
        {
            j[i].push(0);
            j[i].push(0);
            jd[i].push(0);
            jd[i].push(0);
        }
        if (!p[e[i][0]][2])
        {
            var mm = mr[e[i][0]];
            j[i][mm*2]   = p[e[i][0]][0] - p[e[i][1]][0];
            j[i][mm*2+1] = p[e[i][0]][1] - p[e[i][1]][1];
            jd[i][mm*2]   = p[e[i][0]][3] - p[e[i][1]][3];
            jd[i][mm*2+1] = p[e[i][0]][4] - p[e[i][1]][4];
        }
        if (!p[e[i][1]][2])
        {
            var mm = mr[e[i][1]];
            j[i][mm*2]   =  p[e[i][1]][0] - p[e[i][0]][0];
            j[i][mm*2+1] =  p[e[i][1]][1] - p[e[i][0]][1];
            jd[i][mm*2]   =  p[e[i][1]][3] - p[e[i][0]][3];
            jd[i][mm*2+1] =  p[e[i][1]][4] - p[e[i][0]][4];
        }
    }
    //curve constraint
    
    
    //j.push([0,0,0,0,p[3][1],p[3][0]]);
    //jd.push([0,0,0,0,p[3][4],p[3][3]]);
    
    //circle
    // j.push([0,0,0,0,2*p[3][0], 2*p[3][1]]);
    // jd.push([0,0,0,0,2*p[3][3], 2*p[3][4]]);
    



    var node;
    var c = [];
    for (var i=0; i<e.length; i++)
    {
        var dx = p[e[i][0]][0] - p[e[i][1]][0];
        var dy = p[e[i][0]][1] - p[e[i][1]][1];
        c.push(dx*dx+dy*dy-e[i][2]*e[i][2]);
    }

    // curve constraint
    //c.push(p[3][0] * p[3][1] - 1);
	 //circle
    // c.push(p[3][0]*p[3][0] + p[3][1]*p[3][1] - 1);



	

    var cdot = [];
    for (var i=0; i<e.length; i++)
    {
        var val = 0;
        for (var ii=0; ii<m.length; ii++)
        {
            val += j[i][ii*2]*p[m[ii]][3] + j[i][ii*2+1]*p[m[ii]][4];
        }
        cdot.push(val);
    }
    // curve constraint
    //cdot.push(p[3][1]*p[3][3] + p[3][0]*p[3][4]);
    //circle
    // cdot.push(2*p[3][0]*p[3][3] + 2*p[3][1]*p[3][4]);

    var w = 1;

    var num = [];
    for (var i=0; i<(e.length); i++)
    {
        var val = 0;
        for (var ii=0; ii<m.length; ii++)
        {
            val += jd[i][ii*2]*p[ii][3] + jd[i][ii*2+1]*p[ii][4];
            val += j[i][ii*2]*qf[ii*2] + j[i][ii*2+1]*qf[ii*2+1];
        }
        num.push(-val  -5*c[i]  -10*cdot[i]);
    }

    var jt = numeric.transpose(j);
    var jjt = numeric.dot(j,jt);

    var lambda;

    if (numeric.det(jjt) > 0.000001) {
        lambda = numeric.solve(jjt, num);
    } else  {
        lambda = conjugategrad(jjt, num);
    }

    // var lambda = numeric.solve(jjt, num);
    // var lambda = conjugategrad(jjt, num);
    // var xsol = [];
    // for (var i=0; i<num.length; i++)
    //     xsol.push([0]);
    // var lambda = jStat.SOR(jjt, num, xsol, 0.01, 1);
    // if (ccccc++<10)
    // {
    //     console.log(j);
    //     console.log(qf);
    //     console.log(c);
    //     console.log(lambda);
    //     console.log(numeric.det(jjt));
    // }

    var jtl = numeric.dot(jt, lambda);

    for (var i=0; i<qf.length; i++)
        qf[i] += jtl[i];


    var f = [];
    for (var i=0; i<p.length; i++)
    {
        if (p[i][2])
        {
            f.push([0,0,true,0,0]);
        } else
        {
            f.push([p[i][3], p[i][4], false, qf[mr[i]*2], qf[mr[i]*2+1]]);
        }
    }
    return f;
}


var F = function(x, y) {
	// circle
	//return x*x + y*y - 1;	

	// ellipse
	//return (x*x)/4 + y*y - 1;

	// rotated ellipse
	//return x*x + x*y + y*y - 1;

	// squarish circle
	//return x*x*x*x + y*y*y*y - 1;

	// conchoid
	return (x - 1) * (x*x + y*y) + 3*x*x;
}

var Fx = function(x, y) {
	// circle
	//return 2*x;


	// ellipse
	//return x/2;

	// rotated ellipse
	//return 2 * x + y;

	// squarish circle
	//return 4*x*x*x;

	// conchoid
	return 3*x*x + 4*x + y*y;
}

var Fy = function(x, y) {
	// circle
	//return 2*y;

	// ellipse
	//return y/2;

	// rotated ellipse
	//return 2*y + x;

	// squarish circle
	//return 4*y*y*y;

	// conchoid
	return 2*(x-1)*y;
}

var Fxx = function (x, y) {
	// rotated ellipse
	//return 2;

	//squarish circle
	//return 12*x*x;

	// conchoid
	return 6*x + 4;

}

var Fxy = function (x, y) {
	// rotated ellipse
	//return 1;

	// squarish circle
	//return 0;

	// conchoid
	return 2*y;
}

var Fyy = function (x, y) {
	// rotated ellipse
	//return 2;

	//squarish circle
	//return 12*y*y;

	// conchoid
	return 2*(x-1);
}


function physicsInit(equs)
{
    F = equs[0];
    Fx = equs[1];
    Fxx = equs[2];
    Fy = equs[3];
    Fyy = equs[4];
    Fxy = equs[5];
    console.log("physics initialized");
}

function pgramForces(pgram, fi, fx, fy) {
    var flen = Math.sqrt(fx*fx+fy*fy);
    /*

    if (flen > 0.1)
    {
        fx = fx/flen;
        fy = fy/flen;
    }
    flen = Math.min(flen, 10);
    fx *= .5;
    fy *= .5;
    */

    var p = data[0];
    var e = data[1];

    var m = [];
    var mr = [];
    var mi = 0;
    for (var i=0; i<p.length; i++)
    {
        if (!p[i][2])
        {
            mr.push(m.length);
            m.push(i);
        } else mr.push(-1);
    }

    var qf = [];
    for (var i=0; i<m.length; i++)
    {
        qf.push(p[m[i]][3]*(-5));
        qf.push(p[m[i]][4]*(-5));
    }
    
    qf[mr[fi]*2] += fx;
    qf[mr[fi]*2+1] += fy;

    var j = [];
    var jd = [];
    for (var i=0; i<e.length; i++)
    {
        j.push([]);
        jd.push([]);
        for (var ii=0; ii<m.length; ii++)
        {
            j[i].push(0);
            j[i].push(0);
            jd[i].push(0);
            jd[i].push(0);
        }
        if (!p[e[i][0]][2])
        {
            var mm = mr[e[i][0]];
            j[i][mm*2]   = p[e[i][0]][0] - p[e[i][1]][0];
            j[i][mm*2+1] = p[e[i][0]][1] - p[e[i][1]][1];
            jd[i][mm*2]   = p[e[i][0]][3] - p[e[i][1]][3];
            jd[i][mm*2+1] = p[e[i][0]][4] - p[e[i][1]][4];
        }
        if (!p[e[i][1]][2])
        {
            var mm = mr[e[i][1]];
            j[i][mm*2]   =  p[e[i][1]][0] - p[e[i][0]][0];
            j[i][mm*2+1] =  p[e[i][1]][1] - p[e[i][0]][1];
            jd[i][mm*2]   =  p[e[i][1]][3] - p[e[i][0]][3];
            jd[i][mm*2+1] =  p[e[i][1]][4] - p[e[i][0]][4];
        }
    }
    //curve constraint
    
    
    j.push([0,0,0,0,Fx(p[3][0], p[3][1]), Fy(p[3][0], p[3][1])]);
    jd.push([0,0,0,0,Fxx(p[3][0], p[3][1])*p[3][3] +Fxy(p[3][0], p[3][1])*p[3][4], Fyy(p[3][0], p[3][1])*p[3][4] + Fxy(p[3][0], p[3][1])*p[3][3]]);
    



    var node;
    var c = [];
    for (var i=0; i<e.length; i++)
    {
        var dx = p[e[i][0]][0] - p[e[i][1]][0];
        var dy = p[e[i][0]][1] - p[e[i][1]][1];
        c.push(dx*dx+dy*dy-e[i][2]*e[i][2]);
    }

    // curve constraint
    //c.push(p[3][0] * p[3][1] - 1);
	 //circle
    c.push(F(p[3][0], p[3][1]));



	

    var cdot = [];
    for (var i=0; i<e.length; i++)
    {
        var val = 0;
        for (var ii=0; ii<m.length; ii++)
        {
            val += j[i][ii*2]*p[m[ii]][3] + j[i][ii*2+1]*p[m[ii]][4];
        }
        cdot.push(val);
    }
    // curve constraint
    //cdot.push(p[3][1]*p[3][3] + p[3][0]*p[3][4]);
    //circle
    cdot.push(Fx(p[3][0], p[3][1])*p[3][3] + Fy(p[3][0], p[3][1])*p[3][4]);

    var w = 1;

    var num = [];
    for (var i=0; i<(e.length+1); i++)
    {
        var val = 0;
        for (var ii=0; ii<m.length; ii++)
        {
            val += jd[i][ii*2]*p[ii][3] + jd[i][ii*2+1]*p[ii][4];
            val += j[i][ii*2]*qf[ii*2] + j[i][ii*2+1]*qf[ii*2+1];
        }
        num.push(-val  -15*c[i]  -20*cdot[i]);
    }

    var jt = numeric.transpose(j);
    var jjt = numeric.dot(j,jt);

    var lambda;

    if (numeric.det(jjt) > 0.000001) {
        lambda = numeric.solve(jjt, num);
    } else  {
	// alert("noninvertible");

    console.log("noninvertible");
        lambda = conjugategrad(jjt, num);
    }

    // var lambda = numeric.solve(jjt, num);
    // var lambda = conjugategrad(jjt, num);
    // var xsol = [];
    // for (var i=0; i<num.length; i++)
    //     xsol.push([0]);
    // var lambda = jStat.SOR(jjt, num, xsol, 0.01, 1);
    // if (ccccc++<10)
    // {
    //     console.log(j);
    //     console.log(qf);
    //     console.log(c);
    //     console.log(lambda);
    //     console.log(numeric.det(jjt));
    // }

    var jtl = numeric.dot(jt, lambda);

    for (var i=0; i<qf.length; i++)
        qf[i] += jtl[i];


    var f = [];
    for (var i=0; i<p.length; i++)
    {
        if (p[i][2])
        {
            f.push([0,0,true,0,0]);
        } else
        {
            f.push([p[i][3], p[i][4], false, qf[mr[i]*2], qf[mr[i]*2+1]]);
        }
    }
    return f;
}

function conjugategrad(A, b)
{
    // console.log("new call");
    var ccc = 0;
    var x = [];
    var r = [];
    var p = [];
    var rold = [];
    var pold = [];
    var rval = 0;
    for (var i=0; i<b.length; i++)
    {
        x.push(0);
        r.push(0);
        p.push(0);
        rold.push(0);
        pold.push(0);
    }
    // var ans = numeric.dot(A,x);
    for (var i=0; i<b.length; i++)
    {
        p[i] = r[i] = b[i];
        rval += r[i]*r[i];
    }
    var steps = 1;

    while (true)
    {
        var q = numeric.dot(A, r);
        var qq = 0;
        for (var i=0; i<r.length; i++)
            qq += r[i]*q[i];
        var alpha = rval/qq;

        var rsize = 0;
        for (var i=0; i<r.length; i++)
        {
            x[i] = x[i] + alpha * r[i];
        }

        r = numeric.dot(A,x)

        rval = 0;
        for (var i=0; i<r.length; i++)
        {
            r[i] = b[i]-r[i];

            rval += r[i]*r[i];
        }

        // if (ccc++ < 200)
        // {
        //     console.log(rsize);
        //     console.log(x);
        // }
        if (rval < 0.01 || steps++ > 200) break;

    }
    return x;
}

function timeStep(data, forces, t) {
   var state = data[0]; 
   var node;
   var nodeF;

   for (var i = 0; i < state.length; i++) {
       node = state[i];
       nodeF = forces[i];
       
       node[0] = node[0] + t*nodeF[0];
       node[1] = node[1] + t*nodeF[1];
       node[3] = node[3] + t*nodeF[3];
       node[4] = node[4] + t*nodeF[4];
       
   }
};


/*
function RK4step(data, forces, t) {
    var state = data[0];
    var node;
    var nodeF;

    for (var i = 0; i < state.length; i++) {
        node = state[i];
        nodeF = forces[i];

        var k1x = t*nodeF[0];
        var k1y = t*nodeF[1]
        var k1vx = t*nodeF[3];
        var k1vy = t*nodeF[4];

        var k2x = 
    }

}
*/
function RK4step(data, forces, t) {
    var oldData = data.slice(0);

    var a = evalForces(oldData);
    timeStep(oldData, a, t/2);
    var b = evalForces(oldData);
    timeStep(oldData, b, t/2);
    var c = evalForces(oldData);
    timeStep(oldData, c, t);
    var d = evalForces(oldData);

    state = data[0];
    for (var i = 0; i < state.length; i++) {
        node = state[i];
        node[0] += t*(a[i][0] + 2*b[i][0] + 2*c[i][0] +d[i][0])/6;
        node[1] += t*(a[i][1] + 2*b[i][1] + 2*c[i][1] +d[i][1])/6;
        node[3] += t*(a[i][3] + 2*b[i][3] + 2*c[i][3] +d[i][3])/6;
        node[4] += t*(a[i][4] + 2*b[i][4] + 2*c[i][4] +d[i][4])/6;
    }


}
