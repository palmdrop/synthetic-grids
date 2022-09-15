import * as THREE from 'three';
import { combineProbabilityMaps, getWeightedRandomPointsInDomain, noiseProbabilityMap, uniformProbabilityMap } from '../../../procedural/domain/domain';
import { getContainingVolume, random } from "../../../tools/math";
import { Octree } from '../../../tools/space/Octree';
import { SpaceColonizationTree } from "../../../tools/space/SpaceColonizationTree";

export const getPoints = () => {
  const domain = new THREE.Box3(
    new THREE.Vector3(
      -15, -15, -15
    ),
    new THREE.Vector3(
      15, 15, 15
    ),
  )

  const probabilityMap = 
    combineProbabilityMaps(
      noiseProbabilityMap( 0.12, 0.0, 1.0, 1.5 ),
      uniformProbabilityMap( 10.0 ),
      ( v1, v2 ) => Math.pow( v1, v2 )
    );

  const points = getWeightedRandomPointsInDomain(
    domain, 
    probabilityMap,
    2500,
    20
  );

  const volume = getContainingVolume( points );

  return {
    points,
    volume
  };
}

export const getTree = () => {
  const { points, volume } = getPoints();

  const tree = new SpaceColonizationTree(
    random(3.2, 6.0), // Min dist
    random(15, 20.5), // Max dist
    random(0.5, 0.6), // Dynamics
    random(0.1, 0.4), // Step size
    random(0.3, 0.3) // Random
  );

  tree.generate(
    points, 
    volume, 
    new THREE.Vector3(
      0, volume.y, 0
    ),
    new THREE.Vector3(
      0, 1, 0
    ), 
    100
  );

  const treePoints: THREE.Vector3[] = [];
  tree.traverse(segment => treePoints.push(segment.origin));

  const treeObject = tree.buildInstancedThreeObject(new THREE.MeshBasicMaterial({
    color: '#ffffff'
  }), 0.02, 0.2, 0.1, 10);

  const octree = new Octree<THREE.Vector3>(volume, 3, 5);
  octree.insertAll(treePoints, treePoints);

  const object = new THREE.Object3D();
  object.add(
    treeObject
  );

  return { object, octree };
}