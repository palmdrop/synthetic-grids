import * as THREE from 'three';
import { getNoise3D } from '../../../procedural/noise/noise';

const palettes = Object.values(import.meta.globEager('../../../../../assets/palettes/*.json')).map((module: any) => module.default);

// TODO: 
// TODO
/*
  * better solution?
  * multiple grids with various levels
  * easy to check neighboring cells
  * step "down" one level to check at more granular levels
  * have cell property indicate if step is needed...
  * is there a reason to do this?

*/

export type Grid<T> = {
  width: number,
  height: number,
  depth: number,

  cells: T[]
}


export const makeGrid = <T>(
  width: number, height: number, depth: number, 
  initializer?: (x: number, y: number, z: number, index: number) => T
): Grid<T> => {
  const cells: T[] = [];

  const grid = {
    width, height, depth,
    cells
  };

  if(initializer) {
    traverseGrid(grid, (_, x, y, z, index) => {
      grid.cells[index] = initializer(x, y, z, index);
    })
  }

  return grid;
}

export const traverseGrid = <T>(
  grid: Grid<T>, 
  callback: (value: T, x: number, y: number, z: number, index: number) => void
) => {
  for(let x = 0; x < grid.width; x++)
  for(let y = 0; y < grid.height; y++)
  for(let z = 0; z < grid.depth; z++) {
    const index = getIndex(x, y, z, grid);
    callback(grid[index], x, y, z, index);
  }
};

const getIndex = (x: number, y: number, z: number, grid: Grid<any>) => {
  return x + grid.width * (y + grid.height * z);
}

const getWalkDirections = () => {
  return [
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),

    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),

    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
  ];
}

export class Pipe {
  private static walkDirections = getWalkDirections();

  private segments: THREE.Vector3[] = [];
  private dead: boolean = false;
  public object: THREE.Object3D = new THREE.Object3D();
  private previousDirection: undefined | THREE.Vector3 = undefined;
  
  constructor(
    private grid: Grid<number>,
    startPosition: THREE.Vector3, 
    private makeSegmentMesh?: (
      previousSegment: THREE.Vector3, 
      nextSegment: THREE.Vector3, 
      direction?: THREE.Vector3,
      previousDirection?: THREE.Vector3
    ) => THREE.Mesh | undefined,
    private isOccupied: (cellValue: number) => boolean = cellValue => !!cellValue,
    private decider: (cells: THREE.Vector3[]) => { cell: THREE.Vector3, value: number }
      = cells => ({
        cell: cells[Math.floor(Math.random() * cells.length)],
        value: 1.0
      })
  ) {
    if(
      startPosition.x < 0 || startPosition.x >= grid.width  || 
      startPosition.y < 0 || startPosition.y >= grid.height || 
      startPosition.x < 0 || startPosition.x >= grid.depth  
    ) {
      throw new Error('Starting position has to be inside grid');
    }

    this.segments.push(startPosition);
  }

  walk(steps: number) {
    if(steps <= 0 || this.dead) return;
    
    const currentPosition = this.segments.at(-1);
    const options: THREE.Vector3[] = [];

    Pipe.walkDirections.forEach(direction => {  
      const dx = direction.x;
      const dy = direction.y;
      const dz = direction.z;

      const x = currentPosition.x + dx; 
      const y = currentPosition.y + dy; 
      const z = currentPosition.z + dz; 

      if(
        x < 0 || x >= this.grid.width ||
        y < 0 || y >= this.grid.height ||
        z < 0 || z >= this.grid.depth ||
        (Math.abs(dx) + Math.abs(dy) + Math.abs(dz)) >= 2
      ) return;

      const index = getIndex(x, y, z, this.grid);
      if(this.isOccupied(this.grid.cells[index])) return;

      options.push(new THREE.Vector3(x, y, z));
    });

    if(!options.length) {
      this.dead = true;
      return;
    }

    const {
      cell: next,
      value
    } = this.decider(options);

    // const next = options[Math.floor(Math.random() * options.length)];
    const previous = this.segments.at(-1);

    this.segments.push(next);
    this.grid.cells[getIndex(next.x, next.y, next.z, this.grid)] = value;

    const direction = new THREE.Vector3().subVectors(next, previous);

    if(this.makeSegmentMesh) {
      const mesh = this.makeSegmentMesh(previous, next, direction, this.previousDirection);
      if(mesh) this.object.add(mesh);
    }

    this.previousDirection = direction;

    this.walk(steps - 1);
  }

  get isDead() { return this.dead; }
} 

