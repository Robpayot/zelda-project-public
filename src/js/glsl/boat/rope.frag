varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;

uniform vec3 ambientColor;
uniform float coefShadow;
uniform float sRGBSpace;

uniform vec3 color1;
uniform vec3 color2;

// Converts a color from linear light gamma to sRGB gamma
vec4 fromLinear(vec4 linearRGB)
{
    bvec3 cutoff = lessThan(linearRGB.rgb, vec3(0.0031308));
    vec3 higher = vec3(1.055)*pow(linearRGB.rgb, vec3(1.0/2.4)) - vec3(0.055);
    vec3 lower = linearRGB.rgb * vec3(12.92);

    return vec4(mix(higher, lower, cutoff), linearRGB.a);
}

// colors
// yellow ffe384 eabf5f c68221 ffc763

void main() {
  float vY = (vUv.y * 60.);
  vY = fract(vY);
  float stripe = step(vY, 0.18 );
  vec3 color = mix(color1, color2, stripe);

  gl_FragColor = vec4(color, 1.);
  float shadow = dot(vNormal, vSurfaceToLight);
  vec4 toonshading = vec4(1.) * smoothstep(0.0, 0.1, shadow) * 0.9 * coefShadow + ambientColor.r ;

  // need to convert shadow only to SRGB to match SRGB shadows for other materials
  if (sRGBSpace == 1.) {
    toonshading = fromLinear(toonshading);
  }

  gl_FragColor.rgb *= toonshading.rgb;
  gl_FragColor.a = 1.;


  if (sRGBSpace == 0.) {
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
}