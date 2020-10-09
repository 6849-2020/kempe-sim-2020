function Term(c, p) {
    // map variable/function to power
    this.p = p;

    // coefficient
    this.c = c;

    this.simplify();
}

function Equation(terms) {
    // elements, each element is a term or a function
    this.e = terms;

    this.simplify();
}

function Function(name, equations) {
    // name of this function
    this.n = name;

    // the equation(s) inside this function
    this.e = equations;
}

function keys(obj)
{
    var keys = [];

    for (var key in obj) {
        keys.push(key);
    }
    return keys;
}

function strsort(a,b) {
    return a.toString() < b.toString() ? -1 : 1;
}

function type(o){
    return !!o && Object.prototype.toString.call(o).match(/(\w+)\]/)[1];
}

Term.prototype.str = function() {
    if (this.c == 0)
        return "0";
    var id = this.id();
    if (this.c == 1)
        return id=="" ? 1 : id;
    else if (this.c == -1)
        return "-"+(id=="" ? 1 : id);
    else
        return ""+this.c+this.id();
    
}
Term.prototype.toString = Term.prototype.str;

Term.prototype.id = function() {
    if (this.c == 0)
        return "";
    else {
        var s = "";
        var sorted = keys(this.p).sort(strsort);
        for (var i=0; i<sorted.length; i++) {
            var a = sorted[i];
            if (this.p[a]==1)
                s += a;
            else
                s += a+"^"+this.p[a];
        }
        return s;
    }
}

Term.prototype.simplify = function() {
    if (this.c==0)
        this.p = {};
    for (var a in this.p)
        if (this.p[a] == 0)
            delete this.p[a];
    return this;
}

Term.prototype.copy = function() {
    var newp = {};
    for (var i in this.p)
        newp[i] = this.p[i];
    return new Term(this.c, newp);
}

Term.prototype.eval = function(x, v) {
    var copy = this.copy();
    if (this.p[x])
    {
        if (type(v) == 'Number')
        {
            copy.c = copy.c*Math.pow(v,copy.p[x]);
            if (copy.c == 0)
                copy.p = {};
            else
                delete copy.p[x];
        } else
        {
            copy.p[v] = copy.p[x];
            delete copy.p[x];
        }
    }
    return copy;
}

Term.prototype.evalequ = function(x, e) {
    var copy = this.copy();
    var pow = this.p[x];
    delete copy.p[x];
    if (pow)
    {
        var c = e.times(new Equation([copy]));
        for (var i=1; i<pow; i++)
            c = c.times(e);

        return c;
    } else
        return new Equation([copy]);
}

Term.prototype.times = function(t) {
    var cc = this.c*t.c;
    if (cc == 0)
        return new Term(0,{});
    var copy = this.copy();
    copy.c = cc;
    for (var a in t.p)
    {
        var c = copy.p[a];
        if (c) {
            c += t.p[a];
            if (c!=0)
                copy.p[a] = c;
        } else
            copy.p[a] = t.p[a];
    }
    return copy;
}
Term.prototype.mult = Term.prototype.times;

Term.prototype.num = function() {
    if (this.c == 0)
        return 0;
    for (var a in this.p)
        return undefined;
    return this.c;
}

Term.prototype.isnum = function() {
    return this.num() !== undefined;
}

Equation.prototype.str = function() {
    if (this.e.length == 0)
        return "";

    var s = ""+this.e[0];

    for (var i=1; i<this.e.length; i++)
    {
        var t = this.e[i];
        if (t.c < 0)
            s += t;
        else
            s += "+"+t;
    }
    return s;
}
Equation.prototype.toString = Equation.prototype.str;

Equation.prototype.copy = function() {
    var newe = [];
    for (var i=0; i<this.e.length; i++)
        newe.push(this.e[i].copy());
    return new Equation(newe);
}

Equation.prototype.simplify = function() {
    var newterms = [];
    var mapterms = {};

    for (var i=0; i<this.e.length; i++) {
        var t = this.e[i];
        var exists = mapterms[t.id()];
        if (exists) {
            exists.c += t.c;
        } else {
            mapterms[t.id()] = t.copy();
        }
    }

    for (var t in mapterms)
    {
        if (mapterms[t].c != 0)
            newterms.push(mapterms[t]);
    }

    this.e = newterms.sort(strsort);
    return this;
}

Equation.prototype.eval = function(x, v) {
    var newterms = [];
    for (var i=0; i<this.e.length; i++)
        newterms.push(this.e[i].eval(x,v));
    return new Equation(newterms);
}

Equation.prototype.evalequ = function(x, e) {
    var newterms = [];
    var eq;
    for (var i=0; i<this.e.length; i++)
    {
        eq = this.e[i].evalequ(x,e);
        for (var j=0; j<eq.e.length; j++)
            newterms.push(eq.e[j]);
    }
    return new Equation(newterms);
}

