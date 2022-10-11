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

export class Pipe {
  private segments: THREE.Vector3 = [];
  
  constructor(
    private grid: PipesGrid, 
    private startPosition: THREE.Vector3, 
    private level: number
  ) {
    if(!volumePointIntersection(grid.octree.getVolume(), startPosition)) throw new Error(
      'Starting point has to be inside grid volume'
    );
  }

  walk(steps: number) {



  }
} 
