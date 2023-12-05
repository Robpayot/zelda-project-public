attribute float delay;
attribute float aSize;
attribute float angle;

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

  vec3 animatedPos = vec3(position.x + cos(angle) * forceDir,
  position.y + uCoefY * sin((forceDir / offset) * (PI / uDuration * (1. / uForce))) * delay,
  position.z + sin(angle) * forceDir);

  csm_Position = animatedPos * uActive;
  csm_PointSize *= (aSize * uActive);
}