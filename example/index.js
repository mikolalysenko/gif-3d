"use strict"

var createVolumeRenderer = require("../index.js")
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