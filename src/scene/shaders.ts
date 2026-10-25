// 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT) + fractal Brownian motion.
export const noise = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm(vec3 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amp * snoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    amp *= 0.5;
  }
  return value;
}
`;

const surfaceVertex = `
varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vNormalW;

void main() {
  vObjPos = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const planetShader = {
  vertex: surfaceVertex,
  fragment: `
uniform vec3 uColor;
uniform vec3 uAccent;
uniform vec3 uAtmosphere;
uniform float uType;
uniform float uSeed;
uniform float uTime;
uniform float uHover;

varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vNormalW;

${noise}

void main() {
  vec3 dir = normalize(vObjPos);
  vec3 p = dir * 2.0 + uSeed;
  vec3 base;
  vec3 glow = vec3(0.0);

  if (uType < 0.5) {
    float n = fbm(p * 1.4);
    float land = smoothstep(-0.02, 0.06, n);
    vec3 ocean = uAccent * (0.65 + 0.35 * fbm(p * 4.0));
    vec3 ground = mix(uColor, uColor * vec3(0.75, 0.6, 0.4), fbm(p * 5.0) * 0.5 + 0.5);
    base = mix(ocean, ground, land);
    float clouds = smoothstep(0.1, 0.5, fbm(p * 2.5 + vec3(uTime * 0.02, 0.0, 0.0)));
    base = mix(base, vec3(0.95), clouds * 0.55);
    float poles = smoothstep(0.78, 0.92, abs(dir.y) + n * 0.12);
    base = mix(base, vec3(0.94, 0.97, 1.0), poles);
  } else if (uType < 1.5) {
    float turb = fbm(p * vec3(1.0, 3.0, 1.0) + vec3(uTime * 0.03, 0.0, 0.0));
    float bands = sin(dir.y * 16.0 + turb * 3.5) * 0.5 + 0.5;
    base = mix(uColor, uAccent, bands);
    base *= 0.85 + 0.3 * fbm(p * 6.0);
    float storm = smoothstep(0.32, 0.0, length(dir - normalize(vec3(0.6, -0.25, 0.75))));
    base = mix(base, uAccent * 1.4, storm * 0.7);
  } else if (uType < 2.5) {
    float n = fbm(p * 2.0);
    float cracks = 1.0 - smoothstep(0.0, 0.045, abs(snoise(p * 3.0)));
    base = mix(uColor, vec3(0.95, 0.98, 1.0), n * 0.5 + 0.5);
    base = mix(base, uAccent, cracks * 0.85);
  } else {
    float n = fbm(p * 1.8 + vec3(0.0, uTime * 0.02, 0.0));
    float cracks = 1.0 - smoothstep(0.0, 0.09, abs(n));
    base = mix(uAccent * 0.6, uAccent * 1.2, fbm(p * 5.0) * 0.5 + 0.5);
    float pulse = 0.85 + 0.15 * sin(uTime * 1.5 + n * 10.0);
    glow = uColor * cracks * 3.0 * pulse;
  }

  vec3 N = normalize(vNormalW);
  vec3 L = normalize(-vWorldPos);
  vec3 V = normalize(cameraPosition - vWorldPos);

  float light = smoothstep(-0.2, 0.7, dot(N, L));
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);

  vec3 color = base * (0.035 + light * 1.05) + glow;
  color += uAtmosphere * rim * (0.25 + light * 0.6 + uHover * 1.2);

  gl_FragColor = vec4(color, 1.0);
}
`,
};

export const atmosphereShader = {
  vertex: surfaceVertex,
  fragment: `
uniform vec3 uColor;
uniform float uHover;

varying vec3 vWorldPos;
varying vec3 vNormalW;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(-vWorldPos);

  float intensity = pow(clamp(-dot(N, V), 0.0, 1.0), 2.2);
  float lit = smoothstep(-0.5, 0.6, dot(-N, L));
  float alpha = intensity * (0.35 + lit * 0.9) * (1.0 + uHover * 1.2);

  gl_FragColor = vec4(uColor * alpha * 1.4, alpha);
}
`,
};

export const sunShader = {
  vertex: surfaceVertex,
  fragment: `
uniform float uTime;

varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vNormalW;

${noise}

void main() {
  vec3 p = normalize(vObjPos) * 2.4;
  float warp = fbm(p * 1.5 + vec3(uTime * 0.05));
  float n = fbm(p + warp * 1.3 + vec3(0.0, uTime * 0.03, 0.0));
  float spots = smoothstep(0.35, 0.65, fbm(p * 4.0 - vec3(uTime * 0.04)));

  vec3 deep = vec3(0.95, 0.22, 0.02);
  vec3 hot = vec3(1.0, 0.82, 0.45);
  vec3 color = mix(deep, hot, n * 0.5 + 0.5);
  color = mix(color, vec3(1.0, 0.95, 0.8), spots * 0.6);

  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.0);
  color += vec3(1.0, 0.55, 0.15) * rim * 1.2;

  float boost = mix(0.75, 1.3, smoothstep(25.0, 140.0, length(cameraPosition)));
  gl_FragColor = vec4(color * boost, 1.0);
}
`,
};

export const ringShader = {
  vertex: `
varying vec3 vObjPos;
varying vec3 vWorldPos;

void main() {
  vObjPos = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`,
  fragment: `
uniform vec3 uColor;
uniform vec3 uAccent;
uniform float uInner;
uniform float uOuter;
uniform vec3 uPlanetPos;
uniform float uPlanetRadius;

varying vec3 vObjPos;
varying vec3 vWorldPos;

${noise}

void main() {
  float r = (length(vObjPos.xy) - uInner) / (uOuter - uInner);
  float bands = snoise(vec3(r * 22.0, 0.0, 0.0)) * 0.5 + 0.5;
  bands *= snoise(vec3(r * 60.0, 3.0, 0.0)) * 0.3 + 0.7;
  float gap = smoothstep(0.55, 0.58, r) * (1.0 - smoothstep(0.6, 0.63, r));
  float edge = smoothstep(0.0, 0.06, r) * (1.0 - smoothstep(0.92, 1.0, r));
  float alpha = bands * edge * (1.0 - gap * 0.9) * 0.85;

  vec3 toSun = normalize(-vWorldPos);
  vec3 toPlanet = uPlanetPos - vWorldPos;
  float along = dot(toPlanet, toSun);
  float dist = length(toPlanet - toSun * along);
  float shadow = along > 0.0 ? smoothstep(uPlanetRadius * 0.9, uPlanetRadius * 1.05, dist) : 1.0;

  vec3 color = mix(uAccent, uColor, bands) * (0.15 + shadow * 0.9);
  gl_FragColor = vec4(color, alpha);
}
`,
};

export const starShader = {
  vertex: `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;

uniform float uTime;
uniform float uPixelRatio;

varying vec3 vColor;
varying float vTwinkle;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vTwinkle = 0.65 + 0.35 * sin(uTime * (0.6 + aPhase * 1.4) + aPhase * 40.0);
  vColor = aColor;
  gl_PointSize = aSize * uPixelRatio * (0.8 + vTwinkle * 0.4);
}
`,
  fragment: `
varying vec3 vColor;
varying float vTwinkle;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float alpha = pow(smoothstep(0.5, 0.0, d), 1.8);
  gl_FragColor = vec4(vColor * vTwinkle, alpha);
}
`,
};

export const nebulaShader = {
  vertex: `
varying vec3 vDir;

void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
  fragment: `
varying vec3 vDir;

${noise}

void main() {
  vec3 p = vDir * 1.6;
  float shape = fbm(p + fbm(p * 1.3) * 0.8);
  float detail = fbm(p * 3.5 + vec3(5.0));
  float band = exp(-pow(vDir.y * 2.2 + shape * 0.6, 2.0));

  vec3 violet = vec3(0.32, 0.12, 0.55);
  vec3 blue = vec3(0.06, 0.18, 0.5);
  vec3 pink = vec3(0.55, 0.12, 0.35);

  vec3 color = mix(blue, violet, smoothstep(-0.4, 0.4, shape));
  color = mix(color, pink, smoothstep(0.2, 0.6, detail) * 0.6);
  float density = smoothstep(-0.15, 0.55, shape) * (0.35 + band * 0.65);

  gl_FragColor = vec4(color * density * 0.32, 1.0);
}
`,
};
