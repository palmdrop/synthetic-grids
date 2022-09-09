import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { getTree } from './tree';

export const spaceMetadata = {
  postProcessing: true
}

const updateCamera = (object: THREE.Object3D, renderScene: AbstractRenderScene, margin = 0.1) => {
  if(!(renderScene.camera as THREE.OrthographicCamera).isOrthographicCamera) return;

  const camera = renderScene.camera;

  const box = new THREE.Box3().expandByObject(object);
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

const updateObject = (parent: THREE.Object3D, renderScene: AbstractRenderScene) => {
  parent.clear();

  const tree = getTree();

  parent.add(tree);
  updateCamera(tree, renderScene);
}

export const getGlowTreeSpace = (
  renderScene: AbstractRenderScene,
  interactive?: boolean
): SyntheticSpace => {
  const parent = new THREE.Object3D();

  updateObject(parent, renderScene);

  const synthetic: Synthetic = {
    object: parent
  }

  synthetic.update = () => {
    parent.children[0].rotateY(0.01);
  }

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      updateCamera(parent.children[0], renderScene);
    },
    onClick: () => {
      updateObject(parent, renderScene);
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      scene.background = new THREE.Color('#0c140c');

      camera.position.set(0, 0, 80);

      const directionalLight = new THREE.DirectionalLight('white', 4.7);
      directionalLight.position.set(-10, 5, 10);
      directionalLight.castShadow = true;

      const ambientLight = new THREE.AmbientLight('white', 1.3);

      const pointLight = new THREE.PointLight('red', 200.0, 1000, 1.1);
      pointLight.position.set(0, -100, 0);

      scene.add(
        directionalLight,
        ambientLight,
        pointLight
      );
    },
    synthetics: [
      synthetic,
    ],
    postProcessing: true,
    defaultPasses: true,
    controls: interactive,
    setupControls: (controls) => {
      controls.noPan = true;
    },
    postProcessingPassSettings: {
      bloom: {
        threshold: 0.4,
        intensity: 1.5,
        smoothing: 0.05
      },
      depthOfField: {
        bokehScale: 2,
        focusDistance: 0.01,
        focalLength: 0.005
      },
      vignette: {
        darkness: 0.2
      }
    },
    // backgroundRenderer,
    defaultSceneProperties: {
      scale: 1.0
    }
  };

  return space;
}