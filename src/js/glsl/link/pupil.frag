varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;

uniform sampler2D map;
uniform sampler2D uMask;
uniform vec2 uDir;
uniform float uScale;
uniform float uFLip;
uniform vec3 ambientColor;
uniform float coefShadow;

// Converts a color from linear light gamma to sRGB gamma
vec4 fromLinear(vec4 linearRGB)
{
    bvec3 cutoff = lessThan(linearRGB.rgb, vec3(0.0031308));
    vec3 higher = vec3(1.055)*pow(linearRGB.rgb, vec3(1.0/2.4)) - vec3(0.055);
    vec3 lower = linearRGB.rgb * vec3(12.92);

    return vec4(mix(higher, lower, cutoff), linearRGB.a);
}

void main() {

  vec4 mask = texture2D(uMask, vUv);

  vec2 uv = vUv;
  uv += uDir * vec2(uFLip, 1.);
  uv -= vec2(0.5);
  uv /= uScale;
  uv += vec2(0.5);
  gl_FragColor = texture2D(map, uv);
  gl_FragColor.a *= smoothstep(0.0, 0.4, mask.r);

  float shadow = dot(vNormal, vSurfaceToLight);
  vec4 toonshading = vec4(1.) * smoothstep(0.0, 0.1, shadow) * 0.9 * coefShadow  + ambientColor.r;
  // need to convert shadow only to SRGB to match SRGB shadows for other materials
  toonshading = fromLinear(toonshading);

  gl_FragColor.rgb *= toonshading.rgb;
}