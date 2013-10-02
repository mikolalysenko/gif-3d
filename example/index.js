"use strict"

var createVolumeRenderer = require("../index.js")
var shell = require("gl-now")()
var camera = require("game-shell-orbit-camera")(shell)

var viewer

shell.on("gl-init", function() {
  var tmp = ndarray(new Float32Array(1000), [10,10,10])
	viewer = createVolumeRenderer(shell.gl, tmp)
})

shell.on("gl-render", function() {

  viewer.
	
})