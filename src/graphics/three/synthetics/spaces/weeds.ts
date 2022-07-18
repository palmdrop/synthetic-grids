import * as THREE from 'three';
import type * as dat from 'dat.gui';
import { createWarpedTerrain } from '../terrain/warpedTerrain';
import { mapNormalShader } from '../../../glsl/shaders/normalWarp/mapNormalShader';
import { decodeProgram, EncodedProgram } from '../../../../modules/substrates/src/stores/programStore';
import encodedGridProgram from '../programs/grid2.json';
import encodedGateProgram from '../programs/gate1.json';
import { createProgramManager, MaterialObject } from '../programs/programManager';
import { getBackgroundWall } from '../background/wall';
import { getBackgroundRenderer } from '../background/background';
import type { SceneProperties, Synthetic, SyntheticSpace } from '../scene';
import { getStraw } from '../../procedural/organic/weeds';

export const getWeeds = (
  renderer: THREE.WebGLRenderer,
  backgroundRenderTarget: THREE.WebGLRenderTarget,
  gui: dat.GUI
): SyntheticSpace => {
  const straw = getStraw();

  return {
    sceneConfigurator: (scene: THREE.Scene) => {
      // scene.background = backgroundRenderTarget.texture;
      scene.background = new THREE.Color('black');

      scene.add(
        new THREE.AmbientLight('white', 2.0)
      );

      const directionalLight = new THREE.DirectionalLight('white', 5);
      directionalLight.position.set(3, 5, 5);

      scene.add(directionalLight);
    },
    // backgroundRenderer, 
    synthetics: [
      straw
      /*
      terrain,
      backgroundWall
      */
    ]
  }
}