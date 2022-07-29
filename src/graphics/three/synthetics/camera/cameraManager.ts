import * as THREE from 'three';
import type { AbstractRenderScene } from '../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../systems/AspectOrthoResizer';

export const makeCamera = (renderScene: AbstractRenderScene): THREE.Camera => {
  const camera = new THREE.OrthographicCamera(
    -1, 1,
    -1, 1,
    -1000.0, 100000
  );

  camera.position.set( 0, 0, 100 );

  renderScene.resizeables.push(makeAspectOrthoResizer(
    camera as THREE.OrthographicCamera, 190.4 
  ));

  return camera;

  /*
  const camera = new THREE.PerspectiveCamera(
    45, 1.0, 0.1, 2000
  );
  camera.position.set( 0, 0, 30 );
  */

  return camera;
}
