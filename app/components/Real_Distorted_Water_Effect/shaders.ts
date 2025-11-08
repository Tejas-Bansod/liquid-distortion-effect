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

  // 🔸 Slower wave evolution
  float t = time * 0.25;  // 4x slower ripple updates

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

  // Smooth, heavy wave motion
  pressure += delta * pVel * 0.85;
  pVel -= 0.004 * delta * pressure;
  pVel *= 1.0 - 0.0015 * delta;
  pressure *= 0.998;

  // Mouse interaction: still responsive, but not explosive
  vec2 mouseUV = mouse / resolution;
  if (mouse.x > 0.0) {
    float dist = distance(uv, mouseUV);
    if (dist <= 0.03) { // slightly larger radius
      pressure += 3.5 * (1.0 - dist / 0.03); // stronger push
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

  // 🔸 Slower temporal movement
  float t = time * 0.25; // slow breathing speed

  // 🔸 Increased distortion for heavier liquid feel
  vec2 distortion = 0.22 * data.zw; // was 0.12 → stronger depth bend
  distortion *= smoothstep(0.1, 0.9, vUv.y);

  // Add slow oscillating turbulence (gentle motion)
  distortion += 0.015 * vec2(
    sin(vUv.y * 10.0 + t * 0.8),
    cos(vUv.x * 8.0 + t * 0.7)
  );

  vec4 color = texture2D(textureB, vUv + distortion);

  // 🔸 Enhance lighting realism
  vec3 normal = normalize(vec3(-data.z * 2.0, 0.6, -data.w * 2.0));
  vec3 lightDir = normalize(vec3(-3.0, 10.0, 3.0));

  // Softer but brighter specular
  float specular = pow(max(0.0, dot(normal, lightDir)), 50.0) * 1.0;
  color.rgb += vec3(0.9, 0.92, 0.95) * specular;

  // 🔸 Depth & tone balance
  float depth = smoothstep(0.0, 1.0, vUv.y);
  color.rgb *= mix(1.05, 0.92, depth);

  // 🔸 Subtle shimmer to make it alive, slower now
  color.rgb *= 1.0 + 0.03 * sin(vUv.y * 3.0 + t * 0.5);

  gl_FragColor = color;
}
`;