import * as THREE from 'three';
import type * as dat from 'dat.gui';

import type { SyntheticSpace } from '../scene';
import { getWeeds, StrawConfig } from '../../procedural/organic/weeds';
import * as EASING from '../../../utils/easing';
import { decodeProgram, EncodedProgram } from '../../../../modules/substrates/src/stores/programStore';
import { getBackgroundRenderer } from '../background/background';

import encodedBackgroundProgram from '../programs/grid2.json';
import { createProgramManager, MaterialObject } from '../programs/programManager';

export const getWeedsSpace = (
  renderer: THREE.WebGLRenderer,
  backgroundRenderTarget: THREE.WebGLRenderTarget,
  gui: dat.GUI
): SyntheticSpace => {
  const config: StrawConfig = {
    width: 0.5, 
    height: 50,
    widthSegments: 3, 
    heightSegments: 100,

    bend: -0.3,
    
    thicknessController: (n) => (
      EASING.easeOutElastic(n) *
      EASING.easeOutElastic(1.0 - n * n)
    )
      // .easeOutBounce(n)
    ,

    noiseOffsetMultiplier: 1.1,

    directionNoiseSettings: {
      frequency: 0.050,
      min: -1.0,
      max: 1.0
    },
    twistNoiseSettings: {
      frequency: 0.9,
      min: -0.9,
      max: 0.9
    },

    forces: {
      gravity: 0.1,
      twist: 1.0,
      turn: new THREE.Vector3(1, 1, 1)
        .multiplyScalar(0.5),
      direction: 0.2,
      random: 0.1
    }
  }


  const weeds = getWeeds(
    config,
    500,
    () => new THREE.Vector3().randomDirection().multiply(
      new THREE.Vector3(20, 10, 20)
    )
  );

  weeds.object.rotateY(Math.PI / 2.0);
  weeds.object.position.set(0, -15, 0);

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
      scene.background = backgroundRenderTarget.texture;
     
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      camera.position.set(0, 0, 80);

      // scene.background = backgroundRenderTarget.texture;
      // scene.background = new THREE.Color('black');

      const ambientLight = new THREE.AmbientLight('white', 2.0)

      const directionalLight = new THREE.DirectionalLight('white', 5);
      directionalLight.position.set(0, 0, 50);
      directionalLight.castShadow = true;
      directionalLight.shadow.bias = -0.001;

      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      directionalLight.shadow.camera.near = 0.0;
      directionalLight.shadow.camera.far = 1024;

      directionalLight.shadow.camera.left = -50;
      directionalLight.shadow.camera.right = 50;
      directionalLight.shadow.camera.top = 50;
      directionalLight.shadow.camera.bottom = -50;

      const pointLight = new THREE.PointLight('red', 15);
      pointLight.position.set(-3, -5, -5);

      const plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(100, 140),
        new THREE.MeshStandardMaterial({ color: '#111100' })
      );

      plane.receiveShadow = true;

      plane.position.set(0, 0, -80);

      scene.add(
        ambientLight,
        directionalLight,
        pointLight,
        // plane
      );
    },
    backgroundRenderer, 
    synthetics: [
      weeds
      /*
      terrain,
      backgroundWall
      */
    ]
  }
}