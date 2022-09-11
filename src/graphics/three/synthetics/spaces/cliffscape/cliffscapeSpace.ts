import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { createFormation } from '../formations/formation';
import { createLineBox } from '../../../../utils/lines';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { createBackgroundRenderer } from '../formations/background';
import { getTree } from './tree';
import { updateFormations } from './formations';
import { volumeToBox3 } from '../../../tools/math';

export const spaceMetadata = {
  postProcessing: true
}

const updateCamera = (box: THREE.Box3, renderScene: AbstractRenderScene, margin = 0.2) => {
  if(!(renderScene.camera as THREE.OrthographicCamera).isOrthographicCamera) return;

  const camera = renderScene.camera;

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

export const getCliffscapeSpace
 = (
  renderScene: AbstractRenderScene,
  interactive?: boolean
): SyntheticSpace => {
  const parent = new THREE.Object3D();
  // parent.rotateX(0.08);

  // updateFormation(parent, renderScene);
  const { object, octree } = getTree();
  updateFormations(parent, renderScene, octree);

  parent.add(object);

  const synthetic: Synthetic = {
    object: parent,
    metadata: {}
  };

  synthetic.update = (properties) => {
    // parent.children[0].rotateY(0.002);
    parent.rotateY(0.005);
  }

  // Background
  const {
    backgroundRenderer,
    renderTarget: backgroundRenderTarget
  } = createBackgroundRenderer(renderScene.renderer, renderScene.scene, renderScene.camera);

  renderScene.resizeables.push(backgroundRenderer);

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      updateCamera(volumeToBox3(octree.getVolume()), renderScene);
    },
    onClick: () => {
      updateFormations(parent, renderScene, octree);
      updateCamera(volumeToBox3(octree.getVolume()), renderScene);
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      // scene.background = backgroundRenderTarget.texture;
      scene.background = new THREE.Color('#696666');

      camera.position.set(0, 0, 80);

      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const directionalLight = new THREE.DirectionalLight('white', 4.7);
      directionalLight.position.set(-10, 5, 10);
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

      const ambientLight = new THREE.AmbientLight('white', 1.3);

      const pointLight = new THREE.PointLight('#80ff00', 30.0, 1000, 1.1);
      // pointLight.position.set(0, -100, 0);
      pointLight.position.set(0, 0, 0);

      scene.add(
        directionalLight,
        ambientLight,
        // pointLight
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
        threshold: 0.8,
        intensity: 2.0,
        smoothing: 0.1
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
    // backgroundRenderer,
    defaultSceneProperties: {
      scale: 1.0
    }
  };

  return space;
}