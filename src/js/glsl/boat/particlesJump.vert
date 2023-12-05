attribute float delay;
attribute float aSize;
attribute float angle;

uniform float uProgress;

varying vec2 vMapUv;

void main() {
  vMapUv = uv;
  vec3 animatedPos = vec3(position.x,
  position.y + delay * uProgress,
  position.z);

  csm_Position = animatedPos;

  csm_PointSize *= (aSize);
}