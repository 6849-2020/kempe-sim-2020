//FIX FIND LINE, REFLECT
 
 function createParent(a,b,l){
    var points = [[0,0,true],[a[0],a[1],false],[b[0],b[1],false],[a[0]+b[0],a[1]+b[1],false]];
    var l = 4*Math.sqrt(5);
    var edges = [[0,1,l],[0,2,l],[1,3,l],[2,3,l]];
    return[points,edges];
 }
// function createParent2(a,b,l){
//     var points = [[0,0,true],[8,4,false],[4,8,false],[11,11,false]];
//     var l = 4*Math.sqrt(5);
//     var edges = [[0,1,l],[0,2,l],[1,3,l],[2,3,l]];
//     return[points,edges];
//  }

 /*
 INPUT: Terms in format alpha,beta,[c_1,ma_1,mb_1,d_1],
 [c_2,ma_2,mb_2,d_2]...]

 RETURNS: List of linkages for each cosine term 
 */
function createKempeLinkage(a,b,terms,anga,angb){
    var final_term_links = [];
    //Parent parallelogram p [[p_o,p_a,p_b,p_f],[o_a,o_b,a_f,b_f]
    var parent = createParent(a,b,1);
    var linkage_pts = [parent[0][0], normalize(parent[0][1]).concat([false]), normalize(parent[0][2]).concat([false])];
    var linkage_edges = [] //parent[1];//.concat([1,3,1][2,3,1]);
    shift = 0;
    for (var i = 0; i < terms.length; i++){
        var linkage_term = createLinkage(linkage_pts,terms[i],anga,angb);
        // linkage_term[0].splice(0,4);
        linkage_pts = linkage_pts.concat(linkage_term[0]);
        //alert(JSON.stringify(linkage_term));
        final_term_links.push(linkage_pts.length-1);
    
        var shift_edges = [];
        for(var j = 0; j < linkage_term[1].length; j++){
            var newp1 = linkage_term[1][j][0];
            var newp2 = linkage_term[1][j][1];
            if (newp1 != 0 && newp1 != 1 && newp1 != 2){
                newp1 = shift + newp1;
            }
            if (newp2 != 0 && newp2 != 1 && newp2 != 2){
                newp2 = shift + newp2;
            }
            shift_edges.push([newp1,newp2,linkage_term[1][i][2]]);
        }
        shift = shift + linkage_term[0].length;
        // console.log(linkage_term);
        linkage_edges = linkage_edges.concat(shift_edges);
    }

    root = [0,0,true];
    var ts = linkage_pts.length;
    pt1 = linkage_pts[final_term_links[0]];
    pt1_i = final_term_links[0];
    for( var l = 1; l < final_term_links.length; l++){
        linkage_pts.push([0,0,false]);
        //alert(JSON.stringify(linkage_pts));
    }
    
    //alert(JSON.stringify(linkage_pts));
    for ( var k = 1; k < final_term_links.length; k++){
        var c_i = final_term_links[k];
        var c_pt = linkage_pts[c_i];
        var A = c_pt;
        var B = root;
        var C = pt1;
        var i1 = c_i;
        var i2 = pt1_i;
        for( var i = 1; i <= k; i++){
            if(i == k){
                //alert(JSON.stringify(linkage_pts));
                var n_pt = findThirdPt(A,B,C);
                linkage_pts[k-1+ts] = [n_pt[0],n_pt[1],false];
                linkage_edges.push([k-1+ts,i1,1],[k-1+ts,i2,1]);
            }
            else{
                //alert(JSON.stringify(linkage_pts));
                var n_pt = findThirdPt(A,B,C);
                linkage_pts.push([n_pt[0],n_pt[1],false]);
                linkage_edges.push([linkage_pts.length-1,i1,1],[linkage_pts.length-1,i2,1]);
                A = n_pt;
                i1 = linkage_pts.length-1;
                i2 = ts + i-1; 
                B = C;
                C = linkage_pts[ts + i-1];
                //alert(JSON.stringify(linkage_pts));
            }
        }
    }

    linkage_pts.push(parent[0][1], parent[0][2], parent[0][3]);
    linkage_edges.push(
            [0, linkage_pts.length-3],
            [1, linkage_pts.length-3],
            [0, linkage_pts.length-2],
            [2, linkage_pts.length-2],
            [linkage_pts.length-3, linkage_pts.length-1],
            [linkage_pts.length-2, linkage_pts.length-1]

        );
    // console.log([linkage_pts,linkage_edges]);
    var xx = 0;
    var yy = 0;
    for (var x=0; x<final_term_links.length; x++)
    {
        xx += linkage_pts[final_term_links[x]][0];
        yy += linkage_pts[final_term_links[x]][1];
    }
    linkage_pts.push([xx,yy, false]);
    // fakecolor[""+(pts.length-1)] = 'black';

    return [linkage_pts,linkage_edges];
}

