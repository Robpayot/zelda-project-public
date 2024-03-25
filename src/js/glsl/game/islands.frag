varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;

uniform sampler2D map;
uniform vec3 ambientColor;
uniform float coefShadow;

void main() {

  vec4 texture = texture2D(map, vUv);

  float aplha = 1.;
  #ifdef USE_ALPHAMAP
    aplha = texture.a;
    if (aplha < 0.05) {
      discard;
    }
  #endif

  #ifdef USE_ALPHAMAP_CUTY
    if (vUv.y < 0.05) {
      discard;
    }
  #endif

  float shadow = dot(vNormal, vSurfaceToLight);
  gl_FragColor.rgb = texture.rgb * (smoothstep(0.0, 0.5, shadow) * 0.9 * coefShadow + ambientColor.r * 1.);
  gl_FragColor.a = aplha;

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
