import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { createFormation } from './formation';
import { getRockConfig, getSharpConfig, getStairsConfig } from './configs';
import { createLineBox } from '../../../../utils/lines';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { createBackgroundRenderer } from './background';

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


export const getFormationsSpace = (
  renderScene: AbstractRenderScene,
  interactive?: boolean
): SyntheticSpace => {
  const parent = new THREE.Object3D();

  const boulder = createFormation(
    // getSharpConfig()
    // getRockConfig()
    getStairsConfig()
  );

  boulder.receiveShadow = true;
  boulder.castShadow = true;

  parent.add(boulder);
  updateCamera(boulder, renderScene);

  const lineBox = createLineBox(new THREE.Box3().setFromObject(boulder), new LineMaterial({
    color: new THREE.Color('#779988').getHex(),
    linewidth: 0.002
  }));

  lineBox.position.copy(boulder.position);
  // boulder.add(lineBox);

  const synthetic: Synthetic = {
    object: parent,
    metadata: {}
  };

  synthetic.update = (properties) => {
    parent.children[0].rotateY(0.002);
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

    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      scene.background = backgroundRenderTarget.texture;
      // scene.background = new THREE.Color('gray');

      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      camera.position.set(0, 0, 80);

      const directionalLight = new THREE.DirectionalLight('white', 3.8);
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
    postProcessingPassSettings: {
      bloom: {
        threshold: 0.55,
        intensity: 2.0,
        smoothing: 0.1
      },
      depthOfField: {
        bokehScale: 5,
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