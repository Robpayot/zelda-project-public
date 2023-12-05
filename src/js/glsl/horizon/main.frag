uniform vec3 color1;
uniform vec3 color2;

varying vec2 vUv;

void main() {

  float power = pow((1. - vUv.x), 4.);

  vec3 color = mix(color1, color2, power);

  gl_FragColor = vec4(color, 1.);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>

}