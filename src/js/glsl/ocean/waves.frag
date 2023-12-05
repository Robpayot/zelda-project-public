uniform sampler2D map;
uniform float uRatioTexture;
uniform float opacity;
uniform float globalOpacity;

varying vec2 vUv;
varying float vProgress;
varying float vProgressAlpha;

void main() {
  // // adapt point to UV texture

  // // We get the coordinate inside 1 particle: gl_PointCoord
  vec2 uv = gl_PointCoord;


  float alpha = 1. - vProgressAlpha;

  float ratioUV = uRatioTexture * (.5 + vProgress * 0.5);

  // center based on texRatio
  uv.y += ratioUV / 2. - 0.5;
  uv.y /= ratioUV;

  vec4 texture = texture2D(map, uv);

  gl_FragColor = texture;

  if (gl_FragColor.r < 0.5) {
    discard;
  }

  gl_FragColor.a *= alpha;
  gl_FragColor.a *= opacity;
  gl_FragColor.a *= globalOpacity;
}