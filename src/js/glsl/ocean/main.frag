uniform sampler2D map;
uniform sampler2D trailMap;
uniform sampler2D heightMap;
uniform vec3 color;
uniform float timeTex;
uniform vec2 dirTex;
uniform float repeat;
uniform float yScale;
uniform float alphaTex;
uniform float alphaTex2;

uniform float trailProgress;
uniform float trailRotation;
uniform float trailTurn;
uniform float trailOpacity;
uniform float trailJumpOffset;
uniform float trailJumpOpacity;
// shadows
uniform sampler2D uDepthMap;
uniform vec3 uLightPos;
// Fog
uniform vec3 fogColor;
uniform float fogDensity;


varying vec2 vUv;
varying float vDepth;
varying float vFogDepth;
varying vec2 vUvTrail;
varying float vRepeatTrail;
// shadows
varying vec3 vNormal;
varying vec4 vShadowCoord;

const vec2 center = vec2(0.5, 0.5);
const float nbTrailVisible = 4.;

// https://github.com/mrdoob/three.js/blob/master/src/renderers/shaders/ShaderChunk/packing.glsl.js#L24
#include <packing>

float frustumTest(vec3 shadowCoord, float shadowFactor){
    bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
    bool inFrustum = all( inFrustumVec );

    bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
    bool frustumTest = all( frustumTestVec );

    if(frustumTest == false){
        shadowFactor = 1.0;
    }

    return shadowFactor;
}

vec2 rotateUV(vec2 uv, float rotation, float mid)
{
    return vec2(
      cos(rotation) * (uv.x - mid) + sin(rotation) * (uv.y - mid) + mid,
      cos(rotation) * (uv.y - mid) - sin(rotation) * (uv.x - mid) + mid
    );
}

void main() {
  vec2 uv = vUv + dirTex;
  uv.y += 0.01 * (sin(uv.x * 3.5 + timeTex * 0.35) + sin(uv.x * 4.8 + timeTex * 1.05) + sin(uv.x * 7.3 + timeTex * 0.45)) / 3.0;
  uv.x += 0.12 * (sin(uv.y * 4.0 + timeTex * 0.5) + sin(uv.y * 6.8 + timeTex * 0.75) + sin(uv.y * 11.3 + timeTex * 0.2)) / 3.0;
  uv.y += 0.12 * (sin(uv.x * 4.2 + timeTex * 0.64) + sin(uv.x * 6.3 + timeTex * 1.65) + sin(uv.x * 8.2 + timeTex * 0.45)) / 3.0;

  // ocean texture
  vec4 tex = texture2D(map, uv);
  // 2nd darker texture
  vec4 texOffset = texture2D(map, uv + vec2(0.3));

  // no texture if far
  vec3 texColor = tex.rgb * alphaTex + color - texOffset.a * alphaTex2 * alphaTex;

  tex.rgb = mix(texColor, color, vDepth);

  vec2 uvOrigin = vUv / repeat;
  // make ocean a circle
  float circle = distance(uvOrigin, center);
  float alpha = smoothstep(0.5, 0.505, 1. - circle);
  vec4 oceanTex = vec4(tex.rgb, alpha);


  // Trail
  // rotate based on boat rotation
  vec2 distortUVTrail = rotateUV(vec2(vUvTrail.x, vUvTrail.y), trailRotation, 0.5);
  float trailTexOffset = trailProgress * vRepeatTrail;

  // only show texture trail behind the boat
  float distortionView = distance(vec2(0.5), vUvTrail);

  if (distortionView > 0.05 ) {
    distortUVTrail.x -= 0.5;
    distortUVTrail.y -= 0.5 - trailTexOffset + trailJumpOffset;


    float trailPosYOffset = 0.5;

    float yCoef = (distortUVTrail.y - trailTexOffset) / nbTrailVisible - trailPosYOffset;
    // make trail small to big based on Y
    distortUVTrail.x /= yCoef;
    // offset UVs trail to center it
    distortUVTrail.x -= 1. * (yCoef / vRepeatTrail - 0.5);

    // turning trail effect
    // make is += and windows -= ...
    distortUVTrail.x += abs(pow((yCoef + trailPosYOffset - 0.2), 3.)) * trailTurn * (1. / (trailOpacity + 0.1)) * 3.;
  }

  vec4 trailTex = texture2D(trailMap, distortUVTrail) * min(alphaTex * 20., 1.);

  trailTex.rgb *= smoothstep(0.1, 0.3, trailTex.r);
  // trailTex.rgb += 0.5;


  // only show texture trail behind the boat
  float hiddenTrailPart = step(0., -distortUVTrail.y + trailTexOffset) * smoothstep(-nbTrailVisible * trailOpacity, -nbTrailVisible * trailOpacity + 3., distortUVTrail.y - trailTexOffset) * step(0., 1. - distortUVTrail.x) * step(0., distortUVTrail.x);
  trailTex.a *= hiddenTrailPart * trailOpacity * trailJumpOpacity;

  gl_FragColor.rgb = vec4(oceanTex.rgb * (1. - trailTex.a) + mix(trailTex.rgb, oceanTex.rgb, 0.1) * trailTex.a, oceanTex.a).rgb;
  gl_FragColor.a = 1.;



  // compute shadows
  #ifdef USE_SHADOWS
    vec3 shadowCoord = (vShadowCoord.xyz / vShadowCoord.w * 0.5 + 0.5);

    float depth_shadowCoord = shadowCoord.z;

    vec2 depthMapUv = shadowCoord.xy;
    float depth_depthMap = unpackRGBAToDepth(texture2D(uDepthMap, depthMapUv));

    float bias = 0.01;

    float shadowFactor = step(depth_shadowCoord - bias, depth_depthMap);
    shadowFactor = frustumTest(shadowCoord, shadowFactor);

    float shadowDarkness = 0.5;

    float shadow = mix(1. - shadowDarkness, 1., shadowFactor);

    gl_FragColor.rgb *= shadow;
  #endif

  float fogFactor = 1.0 - exp( -fogDensity * fogDensity * vFogDepth * vFogDepth );
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor );

  #include <tonemapping_fragment>
  #include <colorspace_fragment>

  // Show heightmap
  // vec4 hp = texture2D(heightMap, vUv / 70.);

  // gl_FragColor = hp;
}
