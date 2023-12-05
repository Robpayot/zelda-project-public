uniform vec3 sunDir;
uniform float uTime;
uniform float uVelocity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;

#pragma glslify: pnoise2 = require(glsl-noise/periodic/2d)

#include <morphtarget_pars_vertex>

void main() {
  vUv = uv;
  vNormal = normal;
  vec3 pos = position;

  // sun Dir light calculation in worldMatrix
  vec3 surfaceToLightDirection = vec3( modelViewMatrix * vec4(pos, 1.0));
  vec3 worldLightPos = vec3(viewMatrix * vec4(sunDir, 1.0));
  vSurfaceToLight = normalize(worldLightPos - surfaceToLightDirection);

  // morph target compute

  #ifdef USE_MORPHTARGETS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in position = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	pos *= morphTargetBaseInfluence;

    #ifdef MORPHTARGETS_TEXTURE

      for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

        if ( morphTargetInfluences[ i ] != 0.0 ) pos += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];

      }

    #endif

  #endif

  #ifdef USE_MORPHNORMALS

    // morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
    // When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in normal = sum((target - base) * influence)
    // When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
    vNormal *= morphTargetBaseInfluence;

    #ifdef MORPHTARGETS_TEXTURE

      for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

        if ( morphTargetInfluences[ i ] != 0.0 ) vNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];

      }

    #endif

  #endif

  vNormal = normalize(normalMatrix * vNormal);

  // wind effect
  float noise = pnoise2(vec2(uTime), vec2(position.y, 1.)) * 7. * (1. + uVelocity * 0.1);
  pos = vec3(pos.x, pos.y + noise, pos.z + noise);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}