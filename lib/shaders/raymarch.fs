precision highp float;

uniform mat4 clipToWorld;

varying vec3 rayOrigin;

void main() {
  vec3 eye = clipToWorld[3].xyz / clipToWorld[3].w;
  vec3 rayDirection = normalize(rayOrigin - eye);
  
  float a = dot(rayDirection, rayDirection);
  float b = 2.0 * dot(rayDirection, rayOrigin);
  float c = dot(rayOrigin, rayOrigin) - 1.0;
  
  if(b * b < 4.0 * a * c) {
    gl_FragColor = vec4(0, 0, 0, 0);
  } else {
    gl_FragColor = vec4(1, 0, 0, 1);
  }
}
