attribute float offset;
attribute float speed;

uniform sampler2D map;
uniform float uSize;
uniform float uTime;
uniform sampler2D heightMap;
uniform float scaleOcean;

varying vec2 vUv;
varying float vProgress;
varying float vProgressAlpha;

void main() {
  #include <begin_vertex>

  vUv = uv;

	#include <project_vertex>

  vProgress = sin(uTime * 0.1 * speed + offset);
  vProgressAlpha = sin(uTime * 0.1 + offset);


  // Heightmap
  vec3 center = position;
  vec4 worldPos = modelMatrix * vec4(center, 1.0); // get center in worldPos

  // Ocean coord grid
  vec2 uvGrid = vec2(0.5 + worldPos.x / scaleOcean, 0.5 + -worldPos.z / scaleOcean);
  vec4 heightMapPos = texture2D(heightMap, uvGrid);

  // take texel left, right, top, bottom from center texel
  float offset = 0.01;
  vec4 heightMapPos1A = texture2D(heightMap, vec2(uvGrid.x + offset, uvGrid.y));
  vec4 heightMapPos1B = texture2D(heightMap, vec2(uvGrid.x, uvGrid.y + offset));
  vec4 heightMapPos2A = texture2D(heightMap, vec2(uvGrid.x - offset, uvGrid.y));
  vec4 heightMapPos2B = texture2D(heightMap, vec2(uvGrid.x, uvGrid.y - offset));

  // take average of pixel to avoid flicker
  float avgH = (heightMapPos.r + heightMapPos1A.r + heightMapPos1B.r + heightMapPos2A.r + heightMapPos2B.r) / 5.;

  gl_Position.y += (avgH - 0.5) * 2. * (heightMapPos.b * 100.) * 2.;

  gl_PointSize = uSize * (1. + vProgress * 0.2) * (100. / -mvPosition.z);
}
