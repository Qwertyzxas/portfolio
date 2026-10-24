import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshStandardMaterial,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { PlanetType, Project } from '../data/portfolio';
import { atmosphereShader, planetShader, ringShader } from './shaders';

const TYPE_INDEX: Record<PlanetType, number> = { rocky: 0, gas: 1, ice: 2, lava: 3 };

interface Moon {
  pivot: Group;
  speed: number;
}

/** A project rendered as a planet: orbit line, procedural surface, atmosphere, optional rings and moons. */
export class Planet {
  /** Inclined orbital plane, attached to the scene */
  readonly orbitPlane = new Group();
  /** Moves along the orbit */
  readonly body = new Group();
  /** Pickable sphere */
  readonly mesh: Mesh;
  readonly label: CSS2DObject;

  private readonly tilt = new Group();
  private readonly surface: ShaderMaterial;
  private readonly atmosphere: ShaderMaterial;
  private readonly ring?: ShaderMaterial;
  private readonly orbitMaterial: LineBasicMaterial;
  private readonly moons: Moon[] = [];
  private readonly angularSpeed: number;
  private angle: number;
  private hover = 0;
  private hoverTarget = 0;
  private focused = false;

  constructor(
    readonly project: Project,
    readonly index: number,
    onSelect: (planet: Planet) => void,
  ) {
    const { planet } = project;
    const color = (hex: string) => new Color(hex);

    this.angle = index * 2.4 + 0.6;
    this.angularSpeed = (0.5 * planet.speed) / Math.sqrt(planet.orbit);
    this.orbitPlane.rotation.set(Math.sin(index * 7.1) * 0.06, 0, Math.cos(index * 3.3) * 0.05);
    this.orbitPlane.add(this.body);

    // orbit line
    const points: Vector3[] = [];
    for (let i = 0; i < 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      points.push(new Vector3(Math.cos(a) * planet.orbit, 0, Math.sin(a) * planet.orbit));
    }
    this.orbitMaterial = new LineBasicMaterial({
      color: planet.atmosphere,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    this.orbitPlane.add(new LineLoop(new BufferGeometry().setFromPoints(points), this.orbitMaterial));

    // surface
    this.tilt.rotation.z = 0.15 + Math.sin(index * 5.7) * 0.25;
    this.body.add(this.tilt);

    this.surface = new ShaderMaterial({
      vertexShader: planetShader.vertex,
      fragmentShader: planetShader.fragment,
      uniforms: {
        uColor: { value: color(planet.color) },
        uAccent: { value: color(planet.accent) },
        uAtmosphere: { value: color(planet.atmosphere) },
        uType: { value: TYPE_INDEX[planet.type] },
        uSeed: { value: index * 13.37 },
        uTime: { value: 0 },
        uHover: { value: 0 },
      },
    });
    this.mesh = new Mesh(new SphereGeometry(planet.size, 96, 64), this.surface);
    this.mesh.userData.planet = this;
    this.tilt.add(this.mesh);

    this.atmosphere = new ShaderMaterial({
      vertexShader: atmosphereShader.vertex,
      fragmentShader: atmosphereShader.fragment,
      uniforms: { uColor: { value: color(planet.atmosphere) }, uHover: { value: 0 } },
      side: BackSide,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const atmosphereMesh = new Mesh(new SphereGeometry(planet.size * 1.22, 64, 48), this.atmosphere);
    atmosphereMesh.raycast = () => {};
    this.tilt.add(atmosphereMesh);

    if (planet.rings) {
      const inner = planet.size * 1.4;
      const outer = planet.size * 2.25;
      this.ring = new ShaderMaterial({
        vertexShader: ringShader.vertex,
        fragmentShader: ringShader.fragment,
        uniforms: {
          uColor: { value: color(planet.color) },
          uAccent: { value: color(planet.accent) },
          uInner: { value: inner },
          uOuter: { value: outer },
          uPlanetPos: { value: new Vector3() },
          uPlanetRadius: { value: planet.size },
        },
        side: DoubleSide,
        transparent: true,
        depthWrite: false,
      });
      const ringMesh = new Mesh(new RingGeometry(inner, outer, 160, 1), this.ring);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.raycast = () => {};
      this.tilt.add(ringMesh);
    }

    const moonMaterial = new MeshStandardMaterial({ color: '#b9b4c4', roughness: 0.95 });
    for (let i = 0; i < (planet.moons ?? 0); i++) {
      const pivot = new Group();
      pivot.rotation.set(Math.sin(index + i) * 0.5, i * 2.1, Math.cos(index * 2 + i) * 0.4);
      const moon = new Mesh(new SphereGeometry(0.28 + i * 0.08, 32, 24), moonMaterial);
      moon.position.x = planet.size * 1.9 + i * 1.3;
      pivot.add(moon);
      this.body.add(pivot);
      this.moons.push({ pivot, speed: 0.6 - i * 0.18 });
    }

    // HTML label floating above the planet
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'planet-label';
    element.style.setProperty('--accent', planet.atmosphere);
    element.innerHTML = `<span class="planet-label__dot"></span><span class="planet-label__text"></span>`;
    element.querySelector('.planet-label__text')!.textContent = project.name;
    element.addEventListener('click', () => onSelect(this));
    element.addEventListener('pointerenter', () => this.setHover(true));
    element.addEventListener('pointerleave', () => this.setHover(false));
    this.label = new CSS2DObject(element);
    this.label.position.set(0, planet.size * 1.3 + 1.2, 0);
    this.body.add(this.label);

    this.update(0, 0, 0);
  }

  get radius() {
    return this.project.planet.size;
  }

  setHover(active: boolean) {
    this.hoverTarget = active ? 1 : 0;
    this.label.element.classList.toggle('is-hover', active);
  }

  setFocused(active: boolean) {
    this.focused = active;
    this.label.element.classList.toggle('is-focused', active);
  }

  getWorldPosition(target: Vector3) {
    return this.body.getWorldPosition(target);
  }

  update(dt: number, elapsed: number, timeScale: number) {
    const { orbit } = this.project.planet;
    this.angle += dt * timeScale * this.angularSpeed;
    this.body.position.set(Math.cos(this.angle) * orbit, 0, -Math.sin(this.angle) * orbit);
    this.mesh.rotation.y += dt * (0.05 + 0.15 * timeScale);

    this.hover += (this.hoverTarget - this.hover) * Math.min(1, dt * 8);
    this.surface.uniforms.uTime.value = elapsed;
    this.surface.uniforms.uHover.value = this.hover;
    this.atmosphere.uniforms.uHover.value = this.hover;
    // up close the orbit line would slice straight through the planet, so it fades out while focused
    this.orbitMaterial.opacity = this.focused ? 0.04 : 0.12 + this.hover * 0.4;

    for (const moon of this.moons) moon.pivot.rotation.y += dt * moon.speed * (0.3 + timeScale * 0.7);

    if (this.ring) this.body.getWorldPosition(this.ring.uniforms.uPlanetPos.value);
  }
}
