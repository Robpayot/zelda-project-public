uniform float uTime;
uniform float uVelocity;

#pragma glslify: pnoise2 = require(glsl-noise/periodic/2d)

void main() {

  float noise = pnoise2(vec2(uTime), position.xy) * 7. * (1. + uVelocity * 0.1);

  csm_Position = vec3(position.x, position.y + noise, position.z + noise);
}