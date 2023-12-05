varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;

uniform vec3 ambientColor;
uniform vec3 color;
uniform float coefShadow;

void main() {

  gl_FragColor.rgb = color;
  float shadow = dot(vNormal, vSurfaceToLight);
  gl_FragColor.rgb *= smoothstep(0.0, 0.8, shadow) * 0.9 * coefShadow + ambientColor.r * 0.5;
  gl_FragColor.a = 1.;

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
