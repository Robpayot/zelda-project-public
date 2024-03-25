uniform vec3 color;
uniform float uTime;

varying vec2 vUv;
// uv.x from angle 0 to 360
// uv.y from bottom to top

#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)

const float speed = 0.03;

void main() {
  gl_FragColor.rgb = color;


  float noise = snoise2(vec2(abs((vUv.x - 0.5) * 2.) + uTime * speed, vUv.y));
  noise += max(0., snoise2(vec2(abs((vUv.x - 0.5) * 2.) + uTime * speed + 0.5, vUv.y + uTime * speed * 2.)));
  noise += max(0., snoise2(vec2(abs((vUv.x - 0.5) * 2.) + uTime * speed + 1., vUv.y)));
  float edges = 1. - abs((vUv.y - 0.5) * 2.);

  gl_FragColor.a = (0.5 + noise) * (edges * 0.7);
}