Equation.prototype.add = function(e) {
    var copy = this.copy();
    for (var x=0; x<e.e.length; x++)
        copy.p.push(e.e[x].copy());
    return copy.simplify();
}
Equation.prototype.plus = Equation.prototype.add;

Equation.prototype.times = function(e) {
    var newe = [];
    if (type(e) == 'Term')
    {
        for (var x=0; x<this.e.length; x++)
            newe.push(this.e[x].times(e));
    } else 
    {
        for (var x=0; x<this.e.length; x++)
            for (var y=0; y<e.e.length; y++)
                newe.push(this.e[x].times(e.e[y]));
    }
    return new Equation(newe);
}
Equation.prototype.mult = Equation.prototype.times;

Equation.prototype.num = function() {
    if (this.e.length == 0)
        return 0;
    if (this.e.length == 1)
        return this.e[0].num();
    return undefined;
}

Equation.prototype.isnum = function() {
    return this.num() !== undefined;
}

Equation.prototype.simp = function(vars) {
    var res = [0];
    var t;
    var r;
    var bb;
    for (var i=0; i<this.e.length; i++)
    {
        bb = false;
        r = [];
        t = this.e[i];
        r.push(t.c);
        for (var j=0; j<vars.length; j++)
        {
            var power = t.p[vars[j]];
            if (power)
            {
                bb = true;
                r.push(power);
            } else
                r.push(0);
        }
        if (bb)
            res.push(r);
        else
            res[0] += r[0];
    }
    return res;
}

function generateFunction(eval) {
    return function(x,y) {
        var ans = eval[0];
        for (var i=1; i<eval.length; i++)
            ans += eval[i][0]*Math.pow(x,eval[i][1])*Math.pow(y,eval[i][2]);
        return ans;
    }
}

Equation.prototype.genFuncs = function() {
    var funcs = [];

    var f = this.simp(['x','y']);
    funcs.push(generateFunction(f));
    // console.log(f);

    var fx = f.slice();
    fx[0] = 0;
    for (var i=1; i<fx.length; i++)
    {
        fx[i] = f[i].slice();
        if (fx[i][1] > 0)
        {
            fx[i][0] *= fx[i][1];
            fx[i][1] -= 1;
        } else
        {
            fx[i][0] = 0;
        }
    }
    funcs.push(generateFunction(fx));

    var fxx = fx.slice();
    fxx[0] = 0
    for (var i=1; i<fxx.length; i++)
    {
        fxx[i] = fx[i].slice();
        if (fxx[i][1] > 0)
        {
            fxx[i][0] *= fxx[i][1];
            fxx[i][1] -= 1;
        } else
        {
            fxx[i][0] = 0;
        }
    }
    funcs.push(generateFunction(fxx));

    var fy = f.slice();
    fy[0] = 0;
    for (var i=1; i<fy.length; i++)
    {
        fy[i] = f[i].slice();
        if (fy[i][2] > 0)
        {
            fy[i][0] *= fy[i][2];
            fy[i][2] -= 1;
        } else
        {
            fy[i][0] = 0;
        }
    }
    funcs.push(generateFunction(fy));

    var fyy = fy.slice();
    fyy[0] = 0;
    for (var i=1; i<fyy.length; i++)
    {
        fyy[i] = fy[i].slice();
        if (fyy[i][2] > 0)
        {
            fyy[i][0] *= fyy[i][2];
            fyy[i][2] -= 1;
        } else
        {
            fyy[i][0] = 0;
        }
    }
    funcs.push(generateFunction(fyy));

    var fxy = fx.slice();
    fxy[0] = 0;
    for (var i=1; i<fxy.length; i++)
    {
        fxy[i] = fx[i].slice();
        if (fxy[i][2] > 0)
        {
            fxy[i][0] *= fxy[i][2];
            fxy[i][2] -= 1;
        } else
        {
            fxy[i][0] = 0;
        }
    }
    funcs.push(generateFunction(fxy));


    return funcs;
}

Function.prototype.str = function() {
    s = n.name+"(";
    if (s.e.length > 0)
    {
        s += s.e[0].str();
        for (var x=1; x<s.e.length; x++)
            s += ","+s.e[x].str();
    }
    return s+")";
}
Function.prototype.toString = Function.prototype.str;

Function.prototype.copy = function() {
    return new Function(this.n, this.e.copy());
}

