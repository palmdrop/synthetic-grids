import * as THREE from 'three';

export const box3ToBoxGeometry = (box3: THREE.Box3) => {
  const dimensions = box3.getSize(new THREE.Vector3());
  const boxGeometry = new THREE.BoxBufferGeometry(dimensions.x, dimensions.y, dimensions.z);
  const matrix = new THREE.Matrix4().setPosition(dimensions.addVectors(box3.min, box3.max).multiplyScalar( 0.5 ));
  boxGeometry.applyMatrix4(matrix);
  return boxGeometry;
}

export const boundingBoxToBoxGeometry = (object: THREE.Object3D) => {
  return box3ToBoxGeometry(new THREE.Box3().setFromObject(object));
}