import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';
import { getWeedsFromConfig, WeedsConfig } from '../../../procedural/organic/weedsGenerator';

import encodedBackgroundProgram from '../../programs/moss-structure9.json';
import { getWeedsConfig, weedsMaterial } from './defaultConfig';
import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { setUniform } from '../../../../../modules/substrates/src/utils/shader';
import { decodeProgram, EncodedProgram } from '../../../../../modules/substrates/src/stores/programStore';
import { getBackgroundRenderer } from '../../background/background';
import { createProgramManager, MaterialObject } from '../../programs/programManager';

export const spaceMetadata = {
  postProcessing: true
}

const cameraMargin = -0.0;

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

const updateWeeds = (parent: THREE.Object3D, renderScene: AbstractRenderScene, space: SyntheticSpace) => {
  parent.clear();

  const config = getWeedsConfig(weedsMaterial);

  const weedsObject = getWeedsFromConfig(config);
  weedsObject.rotateZ(THREE.MathUtils.randFloatSpread(Math.PI / 4.0));
  parent.add(weedsObject);

  space.data = {
    ...space.data ?? {},
    colors: config.colors,
    config
  };

  updateCamera(weedsObject, renderScene, cameraMargin);

  setUniform(
    'lineColor', new THREE.Color(config.colors!.lines),
    weedsMaterial
  );
  setUniform(
    'scale', new THREE.Vector3(0.0, 0.15, 0.25),
    weedsMaterial
  );
  setUniform(
    'width', 1.0,
    weedsMaterial
  );

  return config;
}

export const getNeonMossSpace = (
  renderScene: AbstractRenderScene,
  interactive?: boolean
): SyntheticSpace => {
  const weedsParent = new THREE.Object3D();

  const weedsSynthetic: Synthetic = {
    object: weedsParent,
    metadata: {}
  };

  weedsSynthetic.update = (_, __, delta) => {
    weedsParent.children[0].rotateY(0.07 * delta);
  }

  // Background
  const backgroundRenderTarget = new THREE.WebGLRenderTarget(
    renderScene.canvas.width, renderScene.canvas.height, {}
  );
  const defaultBackgroundProgram = decodeProgram(encodedBackgroundProgram as unknown as EncodedProgram);
  const backgroundRenderer = getBackgroundRenderer(renderScene.renderer, backgroundRenderTarget, defaultBackgroundProgram);

  renderScene.resizeables.push(backgroundRenderer);

  if(interactive) {
    createProgramManager({
      'background': {
        object: backgroundRenderer as MaterialObject,
        defaultProgram: defaultBackgroundProgram
      },
    }, renderScene.gui, 'background');
  }

  const scale = defaultBackgroundProgram.rootNode.fields['scale'].value as number;

  const space: SyntheticSpace = {
    regenerate: (renderScene) => {
      updateWeeds(weedsParent, renderScene, space);
    },
    onResize: (width, height, renderScene) => {
      updateCamera(weedsParent.children[0], renderScene, cameraMargin);
    },
    onClick: () => {
      updateWeeds(weedsParent, renderScene, space);
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      scene.background = backgroundRenderTarget.texture;

      // renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x000000, 0);

      camera.position.set(0, 0, 80);

      const directionalLight = new THREE.DirectionalLight('white', 2.2);
      directionalLight.position.set(-0, 1, 100);
      directionalLight.castShadow = true;
      directionalLight.shadow.bias = -0.001;

      directionalLight.shadow.mapSize.width = 1024 * 2;
      directionalLight.shadow.mapSize.height = 1024 * 2;
      directionalLight.shadow.camera.near = 0.0;
      directionalLight.shadow.camera.far = 1024;

      directionalLight.shadow.camera.left = -100;
      directionalLight.shadow.camera.right = 100;
      directionalLight.shadow.camera.top = 100;
      directionalLight.shadow.camera.bottom = -100;

      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(1000, 1000),
        new THREE.ShadowMaterial({
          opacity: 0.1,
        })
      );

      shadowPlane.receiveShadow = true;

      shadowPlane.position.set(0, 0, -400);

      scene.add(
        directionalLight,
        shadowPlane
      );
    },
    synthetics: [
      weedsSynthetic,
    ],
    postProcessing: true,
    defaultPasses: true,
    controls: interactive,
    postProcessingPassSettings: {
      bloom: {
        threshold: 0.4,
        intensity: 2.0,
        smoothing: 0.1
      }
    },
    backgroundRenderer,
    data: {
      colors: {} as { [name: string]: string },
      config: undefined as undefined | WeedsConfig
    },
    defaultSceneProperties: {
      scale
    }
  };

  updateWeeds(weedsParent, renderScene, space);
 
  return space;
}