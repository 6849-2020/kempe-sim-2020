# Rigid Linkages and Kempe Linkages simulation #

This was a final project for [6.849 Fall 2012](http://courses.csail.mit.edu/6.849/fall12/project.html) containing a physics simulation for rigid linkages, as well as a visualizer/simulator of Kempe linkages for algebraic equations.

### Quick Overview of Files ###

* **cas.js** - Computer Algebra System implementation for converting algebraic equations into trigonometic ones. Used to convert *x*,*y* equations into *a*,*b* equations, where *a* and *b* are angles forming the drawing rhombus.
* **casdemo.html** - Simple display for testing various algebraic expression calculations.
* **kempe-linkage.js** - Code for generating kempe linkage constructions.
* **kempe.js** - Main application display/GUI code.
* **kempesim.html** - Simulator/visualizer for Kempe linkages for inputted algebraic equations.
* **linkagesim.html** - Physics simulator for rigid linkages using our physics system.
* **physics.js** - Our specialized rigid linkage physics system.

### Libraries Used ###

* **Box2dWeb-2.1.a.3.js**, **Box2dWeb-2.1.a.3.min.js** - [Box2dWeb](https://code.google.com/p/box2dweb/) physics library as a more stable but less precise physics engine alternative for the linkage simulator.
* **colors.js**, **colors.min.js** - [Colors JS](https://github.com/mbjordan/Colors) library for ease of picking colors.
* **numeric-1.2.3.js**, **numeric-1.2.3.min.js** - [Numeric Javascript](http://numericjs.com/) library for matrix functions.
* **webgl-utils.js** - Google webgl utils for regularly updating animation frames.


### License ###

This content is released under the[ MIT License](https://en.wikipedia.org/wiki/MIT_License).