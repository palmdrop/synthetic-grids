import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { createBackgroundRenderer } from './background';
import { getSingleFragmentScene } from './scene';

export const spaceMetadata = {
  postProcessing: true
}

const updateCamera = (weedsObject: THREE.Object3D, renderScene: AbstractRenderScene, margin = 0.5) => {
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

const updateScene = (parent: THREE.Object3D, renderScene: AbstractRenderScene) => {
  parent.clear();

  const object = getSingleFragmentScene();

  parent.add(object);
  // updateCamera(object, renderScene);

  /*
  const lineBox = createLineBox(new THREE.Box3().setFromObject(scene), new LineMaterial({
    color: new THREE.Color('#13de00').getHex(),
    linewidth: 0.0020
  }));

  lineBox.position.copy(scene.position);
  scene.add(lineBox);
  */
}

export const getFragmentsSpace = (
  renderScene: AbstractRenderScene,
  interactive?: boolean
): SyntheticSpace => {
  const rotationForce = 0.005;
  const rotationFriction = 0.05;

  const maxRotation = Math.PI / 3;
  const parent = new THREE.Object3D();

  updateScene(parent, renderScene);

  const synthetic: Synthetic = {
    object: parent,
    metadata: {}
  };

  synthetic.update = (sceneProperties, __, delta) => {
    parent.children[0].rotateZ(0.03 * delta);

    const mouseDeltaX = 2.0 * ((sceneProperties.mousePosition.x / sceneProperties.dimensions.x) - 0.5);
    const mouseDeltaY = 2.0 * ((sceneProperties.mousePosition.y / sceneProperties.dimensions.y) - 0.5);

    parent.rotation.x = THREE.MathUtils.lerp(parent.rotation.x, mouseDeltaY * maxRotation, rotationForce);
    parent.rotation.y = THREE.MathUtils.lerp(parent.rotation.y, mouseDeltaX * maxRotation, rotationForce);
  }

  // Background
  const {
    backgroundRenderer,
    renderTarget: backgroundRenderTarget
  } = createBackgroundRenderer(renderScene.renderer, renderScene.scene, renderScene.camera);

  renderScene.resizeables.push(backgroundRenderer);

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      updateCamera(parent.children[0], renderScene);
    },
    onClick: () => {
      updateScene(parent, renderScene);
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