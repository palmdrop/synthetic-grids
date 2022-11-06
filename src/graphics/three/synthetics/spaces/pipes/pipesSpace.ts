import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { createBackgroundRenderer } from './background';
import { configMakers } from './configs';
import { createFormation } from '../formations/formation';
import { getRockConfig } from './configs';
import { transparentMapShader } from '../../../../glsl/shaders/transparentMapShader';
import { createLineBox } from '../../../../utils/lines';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { randomGaussian } from '../../../tools/math';
import { Grid, makeGrid, makePipesSystem, Pipe } from './pipes';
import { getNoise3D } from '../../../procedural/noise/noise';

export const spaceMetadata = {
  postProcessing: true
}

const updateCamera = (box: THREE.Box3, renderScene: AbstractRenderScene, margin = 0.8) => {
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

const getObject = (parent: THREE.Object3D, renderScene: AbstractRenderScene) => {
  parent.clear();

  const radius = 0.28;
  const spacing = 3.0;
  const padding = 0.5;

  const offset = {
    x: THREE.MathUtils.randFloatSpread(100),
    y: THREE.MathUtils.randFloatSpread(100),
    z: THREE.MathUtils.randFloatSpread(100)
  }

  const grid = makeGrid<number>(
    10, 10, 10,
    (x, y, z) => {
      return getNoise3D({
        x, y, z
      }, {
        frequency: 0.03,
        min: 0,
        max: 1,
        offset
      });
    }
  );

  const system = makePipesSystem({
    spacing, padding, radius, grid
  });

  parent.add(system.object);

  updateCamera(system.boundingBox, renderScene);

  return system;
}

const updateScene = (synthetic: Synthetic, renderScene: AbstractRenderScene) => {
  const parent = synthetic.object;

  parent.scale.set(
    1, 1, 1
  ).multiplyScalar(
    THREE.MathUtils.randFloat(0.5, 1.5)
  );

  const system = getObject(parent, renderScene); 

  synthetic.update = (sceneProperties, renderScene, delta) => {
    system.walk(10);

    parent.rotateX(delta * 0.05);
    parent.rotateY(-delta * 0.05);
  }

  return system;
}

export const getPipesSpace = (
  renderScene: AbstractRenderScene,
  interactive?: boolean
): SyntheticSpace => {
  // Background
  const updateBackgroundEffect = () => {
    const backgroundConfig = configMakers[Math.floor(Math.random() * configMakers.length)]();
    updateBackground(backgroundConfig);
  }

  const {
    backgroundRenderer,
    renderTarget: backgroundRenderTarget,
    update: updateBackground
  } = createBackgroundRenderer(renderScene.renderer, renderScene.scene, renderScene.camera);

  updateBackgroundEffect();
  renderScene.resizeables.push(backgroundRenderer);

  // Scene
  const parent = new THREE.Object3D();
  const synthetic: Synthetic = {
    object: parent,
    metadata: {}
  };

  let boundingBox: THREE.Box3;

  let sceneData = updateScene(synthetic, renderScene);
  boundingBox = sceneData.boundingBox;

  const generateNew = () => {
    sceneData = updateScene(synthetic, renderScene);
    boundingBox = sceneData.boundingBox;
    updateBackgroundEffect();
  }

  setInterval(() => {
    generateNew();
  }, 2000)

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      updateCamera(boundingBox, renderScene);
    },
    onClick: () => {
      generateNew();
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      renderer.autoClearDepth = true;
      scene.background = backgroundRenderTarget.texture;
      // scene.background = new THREE.Color('black');

      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      camera.position.set(0, 0, 80);

      const directionalLight = new THREE.DirectionalLight('white', 3);
      const ambientLight = new THREE.AmbientLight('white', 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(
        directionalLight,
        ambientLight
      )
    },
    synthetics: [
      synthetic,
    ],
    postProcessing: true,
    defaultPasses: true,
    controls: interactive,
    setupControls: (controls) => {
      controls.zoomSpeed = 1;
      controls.noPan = true;
      // controls.noRotate = true;
    },
    postProcessingPassSettings: {
      bloom: {
        threshold: 0.5,
        intensity: 0.0,
        smoothing: 1.4
      },
      depthOfField: {
        bokehScale: 0,
        focusDistance: 0.01,
        focalLength: 0.005
      },
      vignette: {
        darkness: 0.3
      }
    },
    backgroundRenderer,
    defaultSceneProperties: {
      scale: 1.0
    },
  };

  return space;
}