function createTerm(s) {
    var terms = {   '0':true,
                    '1':true,
                    '2':true,
                    '3':true,
                    '4':true,
                    '5':true,
                    '6':true,
                    '7':true,
                    '8':true,
                    '9':true,
                    '.':true,
                    '-':true
                };
    if (s[0] == '+') s = s.substring(1);
    var x=0;
    while (x<s.length && terms[s[x]]) x++;

    var c = 1;
    if (x > 0)
    {
        var ss = s.substring(0,x);
        if (ss == "-")
            c = -1;
        else
            c = parseFloat(s.substring(0,x))
    }

    var powers = {};

    while (x<s.length) {
        var n = s[x++];
        var p = 1;
        if (x<s.length && s[x] == '^') {
            var y = x+1;
            while (y<s.length && terms[s[y]]) y++;
            p = parseInt(s.substring(x+1,y));
            x = y;
        }
        powers[n] = p;
    }
    return new Term(c,powers).simplify();
}

function createEquation(s) {
    if (s=="")
        return new Equation([]);
    var x=0;
    var terms = [];
    for (var y=1; y<s.length; y++)
    {
        if (s[y]=='+' || (s[y]=='-' && s[y-1]!='^'))
        {
            terms.push(createTerm(s.substring(x,y)));
            x = y;
        }
    }
    terms.push(createTerm(s.substring(x)));
    return new Equation(terms);
}

function cosID(c) {
    c[2] = ((c[2]%2)+2)%2;
    if (c[0] == 0)
    {
        if (c[1] == 0)
            return c[0]+" "+c[1]+" "+((((c[2]%2)+2)%2)%1);
        else if (c[1] < 0)
        {
            c[0] = -c[0];
            c[1] = -c[1];
            c[2] = -c[2];
            c[2] = ((c[2]%2)+2)%2;
            return c[0]+" "+c[1]+" "+((((c[2]%2)+2)%2)%1);
        } else
            return c[0]+" "+c[1]+" "+((((c[2]%2)+2)%2)%1);
    } else
    {
        if (c[0] < 0)
        {
            c[0] = -c[0];
            c[1] = -c[1];
            c[2] = -c[2];
            c[2] = ((c[2]%2)+2)%2;
            return c[0]+" "+c[1]+" "+((((c[2]%2)+2)%2)%1);
        } else
            return c[0]+" "+c[1]+" "+((((c[2]%2)+2)%2)%1);
    }

    return c[0]+" "+c[1]+" "+((((c[2]%2)+2)%2)%1);
}
// key: 
// 'a' = cos theta
// 'b' = cos phi
// 'c' = sin theta
// 'd' = sin phi
// c = [theta, phi, const]
function cosTerm(coeff, t, i, c, mult, l) {
    switch(t[i])
    {
        case 'a': c[0] += mult; break;
        case 'b': c[1] += mult; break;
        case 'c': c[0] += mult; c[2] -= mult*0.5; break;
        case 'd': c[1] += mult; c[2] -= mult*0.5; break;
    }
    if (i == t.length-1)
    {
        var id = cosID(c);
        var v = l[id];
        var newv = Math.pow(0.5,t.length-1)*coeff;
        if (c[2] >= 1)
            newv = -newv;
        if (v)
            l[id] = v+newv;
        else
            l[id] = newv;
    } else
    {
        cosTerm(coeff, t, i+1, c.slice(0), 1, l);
        cosTerm(coeff, t, i+1, c.slice(0), -1, l);
    }
}

function constructCosReporesentation(e) {
    var l = {};
    var c = 0;
    for (var x=0; x<e.e.length; x++)
    {
        var t = e.e[x];
        if (t.isnum())
            c = t.num();
        else
        {
            var tid = [];
            for (var a in t.p)
            {
                var times = t.p[a];
                for (var b=0; b<times; b++)
                    tid.push(a);
            }
            cosTerm(t.c, tid, 0, [0,0,0], 1, l);
        }
    }
    var terms = [c];
    for (var x in l)
    {
        var coeff = l[x];
        var split = x.split(" ");
        if (coeff == 0) continue;
        var newterm = [coeff, parseInt(split[0]), 
                            parseInt(split[1]), 
                            parseFloat(split[2])*Math.PI];
        if (newterm[1] == 0 && newterm[2] == 0)
        {
            terms[0] += Math.cos(newterm[2])*coeff;
        } else
            terms.push(newterm);
    }
    return terms;
}

