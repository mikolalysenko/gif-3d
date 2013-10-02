"use strict"

var createTexture = require("gl-texture2d")
var createShader = require("gl-shader")
var createVAO = require("gl-vao")
var createBuffer = require("gl-buffer")
var ndarray = require("ndarray")
var pool = require("typedarray-pool")
var ops = require("ndarray-ops")
var fs = require("fs")
var glm = require("gl-matrix")
var mat4 = glm.mat4

module.exports = createVolumeRenderer

var VERT_SRC = fs.readFileSync(__dirname + "/lib/shaders/raymarch.vs")
var FRAG_SRC = fs.readFileSync(__dirname + "/lib/shaders/raymarch.fs")

function VolumeRenderer(gl, vao, faceBuf, vertBuf, shader, texture, shape) {
	this._gl = gl
	this._vao = vao
	this._faceBuf = faceBuf
	this._vertBuf = vertBuf
	this._shader = shader
	this._texture = texture
	this._shape = shape
	this._model = new Float32Array(16)
	this._view = new Float32Array(16)
	this._projection = new Float32Array(16)
  this._worldToClip = new Float32Array(16)
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
  
  gl.enable(gl.CULL_FACE)
  
  mat4.multiply(this._worldToClip, this._view, this._model)
  mat4.multiply(this._worldToClip, this._projection, this._worldToClip)
  
  //this._texture.bind(0)
	shader.bind()
  shader.uniforms.worldToClip = this._worldToClip
  shader.uniforms.clipToWorld = mat4.invert(this._worldToClip, this._worldToClip)
	//shader.uniforms.texture = 0
	shader.uniforms.shape = this._shape
	this._vao.bind()
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)
  this._vao.unbind()
}

proto.dispose = function() {
	this._vao.dispose()
	this._faceBuf.dispose()
	this._vertBuf.dispose()
	this._shader.dispose()
	this._texture.dispose()
}

function createVolumeRenderer(gl, array) {
	if(array.shape.length !== 3) {
		throw new Error("Invalid array shape")
	}
	
	//Unpack texture into ndarray
	var data = pool.mallocUint8(array.shape[0] * array.shape[1] * array.shape[2])
	var gridW = array.shape[0]
	var gridH = array.shape[1] * array.shape[2]
	var s0 = ndarray(data, [array.shape[0], array.shape[1], array.shape[2]])
	ops.assign(s0, array)
	var s1 = ndarray(data, [gridW, gridH])
	var texture = createTexture(gl, s1)
	pool.free(data)
	
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
	var faceBuf = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeFacets))
	var vertBuf = createBuffer(gl, new Float32Array(cubeVerts))
	var vao = createVAO(gl, faceBuf, [
		{	"buffer": vertBuf,
			"type": gl.FLOAT,
			"size": 3,
      "stride": 0,
      "offset": 0,
      "normalized": false
		}
	])
	
	//Create shader
	var shader = createShader(gl, VERT_SRC, FRAG_SRC)
	shader.attributes.position.location = 0
	
	//Return the volume renderer object
	return new VolumeRenderer(gl, vao, faceBuf, vertBuf, shader, texture, array.shape.slice(0))
}