'use strict'

var shell       = require('gl-now')()
var camera      = require('game-shell-orbit-camera')(shell)
var getPixels   = require('get-pixels')
var mat4        = require('gl-mat4')
var createVolumeRenderer = require('./lib/viewer.js')

camera.lookAt([3,0,0], [0,0,0], [0,1,0])

var viewer

shell.on("gl-init", function() {
  getPixels("/example/banana.gif", function(err, voxels) {
    viewer = createVolumeRenderer(shell.gl, voxels)
  })
})

shell.on("gl-render", function() {
  if(viewer) {
    viewer.projection = mat4.perspective(new Float32Array(16), Math.PI/4.0, shell.width/shell.height, 0.01, 1000.0)
    viewer.view = camera.view()
    viewer.draw()
  }
})