function strCos(a)
{
    var s = "";
    var total = 0;
    if (a[0])
    {
        total++;
        s += a[0];
    } else if (a.length == 1)
        return "0";
    for (var i=1; i<a.length; i++)
    {
        if (a[i][0] > 0)
        {
            if (total > 0)
                s += "+";
            if (a[i][0] != 1)
                s += a[i][0];
        } else
        {
            if (a[i][0] == -1)
                s += "-";
            else
                s += a[i][0];
        }
        s += "cos(";
        var terms = 0;
        if (a[i][1])
        {
            if (a[i][1]!=1)
                if (a[i][1] == -1)
                    s += "-";
                else
                    s += a[i][1];
            s += "a"
            terms++;
        }
        if (a[i][2])
        {
            if (a[i][2]>0)
            {
                if (terms > 0)
                    s += "+";
                if (a[i][2]!=1)
                    s += a[i][2];
            } else
            {
                if (a[i][2] == -1)
                    s += "-";
                else
                    s += a[i][2];
            }
            s += "b"
            terms++;
        }
        if (a[i][3])
        {
            if (a[i][3]>0)
            {
                if (terms > 0)
                    s += "+";
                if (a[i][3]!=1)
                    s += a[i][3];
            } else
            {
                if (a[i][3] == -1)
                    s += "-";
                else
                    s += a[i][3];
            }
            // s += "PI";
        }
        s += ")";
        total++;
    }
    return s;
}


var cas = {
    test : function() {
        var t1 = createTerm("-0.394x^5y^8z^2");
        console.log(t1, t1.str(), t1.id(), t1+"");
        var t2 = createTerm("0.394xy^0utz^2");
        console.log(t2, t2.str(), t2.id());
        var t3 = createTerm("-0.394xy^0tuz^2");
        console.log(t3, t3.str(), t3.id());
        var e1 = new Equation([t1,t2,t3]);
        console.log(e1, e1.str());
        console.log(e1.simplify(), e1.str());

        var t = createTerm("-0.1xyz");
        console.log(t.times(t).str());
        console.log(t.times(t).times(t).str());
        console.log(t.times(t).times(t).eval('x',10).str());
        console.log(t.times(t).times(t).eval('x',10).eval('z','a').str());
        console.log(t.times(t).times(t).eval('x',10).eval('a',9).str());

        var e = new Equation([createTerm("xyz"), createTerm("xy"), createTerm("z^2")]);
        console.log(e.str());
        console.log(e.times(e).str());
        console.log(e.times(e).eval('z',2).str());
        console.log(e.times(e).eval('z',2).eval('x',3).str());
        console.log(e.times(e).eval('z',2).eval('x',3).eval('y',9).str());
        console.log(e.times(e).eval('z',2).eval('x',3).eval('y',9).num());
        console.log(e.times(e).eval('z',2).eval('x',3).eval('y',9).isnum());

        var e2 = new Equation([createTerm("a"), createTerm("b")])
        console.log(e2.str());
        console.log(e.str());
        console.log(e.times(e).str());
        console.log(e.times(e).evalequ('z',e2).str());
        console.log(e.times(e).evalequ('z',e2).evalequ('x',e2).str());
        console.log(e.times(e).evalequ('z',e2).evalequ('x',e2).evalequ('y',e2).str());

        var e3 = createEquation("x^2+xy+y^3-x^2-xy^2");
        console.log(createEquation("a+b").str());
        console.log(createEquation("c+d").str());
        console.log(e3.str());
        console.log(e3.evalequ('x',createEquation("a+b"))
                            .str());
        console.log(e3.evalequ('x',createEquation("a+b"))
                        .evalequ('y',createEquation("c+d"))
                            .str());
        console.log(constructCosReporesentation(e3.evalequ('x',createEquation("a+b"))
                        .evalequ('y',createEquation("c+d"))));

        
        var e4 = createEquation("y-1");
        console.log(e4);
        var funcs = e4.genFuncs();
        console.log('f');
        console.log(funcs[0](1,2));
        console.log(funcs[0](0,2));
        console.log(funcs[0](2,0));
        console.log(funcs[0](1,3));
        console.log(funcs[0](4,6));

        console.log('fx');
        console.log(funcs[1](1,2));
        console.log(funcs[1](0,2));
        console.log(funcs[1](2,0));
        console.log(funcs[1](1,3));
        console.log(funcs[1](4,6));

        console.log('fxx');
        console.log(funcs[2](1,2));
        console.log(funcs[2](0,2));
        console.log(funcs[2](2,0));
        console.log(funcs[2](1,3));
        console.log(funcs[2](4,6));

        console.log('fy');
        console.log(funcs[3](1,2));
        console.log(funcs[3](0,2));
        console.log(funcs[3](2,0));
        console.log(funcs[3](1,3));
        console.log(funcs[3](4,6));

        console.log('fyy');
        console.log(funcs[4](1,2));
        console.log(funcs[4](0,2));
        console.log(funcs[4](2,0));
        console.log(funcs[4](1,3));
        console.log(funcs[4](4,6));

        console.log('fxy');
        console.log(funcs[5](1,2));
        console.log(funcs[5](0,2));
        console.log(funcs[5](2,0));
        console.log(funcs[5](1,3));
        console.log(funcs[5](4,6));

    }
}

// cas.test();