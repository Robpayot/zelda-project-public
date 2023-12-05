uniform float repeat;
uniform float timeWave;
uniform float yScale;
uniform float yStrength;
uniform vec2 dirTex;
uniform float trailProgress;
// shadows
uniform mat4 uShadowCameraP;
uniform mat4 uShadowCameraV;

varying vec2 vUv;
varying float vDepth;
varying float vFogDepth;
varying vec2 vUvTrail;
varying float vRepeatTrail;
varying vec3 vNormal;
// shadows
varying vec4 vShadowCoord;

const vec2 center = vec2(0.5, 0.5);
const float waveDirCoef = 0.02;
const float repeatTrail = 190.52;
const float depthFog = 1000.;


float calculateSurface(float x, float z) {
    float y = 0.0;
    y += (sin(x * 1.0 / yScale + timeWave * 1.0) + sin(x * 2.3 / yScale + timeWave * 1.5) + sin(x * 3.3 / yScale + timeWave * 0.4)) / 3.0;
    y += (sin(z * 0.2 / yScale + timeWave * 1.8) + sin(z * 1.8 / yScale + timeWave * 1.8) + sin(z * 2.8 / yScale + timeWave * 0.8)) / 3.0;
    return y;
}

void main() {
  vUv = vec2(uv.x, uv.y) * repeat;
  // trail
  vRepeatTrail = repeatTrail;
  vUvTrail = vec2(uv.x - 0.5 + (1. / vRepeatTrail) / 2., uv.y - 0.5 + (1. / vRepeatTrail) / 2.) * vRepeatTrail;

  // vUvTrail.y = min(0., vUvTrail.y);

  vec3 pos = position;

  vec2 dirWave = dirTex * waveDirCoef;

  pos.z += yStrength * calculateSurface(pos.x + dirWave.x, pos.y + dirWave.y); // TODO:  add offset dir here as well
  pos.z -= yStrength * calculateSurface(0.0 + dirWave.x, 0.0 + dirWave.y);
  // if distance is far, do not move waves for horizon

  float circle = distance(vec2(pos.x, pos.y), vec2(0.));

  pos.z *= (0.5 - circle);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.);

  vDepth = clamp(-mvPosition.z / depthFog, 0., 1.);
  vFogDepth = -mvPosition.z;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  // compute shadows
  vNormal = normal;
  vShadowCoord = uShadowCameraP * uShadowCameraV * modelMatrix * vec4(position, 1.0);
}