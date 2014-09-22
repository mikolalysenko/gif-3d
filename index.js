'use strict'

var shell       = require('gl-now')()
var camera      = require('game-shell-orbit-camera')(shell)
var getPixels   = require('get-pixels')
var mat4        = require('gl-mat4')
var now         = require('right-now')
var url         = require('parsed-url')
var listenDrop  = require('drag-and-drop-files')
var createVolumeRenderer = require('./lib/viewer.js')

camera.lookAt([0,0,-5], [0,0,0], [0,-1,0])

var viewer

function loadVoxels(href) {
  getPixels(href, function(err, voxels) {
    if(err || voxels.dimension !== 4) {
      loadVoxels("example/banana.gif")
      return
    }
    if(viewer) {
      viewer.dispose()
    }
    window.history.replaceState({}, 'Gif 3D', '?href=' + href)
    viewer = createVolumeRenderer(shell.gl, voxels.transpose(0, 2, 1))
  })
}

shell.on("gl-init", function() {
  loadVoxels(url.query.href || "example/banana.gif")

  listenDrop(shell.element, function(files) {
    if(files.length !== 1) {
      return
    }
    var reader = new FileReader()
    reader.onloadend = function() {
      loadVoxels(reader.result)
    }
    reader.readAsDataURL(files[0])
  })
})

shell.on("gl-render", function() {
  if(viewer) {
    viewer.timeShift = now() * 0.001
    viewer.projection = mat4.perspective(new Float32Array(16), Math.PI/4.0, shell.width/shell.height, 0.1, 1000.0)
    viewer.view = camera.view()
    viewer.draw()
  }
})