export type PipeSystemConfig = {
  spacing: number,
  padding: number,
  radius: number,
  grid: Grid<number>
}

export const makePipesSystem = ({ spacing, padding, radius, grid }: PipeSystemConfig) => {
  const parent = new THREE.Object3D();

  const curve = new THREE.LineCurve3(
    new THREE.Vector3(0.0, 0.0, 0.0), 
    new THREE.Vector3(0.0, 0.0, spacing * (1.0 + padding))
  );

  const tubeGeometry = new THREE.TubeBufferGeometry(
    curve, 3, radius, 2, true
  );

  const sphereGeometry = new THREE.SphereBufferGeometry(
    radius, 4, 4
  );

  const paletteIndex = Math.floor(Math.random() * palettes.length);
  const palette = palettes[paletteIndex];

  const colors = palette.map(entry => entry.color).map(({ r, g, b }) => {
    const { h, s, l } = new THREE.Color(r / 255, g / 255, b / 255).getHSL({ h: 0, s: 0, l: 0 });
    const color = new THREE.Color().setHSL(
      h, 
      s,
      Math.max(Math.pow(l, 0.9), 0.4),
    );

    return color;
  });

  const threshold = 0.6;
  const checkUnoccupied = (x: number, y: number, z: number) => {
    return grid.cells[getIndex(x, y, z, grid)] > threshold;
  }

  const getUnoccupied = (tries = 30) => {
    let x: number;
    let y: number;
    let z: number;
    let tryCount = 0;
    do {
      x = Math.floor(Math.random() * grid.width);
      y = Math.floor(Math.random() * grid.height);
      z = Math.floor(Math.random() * grid.depth);
      if(tryCount >= tries) return undefined;
    } while(checkUnoccupied(x, y, z));

    return new THREE.Vector3(x, y, z);
  }

  const makePipe = () => {
    const material = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      wireframe: true
    });

    const instanceCount = grid.width * grid.height * grid.depth;
    const tubeMesh = new THREE.InstancedMesh(
      tubeGeometry,
      material,
      instanceCount
    );
    const sphereMesh = new THREE.InstancedMesh(
      sphereGeometry,
      material,
      instanceCount
    );

    tubeMesh.count = 0;
    sphereMesh.count = 0;

    const offset = new THREE.Vector3(
      -spacing * grid.width / 2.0,
      -spacing * grid.height / 2.0,
      -spacing * grid.depth / 2.0
    );

    let tubeIndex = 0;
    let sphereIndex = 0;
    const scale = new THREE.Vector3(1.0, 1.0, 1.0);
    const dummyMesh = new THREE.Mesh();
    const startPosition = getUnoccupied();

    if(!startPosition) return undefined;
    
    const pipe = new Pipe(
      grid,
      startPosition,
      (previous, next, direction, previousDirection) => {
        const position = previous.clone()
          .multiplyScalar(spacing)
          .add(direction.clone().multiplyScalar(-padding / 2.0))
          .add(offset);

        const lookAtPoint = new THREE.Vector3().subVectors(next, previous).normalize();
        dummyMesh.lookAt(lookAtPoint);

        const matrix = new THREE.Matrix4().compose(
          position,
          dummyMesh.quaternion,
          scale
        );

        if(!previousDirection || !direction.equals(previousDirection)) {
          sphereMesh.count = sphereIndex + 1;
          sphereMesh.setMatrixAt(sphereIndex, matrix);
          sphereMesh.instanceMatrix.needsUpdate = true;
          sphereIndex++;
        }

        tubeMesh.count = tubeIndex + 1;
        tubeMesh.setMatrixAt(tubeIndex, matrix);
        tubeMesh.instanceMatrix.needsUpdate = true;
        tubeIndex++;

        return undefined;
      },
      isOccupied => isOccupied > threshold
    );

    pipe.object.add(tubeMesh);
    pipe.object.add(sphereMesh);

    parent.add(pipe.object);

    return pipe;
  }

  const boundingBox = new THREE.Box3(
    new THREE.Vector3(
      -0.5 * grid.width * spacing,
      -0.5 * grid.height * spacing,
      -0.5 * grid.depth * spacing
    ),
    new THREE.Vector3(
      0.5 * grid.width * spacing,
      0.5 * grid.height * spacing,
      0.5 * grid.depth * spacing
    )
  );

  let currentPipe = makePipe();

  return {
    object: parent,
    boundingBox,
    walk: (steps: number) => {
      if(!currentPipe) return;
      if(currentPipe.isDead) {
        currentPipe = makePipe();
      }

      currentPipe.walk(steps);
    }
  }
}