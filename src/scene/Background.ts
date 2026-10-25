import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Mesh,
  Points,
  ShaderMaterial,
  SphereGeometry,
} from 'three';
import { nebulaShader, starShader } from './shaders';

const STAR_COLORS = ['#ffffff', '#cfe0ff', '#a9c4ff', '#fff4e0', '#ffd9a8', '#ffb38a'];

export class Background {
  readonly group = new Group();
  private readonly starMaterial: ShaderMaterial;

  constructor(starCount: number, pixelRatio: number) {
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const phases = new Float32Array(starCount);
    const color = new Color();

    for (let i = 0; i < starCount; i++) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const radius = 350 + Math.random() * 550;
      positions.set([s * Math.cos(theta) * radius, u * radius, s * Math.sin(theta) * radius], i * 3);

      color.set(STAR_COLORS[Math.floor(Math.random() ** 2 * STAR_COLORS.length)]);
      colors.set([color.r, color.g, color.b], i * 3);

      sizes[i] = 1 + Math.random() ** 6 * 5;
      phases[i] = Math.random();
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new BufferAttribute(phases, 1));

    this.starMaterial = new ShaderMaterial({
      vertexShader: starShader.vertex,
      fragmentShader: starShader.fragment,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.group.add(new Points(geometry, this.starMaterial));

    const nebula = new Mesh(
      new SphereGeometry(1200, 64, 32),
      new ShaderMaterial({
        vertexShader: nebulaShader.vertex,
        fragmentShader: nebulaShader.fragment,
        side: BackSide,
        depthWrite: false,
      }),
    );
    nebula.rotation.set(0.4, 0, 0.25);
    this.group.add(nebula);
  }

  update(elapsed: number) {
    this.starMaterial.uniforms.uTime.value = elapsed;
    this.group.rotation.y = elapsed * 0.004;
  }

  setPixelRatio(pixelRatio: number) {
    this.starMaterial.uniforms.uPixelRatio.value = pixelRatio;
  }
}
