import * as THREE from 'three';
import type * as dat from 'dat.gui';

import type { Synthetic, SyntheticSpace } from '../../scene';
import { CellData, getWeeds, getWeedsGrid, StrawConfigGenerator, WeedsGridConfig } from '../../../procedural/organic/weedsGenerator';
import { decodeProgram, EncodedProgram } from '../../../../../modules/substrates/src/stores/programStore';
import { getBackgroundRenderer } from '../../background/background';

import encodedBackgroundProgram from '../../programs/grid4.json';
import { createProgramManager, MaterialObject } from '../../programs/programManager';
import { addDirectionalLight, addPointLight } from '../../../systems/GuiUtils';
import { colors, completeWeedsConfig } from './defaultConfig';

const updateWeeds = (
  weedsSynthetic: Synthetic, 
  gui: dat.GUI
): Synthetic => {
  weedsSynthetic.metadata = {};
  weedsSynthetic.object.children = [];

  const weedsObject = getWeeds(
    completeWeedsConfig.configGenerator,
    completeWeedsConfig.count,
    completeWeedsConfig.spawner
  );

  weedsSynthetic.object.add(weedsObject);
  // weedsSynthetic.metadata['cellsData'] = cellsData;

  return weedsSynthetic;
}

export const spaceMetadata = {
  postProcessing: false
}

export const getMappingSpace = (
  renderer: THREE.WebGLRenderer,
  backgroundRenderTarget: THREE.WebGLRenderTarget,
  gui: dat.GUI
): SyntheticSpace => {
  const weedsParent = new THREE.Object3D();
  const weedsSynthetic: Synthetic = {
    object: weedsParent,
    metadata: {}
  };

  updateWeeds(weedsSynthetic, gui);

  weedsSynthetic.update = (properties) => {
    weedsParent.rotateY(0.01);
  }

  // Background
  const defaultBackgroundProgram = decodeProgram(encodedBackgroundProgram as unknown as EncodedProgram);
  const backgroundRenderer = getBackgroundRenderer(renderer, backgroundRenderTarget, defaultBackgroundProgram);

  createProgramManager({
    'background': {
      object: backgroundRenderer as MaterialObject,
      defaultProgram: defaultBackgroundProgram
    },
  }, gui, 'background');

  return {
    onClick: (mousePosition, renderScene) => {
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      // scene.background = backgroundRenderTarget.texture;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      camera.position.set(0, 0, 80);

      // scene.background = backgroundRenderTarget.texture;
      scene.background = new THREE.Color(colors.background);

      const ambientLight = new THREE.AmbientLight('white', 1.0)

      const directionalLight = new THREE.DirectionalLight('white', 2.2);
      directionalLight.position.set(-6, 8, 16);
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

      addDirectionalLight(gui.addFolder('directional light'), directionalLight);

      const pointLightColor = colors.light;
      const pointLight = new THREE.PointLight(pointLightColor, 100);
      pointLight.position.set(0, 0, 0);

      addPointLight(gui.addFolder('point light'), pointLight);

      scene.add(
        ambientLight,
        directionalLight,
        pointLight,
      );
    },
    // backgroundRenderer, 
    synthetics: [
      weedsSynthetic,
      // backgroundWall
      /*
      terrain,
      */
    ],
    postProcessing: false
  }
}