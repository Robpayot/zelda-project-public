varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;

void main() {
  vUv = uv;
  vNormal = normal;
  vec3 pos = position;
  // sun Dir light calculation in worldMatrix, fix
  vec3 surfaceToLightDirection = vec3( viewMatrix * vec4(vec3(0.), 1.0));
  vec3 fixSunDir = vec3(-10., 185., 75.);
  vec3 worldLightPos = vec3(viewMatrix * vec4(fixSunDir, 1.0));
  vSurfaceToLight = normalize(worldLightPos - surfaceToLightDirection);

  vNormal = normalize(normalMatrix * vNormal);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}