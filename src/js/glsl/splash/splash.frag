uniform vec3 uColor;
uniform float power;
uniform float alphaTex;
// shadows
uniform sampler2D uDepthMap;
uniform vec3 uLightPos;

varying vec2 vUv;
// shadows
varying vec3 vNormal;
varying vec4 vShadowCoord;
varying vec3 vPos;

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

void main() {

  if (vPos.y < -3.) { // hide if under water
    discard;
  }

  float threshold = step(power, vUv.y);

  vec3 color = mix(uColor, vec3(1.) * alphaTex, threshold);
  gl_FragColor = vec4(color, 1.);

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

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}