uniform sampler2D map;
uniform float uRatioTexture;
uniform float opacity;
uniform float globalOpacity;

varying vec2 vUv;
varying float vProgress;
varying float vProgressAlpha;
varying float vScale;
varying float vOffset;

void main() {
  // // adapt point to UV texture

  // // We get the coordinate inside 1 particle: gl_PointCoord
  vec2 uv = gl_PointCoord;

  float alpha = 1. - vProgressAlpha;

  float ratioUV = uRatioTexture * (1. + 0.);

  // center based on texRatio
  uv.y *= (1. - vScale);
  uv.x *= ratioUV;


  if (vOffset > 50.) {
    uv.x = ratioUV - uv.x;
  }

  vec4 texture = texture2D(map, uv);

  gl_FragColor = texture;

  // if (gl_FragColor.r < 0.5) {
  //   discard;
  // }

  gl_FragColor.a *= alpha * smoothstep(0.4, 1., gl_FragColor.r);
  gl_FragColor.a *= opacity;
  gl_FragColor.a *= globalOpacity;
}