function createOptimizedKempeLinkage(a, b, terms, fakecolor, anglea, angleb)
{
    var pts = [[0,0,true], normalize(a).concat(false), normalize(b).concat(false),
        [1,0,true], [2,0,true], [4,0,true]];
    var lines = [[0,1],[0,2]];
    var maxa = 0; var mina = 0;
    var maxb = 0; var minb = 0;
    var apos = [1], aneg, bpos = [2], bneg;
    var shift;
    var finalpts = [];
    var origanga = Math.atan2(pts[1][1],pts[1][0]);
    var origangb = Math.atan2(pts[2][1],pts[2][0]);

    for (var x=0; x<terms.length; x++)
    {
        if (terms[x][1] > maxa) maxa = terms[x][1];
        if (terms[x][1] < mina) mina = terms[x][1];
        if (terms[x][2] > maxb) maxb = terms[x][2];
        if (terms[x][2] < minb) minb = terms[x][2];
    }
    var p;

    fakecolor[""+1] = "#d0b2ca";
    fakecolor[""+2] = "#fd2850";

    if (maxa>1 || mina<0)
    {
        shift = pts.length;
        p = createOptimizedMultiplier(pts[1], maxa, mina);

        // console.log(p);
        for (var x=p[2].length-1; x>=0; x--)
            p[0].splice(p[2][x], 1);

        pts = pts.concat(p[0]);
        for (var x=0; x<p[1].length; x++)
        {
            // console.log(p[1][x][0], p[1][x][1]);
            var a = p[1][x][0];
            if (a == 0) a = 0;
            else if (a == 1) a = 1;
            else if (a == 2) a = 3;
            else if (a == 3) a = 4;
            else if (a == 4) a = 5;
            else
            {
                for (var y=p[2].length-1; y>=0; y--)
                {
                    if (a>p[2][y]+5)
                    {
                        a -= y+1;
                        break;
                    }
                }
                a += shift-5;
            }
            p[1][x][0] = a;

            a = p[1][x][1];
            if (a == 0) a = 0;
            else if (a == 1) a = 1;
            else if (a == 2) a = 3;
            else if (a == 3) a = 4;
            else if (a == 4) a = 5;
            else
            {
                for (var y=p[2].length-1; y>=0; y--)
                {
                    if (a>p[2][y]+5)
                    {
                        a -= y+1;
                        break;
                    }
                }
                a += shift-5;
            }
            p[1][x][1] = a;

            // console.log('>',p[1][x][0], p[1][x][1]);
        }

        for (var x=0; x<p[3].length; x++)
        {
            var a = p[3][x]
            if (a==1 || a==2) a = 1;
            else
            {
                for (var y=p[2].length-1; y>=0; y--)
                {
                    if (a>p[2][y]+5)
                    {
                        a -= y+1;
                        break;
                    }
                }
                a += shift-5;
            }
            p[3][x] = a;
        }

        for (var x=0; x<p[4].length; x++)
        {
            var a = p[4][x]
            if (a==1 || a==2) a = 1;
            else
            {
                for (var y=p[2].length-1; y>=0; y--)
                {
                    if (a>p[2][y]+5)
                    {
                        a -= y+1;
                        break;
                    }
                }
                a += shift-5;
            }
            p[4][x] = a;
        }

        apos = p[3];
        aneg = p[4];

        lines = lines.concat(p[1]);
    }
    
    if (maxb>1 || minb<0)
    {
        shift = pts.length;
        p = createOptimizedMultiplier(pts[2], maxb, minb);

        // console.log(p);
        for (var x=p[2].length-1; x>=0; x--)
            p[0].splice(p[2][x], 1);

        pts = pts.concat(p[0]);
        for (var x=0; x<p[1].length; x++)
        {
            // console.log(p[1][x][0], p[1][x][1]);
            var a = p[1][x][0];
            if (a == 0) a = 0;
            else if (a == 1) a = 2;
            else if (a == 2) a = 3;
            else if (a == 3) a = 4;
            else if (a == 4) a = 5;
            else
            {
                for (var y=p[2].length-1; y>=0; y--)
                {
                    if (a>p[2][y]+5)
                    {
                        a -= y+1;
                        break;
                    }
                }
                a += shift-5;
            }
            p[1][x][0] = a;

            a = p[1][x][1];
            if (a == 0) a = 0;
            else if (a == 1) a = 1;
            else if (a == 2) a = 3;
            else if (a == 3) a = 4;
            else if (a == 4) a = 5;
            else
            {
                for (var y=p[2].length-1; y>=0; y--)
                {
                    if (a>p[2][y]+5)
                    {
                        a -= y+1;
                        break;
                    }
                }
                a += shift-5;
            }
            p[1][x][1] = a;

            // console.log('>',p[1][x][0], p[1][x][1]);
        }

        for (var x=0; x<p[3].length; x++)
        {
            var a = p[3][x]
            if (a==1 || a==2) a = 2;
            else
            {
                for (var y=p[2].length-1; y>=0; y--)
                {
                    if (a>p[2][y]+5)
                    {
                        a -= y+1;
                        break;
                    }
                }
                a += shift-5;
            }
            p[3][x] = a;
        }

        for (var x=0; x<p[4].length; x++)
        {
            var a = p[4][x]
            if (a==1 || a==2) a = 2;
            else
            {
                for (var y=p[2].length-1; y>=0; y--)
                {
                    if (a>p[2][y]+5)
                    {
                        a -= y+1;
                        break;
                    }
                }
                a += shift-5;
            }
            p[4][x] = a;
        }

        bpos = p[3];
        bneg = p[4];

        lines = lines.concat(p[1]);
    }
    
    // console.log(maxa, mina, maxb, minb);
    // console.log(apos, bpos, aneg, bneg);

    var aindex, bindex;
    // now we do the additors
    for (var ii=0; ii<terms.length; ii++)
    {
        // angle a multiplier = 0
        if (terms[ii][1] == 0)
        {
            if (terms[ii][2]>0)
                bindex = bpos[terms[ii][2]-1];
            else
                bindex = bneg[-terms[ii][2]-1];
            if (terms[ii][3] != 0) // additional angle
            {
                var tang = Math.atan2(pts[bindex][1], pts[bindex][0]);
                tang += terms[ii][3];
                pts.push([Math.cos(tang), Math.sin(tang), false]);
                lines.push([0, pts.length-1]);
                lines.push([bindex, pts.length-1]);
                bindex = pts.length-1;
            }
            if (terms[ii][0] != 1)
            {
                var ap = pts[bindex];
                pts.push([ap[0]*terms[ii][0], ap[1]*terms[ii][0], false]);
                lines.push([0, pts.length-1]);
                lines.push([bindex, pts.length-1]);
                bindex = pts.length-1;
            }
            finalpts.push(bindex);
        } else if (terms[ii][2] == 0) // angle b multiplier = 0
        {
            if (terms[ii][1]>0)
                aindex = apos[terms[ii][1]-1];
            else
                aindex = aneg[-terms[ii][1]-1];
            if (terms[ii][3] != 0) // additional angle
            {
                var tang = Math.atan2(pts[aindex][1], pts[aindex][0]);
                tang += terms[ii][3];
                pts.push([Math.cos(tang), Math.sin(tang), false]);
                lines.push([0, pts.length-1]);
                lines.push([aindex, pts.length-1]);
                aindex = pts.length-1;
            }
            if (terms[ii][0] != 1)
            {
                var ap = pts[aindex];
                pts.push([ap[0]*terms[ii][0], ap[1]*terms[ii][0], false]);
                lines.push([0, pts.length-1]);
                lines.push([aindex, pts.length-1]);
                aindex = pts.length-1;
            }
            finalpts.push(aindex);
        } else // both multipliers non-zero
        {
            if (terms[ii][2]>0)
                bindex = bpos[terms[ii][2]-1];
            else
                bindex = bneg[-terms[ii][2]-1];
            if (terms[ii][1]>0)
                aindex = apos[terms[ii][1]-1];
            else
                aindex = aneg[-terms[ii][1]-1];
            var additor = createALinkage(pts[0], pts[aindex], pts[bindex], terms[ii][3], terms[ii][0], terms[ii], anglea, angleb);
            additor[0].splice(0,3);
            shift = pts.length-3;
            var p1_pos = aindex;
            var p2_pos = bindex;
            for(var i = 0; i < additor[1].length; i++){
              var newp1 = additor[1][i][0];
              var newp2 = additor[1][i][1];
              if(newp1 != 0){
                  if (newp1 == 1){
                      newp1 = p1_pos;
                  }
                  else if(newp1 == 2){
                      newp1 = p2_pos;
                  }
                  else{
                      newp1 = shift + newp1;
                  }
              }
              if(newp2 != 0){
                  if (newp2 == 1){
                      newp2 = p1_pos;
                  }
                  else if(newp2 == 2){
                      newp2 = p2_pos;
                  }
                  else{
                      newp2 = shift + newp2;
                  }
              }
              additor[1][i][0] = newp1;
              additor[1][i][1] = newp2;
            }
            pts = pts.concat(additor[0]);
            lines = lines.concat(additor[1]);
            finalpts.push(pts.length-1);
        }
    }

    var root = [0,0,true];
    var ts = pts.length;
    var pt1 = pts[finalpts[0]];
    var pt1_i = finalpts[0];
    for( var l = 1; l < finalpts.length; l++){
        pts.push([0,0,false]);
        //alert(JSON.stringify(pts));
    }

    fakecolor[""+(pts.length-1)] = 'brown';
    
    //alert(JSON.stringify(pts));
    for ( var k = 1; k < finalpts.length; k++){
        var c_i = finalpts[k];
        var c_pt = pts[c_i];
        var A = c_pt;
        var B = root;
        var C = pt1;
        var i1 = c_i;
        var i2 = pt1_i;
        for( var i = 1; i <= k; i++){
            if(i == k){
                //alert(JSON.stringify(pts));
                var n_pt = findThirdPt(A,B,C);
                pts[k-1+ts] = [n_pt[0],n_pt[1],false];
                lines.push([k-1+ts,i1,1],[k-1+ts,i2,1]);
            }
            else{
                //alert(JSON.stringify(pts));
                var n_pt = findThirdPt(A,B,C);
                pts.push([n_pt[0],n_pt[1],false]);
                lines.push([pts.length-1,i1,1],[pts.length-1,i2,1]);
                A = n_pt;
                i1 = pts.length-1;
                i2 = ts + i-1; 
                B = C;
                C = pts[ts + i-1];
                //alert(JSON.stringify(pts));
            }
        }
    }

    var xx = 0;
    var yy = 0;
    for (var x=0; x<finalpts.length; x++)
    {
        xx += pts[finalpts[x]][0];
        yy += pts[finalpts[x]][1];
    }
    pts.push([xx,yy, false]);
    fakecolor[""+(pts.length-1)] = 'brown';

    for (var i=0; i<finalpts.length; i++)
        fakecolor[""+finalpts[i]] = Colors.rgb2hex(160, 180, 78)

    pts.push([pts[1][0]+pts[2][0], pts[1][1]+pts[2][1], false]);
    lines.push([1,pts.length-1]);
    lines.push([2,pts.length-1]);

    fakecolor[""+(pts.length-1)] = 'green';

    return [pts, lines, finalpts];
}

