import * as THREE from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { createLineBox } from '../../../../utils/lines';
import { AbstractRenderScene } from '../../../AbstractRenderScene';
import { getScaleToFit } from '../../../tools/geometryTools';
import { calculateVolume, getVolumeCenter, random, volumeToBox3 } from '../../../tools/math';
import { Octree } from '../../../tools/space/Octree';
import { getRockConfig, getStairsConfig } from '../formations/configs';
import { createFormation } from '../formations/formation';

export const updateFormations = (parent: THREE.Object3D, renderScene: AbstractRenderScene, octree: Octree<THREE.Vector3>) => {
  parent.clear();

  const leafNodes = octree.getLeafNodes();

  const formationVersions = 3;
  const formationCount = leafNodes.length;

  const formations: THREE.InstancedMesh[] = [];
  for(let i = 0; i < formationVersions; i++) {
    const formation = createFormation(
      Math.random() > 0.5 
        ? getRockConfig()
        : getStairsConfig(),
      {
        count: Math.ceil(formationCount / formationVersions)
      }
    ) as THREE.InstancedMesh;

    formations.push(formation);
  }

  // parent.add(formation);
  parent.add(...formations);

  const boundingBoxes = formations.map(formation => new THREE.Box3().setFromObject(formation));

  // octree
    // .getFlattenedNodes()
    // .getLeafNodes()
  leafNodes
    .map(node => node.getVolume())
    .sort((v1, v2) => (
      calculateVolume(v2) - calculateVolume(v1)
    ))
    .slice(0, formationCount)
    .forEach((volume, i) => {
      const formationIndex = i % formationVersions;
      const boundingBox = boundingBoxes[formationIndex];
      const formation = formations[formationIndex];

      const center = getVolumeCenter(volume);

      const rotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          random(-Math.PI, Math.PI),
          random(-Math.PI, Math.PI),
          random(-Math.PI, Math.PI),
        )
      );

      const translateRotateMatrix = new THREE.Matrix4().compose(
        new THREE.Vector3(center.x, center.y, center.z), 
        rotation, 
        new THREE.Vector3(1.0, 1.0, 1.0)
      );

      const nodeBoundingBox = volumeToBox3(volume);
      const instanceBoundingBox = boundingBox.clone().applyMatrix4(translateRotateMatrix);

      const scale = getScaleToFit(nodeBoundingBox, instanceBoundingBox);

      formation.setMatrixAt(
        Math.floor(i / formationVersions - formationIndex), 
        new THREE.Matrix4().compose(
          new THREE.Vector3(center.x, center.y, center.z), 
          rotation, 
          new THREE.Vector3(scale, scale, scale)
        )
      );

      /*
      parent.add(
        createLineBox(nodeBoundingBox, new LineMaterial({
          color: new THREE.Color('#13de00').getHex(),
          linewidth: 0.0020
        }))
      )
      */
    });

  // updateCamera(formation, renderScene);

  /*
  const lineBox = createLineBox(new THREE.Box3().setFromObject(formation), new LineMaterial({
    color: new THREE.Color('#13de00').getHex(),
    linewidth: 0.0020
  }));
  */

  // lineBox.position.copy(formation.position);
  // formation.add(lineBox);
  return 
}