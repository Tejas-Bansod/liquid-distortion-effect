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
  pressure += delta * pVel;
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
varying vec2 vUv;

void main() {
  vec4 data = texture2D(textureA, vUv);

  // ↓↓↓ Reduced distortion strength ↓↓↓
  vec2 distortion = 0.12 * data.zw;

  // Smooth edge falloff (less ripple noise near top/bottom)
  distortion *= smoothstep(0.15, 0.85, vUv.y);

  // Apply distortion
  vec4 color = texture2D(textureB, vUv + distortion);

  // Softer normals for smoother lighting
  vec3 normal = normalize(vec3(-data.z * 1.5, 0.4, -data.w * 1.5));

  // Light direction
  vec3 lightDir = normalize(vec3(-3.0, 10.0, 3.0));

  // ↓↓↓ Reduced specular intensity ↓↓↓
  float specular = pow(max(0.0, dot(normal, lightDir)), 40.0) * 0.6;

  // Add gentle highlights
  color.rgb += vec3(0.85, 0.88, 0.92) * specular;

  // Subtle depth gradient for natural shading
  float depth = smoothstep(0.0, 1.0, vUv.y);
  color.rgb *= mix(1.02, 0.95, depth);

  // Optional: slight sine shimmer for life
  color.rgb *= 1.0 + 0.03 * sin(vUv.y * 3.0);

  gl_FragColor = color;
}
`;