// 0 = root
// 1 = first point, normalized
// 2 = fixed point 1
// 3 = fixed point 2
// 4 = fixed point 4
// 5x = angle point len 1
// 8 - repeat, discard
function createOptimizedMultiplier(pp, max, min)
{
    var pts = [];
    var edges = [];
    var pl, pl2, p;
    var ind;
    var toremove = [];
    var keypointspos = [1];
    var keypointsneg = [];
    var ang = Math.atan2(pp[1], pp[0]);
    // console.log(ang, pp[0], pp[1]);
    if (max > 1)
    {
        for (var i=2; i<=max; i++)
        {
            var cang1 = ang*(i);
            var cang2 = ang*(i-1);
            var cang3 = ang*(i-2);
            // special implementation for first one
            if (i==2)
            {
                pts.push([Math.cos(cang1), Math.sin(cang1), false]);
                keypointspos.push(pts.length-1+5);
                pts.push([Math.cos(cang2)*2, Math.sin(cang2)*2, false]);

                pl = pts[pts.length-2];
                pl2 = pts[pts.length-1];
                p = reflect(pl[0]+pl2[0], pl[1]+pl2[1], pl[0], pl[1], pl2[0], pl2[1]);
                pts.push([p[0], p[1], false]);

                pts.push([Math.cos(cang3)*4, Math.sin(cang3)*4, true]);

                pl = pts[pts.length-3];
                pl2 = pts[pts.length-1];
                p = reflect(pl[0]+pl2[0], pl[1]+pl2[1], pl[0], pl[1], pl2[0], pl2[1]);
                pts.push([p[0], p[1], false]);

                ind = 5*(i-1);
                edges.push([0, ind]);
                edges.push([0, ind+1]);
                edges.push([1, ind+1]);
                edges.push([ind, ind+2]);
                edges.push([ind+1, ind+2]);
                edges.push([ind+1, ind+4]);
                edges.push([ind+2, ind+4]);
                edges.push([4, ind+4]);
                toremove.push(3);
            } else
            {
                pts.push([Math.cos(cang1), Math.sin(cang1), false]);
                keypointspos.push(pts.length-1+5);
                pts.push([Math.cos(cang2)*2, Math.sin(cang2)*2, false]);

                pl = pts[pts.length-2];
                pl2 = pts[pts.length-1];
                p = reflect(pl[0]+pl2[0], pl[1]+pl2[1], pl[0], pl[1], pl2[0], pl2[1]);
                pts.push([p[0], p[1], false]);

                pts.push([Math.cos(cang3)*4, Math.sin(cang3)*4, false]);

                pl = pts[pts.length-3];
                pl2 = pts[pts.length-1];
                p = reflect(pl[0]+pl2[0], pl[1]+pl2[1], pl[0], pl[1], pl2[0], pl2[1]);
                pts.push([p[0], p[1], false]);

                ind = 5*(i-1);
                edges.push([0,      ind]);
                edges.push([0,      ind+1]);
                edges.push([ind-5,  ind+1]);
                edges.push([ind,    ind+2]);
                edges.push([ind+1,  ind+2]);

                edges.push([0,      ind+3]);
                edges.push([ind-4,  ind+3]);
                edges.push([ind+1,  ind+4]);
                edges.push([ind+2,  ind+4]);
                edges.push([ind+3,  ind+4]);
            }
        }
        ind = 5*max;
    } else ind = 5;


    if (min<0)
    {
        for (var i=-1; i>=min; i--)
        {
            var cang1 = ang*(i+2);
            var cang2 = ang*(i+1);
            var cang3 = ang*(i);
            // special implementation for first two
            if (i==-1)
            {
                pts.push([pp[0], pp[1], false]);
                toremove.push(pts.length-1);
                pts.push([2, 0, true]);
                toremove.push(pts.length-1);

                pl = pts[pts.length-2];
                pl2 = pts[pts.length-1];
                p = reflect(pl[0]+pl2[0], pl[1]+pl2[1], pl[0], pl[1], pl2[0], pl2[1]);
                pts.push([p[0], p[1], false]);


                pts.push([Math.cos(cang3)*4, Math.sin(cang3)*4, false]);
                keypointsneg.push(pts.length-1+5);

                pl = pts[pts.length-3];
                pl2 = pts[pts.length-1];
                p = reflect(pl[0]+pl2[0], pl[1]+pl2[1], pl[0], pl[1], pl2[0], pl2[1]);
                pts.push([p[0], p[1], false]);

                edges.push([1,  ind+2]);
                edges.push([3,  ind+2]);
                edges.push([0,  ind+3]);
                edges.push([3,  ind+4]);
                edges.push([ind+2,  ind+4]);
                edges.push([ind+3,  ind+4]);
            } else if (i == -2)
            {
                pts.push([Math.cos(cang1), Math.sin(cang1), false]);
                toremove.push(pts.length-1);
                pts.push([Math.cos(cang2)*2, Math.sin(cang2)*2, false]);

                pl = pts[pts.length-2];
                pl2 = pts[pts.length-1];
                p = reflect(pl[0]+pl2[0], pl[1]+pl2[1], pl[0], pl[1], pl2[0], pl2[1]);
                pts.push([p[0], p[1], false]);

                pts.push([Math.cos(cang3)*4, Math.sin(cang3)*4, false]);
                keypointsneg.push(pts.length-1+5);

                pl = pts[pts.length-3];
                pl2 = pts[pts.length-1];
                p = reflect(pl[0]+pl2[0], pl[1]+pl2[1], pl[0], pl[1], pl2[0], pl2[1]);
                pts.push([p[0], p[1], false]);

                edges.push([0,      ind+1]);
                edges.push([ind-2,  ind+1]);
                edges.push([2,      ind+2]);
                edges.push([ind+1,  ind+2]);

                edges.push([0,      ind+3]);
                edges.push([ind+1,  ind+4]);
                edges.push([ind+2,  ind+4]);
                edges.push([ind+3,  ind+4]);
            } else
            {
                pts.push([Math.cos(cang1), Math.sin(cang1), false]);
                pts.push([Math.cos(cang2)*2, Math.sin(cang2)*2, false]);

                pl = pts[pts.length-2];
                pl2 = pts[pts.length-1];
                p = reflect(pl[0]+pl2[0], pl[1]+pl2[1], pl[0], pl[1], pl2[0], pl2[1]);
                pts.push([p[0], p[1], false]);

                pts.push([Math.cos(cang3)*4, Math.sin(cang3)*4, false]);
                keypointsneg.push(pts.length-1+5);

                pl = pts[pts.length-3];
                pl2 = pts[pts.length-1];
                p = reflect(pl[0]+pl2[0], pl[1]+pl2[1], pl[0], pl[1], pl2[0], pl2[1]);
                pts.push([p[0], p[1], false]);

                edges.push([0,      ind]);
                edges.push([0,      ind+1]);
                edges.push([ind-4,  ind]);
                edges.push([ind-2,  ind+1]);
                edges.push([ind,    ind+2]);
                edges.push([ind+1,  ind+2]);

                edges.push([0,      ind+3]);
                edges.push([ind+1,  ind+4]);
                edges.push([ind+2,  ind+4]);
                edges.push([ind+3,  ind+4]);
            }
            ind +=5;
        }
    }

    for (var i=keypointsneg.length; i>0; i--)
    {
        if (i==keypointsneg.length)
        {
            var cang1 = ang*(-i);
            pts.push([Math.cos(cang1), Math.sin(cang1), false]);
            edges.push([0, pts.length-1+5]);
            edges.push([keypointsneg[i-1], pts.length-1+5]);
            keypointsneg[i-1] = pts.length-1+5;
        } else if (i==keypointsneg.length-1)
        {
            var cang1 = ang*(-i);
            pts.push([Math.cos(cang1), Math.sin(cang1), false]);
            edges.push([0, pts.length-1+5]);
            edges.push([keypointsneg[i-1]+3, pts.length-1+5]);
            keypointsneg[i-1] = pts.length-1+5;
        } else
        {
            keypointsneg[i-1] += 7;
        }
    }

    return [pts, edges, toremove, keypointspos, keypointsneg];
}

