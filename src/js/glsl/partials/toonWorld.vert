varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;

uniform vec3 sunDir;

// Skin pos calculation
#ifdef USE_BONES
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;

	uniform highp sampler2D boneTexture;
	uniform int boneTextureSize;

	mat4 getBoneMatrix( const in float i ) {

		float j = i * 4.0;
		float x = mod( j, float( boneTextureSize ) );
		float y = floor( j / float( boneTextureSize ) );

		float dx = 1.0 / float( boneTextureSize );
		float dy = 1.0 / float( boneTextureSize );

		y = dy * ( y + 0.5 );

		vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
		vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
		vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
		vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );

		mat4 bone = mat4( v1, v2, v3, v4 );

		return bone;

	}
#endif

void main() {
  vUv = uv;
  vNormal = normal;
  vec3 pos = position;

  // sun Dir light calculation in worldMatrix
  vec3 surfaceToLightDirection = vec3( modelViewMatrix * vec4(pos, 1.0));
  vec3 worldLightPos = vec3(modelViewMatrix * vec4(sunDir, 1.0));
  vSurfaceToLight = normalize(worldLightPos - surfaceToLightDirection);

	#ifdef USE_BONES

		// Skin pos calculation
		mat4 boneMatX = getBoneMatrix( skinIndex.x );
		mat4 boneMatY = getBoneMatrix( skinIndex.y );
		mat4 boneMatZ = getBoneMatrix( skinIndex.z );
		mat4 boneMatW = getBoneMatrix( skinIndex.w );

		vec4 skinVertex = bindMatrix * vec4( pos, 1.0 );

		vec4 skinned = vec4( 0.0 );
		skinned += boneMatX * skinVertex * skinWeight.x;
		skinned += boneMatY * skinVertex * skinWeight.y;
		skinned += boneMatZ * skinVertex * skinWeight.z;
		skinned += boneMatW * skinVertex * skinWeight.w;

		pos = ( bindMatrixInverse * skinned ).xyz;

      // Skin normal calculation
  	mat4 skinMatrix = mat4( 0.0 );
    skinMatrix += skinWeight.x * boneMatX;
    skinMatrix += skinWeight.y * boneMatY;
    skinMatrix += skinWeight.z * boneMatZ;
    skinMatrix += skinWeight.w * boneMatW;
    skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;

    vNormal = vec4( skinMatrix * vec4( normal, 0.0 ) ).xyz;

	#endif

  vNormal = normalize(normalMatrix * vNormal);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}