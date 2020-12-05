# Kempe Simulator

An interactive interface for linkages that draw.

*Add picture here*

This was a final project for [6.849 Fall 2020](https://courses.csail.mit.edu/6.849/fall20/) that continued the work done in a previous final project for [6.849 Fall 2012](https://github.com/6849-2020/kempe-sim-2012) that contained a physics simulation for rigid linkages.


## How to Use

### Normal Mode

In this mode you can drag the vertices to move the linkage (if it's not constrained). 
Dragging anywhere else on the screen will drag the whole canvas. 
You can zoom in and out using the scroll wheel.

Notice: on the left there are two Physics Engines*:
- **Box2D** is a fast, yet inaccurate engine. It supported options such as undamped motion (fun!) and gravity.
- **C.H.S.Z** is a slower (and more buggy) but for simple linkages produces very precise results.

### Edit Mode

In this mode you can add/remove points and edges. There are three types of points:
- Fixed - cannot move
- Free - can move
- Pen - can move just like Free, but will draw a trace

There are also two types of edges: regular and "Pen". Pen edges will draw a trace as they move.

** add picture here **

### Import FOLD

You can import files in FOLD format. The mandatory fields are:
- vertices_coords
- edges_vertices
Addtionally, you can specify the following fields:
- vertices_kempe:assignment : F/P/X (Free/Pen/fiXed)
- edges_assignment : F/P (Free/Pen)
For more information on the FOLD format please refer to the [FOLD spec](https://github.com/edemaine/fold/blob/master/doc/spec.md)

### Export Linkage to FOLD

You can save your linkages to the FOLD format. The file will store the corrent configuration of the linkage.

### Export Drawing to SVG

You can save your drawing in SVG format.

### Linkage Library

There is a small set of pre-made linkages to experiment with, such as the [Peaucellier–Lipkin Linkage](https://en.wikipedia.org/wiki/Peaucellier%E2%80%93Lipkin_linkage) and [Jansen's Linkage](https://en.wikipedia.org/wiki/Jansen%27s_linkage). If you designed an interesting linkage, [contact me](mailto:eyalp@mit.edu) and I will add it! (alternatively, submit a Pull Request)


## Libraries Used

* **Box2dWeb-2.1.a.3.js**, **Box2dWeb-2.1.a.3.min.js** - [Box2dWeb](https://code.google.com/p/box2dweb/) physics library as a more stable but less precise physics engine alternative for the linkage simulator.
* **numeric-1.2.3.js**, **numeric-1.2.3.min.js** - [Numeric Javascript](http://numericjs.com/) library for matrix functions.
* **webgl-utils.js** - Google webgl utils for regularly updating animation frames.
* **fold.js** - [FOLD](https://github.com/edemaine/fold) for import/export to FOLD format.
* **canvas2svg.js** - [Canvas2Svg](https://github.com/gliffy/canvas2svg) for export to SVG


### License ###

This content is released under the [MIT License](https://en.wikipedia.org/wiki/MIT_License).