//Used in making translator linkages
function findThirdPt(pA,pB,pC){
    dx = pC[0] - pB[0];
    dy = pC[1] - pB[1];
    return [pA[0]+dx,pA[1]+dy];
}

function createPLinkage(x, y, l)
{
    var r = l/3.0;
    pts = [
        [x-3*r, y, true],
        [x-2*r, y, true],
        [x-r, y, false],
        [x-r/2, y+r*1.5, false],
        [x-r/2, y-r*1.5, false],
        [x, y, false]
        ];
    lns = [
        [1,2],
        [0,3],
        [0,4],
        [3,5],
        [4,5],
        [2,3],
        [2,4]
    ];
    return [pts, lns];
}

/*
INPUT: Angles a and b, Parent parallelogram p [[p_o,p_a,p_b,p_f],[o_a,o_b,a_f,b_f]] and  single linkage params [c_1,ma_1,mb_1,d_1]

RETURNS: list representation of the linkage[[p_1,p_2...],[e_1,e_2...]] where p_i is a point in format [x,y,bool], and e_i is of the form [p_s,p_e,length] and the indices of
p1 and p2 of the multiplicators.
*/
function createLinkage(parent, params, anga, angb){
  // console.log(parent);
  var linkage = [];
  //Multiplicator terms, returns additional points,edges to be attached to parent
  var p_edge_length = 1.0 // parent[1][0][2];
  var mul_one = createMLinkage(params[1],parent[0],parent[1],p_edge_length);
  var mul_two = createMLinkage(params[2],parent[0],parent[2],p_edge_length);
  // //document.write(JSON.stringify(mul_one));
  // //document.write(JSON.stringify(mul_two));
  // console.log(mul_one);
  // console.log(mul_two);


  //Combine mul_one and mul_two, they share points in the parent
  //parallelogram [p_0,p_a,p_b,p_f]

  //m1 looks like [p_0,p_a........f_1], remove first two pts,
  //shift edges not 0,1 by 2 
  var mul_one_pts = mul_one[0].slice();
  mul_one_pts.splice(0,2);
  var mul_one_edges = [];
  for(var i = 0; i < mul_one[1].length; i++){
    var newp1 = mul_one[1][i][0];
    var newp2 = mul_one[1][i][1];
    if (newp1 != 0 && newp1 != 1){
        newp1 = 1 + newp1;
    }
    if (newp2 != 0 && newp2 != 1){
        newp2 = 1 + newp2;
    }
    mul_one_edges.push([newp1,newp2,mul_one[1][i][2]]);
  }

  //attach m2 to m1, m2 looks like [p_0,p_b........f_1], remove
  //first two pts
  var mul_two_pts = mul_two[0].slice();
  mul_two_pts.splice(0,2);
  //modify edges so that any edge with index 1
  //now points to index 2, shift rest.
  var shift = mul_one_pts.length +1;
  var mul_two_edges = [];
  for(var i = 0; i < mul_two[1].length; i++){
    var newp1 = mul_two[1][i][0];
    var newp2 = mul_two[1][i][1];
    if (newp1 != 0){
        if(newp1 == 1){
            newp1 = 2;
        }
        else{
            newp1 = newp1 + shift; 
        }   
    }
    if (newp2 != 0){
        if(newp2 == 1){
            newp2 = 2;
        }
        else{
            newp2 = newp2 + shift; 
        }   
    }
    mul_two_edges.push([newp1,newp2,mul_two[1][i][2]]);
  }

  //Put them through the additor;
  //alert(JSON.stringify(mul_one_pts));
  var mul_one_last = mul_one_pts.length == 0 ? normalize(parent[1]) : mul_one_pts[mul_one_pts.length-1];
  var mul_two_last = mul_two_pts.length == 0 ? normalize(parent[2]) : mul_two_pts[mul_two_pts.length-1];

  var additor = createALinkage(parent[0], mul_one_last, mul_two_last, params[3], params[0], params, anga, angb);
  //Combine mul pts, edges:
  var final_pts = mul_one_pts.concat(mul_two_pts);
  var final_edges = mul_one_edges.concat(mul_two_edges);


  var additor_pts = additor[0].slice();
  additor_pts.splice(0,3);
  var shift = final_pts.length -3+3;
  var p1_pos = mul_one_pts.length == 0 ? 1 : mul_one_pts.length -1+3;
  var p2_pos = mul_two_pts.length == 0 ? 2 : final_pts.length -1+3;
  for(var i = 0; i < additor[1].length; i++){
    var newp1 = additor[1][i][0];
    var newp2 = additor[1][i][1];
    if(newp1 != 0){
        if (newp1 == 1){
            newp1 = p1_pos;
        }
        else if(newp1 == 2){
            newp1 = p2_pos;
        }
        else{
            newp1 = shift + newp1;
        }
    }
    if(newp2 != 0){
        if (newp2 == 1){
            newp2 = p1_pos;
        }
        else if(newp2 == 2){
            newp2 = p2_pos;
        }
        else{
            newp2 = shift + newp2;
        }
    }
    final_edges.push([newp1,newp2,additor[1][i][2]]);
  }
  final_pts =  final_pts.concat(additor_pts);
  //var additor = createALinkage(parent[0][0], normalize(parent[0][1]), normalize(parent[0][2]), params[3], params[0]);
  //Additor terms
  //Scale by c
  //return linkage
  //return mul_one;
  //return additor;
  return [final_pts,final_edges];
}

