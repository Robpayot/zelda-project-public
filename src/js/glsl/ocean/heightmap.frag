uniform float heightMapCoef;

varying vec2 vUv;
varying float vDepth;
varying float vDepthAvg;
varying float vYStrength;

void main() {
  gl_FragColor.rgb = vec3(vDepth, vDepthAvg, vYStrength);

  // r = heightmap val
  // g = heightmap avg interpolated val
  // b = heightmap Y strength of height (divided by 100)

  gl_FragColor.a = 1.;
}