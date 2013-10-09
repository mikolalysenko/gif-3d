precision highp float;

uniform mat4 clipToWorld;
uniform sampler2D voxels;
uniform vec3 shape;
uniform vec2 zshape;
uniform vec2 tshape;

varying vec3 rayOrigin;

vec2 zcoords(float iz) {
  vec2 result;
  result.y = floor(iz / zshape.y);
  result.x = mod(iz, zshape.y);
  return result * shape.xy / tshape;
}

vec4 getVoxel(vec3 p) {
  //Calculate weight
  vec3 wp = step(-1.0, p) * step(-1.0, -p);
  float w = wp.x * wp.y * wp.z;

  //Get z-coordinate
  vec3 sp = 0.5 * (p + 1.0) * shape;
  float iz = floor(sp.z);
  float fz = fract(sp.z);

  //Get tile offset
  vec2 coord = sp.xy / tshape;

  //Read pixels
  vec4 l0 = texture2D(voxels, coord + zcoords(iz));
  vec4 l1 = texture2D(voxels, coord + zcoords(iz+1.0));

  //Read out result
  vec4 result = mix(l0, l1, fz) * w;
  return result.r * vec4(1,1,1,1);
}

vec4 castRay(vec3 origin, vec3 direction) {
  float dt = 0.045;
  vec4 c = vec4(0.0,0.0,0.0,0.0);
  for(int i=0; i<60; ++i) {
    c += getVoxel(origin) * dt;
    origin += direction * dt;
  }
  return c;
}

void main() {
  vec3 eye = clipToWorld[3].xyz / clipToWorld[3].w;
  vec3 rayDirection = normalize(rayOrigin - eye);
  
  gl_FragColor = castRay(rayOrigin, rayDirection);
}
