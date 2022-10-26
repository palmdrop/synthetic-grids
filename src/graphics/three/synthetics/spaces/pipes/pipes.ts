import * as THREE from 'three';
import { getVolumeCenter, Volume, volumePointIntersection } from "../../../tools/math";
import { Octree } from "../../../tools/space/Octree";

type Properties = {
  volume: Volume,
  maxDepth: number,
  preSplits?: number
}

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

export class PipesGrid {
  octree: Octree<boolean>;

  constructor({ 
    volume, 
    maxDepth,
    preSplits = maxDepth / 2
  }: Properties) {
    if(maxDepth < preSplits) throw new Error('Illegal argument. "preSplits" has to be les than "maxDepth"');

    this.octree = new Octree<boolean>(volume, 1, maxDepth, true);
    this.split(this.octree, preSplits);
  }

  private split(octree: Octree<boolean>, steps: number) {
    if(!steps) return;
    const volume = octree.getVolume();
    const center = getVolumeCenter(volume);
    octree.insert(center, false);

    octree.traverseChildren(node => {
      this.split(node, steps - 1);
    });
  }

  private isOccupied(point: THREE.Vector3) {
    const node = this.octree.getLowestNode(point);
    return node && node.entries.some(entry => entry.data);
  }
}

export type Grid<T> = {
  width: number,
  height: number,
  depth: number,

  cells: T[]
}

export const makeGrid = <T>(width: number, height: number, depth: number) => {
  const cells: T[] = [];
  return {
    width, height, depth,
    cells
  };
}

const getIndex = (x: number, y: number, z: number, grid: Grid<any>) => {
  return x + grid.width * (y + grid.height * z);
}
export class Pipe {
  private segments: THREE.Vector3[] = [];
  private dead: boolean = false;

  public object: THREE.Object3D = new THREE.Object3D();
  
  constructor(
    // private grid: PipesGrid, 
    private grid: Grid<boolean>,
    /* private */ startPosition: THREE.Vector3, 
    // private level: number,
    private makeSegmentMesh?: (previousSegment: THREE.Vector3, nextSegment: THREE.Vector3) => THREE.Mesh
  ) {
    /*
    if(!volumePointIntersection(grid.octree.getVolume(), startPosition)) throw new Error(
      'Starting point has to be inside grid volume'
    );
    */
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
    // console.log(this.segments);
    debugger
    if(steps <= 0 || this.dead) return;
    
    const currentPosition = this.segments.at(-1);
    const options: THREE.Vector3[] = [];

    for(let dx = -1; dx <= 1; dx++)
    for(let dy = -1; dy <= 1; dy++)
    for(let dz = -1; dz <= 1; dz++) {
      const x = currentPosition.x + dx; 
      const y = currentPosition.y + dy; 
      const z = currentPosition.z + dz; 

      if(
        x < 0 || x >= this.grid.width ||
        y < 0 || y >= this.grid.height ||
        z < 0 || z >= this.grid.depth
      ) continue;

      const index = getIndex(x, y, z, this.grid);
      if(this.grid.cells[index]) continue;

      options.push(new THREE.Vector3(x, y, z));
    }

    if(!options.length) {
      this.dead = true;
      return;
    }


    const next = options[
      Math.floor(Math.random() * options.length)
    ];
    const previous = this.segments.at(-1);

    this.segments.push(next);

    if(this.makeSegmentMesh) {
      this.object.add(this.makeSegmentMesh(previous, next));
    }

    this.walk(steps - 1);
  }
} 
