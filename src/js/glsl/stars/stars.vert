attribute float offset;
attribute float speed;

uniform float uSize;
uniform float uTime;

varying float vProgressAlpha;

void main() {
  #include <begin_vertex>


	#include <project_vertex>

  vProgressAlpha = sin(uTime * 0.01 + offset);

  gl_PointSize = uSize * (100. / -mvPosition.z);
}
