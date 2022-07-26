import type * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

export const createLineBox = (box: THREE.Box3, material: LineMaterial) => {
  const { min, max } = box;
  // NOTE: A few line segments overlap...
  const points: { x: number, y: number, z: number }[] = [
    { x: min.x, y: max.y, z: min.z }, { x: max.x, y: max.y, z: min.z }, 
    { x: max.x, y: min.y, z: min.z }, { x: min.x, y: min.y, z: min.z }, 
    { x: min.x, y: max.y, z: min.z },

    { x: min.x, y: max.y, z: max.z },
    { x: min.x, y: min.y, z: max.z }, { x: max.x, y: min.y, z: max.z }, 
    { x: max.x, y: max.y, z: max.z }, { x: min.x, y: max.y, z: max.z }, 
    { x: min.x, y: min.y, z: max.z },

    { x: min.x, y: min.y, z: min.z }, { x: max.x, y: min.y, z: min.z },
    { x: max.x, y: min.y, z: max.z }, { x: max.x, y: max.y, z: max.z },
    { x: max.x, y: max.y, z: min.z },
  ];

  const positions = points.flatMap(point => ([point.x, point.y, point.z]));

  const geometry = new LineGeometry();
  geometry.setPositions(positions);

  const line = new Line2(geometry, material);
  line.computeLineDistances();
	line.scale.set( 1, 1, 1 );

  return line;
}