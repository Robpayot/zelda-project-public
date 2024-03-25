varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;

uniform sampler2D map;
uniform vec3 ambientColor;
uniform float coefShadow;

void main() {

  gl_FragColor = texture2D(map, vUv);
  float shadow = dot(vNormal, vSurfaceToLight);
  gl_FragColor.rgb *= smoothstep(0.0, 0.8, shadow) * 0.9 * coefShadow + ambientColor.r * 0.5;
  gl_FragColor.a = 1.;

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
