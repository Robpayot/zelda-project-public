uniform sampler2D map;
// uniform sampler2D alphamap;
uniform vec2 smoothBlue;
uniform float uTime;
uniform float globalOpacity;
uniform float light;
uniform vec2 textureSize;

varying vec2 vUv;


vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.411764705882353) * direction;
  vec2 off2 = vec2(3.2941176470588234) * direction;
  vec2 off3 = vec2(5.176470588235294) * direction;
  color += texture2D(image, uv) * 0.1964825501511404;
  color += texture2D(image, uv + (off1 / resolution)) * 0.2969069646728344;
  color += texture2D(image, uv - (off1 / resolution)) * 0.2969069646728344;
  color += texture2D(image, uv + (off2 / resolution)) * 0.09447039785044732;
  color += texture2D(image, uv - (off2 / resolution)) * 0.09447039785044732;
  color += texture2D(image, uv + (off3 / resolution)) * 0.010381362401148057;
  color += texture2D(image, uv - (off3 / resolution)) * 0.010381362401148057;
  return color;
}


void main() {
  vec2 uv = vUv;
  // uv.y += 0.01 * (sin(uv.x * 3.5 + uTime * 0.35) + sin(uv.x * 4.8 + uTime * 1.05) + sin(uv.x * 7.3 + uTime * 0.45)) / 3.0;
  uv.x += 0.12 * sin(uv.y * 2.0 + uTime * 0.5)  / 6.0;

  // uv.y += 0.12 * (sin(uv.x * 4.2 + uTime * 0.64) + sin(uv.x * 6.3 + uTime * 1.65) + sin(uv.x * 8.2 + uTime * 0.45)) / 3.0;
  vec4 tex = texture2D(map, uv);
  vec4 texBlur = blur13(map, uv, textureSize, vec2(5., 2.));

  float alpha = smoothstep(smoothBlue.x, smoothBlue.y, texBlur.b) * 0.85 ;

  gl_FragColor =  vec4(texBlur.rgb + light, alpha * globalOpacity);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>

}