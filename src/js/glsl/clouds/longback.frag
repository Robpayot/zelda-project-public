uniform sampler2D map;
uniform float uTime;
uniform float light;
uniform float globalOpacity;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  // uv.y += 0.01 * (sin(uv.x * 3.5 + uTime * 0.35) + sin(uv.x * 4.8 + uTime * 1.05) + sin(uv.x * 7.3 + uTime * 0.45)) / 3.0;
  uv.x += 0.12 * sin(uv.y * 2.0 + uTime * 0.5)  / 6.0;

  // uv.y += 0.12 * (sin(uv.x * 4.2 + uTime * 0.64) + sin(uv.x * 6.3 + uTime * 1.65) + sin(uv.x * 8.2 + uTime * 0.45)) / 3.0;
  vec4 tex = texture2D(map, uv);


  gl_FragColor = vec4(tex.rgb + light, tex.a * 0.9 * globalOpacity);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>

}