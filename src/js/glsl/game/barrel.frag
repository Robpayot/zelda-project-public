varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;
varying float vFogDepth;

uniform sampler2D map;
uniform vec3 ambientColor;
uniform float coefShadow;
// Fog
uniform vec3 fogColor;
uniform float fogDensity;

void main() {

  gl_FragColor.rgb = texture2D(map, vUv).rgb;
  float shadow = dot(vNormal, vSurfaceToLight);
  gl_FragColor.rgb *= smoothstep(0.0, 0.5, shadow) * 0.9 * coefShadow + ambientColor.r * 1.;
  gl_FragColor.a = 1.;

  // float fogFactor = 1.0 - exp( -fogDensity * fogDensity * vFogDepth * vFogDepth );
  // gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor );

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
