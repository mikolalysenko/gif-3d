uniform mat4 worldToClip;

attribute vec3 position;

varying vec3 rayOrigin;

void main() {
	gl_Position = worldToClip * vec4(position, 1.0);
  rayOrigin = position;
}