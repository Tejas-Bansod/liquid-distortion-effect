export const simulationVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const simulationFragmentsShader = `
uniform sampler2D textureA;
uniform vec2 mouse;
uniform vec2 resolution;
uniform float time;
uniform int frame;
varying vec2 vUv;
const float delta = 1.4;

void main() {
  vec2 uv = vUv;
  if (frame == 0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // ↓↓↓ Slow down simulation updates ↓↓↓
  float t = time * 0.3;   // 0.3 = 3x slower time evolution

  vec4 data = texture2D(textureA, uv);
  float pressure = data.x;
  float pVel = data.y;

  vec2 texelSize = 1.0 / resolution;
  float pR = texture2D(textureA, uv + vec2(texelSize.x, 0.0)).x;
  float pL = texture2D(textureA, uv - vec2(texelSize.x, 0.0)).x;
  float pU = texture2D(textureA, uv + vec2(0.0, texelSize.y)).x;
  float pD = texture2D(textureA, uv - vec2(0.0, texelSize.y)).x;

  if (uv.x <= texelSize.x) pL = pR;
  if (uv.x >= 1.0 - texelSize.x) pR = pL;
  if (uv.y <= texelSize.y) pD = pU;
  if (uv.y >= 1.0 - texelSize.y) pU = pD;

  pVel += delta * (-2.0 * pressure + pR + pL) / 4.0;
  pVel += delta * (-2.0 * pressure + pU + pD) / 4.0;

  // use slower time value 't' instead of raw frame
  pressure += delta * pVel * 0.9;
  pVel -= 0.005 * delta * pressure;
  pVel *= 1.0 - 0.002 * delta;
  pressure *= 0.999;

  vec2 mouseUV = mouse / resolution;
  if (mouse.x > 0.0) {
    float dist = distance(uv, mouseUV);
    if (dist <= 0.02) {
      pressure += 2.0 * (1.0 - dist / 0.02);
    }
  }

  gl_FragColor = vec4(
    pressure,
    pVel,
    (pR - pL) * 0.5,
    (pU - pD) * 0.5
  );
}
`;

export const renderVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const renderFragmentShader = `
uniform sampler2D textureA;
uniform sampler2D textureB;
uniform float time;
varying vec2 vUv;

void main() {
  vec4 data = texture2D(textureA, vUv);

  // ↓↓↓ Use slower time modulation ↓↓↓
  float t = time * 0.4;   // lower multiplier = slower overall animation

  // Reduced distortion
  vec2 distortion = 0.12 * data.zw;
  distortion *= smoothstep(0.15, 0.85, vUv.y);

  // Add subtle low-frequency motion (slow breathing)
  distortion += 0.01 * vec2(
    sin(vUv.y * 8.0 + t),
    cos(vUv.x * 8.0 + t)
  );

  vec4 color = texture2D(textureB, vUv + distortion);

  // Softer normals for smoother highlights
  vec3 normal = normalize(vec3(-data.z * 1.5, 0.4, -data.w * 1.5));
  vec3 lightDir = normalize(vec3(-3.0, 10.0, 3.0));

  // Reduced specular intensity
  float specular = pow(max(0.0, dot(normal, lightDir)), 40.0) * 0.6;
  color.rgb += vec3(0.85, 0.88, 0.92) * specular;

  // Add mild dynamic shimmer (slower)
  color.rgb *= 1.0 + 0.02 * sin(vUv.y * 2.0 + t * 0.5);

  // Natural depth fade
  float depth = smoothstep(0.0, 1.0, vUv.y);
  color.rgb *= mix(1.02, 0.95, depth);

  gl_FragColor = color;
}
`;