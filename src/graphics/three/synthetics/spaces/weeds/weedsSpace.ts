import * as THREE from 'three';
import * as EASING from '../../../../utils/easing';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type * as dat from 'dat.gui';

import type { Synthetic, SyntheticSpace } from '../../scene';
import { ConfigGenerator, defaultNormalMap, getWeeds, getWeedsGrid, StrawConfig } from '../../../procedural/organic/weedsGenerator';
import { decodeProgram, EncodedProgram } from '../../../../../modules/substrates/src/stores/programStore';
import { getBackgroundRenderer } from '../../background/background';

import encodedBackgroundProgram from '../../programs/grid4.json';
import { createProgramManager, MaterialObject } from '../../programs/programManager';
import { addDirectionalLight, addPointLight } from '../../../systems/GuiUtils';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { configMaker, makeConfigGUI } from './defaultConfig';

const makeWeeds = (gui: dat.GUI): Synthetic => {
  const weedsParent = new THREE.Object3D();
  const config = configMaker();
  makeConfigGUI(gui, config);

  const make = () => {
    weedsParent.children = [];

    const weeds = getWeedsGrid(
      config.strawConfig,
      config.strawCount,
      config.strawSpawner,
      config.gridConfig,
      gui
    );

    weedsParent.add(weeds);
  }

  make();

  gui.add({ generate: () => make() }, 'generate');
  window.addEventListener('keydown', event => {
    if(event.key === 'g') make();
  });

  const weedsSynthetic: Synthetic = {
    object: weedsParent
  }

  weedsSynthetic.update = (properties) => {
    // weedsSynthetic.object.rotateY(0.002);
    weedsSynthetic.object.children[0].children.forEach(child => {
      if(!(child instanceof Line2)) {
        child.rotateY(0.005)
      }
    });
  }

  return weedsSynthetic;
}

export const getWeedsSpace = (
  renderer: THREE.WebGLRenderer,
  backgroundRenderTarget: THREE.WebGLRenderTarget,
  gui: dat.GUI
): SyntheticSpace => {

  const weedsSynthetic = makeWeeds(gui);
  
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
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      // scene.background = backgroundRenderTarget.texture;
     
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      camera.position.set(0, 0, 80);

      // scene.background = backgroundRenderTarget.texture;
      scene.background = new THREE.Color('black');

      const ambientLight = new THREE.AmbientLight('white', 1.5)

      const directionalLight = new THREE.DirectionalLight('white', 3.8);
      directionalLight.position.set(0, 1, 20);
      directionalLight.castShadow = true;
      directionalLight.shadow.bias = -0.001;

      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      directionalLight.shadow.camera.near = 0.0;
      directionalLight.shadow.camera.far = 1024;

      directionalLight.shadow.camera.left = -75;
      directionalLight.shadow.camera.right = 75;
      directionalLight.shadow.camera.top = 75;
      directionalLight.shadow.camera.bottom = -75;

      addDirectionalLight(gui.addFolder('directional light'), directionalLight);

      const pointLightColor = configMaker().gridConfig.color;
      const pointLight = new THREE.PointLight(pointLightColor, 20);
      pointLight.position.set(0, 0, 0);

      addPointLight(gui.addFolder('point light'), pointLight);

      scene.add(
        ambientLight,
        directionalLight,
        // shadowHelper
        pointLight,
        // plane
        /*
        new THREE.Mesh(
          new THREE.SphereBufferGeometry(2, 40, 40),
          new THREE.MeshBasicMaterial({ color: pointLightColor })
        )
        */
      );
    },
    // backgroundRenderer, 
    synthetics: [
      weedsSynthetic,
      // backgroundWall
      /*
      terrain,
      */
    ]
  }
}