import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type * as dat from 'dat.gui';

import type { SyntheticSpace } from '../scene';
import { ConfigGenerator, defaultNormalMap, getWeeds, getWeedsGrid, StrawConfig } from '../../procedural/organic/weedsGenerator';
import * as EASING from '../../../utils/easing';
import { decodeProgram, EncodedProgram } from '../../../../modules/substrates/src/stores/programStore';
import { getBackgroundRenderer } from '../background/background';

import encodedBackgroundProgram from '../programs/grid4.json';
import { createProgramManager, MaterialObject } from '../programs/programManager';
import { addDirectionalLight } from '../../systems/GuiUtils';
import { Matrix4 } from 'three';

export const getWeedsSpace = (
  renderer: THREE.WebGLRenderer,
  backgroundRenderTarget: THREE.WebGLRenderTarget,
  gui: dat.GUI
): SyntheticSpace => {
  const config: ConfigGenerator = (position, index, cell) => ({
    width: Math.random() + 0.9,
    height: 50,
    widthSegments: 3, 
    heightSegments: 50,

    bend: 0.3,
    bendController: (n) => (
      1.0 - EASING.easeOutCubic(1.0 - n)
    ),
    
    thicknessController: (n) => (
      EASING.easeOutCirc(n) *
      EASING.easeOutBack(1.0 - n * n)
    )
    ,

    noiseOffsetMultiplier: 1.0,
    startDirection: () => new THREE.Vector3().randomDirection(),

    widthNoiseSettings: {
      frequency: Math.random() * 0.5 + 0.2,
      min: 1.0,
      max: 1.0
    },

    directionNoiseSettings: {
      frequency: 0.05,
      min: -1.0,
      max: 1.0
    },
    twistNoiseSettings: {
      frequency: 0.1,
      min: -0.9,
      max: 0.9
    },

    forces: {
      gravity: 0.1,
      twist: 0.0,
      turn: new THREE.Vector3(1, 1, 1)
        .multiplyScalar(0.4),
      direction: 0.2,
      random: 0.0
    },

    materialGenerator: (index, position) => {
      return new THREE.MeshStandardMaterial({
        // color: new THREE.Color().lerpColors(c1, c2, Math.random()),
        color: '#8f7e51',
        metalness: 0.1,
        roughness: 0.8,
        side: THREE.DoubleSide,
        normalMap: defaultNormalMap,
        normalScale: new THREE.Vector2(1, 1).multiplyScalar(0.2)
      });
    }
  });


  const dataColor = '#00fff2';

  const weeds = getWeedsGrid(
    config,
    300,
    () => new THREE.Vector3().randomDirection().multiply(
      new THREE.Vector3(1.0, 0.0, 1.0).multiplyScalar(1)
    ),
    dataColor,
    {
      cells: {
        x: 2,
        y: 2,
        z: 2
      },
      padding: -0.0
    }
  );

  weeds.update = (properties) => {
    weeds.object.rotateY(0.002);
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
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      // scene.background = backgroundRenderTarget.texture;
     
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      camera.position.set(0, 0, 80);

      // scene.background = backgroundRenderTarget.texture;
      scene.background = new THREE.Color('black');

      const ambientLight = new THREE.AmbientLight('white', 1.5)

      const directionalLight = new THREE.DirectionalLight('white', 3.8);
      directionalLight.position.set(0, 8, 50);
      directionalLight.castShadow = true;
      directionalLight.shadow.bias = -0.001;

      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      directionalLight.shadow.camera.near = 0.0;
      directionalLight.shadow.camera.far = 1024;

      directionalLight.shadow.camera.left = -50 * 5;
      directionalLight.shadow.camera.right = 50;
      directionalLight.shadow.camera.top = 50;
      directionalLight.shadow.camera.bottom = -50;

      addDirectionalLight(gui.addFolder('directional light'), directionalLight);

      const pointLightColor = dataColor;
      const pointLight = new THREE.PointLight(pointLightColor, 20);
      pointLight.position.set(0, 0, 0);

      scene.add(
        ambientLight,
        directionalLight,
        // pointLight,
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
      weeds,
      // backgroundWall
      /*
      terrain,
      */
    ]
  }
}