uniform sampler2D uDepthMap;
uniform sampler2D map;
uniform vec3 ambientColor;
uniform float coefShadow;
uniform float sRGBSpace;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;
varying vec4 vShadowCoord;

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

// Converts a color from linear light gamma to sRGB gamma
vec4 fromLinear(vec4 linearRGB)
{
    bvec3 cutoff = lessThan(linearRGB.rgb, vec3(0.0031308));
    vec3 higher = vec3(1.055)*pow(linearRGB.rgb, vec3(1.0/2.4)) - vec3(0.055);
    vec3 lower = linearRGB.rgb * vec3(12.92);

    return vec4(mix(higher, lower, cutoff), linearRGB.a);
}

void main() {
    gl_FragColor = texture2D(map, vUv);
    // toon
    float shadow = dot(vNormal, vSurfaceToLight);
    // gl_FragColor.rgb *= smoothstep(0.0, 0.1, shadow) * 0.9 * coefShadow + ambientColor.r;

    // receiveShadow
    #ifdef USE_SHADOWS
        vec3 shadowCoord = (vShadowCoord.xyz / vShadowCoord.w * 0.5 + 0.5);

        float depth_shadowCoord = shadowCoord.z;

        vec2 depthMapUv = shadowCoord.xy;
        float depth_depthMap = unpackRGBAToDepth(texture2D(uDepthMap, depthMapUv));

        float bias = 0.01;

        float shadowFactor = step(depth_shadowCoord - bias, depth_depthMap);
        shadowFactor = frustumTest(shadowCoord, shadowFactor);
        float shadowDarkness = 0.5;
        float receivedShadow = mix(1. - shadowDarkness, 1., shadowFactor);
        // gl_FragColor.rgb *= receivedShadow;
    #endif

    vec4 toonshading = vec4(1.) * smoothstep(0.0, 0.1, shadow) * 0.9 * coefShadow + ambientColor.r ;

    #ifdef USE_SHADOWS
        toonshading *= receivedShadow;
    #endif
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
