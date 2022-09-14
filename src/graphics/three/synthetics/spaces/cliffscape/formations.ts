import * as THREE from 'three';
import { getScaleToFit } from '../../../tools/geometryTools';
import { calculateVolume, getVolumeCenter, random, Volume, volumeToBox3 } from '../../../tools/math';
import { Octree } from '../../../tools/space/Octree';
import { getRockConfig } from './rockConfig';
import { createFormation } from '../formations/formation';
import { createLineBox } from '../../../../utils/lines';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { Synthetic } from '../../scene';

const getLight = () => {
  const directionalLight = new THREE.DirectionalLight('white', 4.3);
  directionalLight.target = new THREE.Object3D();
  directionalLight.castShadow = true;

  directionalLight.castShadow = true;
  directionalLight.shadow.bias = -0.001;

  directionalLight.shadow.mapSize.width = 1024 * 2;
  directionalLight.shadow.mapSize.height = 1024 * 2;
  directionalLight.shadow.camera.near = 0.0;
  directionalLight.shadow.camera.far = 1024;

  directionalLight.shadow.camera.left = -75;
  directionalLight.shadow.camera.right = 75;
  directionalLight.shadow.camera.top = 75;
  directionalLight.shadow.camera.bottom = -75;

  return directionalLight;
}

export const updateFormations = (synthetic: Synthetic<THREE.Object3D>, octree: Octree<THREE.Vector3>, gridColor: THREE.Color) => {
  const parent = synthetic.object;
  parent.clear();

  const light = getLight();
  const leafNodes = octree.getLeafNodes();

  const formationVersions = 3;
  const formationCount = Math.floor(leafNodes.length / random(1.0, 1.2));
  const instanceCount = Math.ceil(formationCount / formationVersions);

  const object = new THREE.Object3D();
  object.rotateX(0.2);

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
  parent.add(object, light, light.target);

  const boundingBoxes = formations.map(formation => new THREE.Box3().setFromObject(formation));
  const scaleMultiplier = random(1.2, 2.3);

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
  const lineBoxes = new THREE.Object3D();
  octree.traverseNodes(node => {
    if(leafNodes.includes(node) || node.getChildCount() !== 0) return;

    const lineBox = createLineBox(volumeToBox3(node.getVolume()), new LineMaterial({
      color: gridColor.getHex(),
      linewidth: 0.0011
    }));

    lineBox.visible = false;

    lineBoxes.add(
      lineBox
    );
    
    unoccupiedVolumes.push(node.getVolume());
  });

  object.add(lineBoxes);
  
  let timeSinceLastUpdate = 0;
  const updateSpeed = 0.06;
  synthetic.update = (_, __, delta) => {
    object.rotateY(0.1 * delta);

    timeSinceLastUpdate += delta;

    if(timeSinceLastUpdate < updateSpeed) return;
    timeSinceLastUpdate -= updateSpeed;

    lineBoxes.children.forEach(lineBox => {
      const r = Math.random();
      if(lineBox.visible && r > 0.7) {
        lineBox.visible = false;
      } else if(r > 0.99) {
        lineBox.visible = true;
      }
    });

    if(Math.random() > 0.95) {
      light.target.position.set(
        random(10, -10),
        random(10, -10),
        random(-2, -10)
      );

      light.target.updateMatrixWorld();
    }

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