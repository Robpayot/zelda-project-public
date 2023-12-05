// shadows
uniform mat4 uShadowCameraP;
uniform mat4 uShadowCameraV;

varying vec2 vUv;
// shadows
varying vec4 vShadowCoord;
varying vec3 vNormal;
varying vec3 vPos;

void main() {
  vUv = uv;
  vPos = (modelMatrix * vec4(position, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  // compute shadows
  vNormal = normal;
  vShadowCoord = uShadowCameraP * uShadowCameraV * modelMatrix * vec4(position, 1.0);
}