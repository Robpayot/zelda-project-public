varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;

uniform vec3 ambientColor;
uniform sampler2D map;

void main() {

  gl_FragColor.rgb = texture2D(map, vUv).rgb;
  float shadow = dot(vNormal, vSurfaceToLight);
  gl_FragColor.rgb *= smoothstep(0.0, 0.8, shadow) * 0.9 + ambientColor.r * 1.;
  gl_FragColor.a = 1.;

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}