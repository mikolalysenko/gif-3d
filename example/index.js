"use strict"

var createVolumeRenderer = require("../index.js")
var shell = require("gl-now")()
var camera = require("game-shell-orbit-camera")(shell)
var glm = require("gl-matrix")
var ndarray = require("ndarray")

var viewer

shell.on("gl-init", function() {
  var tmp = ndarray(new Float32Array(1000), [10,10,10])
	viewer = createVolumeRenderer(shell.gl, tmp)
})

shell.on("gl-render", function() {
  viewer.projection = glm.mat4.perspective(new Float32Array(16), Math.PI/4.0, shell.width/shell.height, 0.01, 1000.0)
  viewer.view = camera.view()
  viewer.draw()
})