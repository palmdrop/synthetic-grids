import type * as THREE from 'three';

export const makeAspectOrthoResizer = (
  camera: THREE.OrthographicCamera,
  frustumSize: number
) => (
  {
    setSize: (width: number, height: number) => {
      const aspect = height / width;

      camera.left = -frustumSize / 2;
      camera.right = frustumSize / 2;
      camera.top = frustumSize * aspect / 2;
      camera.bottom = -frustumSize * aspect / 2;

      camera.updateProjectionMatrix();
    }
  }
);
