uniform sampler2D map;
uniform float opacity;
uniform float globalOpacity;

varying float vProgressAlpha;

// create a circle value in a frag shader
float circle(vec2 uv, float border) {
	float radius = 0.5;
	float dist = radius - distance(uv, vec2(0.5));
  return smoothstep(0.0, border, dist);
}

void main() {
  // // adapt point to UV texture

  // // We get the coordinate inside 1 particle: gl_PointCoord
  vec2 uv = gl_PointCoord;
  float alpha = 1. - vProgressAlpha;


  gl_FragColor = vec4(1.);
  gl_FragColor.a = circle(uv, 0.1);



  gl_FragColor.a *= alpha;
  gl_FragColor.a *= globalOpacity;

    if (gl_FragColor.a < 0.5) {
    discard;
  }
}