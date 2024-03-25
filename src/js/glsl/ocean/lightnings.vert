attribute float offset;
attribute float speed;
attribute float scale;

uniform float uSize;
uniform float uTime;

varying vec2 vUv;
varying float vProgress;
varying float vProgressAlpha;
varying float vScale;
varying float vOffset;

void main() {
  #include <begin_vertex>

  vUv = uv;
  vScale = scale;
  vOffset = offset;

	#include <project_vertex>

  vProgress = sin(uTime * 0.1 * speed + offset);
  vProgressAlpha = sin(uTime * 0.2 + offset) * 2.;

  gl_PointSize = uSize * (400. / -mvPosition.z);
}
