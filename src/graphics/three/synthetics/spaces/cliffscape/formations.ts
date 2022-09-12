import * as THREE from 'three';
import { AbstractRenderScene } from '../../../AbstractRenderScene';
import { getScaleToFit } from '../../../tools/geometryTools';
import { calculateVolume, getVolumeCenter, random, Volume, volumeToBox3 } from '../../../tools/math';
import { Octree } from '../../../tools/space/Octree';
import { getRockConfig } from './formationConfigs';
import { createFormation } from '../formations/formation';
import { createLineBox } from '../../../../utils/lines';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { Synthetic } from '../../scene';

export const updateFormations = (synthetic: Synthetic<THREE.Object3D>, renderScene: AbstractRenderScene, octree: Octree<THREE.Vector3>) => {
  const parent = synthetic.object;
  parent.clear();

  const leafNodes = octree.getLeafNodes();

  const formationVersions = 4;
  const formationCount = Math.floor(leafNodes.length / 1.2);
  const instanceCount = Math.ceil(formationCount / formationVersions);

  const object = new THREE.Object3D();

  const formations: THREE.InstancedMesh[] = [];
  for(let i = 0; i < formationVersions; i++) {
    const config = getRockConfig();
    const formation = createFormation(
      config,
      {
        count: instanceCount
      }
    ) as THREE.InstancedMesh;

    formation.receiveShadow = true;
    formation.castShadow = true;

    formations.push(formation);
  }

  object.position.copy(getVolumeCenter(octree.getVolume())).multiplyScalar(-1);

  object.add(...formations);
  parent.add(object);

  const boundingBoxes = formations.map(formation => new THREE.Box3().setFromObject(formation));
  const scaleMultiplier = random(0.8, 1.7);

  const placeInstance = (formationIndex: number, instanceIndex: number, volume: Volume) => {
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

    const scale = scaleMultiplier * getScaleToFit(nodeBoundingBox, instanceBoundingBox);

    formation.setMatrixAt(
      instanceIndex, 
      new THREE.Matrix4().compose(
        new THREE.Vector3(center.x, center.y, center.z), 
        rotation, 
        new THREE.Vector3(scale, scale, scale)
      )
    );

    formation.instanceMatrix.needsUpdate = true;
  }

  const occupiedVolumes = leafNodes
    .map(node => node.getVolume())
    .sort((v1, v2) => (
      calculateVolume(v1) - calculateVolume(v2)
    ))
    .slice(0, formationCount);

  const formationVolumeMap = new Map<Volume, { formationIndex: number, instanceIndex: number }>();

  occupiedVolumes.forEach((volume, i) => {
    const formationIndex = i % formationVersions;
    const instanceIndex = Math.floor(i / formationVersions + formationIndex);
    formationVolumeMap.set(volume, { formationIndex, instanceIndex });
    placeInstance(formationIndex, instanceIndex, volume);
  });
  
  const unoccupiedVolumes: Volume[] = [];
  octree.traverseNodes(node => {
    if(leafNodes.includes(node) || node.getChildCount() !== 0) return;

    /*
    const lineBox = createLineBox(volumeToBox3(node.getVolume()), new LineMaterial({
      color: new THREE.Color('#62ff00').getHex(),
      linewidth: 0.0013
    }));

    parent.add(
      lineBox
    );
    */
    unoccupiedVolumes.push(node.getVolume());
  });
  
  synthetic.update = () => {
    // parent.rotateY(0.005);

    if(Math.random() > 0.7) return;

    const indexToEmpty = Math.floor(Math.random() * occupiedVolumes.length);
    const volumeToEmpty = occupiedVolumes[indexToEmpty];
    const { formationIndex, instanceIndex } = formationVolumeMap.get(volumeToEmpty);

    const indexToFill = Math.floor(Math.random() * unoccupiedVolumes.length);
    const volumeToFill = unoccupiedVolumes[indexToFill];
    formationVolumeMap.set(volumeToFill, { formationIndex, instanceIndex });

    occupiedVolumes[indexToEmpty] = volumeToFill;
    unoccupiedVolumes[indexToFill] = volumeToEmpty;

    placeInstance(formationIndex, instanceIndex, volumeToFill);
  }
}