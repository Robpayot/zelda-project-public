uniform sampler2D heightMap;
uniform float scaleOcean;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;
varying float vFogDepth;

void main() {
  vUv = uv;
  vNormal = normal;
  vec3 pos = position;

  vNormal = normalize(normalMatrix * vNormal);

	vec4 mvPosition = modelViewMatrix * vec4(pos, 1.);
	vFogDepth = -mvPosition.z;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  // Heightmap
  vec3 center = vec3(0.);
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
}