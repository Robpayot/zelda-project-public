uniform float yStrength;
uniform vec2 dirTex;
uniform float yScale;
uniform float timeWave;

varying vec2 vUv;
varying float vDepth;
varying float vDepthAvg;
varying float vYStrength;

const float waveDirCoef = 0.02;

float calculateSurface(float x, float z) {
    float y = 0.0;
    y += (sin(x * 1.0 / yScale + timeWave * 1.0) + sin(x * 2.3 / yScale + timeWave * 1.5) + sin(x * 3.3 / yScale + timeWave * 0.4)) / 3.0;
    y += (sin(z * 0.2 / yScale + timeWave * 1.8) + sin(z * 1.8 / yScale + timeWave * 1.8) + sin(z * 2.8 / yScale + timeWave * 0.8)) / 3.0;
    return y;
}

void main() {
  vUv = uv;
  vec3 pos = position;

  // calculate wave
  vec2 dirWave = dirTex * waveDirCoef;

  float depth = pos.z;

  depth += yStrength * calculateSurface(pos.x + dirWave.x, pos.y + dirWave.y); // TODO:  add offset dir here as well
  depth -= yStrength * calculateSurface(0.0 + dirWave.x, 0.0 + dirWave.y);

  float circle = distance(vec2(pos.x, pos.y), vec2(0.));

  depth *= (0.5 - circle);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  vDepth = (depth + yStrength) / 2. / yStrength;

    // take texel left, right, top, bottom from center texel
  // float offset = 0.1;
  // float depthPos1A = pos.z + yStrength * calculateSurface(pos.x + dirWave.x + offset, pos.y + dirWave.y);
  // depthPos1A -= yStrength * calculateSurface(0.0 + dirWave.x, 0.0 + dirWave.y);
  // depthPos1A *= (0.5 - circle);
  // float depthPos1B = pos.z + yStrength * calculateSurface(pos.x + dirWave.x - offset, pos.y + dirWave.y);
  // depthPos1B -= yStrength * calculateSurface(0.0 + dirWave.x, 0.0 + dirWave.y);
  // depthPos1B *= (0.5 - circle);
  // float depthPos2A = pos.z + yStrength * calculateSurface(pos.x + dirWave.x, pos.y + dirWave.y + offset);
  // depthPos2A -= yStrength * calculateSurface(0.0 + dirWave.x, 0.0 + dirWave.y);
  // depthPos2A *= (0.5 - circle);
  // float depthPos2B = pos.z + yStrength * calculateSurface(pos.x + dirWave.x, pos.y + dirWave.y - offset);
  // depthPos2B -= yStrength * calculateSurface(0.0 + dirWave.x, 0.0 + dirWave.y);
  // depthPos2B *= (0.5 - circle);

  // // take average of pixel to avoid flicker
  // float avg = (depth + depthPos1A + depthPos1B + depthPos2A + depthPos2B) / 5.;

  vDepthAvg = (depth + yStrength) / 2. / yStrength;

  vYStrength = yStrength / 100.;
}