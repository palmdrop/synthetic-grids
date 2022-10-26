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
import { Grid, makeGrid, Pipe } from './pipes';

export const spaceMetadata = {
  postProcessing: true
}

const palettes = Object.values(import.meta.globEager('../../../../../assets/palettes/*.json')).map((module: any) => module.default);

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

const getObject = (parent: THREE.Object3D, renderScene: AbstractRenderScene) => {
  parent.clear();

  const radius = 0.5;
  const spacing = 2.0;

  const grid = makeGrid<boolean>(
    30, 30, 30,
  );

  const curve = new THREE.LineCurve3(new THREE.Vector3(0.0, 0.0, 0.0), new THREE.Vector3(1.0, 0.0, 0.0));
  const geometry = new THREE.TubeBufferGeometry(
    curve, 10, radius, 10, true
  );

  const material = new THREE.MeshStandardMaterial({
    color: 'white'
  });

  const pipe = new Pipe(
    grid,
    new THREE.Vector3(),
    (previous, next) => {
      const mesh = new THREE.Mesh(
        geometry, material
      );

      mesh.position
        .copy(next)
        .multiplyScalar(spacing)

      mesh.scale.set(spacing, 1.0, 1.0);

      const direction = new THREE.Vector3().subVectors(next, previous);
      
      mesh.lookAt(direction);

      return mesh;
    }
  );

  parent.add(pipe.object);

  updateCamera(parent, renderScene);

  return pipe;
}

const updateScene = (synthetic: Synthetic, renderScene: AbstractRenderScene) => {
  const parent = synthetic.object;

  const pipe = getObject(parent, renderScene); 

  synthetic.update = (sceneProperties, renderScene, delta) => {

    pipe.walk(1);
  }
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

  updateScene(synthetic, renderScene);

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      if(parent.children.length) updateCamera(parent.children[0], renderScene);
    },
    onClick: () => {
      updateScene(synthetic, renderScene);
      updateBackgroundEffect();
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      renderer.autoClearDepth = true;
      // scene.background = backgroundRenderTarget.texture;
      scene.background = new THREE.Color('black');

      camera.position.set(0, 0, 80);

      const directionalLight = new THREE.DirectionalLight('white', 2);
      const ambientLight = new THREE.AmbientLight('white', 0.5);
      directionalLight.position.set(1, 1, 1);
      scene.add(
        directionalLight,
        ambientLight
      )
    },
    synthetics: [
      synthetic,
    ],
    postProcessing: false,
    defaultPasses: false,
    controls: interactive,
    setupControls: (controls) => {
      controls.zoomSpeed = 1;
      // controls.noPan = true;
      // controls.noRotate = true;
    },
    postProcessingPassSettings: {
      bloom: {
        threshold: 0.4,
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
    },
  };

  return space;
}