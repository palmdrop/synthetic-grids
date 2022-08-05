import * as THREE from 'three';
import type * as dat from 'dat.gui';

import type { Synthetic, SyntheticSpace } from '../../scene';
import { getWeedsFromConfig } from '../../../procedural/organic/weedsGenerator';
import { decodeProgram, EncodedProgram } from '../../../../../modules/substrates/src/stores/programStore';
import { getBackgroundRenderer } from '../../background/background';

import encodedBackgroundProgram from '../../programs/grid4.json';
import { createProgramManager, MaterialObject } from '../../programs/programManager';
import { addDirectionalLight, addPointLight } from '../../../systems/GuiUtils';
import { completeWeedsConfig } from './defaultConfig';
import { textureNormalMapShader } from '../../../../glsl/shaders/normalWarp/textureNormalMapShader';

export const spaceMetadata = {
  postProcessing: true
}

const getMapRenderer = (weedsObject: THREE.Object3D): Synthetic => {
  const renderTarget = new THREE.WebGLRenderTarget(1920, 1920, {
  });

  const mapMaterial = new THREE.ShaderMaterial(
    textureNormalMapShader
  );

  mapMaterial.uniforms['tDiffuse'].value = renderTarget.texture;

  const map = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(100, 100),
    mapMaterial
  );

  map.position.set(0, 0, -50)

  const camera = new THREE.OrthographicCamera(
    -20, 20,
    20, -20,
    -100, 1000
  );

  camera.position.set(0, 0, 80);
  camera.lookAt(0, 0, 0);
  
  return {
    object: map,
    update: (_, renderScene) => {
      weedsObject.visible = true;
      renderScene.renderer.setRenderTarget(renderTarget);
      renderScene.renderer.render(renderScene.scene, camera);
      weedsObject.visible = false;
      renderScene.renderer.setRenderTarget(null);
    }
  }
}

export const getMappingSpace = (
  renderer: THREE.WebGLRenderer,
  backgroundRenderTarget: THREE.WebGLRenderTarget,
  gui: dat.GUI
): SyntheticSpace => {
  const weedsParent = new THREE.Object3D();

  const weedsObject = getWeedsFromConfig(
    completeWeedsConfig
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
  const mapSynthetic = getMapRenderer(weedsObject);

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
      scene.background = new THREE.Color(completeWeedsConfig!.colors.background);

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

      const pointLightColor = completeWeedsConfig!.colors.light;
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
      mapSynthetic,
    ],
    postProcessing: false
  }
}