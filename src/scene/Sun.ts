import {
  AdditiveBlending,
  CanvasTexture,
  Group,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
} from 'three';
import { sunShader } from './shaders';

function glowTexture(stops: [number, string][]) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** The star in the middle — clicking it opens the "about me" panel. */
export class Sun {
  static readonly RADIUS = 7;

  readonly group = new Group();
  readonly mesh: Mesh;
  private readonly material: ShaderMaterial;
  private readonly corona: Sprite;
  private hover = 0;
  private hoverTarget = 0;

  constructor() {
    this.material = new ShaderMaterial({
      vertexShader: sunShader.vertex,
      fragmentShader: sunShader.fragment,
      uniforms: { uTime: { value: 0 } },
    });
    this.mesh = new Mesh(new SphereGeometry(Sun.RADIUS, 96, 64), this.material);
    this.group.add(this.mesh);

    this.corona = new Sprite(
      new SpriteMaterial({
        map: glowTexture([
          [0, 'rgba(255,200,130,0.85)'],
          [0.18, 'rgba(255,140,55,0.5)'],
          [0.4, 'rgba(255,90,30,0.16)'],
          [1, 'rgba(255,60,20,0)'],
        ]),
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    this.corona.scale.setScalar(Sun.RADIUS * 6);
    this.group.add(this.corona);

    const halo = new Sprite(
      new SpriteMaterial({
        map: glowTexture([
          [0, 'rgba(255,170,90,0.24)'],
          [0.5, 'rgba(180,90,255,0.08)'],
          [1, 'rgba(0,0,0,0)'],
        ]),
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    halo.scale.setScalar(Sun.RADIUS * 18);
    this.group.add(halo);
  }

  setHover(active: boolean) {
    this.hoverTarget = active ? 1 : 0;
  }

  update(dt: number, elapsed: number) {
    this.material.uniforms.uTime.value = elapsed;
    this.mesh.rotation.y = elapsed * 0.03;
    this.hover += (this.hoverTarget - this.hover) * Math.min(1, dt * 6);
    const breathe = 1 + Math.sin(elapsed * 0.8) * 0.03;
    this.corona.scale.setScalar(Sun.RADIUS * 6 * breathe * (1 + this.hover * 0.25));
  }
}
