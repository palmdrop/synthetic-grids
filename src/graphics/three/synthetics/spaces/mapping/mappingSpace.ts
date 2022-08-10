import * as THREE from 'three';
import * as POSTPROCESSING from 'postprocessing';
import type * as dat from 'dat.gui';

import type { Synthetic, SyntheticSpace } from '../../scene';
import { getWeedsFromConfig } from '../../../procedural/organic/weedsGenerator';
import { decodeProgram, EncodedProgram } from '../../../../../modules/substrates/src/stores/programStore';
import { getBackgroundRenderer } from '../../background/background';

import encodedBackgroundProgram from '../../programs/grid4.json';
import { createProgramManager, MaterialObject } from '../../programs/programManager';
import { addDirectionalLight, addPointLight, addThreeColor, addUniforms } from '../../../systems/GuiUtils';
import { getWeedsConfig, weedsMaterial } from './defaultConfig';

export const spaceMetadata = {
  postProcessing: true
}

const weedsConfig = getWeedsConfig(weedsMaterial);

export const getMappingSpace = (
  renderer: THREE.WebGLRenderer,
  backgroundRenderTarget: THREE.WebGLRenderTarget,
  gui: dat.GUI
): SyntheticSpace => {
  const weedsParent = new THREE.Object3D();

  const weedsObject = getWeedsFromConfig(
    weedsConfig
  );

  weedsParent.add(weedsObject);

  const weedsSynthetic: Synthetic = {
    object: weedsParent,
    metadata: {}
  };

  weedsSynthetic.update = (properties) => {
    weedsParent.rotateY(0.003);
  }

  // Map
  // const mapMaterial = new THREE.ShaderMaterial(textureNormalMapShader);
  const mapMaterial = weedsMaterial;
  mapMaterial.uniforms['baseColor'].value = new THREE.Color(weedsConfig.colors!.plant);
  mapMaterial.uniforms['lineColor'].value = new THREE.Color(weedsConfig.colors!.lines);
  mapMaterial.uniforms['scale'].value.set(0, 0, 3.5);

  const mapPass = new POSTPROCESSING.ShaderPass(mapMaterial, 'tDiffuse');

  const materialFolder = gui.addFolder('map material');
  addUniforms(materialFolder, mapMaterial, {
    width: {
      min: 0.01,
      max: 10.0,
      step: 0.001,
    },
    scale: {
      min: 0.00,
      max: 10.0,
      step: 0.0001
    }
  });

  addThreeColor(
    materialFolder, mapMaterial, 'baseColor',
    true
  );
  addThreeColor(
    materialFolder, mapMaterial, 'lineColor',
    true
  );

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
      scene.background = new THREE.Color(weedsConfig!.colors.background);

      addThreeColor(gui, scene, 'background');

      const ambientLight = new THREE.AmbientLight('white', 1.0)

      const directionalLight = new THREE.DirectionalLight('white', 2.2);
      directionalLight.position.set(-6, 8, 16);
      directionalLight.castShadow = true;
      directionalLight.shadow.bias = -0.001;

      directionalLight.shadow.mapSize.width = 1024 * 2;
      directionalLight.shadow.mapSize.height = 1024 * 2;
      directionalLight.shadow.camera.near = 0.0;
      directionalLight.shadow.camera.far = 1024;

      directionalLight.shadow.camera.left = -25;
      directionalLight.shadow.camera.right = 25;
      directionalLight.shadow.camera.top = 25;
      directionalLight.shadow.camera.bottom = -25;

      addDirectionalLight(gui.addFolder('directional light'), directionalLight);

      const pointLightColor = weedsConfig!.colors.light;
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
      // mapSynthetic,
    ],
    postProcessing: true,
    defaultPasses: false,
    additionalPasses: [
      // mapPass
    ]
  }
}