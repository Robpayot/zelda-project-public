varying vec2 vUv;
varying float vFogDepth;

uniform vec3 color;
// Fog
uniform vec3 fogColor;
uniform float fogDensity;

void main() {

  gl_FragColor.rgb = color;

  float circle = distance(vec2(vUv.x, vUv.y), vec2(0.5));

  gl_FragColor.a = 1.;

  if (circle < 0.12) {
    discard;
  }

  float fogFactor = 1.0 - exp( -fogDensity * fogDensity * vFogDepth * vFogDepth );
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor );

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}