/*
INPUT: The angle to be multiplied, the number of times to be multiplied n, the points of the parent edge to which all other edges are attached,the length of the parent edge.

RETURNS: list of additional points, and edges to be added to the linkage
last point is the resulting multiplied point, scaled to length 1.0
format is like this: [p2,p2,m_1,n_1,bracing for the contra ps....,contrap points]
*/

function createMLinkage(n,p1,p2,l){
    var pts = []
    var edges = []
    if(n == 0){
        return[[p1,normalize(p2)],[[0,1,1]]];
    }
    if(n == 1){
        return[[p1,normalize(p2)],[[0,1,1]]];
    }
    //Anchor contra-parallelogram
    var m_1 = [2.0*l,0.0,true];
    var n_1 = reflect(p2[0]+2.0*l, p2[1], p2[0], p2[1], 2.0*l, 0.0);
    n_1.push(false);

    pts = pts.concat([p1,p2,m_1,n_1]);

    var e_0 = [0,1,l];
    var e_1 = [0,2,2.0*l];
    var e_2 = [1,3,2.0*l];
    var e_3 = [2,3,l];

    edges = edges.concat([e_0,e_1,e_2,e_3]);

    //Multiplicative contra-parallelograms;
    var len = pts.length;
    var unit_l = l;
    var newpts;
    var newedges;
    if( n > 1 ){
        newpts = mulContraPara(pts[len-3],pts[len-1],unit_l/2.0);
        pts = pts.concat(newpts);


        len = pts.length;
        e_1 = [len-2,len-1,unit_l];
        e_2 = [0,len-1,unit_l/2.0];
        e_3 = [len-2,3,unit_l*(3/4.0)]; 
        e_4 = [len-2,1,unit_l*(1/4.0)];
        newedges = [e_1,e_2,e_3,e_4];
        edges = edges.concat(newedges);
        unit_l = unit_l/2.0; 

    }
    for(var j = 2; j < n; j++){
        newpts = mulContraPara(pts[len-1],pts[len-2],unit_l/2.0);
        pts = pts.concat(newpts);

        ////pts looks like [p1,p2,m_1,n_1,np1_2,np1_1]
        len = pts.length;
        e_1 = [len-2,len-1,unit_l];
        e_2 = [0,len-1,unit_l/2.0];

        //Edges to make sure point anchored on bar
        e_3 = [len-2,len-3,unit_l*(3/4.0)]; 
        e_4 = [len-2,len-4,unit_l*(1/4.0)];
        newedges = [e_1,e_2,e_3,e_4];
        edges = edges.concat(newedges);
        unit_l = unit_l/2.0;

    }

    var lastpoint = pts[pts.length-1];
    var ll = Math.sqrt((lastpoint[0]-p1[0])*(lastpoint[0]-p1[0])+(lastpoint[1]-p1[1])*(lastpoint[1]-p1[1]));
    lastpoint = [(lastpoint[0]-p1[0])/ll+p1[0], (lastpoint[1]-p1[1])/ll+p1[1],false];
    pts.push(lastpoint);
    edges.push([0, pts.length-1]);
    edges.push([pts.length-2,pts.length-1]);
    return [pts,edges];
}

