import * as THREE from 'three';
import { combineProbabilityMaps, getWeightedRandomPointInDomain, getWeightedRandomPointsInDomain, noiseProbabilityMap, uniformProbabilityMap } from '../../../procedural/domain/domain';
import { getContainingVolume, random, randomInVolume } from "../../../tools/math";
import { Octree, OctreeHelper } from '../../../tools/space/Octree';
import { SpaceColonizationTree } from "../../../tools/space/SpaceColonizationTree";

export const getPoints = () => {
  const domain = new THREE.Sphere(
    new THREE.Vector3(),
    30
  );

  const probabilityMap = 
    combineProbabilityMaps(
      noiseProbabilityMap( 0.12, 0.0, 1.0, 1.5 ),
      uniformProbabilityMap( 5.0 ),
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
    random(2.2, 3.0), // Min dist
    random(8, 12.5), // Max dist
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

  const treeObject = tree.buildInstancedThreeObject(new THREE.MeshBasicMaterial({
    color: '#f9ff99'
  }), 0.05, 0.3, 0.1, 10);

  const treePoints: THREE.Vector3[] = [];
  tree.traverse(segment => treePoints.push(segment.origin));

  const octreeParent = new THREE.Object3D();
  const octree = new Octree(volume, 1, 8);
  octree.insertAll(treePoints, treePoints);

  const baseHue = random(30, 100);

  const octreeHelper = new OctreeHelper(octree, (node) => {
    if(node.depth < 7) return undefined;

    let hue: number, sat: number, bri: number;
    sat = 100;
    if(node.depth % 2.0 === 0.0) {
      hue = random(100, 200);
      bri = 60;
    } else {
      hue = baseHue;
      bri = 30;
    }

    hue += random(-20, 20);

    return new THREE.LineBasicMaterial( { color: `hsl(${ hue }, ${sat}%, ${bri}%)` } );
  });

  octreeParent.add(octreeHelper);

  const object = new THREE.Object3D();
  object.add(treeObject, octreeParent);

  return object;
}