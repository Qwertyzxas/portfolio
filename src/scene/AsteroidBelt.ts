import { Euler, IcosahedronGeometry, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three';

export class AsteroidBelt {
  readonly mesh: InstancedMesh;

  constructor(count: number, inner: number, outer: number) {
    const geometry = new IcosahedronGeometry(1, 0);
    const material = new MeshStandardMaterial({ color: '#8b8796', roughness: 1, flatShading: true });
    this.mesh = new InstancedMesh(geometry, material, count);

    const matrix = new Matrix4();
    const position = new Vector3();
    const rotation = new Quaternion();
    const scale = new Vector3();
    const euler = new Euler();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // bias towards the middle of the belt
      const t = (Math.random() + Math.random()) / 2;
      const radius = inner + (outer - inner) * t;
      position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 1.6, Math.sin(angle) * radius);
      rotation.setFromEuler(euler.set(Math.random() * 6, Math.random() * 6, Math.random() * 6));
      // uneven scale per axis so asteroids look like rocks rather than gems
      const size = 0.06 + Math.random() ** 3 * 0.38;
      scale.set(size * (0.7 + Math.random() * 0.6), size * (0.5 + Math.random() * 0.5), size);
      this.mesh.setMatrixAt(i, matrix.compose(position, rotation, scale));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  update(dt: number) {
    this.mesh.rotation.y += dt * 0.012;
  }
}
