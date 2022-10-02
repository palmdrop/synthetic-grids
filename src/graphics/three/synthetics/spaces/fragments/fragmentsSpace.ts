import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { createBackgroundRenderer } from './background';
import { getSingleFragmentScene } from './scene';

export const spaceMetadata = {
  postProcessing: true
}

const updateCamera = (object: THREE.Object3D, renderScene: AbstractRenderScene, margin = 3.0) => {
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

const updateFragmentCore = async (parent: THREE.Object3D, renderScene: AbstractRenderScene) => {
  const { object, update } = await getSingleFragmentScene();

  parent.clear();
  parent.add(object);
  updateCamera(object, renderScene);

  return update;
}


let firstUpdate = true;
let mouseDeltaX = 0.0;
let mouseDeltaY = 0.0;
const previousMousePosition = new THREE.Vector2();

const updateScene = (synthetic: Synthetic, renderScene: AbstractRenderScene) => {
  const rotationForce = 0.008;
  const rotationResetForce = 0.005;

  const maxRotation = Math.PI / 3;

  const parent = synthetic.object;

  updateFragmentCore(parent, renderScene).then(update => {
    let timeSinceLastUpdate = 0;
    let updateFrequency = 0.1;
    synthetic.update = (sceneProperties, __, delta) => {
      parent.children[0].rotateZ(0.03 * delta);

      if(!firstUpdate) {
        if(previousMousePosition.equals(sceneProperties.mousePosition)) {
          mouseDeltaX = THREE.MathUtils.lerp(mouseDeltaX, 0.0, rotationResetForce);
          mouseDeltaY = THREE.MathUtils.lerp(mouseDeltaY, 0.0, rotationResetForce);
        } else {
          mouseDeltaX = 2.0 * (0.5 - (sceneProperties.mousePosition.x / sceneProperties.dimensions.x));
          mouseDeltaY = 2.0 * (0.5 - (sceneProperties.mousePosition.y / sceneProperties.dimensions.y));
        }

        parent.rotation.x = THREE.MathUtils.lerp(parent.rotation.x, mouseDeltaY * maxRotation, rotationForce);
        parent.rotation.y = THREE.MathUtils.lerp(parent.rotation.y, mouseDeltaX * maxRotation, rotationForce);
      }

      timeSinceLastUpdate += delta;
      if(timeSinceLastUpdate > updateFrequency) {
        timeSinceLastUpdate -= updateFrequency;
        update();
      }
      
      previousMousePosition.copy(sceneProperties.mousePosition);
      firstUpdate = false;
    }
  });
}

export const getFragmentsSpace = (
  renderScene: AbstractRenderScene,
  interactive?: boolean
): SyntheticSpace => {
  const parent = new THREE.Object3D();

  const synthetic: Synthetic = {
    object: parent,
    metadata: {}
  };

  updateScene(synthetic, renderScene);

  // Background
  const {
    backgroundRenderer,
    renderTarget: backgroundRenderTarget
  } = createBackgroundRenderer(renderScene.renderer, renderScene.scene, renderScene.camera);

  renderScene.resizeables.push(backgroundRenderer);

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      if(parent.children.length) updateCamera(parent.children[0], renderScene);
    },
    onClick: () => {
      updateScene(synthetic, renderScene);
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      renderer.autoClearDepth = true;
      scene.background = backgroundRenderTarget.texture;

      camera.position.set(0, 0, 80);

      const directionalLight = new THREE.DirectionalLight('white', 8.7);
      directionalLight.position.set(-10, 5, 10);
      directionalLight.castShadow = true;

      const ambientLight = new THREE.AmbientLight('white', 2.3);

      scene.add(
        directionalLight,
        ambientLight,
      );
    },
    synthetics: [
      synthetic,
    ],
    postProcessing: false,
    defaultPasses: false,
    controls: interactive,
    setupControls: (controls) => {
      controls.zoomSpeed = 1;
      controls.noPan = true;
      controls.noRotate = true;
    },
    postProcessingPassSettings: {
      bloom: {
        threshold: 0.8,
        intensity: 0.0,
        smoothing: 1.4
      },
      depthOfField: {
        bokehScale: 0,
        focusDistance: 0.01,
        focalLength: 0.005
      },
      vignette: {
        darkness: 0.2
      }
    },
    backgroundRenderer,
    defaultSceneProperties: {
      scale: 1.0
    }
  };

  return space;
}