/*
INPUT: 3 points on the anchor parallelogram, the length of the short side of the anchor 
*/
function mulContraPara(p1,p2,l){
    var x1 = p1[0];
    var y1 = p1[1];
    var x2 = p2[0];
    var y2 = p2[1];

    //Locate anchor point on long side of parent
    var nx2 = x1 + (x2-x1)*(1/4.0);
    var ny2 = y1 + (y2-y1)*(1/4.0);

    var np2 = [nx2,ny2,false];

    //Locate other anchor point
    var nx1 = nx2 - x1;
    var ny1 = ny2 - y1;

    var np1 = reflect(nx1, ny1, 0, 0, nx2, ny2);
    np1.push(false);
    return [np2,np1];
}

function createALinkage(root, p1, p2, angle, length, term, anga, angb)
{
    // console.log(root, p1, p2, angle, length)
    var mp = [p1[0]+p2[0], p1[1]+p2[1]];
    var ang1 = Math.atan2(p1[1],p1[0]);
    var ang2 = Math.atan2(p2[1],p2[0]);
    ang1 = (ang1+Math.PI*2)%(Math.PI*2);
    ang2 = (ang2+Math.PI*2)%(Math.PI*2);
    var ang;
    if (term === undefined)
    {
        ang = (ang1+ang2)/2;
        // if (Math.abs(ang-ang1) > Math.PI/2)
        // if (ang1 > ang2)
        //     ang = ang+Math.PI;
        
    } else
    {
        ang = (term[1]*anga+term[2]*angb)/2;
    }

    mp = [Math.cos(ang), Math.sin(ang)];

    var pts = [
                [root[0], root[1], false],
                [p1[0], p1[1], false],
                [p2[0], p2[1], false]
                ];
    var edges = [
                    [0, 1],
                    [0, 2],
                ];

    var np1 = [p1[0]*2.0, p1[1]*2.0, false];
    var np2 = [p2[0]/2.0, p2[1]/2.0, false];
    pts.push(np1);
    pts.push(np2);
    edges.push([0,3]);
    edges.push([1,3]);
    edges.push([0,4]);
    edges.push([2,4]);

    pts.push([mp[0],mp[1],false]);
    edges.push([0,5]);

    var np3 = [np1[0]+mp[0], np1[1]+mp[1], false];
    np3 = reflect(np3[0], np3[1], mp[0], mp[1], np1[0], np1[1]);
    np3.push(false);
    pts.push(np3);
    edges.push([3,6]);
    edges.push([5,6]);

    var np4 = [(np3[0]-mp[0])*0.25+mp[0],(np3[1]-mp[1])*0.25+mp[1], false];
    pts.push(np4);
    edges.push([5,7]);
    edges.push([6,7]);
    edges.push([4,7]);

    pts.push([2,0, true]);
    var p9 = reflect(mp[0]+2, mp[1], mp[0], mp[1], 2, 0);
    p9.push(false);
    pts.push(p9);
    edges.push([0,8]); // optional
    edges.push([8,9]);
    edges.push([5,9]);

    pts.push([(p9[0]-mp[0])*0.25+mp[0], (p9[1]-mp[1])*0.25+mp[1], false]);
    edges.push([9,10]);
    edges.push([5,10]);

    var p11 = reflect(pts[10][0]-pts[5][0], pts[10][1]-pts[5][1], 0, 0, pts[10][0], pts[10][1]);
    p11.push(false);
    pts.push(p11);
    edges.push([0,11]);
    edges.push([10,11]);

    if(angle != 0){
        var p12 = [p11[0]*Math.cos(angle)-p11[1]*Math.sin(angle), p11[0]*Math.sin(angle)+p11[1]*Math.cos(angle), false];
        pts.push(p12);
        edges.push([0,12]);
        edges.push([11,12]);
    }

    p_last = pts[pts.length-1];
    var p_lastlen = Math.sqrt(p_last[0]*p_last[0]+p_last[1]*p_last[1]);
    pts.push([p_last[0]/p_lastlen*length, p_last[1]/p_lastlen*length, false]);

    edges.push([0,pts.length-1]);
    edges.push([pts.length-2,pts.length-1]);
    // console.log(pts);


    return [pts, edges];
}

