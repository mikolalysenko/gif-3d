raymarch
========
A basic ray marching volume rendering module.

Install
=======

    npm install raymarch

Example
=======

[View this demo in your browser right now](http://mikolalysenko.github.io/raymarch/)

```javascript
var createVolumeRenderer = require("raymarch")
var shell = require("gl-now")()
var camera = require("game-shell-orbit-camera")(shell)
var glm = require("gl-matrix")
var voxelize = require("voxelize")
var bunny = require("bunny")
var ops = require("ndarray-ops")

var viewer

shell.on("gl-init", function() {
  var voxels = voxelize(bunny.cells, bunny.positions, 0.1).voxels
  ops.mulseq(voxels, 255)
  viewer = createVolumeRenderer(shell.gl, voxels)
})

shell.on("gl-render", function() {
  viewer.projection = glm.mat4.perspective(new Float32Array(16), Math.PI/4.0, shell.width/shell.height, 0.01, 1000.0)
  viewer.view = camera.view()
  viewer.draw()
})
```

# API

```javascript
var createVolumeViewer = require("raymarch")
```

## Constructor

### `viewer = createVolumeViewer(gl, array)`
Creates a volume viewer object


## Methods

### `viewer.model`
The current model matrix for the viewer

### `viewer.view`
The current view matrix for the viewer

### `viewer.projection`
The current projection matrix for the viewer

### `viewer.draw()`
Draws the current volume to the screen

### `viewer.dispose()`
Releases all resources associated with this viewer.

# Credits
(c) 2013 Mikola Lysenko. MIT License