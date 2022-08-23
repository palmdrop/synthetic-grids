import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import encodedBackgroundProgram from '../../programs/moss-structure9.json';
import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { decodeProgram, EncodedProgram } from '../../../../../modules/substrates/src/stores/programStore';
import { getBackgroundRenderer } from '../../background/background';
import { createProgramManager, MaterialObject } from '../../programs/programManager';
import { createBoulder } from './formation';

export const spaceMetadata = {
  postProcessing: true
}

const updateCamera = (weedsObject: THREE.Object3D, renderScene: AbstractRenderScene, margin = 0.1) => {
  if(!(renderScene.camera as THREE.OrthographicCamera).isOrthographicCamera) return;

  const camera = renderScene.camera;

  const box = new THREE.Box3().expandByObject(weedsObject);
  const size = box.getSize(new THREE.Vector3());

  const maxDimension = Math.max(size.x, size.y);
  const rendererSize = renderScene.renderer.getSize(new THREE.Vector2());

  const dimensionMultiplier = rendererSize.x > rendererSize.y ? rendererSize.x / rendererSize.y : 1.0;

  const resizer = makeAspectOrthoResizer(
    camera as THREE.OrthographicCamera, 
    dimensionMultiplier * maxDimension * (1.0 + margin)
  );

  resizer.setSize(rendererSize.x, rendererSize.y);
}


export const getBoulderTunnelSpace = (
  renderScene: AbstractRenderScene,
  interactive?: boolean
): SyntheticSpace => {
  const parent = new THREE.Object3D();

  const boulder = createBoulder();
  boulder.receiveShadow = true;
  boulder.castShadow = true;

  parent.add(boulder);
  updateCamera(boulder, renderScene);

  const synthetic: Synthetic = {
    object: parent,
    metadata: {}
  };

  synthetic.update = (properties) => {
    parent.children[0].rotateY(0.002);
  }

  // Background
  const backgroundRenderTarget = new THREE.WebGLRenderTarget(
    renderScene.canvas.width, renderScene.canvas.height, {}
  );

  // const backgroundRenderer = getBackgroundRenderer(renderScene.renderer, backgroundRenderTarget, defaultBackgroundProgram);
  // renderScene.resizeables.push(backgroundRenderer);

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      updateCamera(parent.children[0], renderScene);
    },
    onClick: () => {

    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      // scene.background = backgroundRenderTarget.texture;
      scene.background = new THREE.Color('black');

      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      camera.position.set(0, 0, 80);

      const directionalLight = new THREE.DirectionalLight('white', 3.2);
      directionalLight.position.set(-10, 5, 10);
      directionalLight.castShadow = true;

      const ambientLight = new THREE.AmbientLight('white', 1.3);

      scene.add(
        directionalLight,
        ambientLight
      );
    },
    synthetics: [
      synthetic,
    ],
    postProcessing: false,
    defaultPasses: true,
    controls: interactive,
    postProcessingPassSettings: {
      bloom: {
        threshold: 0.4,
        intensity: 2.0,
        smoothing: 0.1
      }
    },
    // backgroundRenderer,
    defaultSceneProperties: {
      scale: 1.0
    }
  };

  return space;
}