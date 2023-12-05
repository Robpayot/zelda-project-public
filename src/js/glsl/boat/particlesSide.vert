attribute float delay;
attribute float aSize;

uniform float uDuration;
uniform float uForce;
uniform float uCoefDelay;
uniform float uCoefY;
uniform float uActive;
uniform float uTime;

varying vec2 vMapUv;

void main() {
  vMapUv = uv;
  float offset = delay * uCoefDelay;
  float forceDir = uForce * mod(uTime, uDuration * offset);

  vec3 animatedPos = vec3(position.x + position.x * forceDir,
  position.y + uCoefY * sin((forceDir / offset) * (PI / uDuration * (1. / uForce))),
  position.z + position.z * forceDir);

  csm_Position = animatedPos;
  csm_PointSize *= (aSize * uActive);
}