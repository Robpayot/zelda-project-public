varying vec2 vUv;

uniform float uTime;

void main() {
  float len = 0.5;
  float falloff = 0.1;
  float p = mod(uTime * 0.25, 2.0);
  // uvX offset
  float alpha = smoothstep(len, len - falloff, abs(vUv.x - p + 0.5));
  // // // widthSegment
  float width = smoothstep(len * 2.0, 0.0, abs(vUv.x - p + 0.5)) * .5;
  alpha *= smoothstep(width, width - .3, abs(vUv.y - 0.5));

  // // make it appear/disappear based on time
  alpha *= smoothstep(0.5, 0.3, abs(p * 0.5 - .5) * (1.0 + len));

  // make sides always thin
  float sides = abs(vUv.x * 2. - 1.);
  alpha *= smoothstep(sides, 0.8, 1.) * (1. - abs(vUv.y * 2. - 1.) * 7. * sides);


  gl_FragColor.rgb = vec3(1.0);
  gl_FragColor.a = alpha;
}
