precision highp float;

uniform mat4 clipToWorld;
uniform sampler2D voxels;
uniform vec3 shape;       //Volume resolution
uniform vec2 zshape;      //Z factorization
uniform vec2 tshape;      //Texture resolution

varying vec3 rayOrigin;

vec2 zcoords(float iz) {
  float row    = floor(iz / zshape.y);
  float column = iz - zshape.y * row;
  return vec2(column, row) * shape.xy;
}

vec4 getVoxel(vec3 p) {

  //Calculate weight, clamp textures out of bounds
  vec3 wp = step(-1.0, p) * step(-1.0, -p);
  float w = wp.x * wp.y * wp.z;

  //Texture coords run from [-1,1], so rescale to voxel units
  vec3 sp = 0.5 * (p + 1.0) * shape;
  sp = clamp(sp, vec3(0,0,0), shape);
  
  //Get offset in xy slice
  vec2 coord = sp.xy;

  //Get z-coordinate
  float iz = floor(sp.z);
  float fz = fract(sp.z);

  //Read pixels
  vec4 l0 = texture2D(voxels, (coord + zcoords(iz))     / tshape);
  vec4 l1 = texture2D(voxels, (coord + zcoords(iz+1.0)) / tshape);

  //Read out result
  return mix(l0, l1, fz) * w;
}

vec4 castRay(vec3 origin, vec3 direction) {
  float dt = 0.045;
  vec4 c = vec4(0.0,0.0,0.0,0.0);
  for(int i=0; i<100; ++i) {
    vec4 ci = getVoxel(origin) * dt * 4.0;
    c = c + ci * max(1.0 - c.a, 0.0);
    origin += direction * dt;
  }
  return c;
}

void main() {
  vec3 eye = clipToWorld[3].xyz / clipToWorld[3].w;
  vec3 rayDirection = normalize(rayOrigin - eye);
  
  gl_FragColor = castRay(rayOrigin, rayDirection);
}
