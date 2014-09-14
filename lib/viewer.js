'use strict'

var bits          = require('bit-twiddle')
var glslify       = require('glslify')
var createTexture = require('gl-texture2d')
var createVAO     = require('gl-vao')
var createBuffer  = require('gl-buffer')
var ndarray       = require('ndarray')
var pool          = require('typedarray-pool')
var ops           = require('ndarray-ops')
var mat4          = require('gl-mat4')

var imshow = require('ndarray-imshow')

var CUBE_PLANES = [
  [ 1, 0, 0, 1],
  [-1, 0, 0, 1],
  [ 0, 1, 0, 1],
  [ 0,-1, 0, 1],
  [ 0, 0, 1, 1],
  [ 0, 0,-1, 1]
]

module.exports = createVolumeRenderer

var createShader = glslify({
  vert: './shaders/vertex.glsl',
  frag: './shaders/fragment.glsl'
})

function VolumeRenderer(gl, vao, faceBuf, vertBuf, shader, texture, shape, zsplit, tshape) {
  this._gl           = gl
  this._vao          = vao
  this._faceBuf      = faceBuf
  this._vertBuf      = vertBuf
  this._shader       = shader
  this._texture      = texture
  this._shape        = shape
  this._model        = new Float32Array(16)
  this._view         = new Float32Array(16)
  this._projection   = new Float32Array(16)
  this._worldToClip  = new Float32Array(16)
  this._zsplit       = zsplit
  this._tshape       = tshape
  this.opacity       = 1.0
  this.timeShift     = 0.0
  for(var i=0; i<4; ++i) {
    this._model[i+4*i] = this._view[i+4*i] = this._projection[i+4*i] = 1.0
  }
}

var proto = VolumeRenderer.prototype

;(function(){
  var props = ["model", "view", "projection"]
  for(var i=0; i<props.length; ++i) {
    var p = props[i]
    Object.defineProperty(proto, p, {
        get: new Function("return this._" + p)
      , set: new Function("d", ["var m=this._",p,";for(var i=0;i<16;++i){m[i]=d[i]}return m"].join(""))
      , enumerable: true
    })
  }
})()


proto.draw = function() {
  var gl = this._gl
  var shader = this._shader
  
  //Save WebGL state
  var depthMask    = gl.getParameter(gl.DEPTH_WRITEMASK)
  var blend        = gl.getParameter(gl.BLEND)
  var cullFace     = gl.getParameter(gl.CULL_FACE)
  var frontFace    = gl.getParameter(gl.FRONT_FACE)
  var cullFaceMode = gl.getParameter(gl.CULL_FACE_MODE)

  //Set up WebGL state
  gl.depthMask(false)
  gl.enable(gl.CULL_FACE)
  gl.cullFace(gl.BACK)
  gl.frontFace(gl.CCW)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  
  //Calculate camera matrices
  mat4.multiply(this._worldToClip, this._view, this._model)
  mat4.multiply(this._worldToClip, this._projection, this._worldToClip)
  
  //Set up shader
  shader.bind()
  shader.uniforms.worldToClip = this._worldToClip
  shader.uniforms.clipToWorld = mat4.invert(this._worldToClip, this._worldToClip)
  shader.uniforms.voxels      = this._texture.bind(0)
  shader.uniforms.shape       = this._shape
  shader.uniforms.zshape      = this._zsplit
  shader.uniforms.tshape      = this._tshape
  shader.uniforms.opacity     = this.opacity
  shader.uniforms.timeShift   = this.timeShift


  //Draw
  this._vao.bind()
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)
  this._vao.unbind()
  
  //Restore WebGL state
  if(!blend) {
    gl.disable(gl.BLEND)
  }
  gl.depthMask(depthMask)
  if(!cullFace) {
    gl.disable(gl.CULL_FACE)
  }
  gl.cullFace(cullFaceMode)
  gl.frontFace(frontFace)
}

proto.dispose = function() {
  this._vao.dispose()
  this._faceBuf.dispose()
  this._vertBuf.dispose()
  this._shader.dispose()
  this._texture.dispose()
}

function factorZ(x, y, z) {
  var a = Math.ceil(Math.sqrt(x * z / y))|0
  var b = Math.ceil(z / a)|0
  return [a,b]
}

function createVolumeRenderer(gl, array) {
  if(array.shape.length !== 4) {
    throw new Error('Invalid array shape')
  }
  if(array.shape[0] === 0 || array.shape[1] === 0 || array.shape[2] === 0) {
    throw new Error('Invalid array shape')
  }

  var maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
  
  //Unpack texture into square array
  var zsplit = factorZ(array.shape[2], array.shape[1], array.shape[0])
  var gridW = bits.nextPow2(array.shape[2] * zsplit[0])
  var gridH = bits.nextPow2(array.shape[1] * zsplit[1])
  if(gridW > maxTexSize || gridH > maxTexSize) {
    throw new Error('Insufficient texture memory for voxel model')
  }
  var data = pool.mallocUint8(gridW * gridH * 4)
  var s0 = ndarray(data, 
      [zsplit[1], array.shape[1], zsplit[0], array.shape[2], 4],
      [4 *gridW * array.shape[1], 4 * gridW, 4 * array.shape[2], 4, 1], 
      0)
  var nx = array.shape[0]
  for(var i=0; i<nx; ++i) {
    var s = i % zsplit[0]
    var t = (i/zsplit[0])|0
    ops.assign(s0.pick(t, -1, s, -1, -1), array.pick(i))
  }
  var s1 = ndarray(data, [gridH, gridW, 4])

  var texture = createTexture(gl, s1.transpose(1,0))
  pool.free(data)
  texture.minFilter = gl.NEAREST
  texture.magFilter = gl.NEAREST
  texture.wrap      = gl.CLAMP_TO_EDGE
  
  //Create buffers for cube
  var cubeVerts = []
  var cubeFacets = []
  for(var i=0; i<8; ++i) {
    for(var j=0; j<3; ++j) {
      if(i & (1<<j)) {
        cubeVerts.push( 1)
      } else {
        cubeVerts.push(-1)
      }
    }
  }
  for(var d=0; d<3; ++d) {
    var u = 1<<((d + 1) % 3)
    var v = 1<<((d + 2) % 3)
    for(var s=0; s<2; ++s) {
      var m = s << d
      cubeFacets.push(m, m+v, m+u, m+u, m+v, m+u+v)
      var t = u
      u = v
      v = t
    }
  }
  
  //Create cube VAO
  var faceBuf = createBuffer(gl, new Uint16Array(cubeFacets), gl.ELEMENT_ARRAY_BUFFER)
  var vertBuf = createBuffer(gl, new Float32Array(cubeVerts))
  var vao = createVAO(gl, [
    { buffer: vertBuf,
      type: gl.FLOAT,
      size: 3,
      stride: 0,
      offset: 0,
      normalized: false
    }
  ], faceBuf)
  
  //Create shader
  var shader = createShader(gl)
  shader.attributes.position.location = 0
  
  //Return the volume renderer object
  return new VolumeRenderer(gl, 
    vao, 
    faceBuf, 
    vertBuf, 
    shader, 
    texture, 
    [array.shape[2], array.shape[1], array.shape[0]], 
    [zsplit[1], zsplit[0]], 
    [gridW, gridH])
}