function normalize(p)
{
    var pl = Math.sqrt(p[0]*p[0] + p[1]*p[1]);
    return [p[0]/pl, p[1]/pl];
}

function reflect(ax, ay, x1, y1, x2, y2)
{
    var ans = perpendicular(ax, ay, x1, y1, x2, y2);
    return [2*ans[0]-ax, 2*ans[1]-ay];
}

function perpendicular(ax, ay, x1, y1, x2, y2)
{
    var dx = x2-x1;
    var dy = y2-y1;
    var dd = dx*dx + dy*dy;
    var q = ((ax-x1)*dx+(ay-y1)*dy)/dd;
    return [x1+q*dx, y1+q*dy];
}

function bracePara(angle,n,p1,p2){
}

/*
INPUT: four points of the ContraPara, l1, the length
of the short side, l2 the length of the long side
*/
function braceContraPara(a,b,c,d){
    //Length of the struts
    var l1 = distance(a,b);
    var l2 = distance(b,c);
    var r2 = (l1+l2)/2.0;
    var r1 = Math.sqrt(r2*r2-0.25*(l2*l2-l1*l1));
    //Points on longer struts
    var P = midpoint(a,b);
    var R = midpoint(a,d);
    var S = midpoint(b,c);
    var Q = midpoint(d,c);
    //Figure out position of last point
    var base = distance(R,S);
    var alt = Math.sqrt(r1*r1-(base*0.5)*(base*0.5));
    var dx = R[0] - S[0];
    var dy = R[1] - S[1];
    var norm = normalize([-dy,dx]);
    var start = midpoint(R,S);
    var T = [start[0]+norm[0]*alt,start[1]+norm[1]*alt,false];
    //alert(JSON.stringify(distance(a,b)));
    return [P,R,S,Q,T,r1,r2];

}
function midpoint(p1,p2){
    return [0.5*(p1[0]+p2[0]),0.5*(p1[1]+p2[1]),false];
}
function distance(p1,p2){
    var xdist = p1[0]-p2[0];
    var ydist = p1[1]-p2[1]; 
    return Math.sqrt(xdist*xdist+ydist*ydist);
}
// $(document).ready(function(){
//     parent = createParent(1,1,1);
//     //document.write(JSON.stringify(parent));
//     params = [1,2,0,0];
//     mul = createMLinkage(params[1], parent[0][0],parent[0][1],parent[1][0][2]);
//     document.write(JSON.stringify(mul));
// });