import * as THREE from 'three';
import { AbstractRenderScene } from '../../../AbstractRenderScene';
import { getScaleToFit } from '../../../tools/geometryTools';
import { calculateVolume, getVolumeCenter, random, volumeToBox3 } from '../../../tools/math';
import { Octree } from '../../../tools/space/Octree';
import { getRockConfig, getStairsConfig } from './formationConfigs';
import { createFormation } from '../formations/formation';
import { createLineBox } from '../../../../utils/lines';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

export const updateFormations = (parent: THREE.Object3D, renderScene: AbstractRenderScene, octree: Octree<THREE.Vector3>) => {
  parent.clear();

  const leafNodes = octree.getLeafNodes();

  const formationVersions = 4;
  const formationCount = leafNodes.length;

  const object = new THREE.Object3D();

  const formations: THREE.InstancedMesh[] = [];
  for(let i = 0; i < formationVersions; i++) {
    const formation = createFormation(
      getRockConfig(),
      {
        count: Math.ceil(formationCount / formationVersions)
      }
    ) as THREE.InstancedMesh;

    formation.receiveShadow = true;
    formation.castShadow = true;

    formations.push(formation);
  }

  parent.add(object);
  object.add(...formations);

  const boundingBoxes = formations.map(formation => new THREE.Box3().setFromObject(formation));

  octree.traverseNodes(node => {
    if(leafNodes.includes(node) || node.getChildCount() !== 0) return;

    const lineBox = createLineBox(volumeToBox3(node.getVolume()), new LineMaterial({
      color: new THREE.Color('#8cff00').getHex(),
      linewidth: 0.0010
    }));

    parent.add(
      lineBox
    );
  });

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

      const scale = 1.4 * getScaleToFit(nodeBoundingBox, instanceBoundingBox);

      formation.setMatrixAt(
        Math.floor(i / formationVersions - formationIndex), 
        new THREE.Matrix4().compose(
          new THREE.Vector3(center.x, center.y, center.z), 
          rotation, 
          new THREE.Vector3(scale, scale, scale)
        )
      );
      
      /*
      const lineBox = createLineBox(nodeBoundingBox, new LineMaterial({
        color: new THREE.Color('#8cff00').getHex(),
        linewidth: 0.0010
      }));

      parent.add(
        lineBox
      )
      */
    });
}