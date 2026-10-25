import {
  ACESFilmicToneMapping,
  AmbientLight,
  Mesh,
  PerspectiveCamera,
  PointLight,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { asteroidBelt, projects } from '../data/portfolio';
import { AsteroidBelt } from './AsteroidBelt';
import { Background } from './Background';
import { Planet } from './Planet';
import { Sun } from './Sun';

export type Focus = { kind: 'planet'; planet: Planet } | { kind: 'sun' } | null;

export interface UniverseOptions {
  canvas: HTMLCanvasElement;
  lowPower: boolean;
  reducedMotion: boolean;
  onFocusChange: (focus: Focus) => void;
}

interface Flight {
  from: Vector3;
  fromTarget: Vector3;
  elapsed: number;
  duration: number;
  destination: (pos: Vector3, target: Vector3) => void;
  onDone?: () => void;
}

const HOME = new Vector3(0, 62, 150);
const INTRO_START = new Vector3(-120, 520, 1050);
const UP = new Vector3(0, 1, 0);
const OVERVIEW_DISTANCE = { min: 14, max: 420 };

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export class Universe {
  readonly planets: Planet[];
  focus: Focus = null;

  private readonly renderer: WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly labels = new CSS2DRenderer();
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly pickables: Mesh[] = [];
  private readonly background: Background;
  private readonly sun = new Sun();
  private readonly belt: AsteroidBelt;

  private flight: Flight | null = null;
  private introDone: (() => void) | null = null;
  private following: Planet | null = null;
  private readonly followLast = new Vector3();
  private hovered: Planet | Sun | null = null;
  private pointerDown = new Vector2();
  private timeScale = 1;
  private timeScaleTarget = 1;
  private viewShift = new Vector2();
  private viewShiftTarget = new Vector2();
  private lastTime = 0;
  private elapsed = 0;
  private readonly tmp = new Vector3();
  private readonly tmp2 = new Vector3();

  constructor(private readonly options: UniverseOptions) {
    const { canvas, lowPower, reducedMotion } = options;
    const pixelRatio = Math.min(window.devicePixelRatio, lowPower ? 1.25 : 2);

    this.renderer = new WebGLRenderer({ canvas, antialias: !lowPower, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 5000);
    this.camera.position.copy(INTRO_START);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 0.8;
    this.controls.minDistance = OVERVIEW_DISTANCE.min;
    this.controls.maxDistance = OVERVIEW_DISTANCE.max;
    this.controls.autoRotateSpeed = reducedMotion ? 0 : 0.25;
    this.controls.enabled = false;

    // scene graph
    this.background = new Background(lowPower ? 2500 : 7000, pixelRatio);
    this.scene.add(this.background.group);
    this.scene.add(this.sun.group);
    this.scene.add(new PointLight('#ffd6a0', 3, 0, 0));
    this.scene.add(new AmbientLight('#4a4f7a', 0.25));

    this.belt = new AsteroidBelt(lowPower ? 600 : 1800, asteroidBelt.inner, asteroidBelt.outer);
    this.scene.add(this.belt.mesh);

    this.planets = projects.map((project, i) => new Planet(project, i, (p) => this.focusPlanet(p)));
    for (const planet of this.planets) {
      this.scene.add(planet.orbitPlane);
      this.pickables.push(planet.mesh);
    }
    this.pickables.push(this.sun.mesh);
    this.sun.group.add(this.createSunLabel());

    // post-processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 0.95, 0.65, 0.82));
    this.composer.addPass(new OutputPass());

    // HTML labels overlay
    this.labels.setSize(window.innerWidth, window.innerHeight);
    this.labels.domElement.className = 'labels-layer';
    document.body.appendChild(this.labels.domElement);

    this.bindEvents();
  }

  /** Starts rendering and plays the fly-in from deep space. */
  start(onIntroDone?: () => void) {
    this.camera.lookAt(0, 0, 0);
    this.renderer.setAnimationLoop(this.tick);
    this.introDone = () => {
      this.introDone = null;
      onIntroDone?.();
    };
    this.flyTo(
      (pos, target) => {
        pos.copy(HOME);
        target.set(0, 0, 0);
      },
      this.options.reducedMotion ? 0.01 : 3.6,
      () => {
        this.controls.autoRotate = true;
        this.introDone?.();
      },
    );
  }

  focusPlanet(planet: Planet) {
    if (this.focus?.kind === 'planet' && this.focus.planet === planet && !this.flight) return;
    this.setFocus({ kind: 'planet', planet });
    this.timeScaleTarget = 0.12;

    const radius = planet.radius;
    this.flyTo(
      (pos, target) => {
        planet.getWorldPosition(target);
        // approach from the sun-facing side, slightly rotated, so the terminator is visible
        const distance = radius * 4.2 + 4;
        pos.copy(target).setY(0).normalize().negate().applyAxisAngle(UP, 0.75).multiplyScalar(distance);
        pos.y += distance * 0.3;
        pos.add(target);
      },
      this.flightDuration(1.8),
      () => {
        this.following = planet;
        planet.getWorldPosition(this.followLast);
        this.controls.minDistance = radius * 1.8;
        this.controls.maxDistance = radius * 14;
      },
    );
  }

  focusSun() {
    this.setFocus({ kind: 'sun' });
    this.timeScaleTarget = 0.3;
    this.flyTo(
      (pos, target) => {
        target.set(0, 0, 0);
        pos.copy(this.camera.position).setY(0).normalize().multiplyScalar(30);
        pos.y = 9;
      },
      this.flightDuration(1.6),
      () => {
        this.controls.minDistance = Sun.RADIUS * 2;
        this.controls.maxDistance = OVERVIEW_DISTANCE.max;
      },
    );
  }

  overview() {
    if (!this.focus) return;
    this.setFocus(null);
    this.timeScaleTarget = 1;
    this.flyTo(
      (pos, target) => {
        // keep the current viewing angle around the system instead of snapping to a fixed spot
        const angle = Math.atan2(this.camera.position.x, this.camera.position.z);
        pos.set(Math.sin(angle) * HOME.z, HOME.y, Math.cos(angle) * HOME.z);
        target.set(0, 0, 0);
      },
      this.flightDuration(1.8),
      () => {
        this.controls.minDistance = OVERVIEW_DISTANCE.min;
        this.controls.maxDistance = OVERVIEW_DISTANCE.max;
        this.controls.autoRotate = true;
      },
    );
  }

  /** Cycles through planets; direction is +1 / -1. */
  step(direction: number) {
    const current = this.focus?.kind === 'planet' ? this.focus.planet.index : direction > 0 ? -1 : 0;
    const next = (current + direction + this.planets.length) % this.planets.length;
    this.focusPlanet(this.planets[next]);
  }

  findPlanet(id: string) {
    return this.planets.find((p) => p.project.id === id);
  }

  /** Shifts the rendered image (in CSS pixels) so a side panel does not cover the focused object. */
  setViewShift(x: number, y: number) {
    this.viewShiftTarget.set(x, y);
  }

  private setFocus(focus: Focus) {
    this.focus = focus;
    this.following = null;
    this.controls.autoRotate = false;
    for (const planet of this.planets) planet.setFocused(focus?.kind === 'planet' && focus.planet === planet);
    this.labels.domElement.classList.toggle('has-focus', focus !== null);
    this.options.onFocusChange(focus);
  }

  private flightDuration(seconds: number) {
    return this.options.reducedMotion ? 0.4 : seconds;
  }

  private flyTo(destination: Flight['destination'], duration: number, onDone?: () => void) {
    // a flight that cuts the intro short still has to reveal the UI
    if (this.flight) this.introDone?.();
    this.controls.enabled = false;
    this.flight = {
      from: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      elapsed: 0,
      duration,
      destination,
      onDone,
    };
  }

  private updateCamera(dt: number) {
    if (this.flight) {
      const flight = this.flight;
      flight.elapsed += dt;
      const t = Math.min(flight.elapsed / flight.duration, 1);
      const e = easeInOutCubic(t);
      // destination is re-evaluated each frame because planets keep moving
      flight.destination(this.tmp, this.tmp2);
      this.camera.position.lerpVectors(flight.from, this.tmp, e);
      this.controls.target.lerpVectors(flight.fromTarget, this.tmp2, e);
      this.camera.lookAt(this.controls.target);
      if (t >= 1) {
        this.flight = null;
        this.controls.enabled = true;
        this.controls.update();
        flight.onDone?.();
      }
      return;
    }

    if (this.following) {
      const pos = this.following.getWorldPosition(this.tmp);
      const delta = this.tmp2.subVectors(pos, this.followLast);
      this.camera.position.add(delta);
      this.controls.target.add(delta);
      this.followLast.copy(pos);
    }
    this.controls.update(dt);
  }

  private updateViewShift(dt: number) {
    this.viewShift.lerp(this.viewShiftTarget, Math.min(1, dt * 5));
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (this.viewShift.lengthSq() < 0.25 && this.viewShiftTarget.lengthSq() === 0) {
      if (this.camera.view?.enabled) this.camera.clearViewOffset();
      return;
    }
    this.camera.setViewOffset(w, h, this.viewShift.x, this.viewShift.y, w, h);
  }

  private tick = (time: number) => {
    const now = time / 1000;
    const dt = this.lastTime ? Math.min(now - this.lastTime, 0.05) : 0.016;
    this.lastTime = now;
    this.elapsed += dt;

    this.timeScale += (this.timeScaleTarget - this.timeScale) * Math.min(1, dt * 2);

    this.background.update(this.elapsed);
    this.sun.update(dt, this.elapsed);
    this.belt.update(dt * this.timeScale);
    for (const planet of this.planets) planet.update(dt, this.elapsed, this.timeScale);

    this.updateCamera(dt);
    this.updateViewShift(dt);

    this.composer.render(dt);
    this.labels.render(this.scene, this.camera);
  };

  private createSunLabel() {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'planet-label planet-label--sun';
    element.style.setProperty('--accent', '#ffb347');
    element.innerHTML = '<span class="planet-label__dot"></span><span class="planet-label__text">Обо мне</span>';
    element.addEventListener('click', () => this.focusSun());
    element.addEventListener('pointerenter', () => this.sun.setHover(true));
    element.addEventListener('pointerleave', () => this.sun.setHover(false));
    const label = new CSS2DObject(element);
    // below the star: above it the label collides with the innermost planet's label
    label.position.set(0, -Sun.RADIUS - 3, 0);
    return label;
  }

  private pick(event: PointerEvent): Planet | Sun | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.pickables, false)[0];
    if (!hit) return null;
    return hit.object === this.sun.mesh ? this.sun : (hit.object.userData.planet as Planet);
  }

  private setHovered(target: Planet | Sun | null) {
    if (target === this.hovered) return;
    this.hovered?.setHover(false);
    target?.setHover(true);
    this.hovered = target;
    this.renderer.domElement.style.cursor = target ? 'pointer' : '';
  }

  private bindEvents() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'mouse' && event.buttons === 0) this.setHovered(this.pick(event));
    });
    canvas.addEventListener('pointerleave', () => this.setHovered(null));
    canvas.addEventListener('pointerdown', (event) => this.pointerDown.set(event.clientX, event.clientY));
    canvas.addEventListener('pointerup', (event) => {
      // treat as a click only when the pointer barely moved (otherwise it was a drag-rotate)
      if (this.pointerDown.distanceTo(new Vector2(event.clientX, event.clientY)) > 6 || this.flight) return;
      const target = this.pick(event);
      if (target instanceof Planet) this.focusPlanet(target);
      else if (target === this.sun) this.focusSun();
      else this.overview();
    });

    // the user grabbed the camera — stop the idle rotation until the next overview
    this.controls.addEventListener('start', () => {
      if (!this.focus) this.controls.autoRotate = false;
    });

    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
      this.labels.setSize(w, h);
    });
  }
}
