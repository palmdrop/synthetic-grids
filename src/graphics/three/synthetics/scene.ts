import type { Program } from '../../../modules/substrates/src/interface/types/program/program';
import * as THREE from 'three';
import type * as dat from 'dat.gui';
import { createWarpedMap } from './terrain/warpedMap';
import { mapNormalShader } from '../../../graphics/glsl/shaders/normalWarp/mapNormalShader';
import { FullscreenQuadRenderer } from '../tools/FullscreenQuadRenderer';
import { buildProgramShader } from '../../../modules/substrates/src/shader/builder/programBuilder';
import { decodeProgram, EncodedProgram } from '../../../modules/substrates/src/stores/programStore';
import encodedGridProgram from './programs/grid1.json';
import { setUniform } from '../../../modules/substrates/src/utils/shader';
import { createProgramManager, MaterialObject } from './programs/programManager';

export type SceneProperties = {
  time: number
}

export type Synthetic<ObjectType = THREE.Object3D> = {
  object: ObjectType,
  updateShader?: (program?: Program) => void,
  update?: (sceneProperties: SceneProperties) => void,
  resize?: (width: number, height: number) => void
}

export type BackgroundRenderer = { update: Synthetic['update'] } & Pick<
  FullscreenQuadRenderer, 
  'render' | 'renderTarget' | 'setSize'
>;

export type SyntheticSpace = {
  sceneConfigurator: (scene: THREE.Scene) => void, 
  backgroundRenderer?: BackgroundRenderer,
  synthetics: Synthetic[]
}

// Configurations //

const getGridBackgroundRenderer = (
  renderer: THREE.WebGLRenderer, 
  renderTarget: THREE.WebGLRenderTarget
) => {
  const shader = buildProgramShader(decodeProgram(
    encodedGridProgram as unknown as EncodedProgram
  ));

  const material = new THREE.ShaderMaterial(shader);

  const fullscreenRenderer = new FullscreenQuadRenderer(
    renderer,
    material,
    renderTarget
  ) as unknown as BackgroundRenderer;

  fullscreenRenderer.update = (properties) => {
    setUniform(
      'time',
      properties.time,
      material 
    );
  }

  return fullscreenRenderer;
}

export const getWarpSpace = (
  renderer: THREE.WebGLRenderer,
  backgroundRenderTarget: THREE.WebGLRenderTarget,
  gui: dat.GUI
): SyntheticSpace => {
  const warpedMap = createWarpedMap(
    new THREE.SphereBufferGeometry(
      10, 1000, 1000
    ),
    /*
    new THREE.PlaneBufferGeometry(
      20, 20, 
      1000, 1000 
    ),
    */
    /*
    new THREE.CylinderBufferGeometry(
      20,
      20,
      50,
      1000,
      2000,
      true,
      Math.PI / 2.0,
      Math.PI / 2.0,
    ),
    */
   /*
    new THREE.RingGeometry(
      0, 35,
      1000,
      1000
    ),
    */

    // mapShader,
    mapNormalShader,
    gui
  );

  warpedMap.object.geometry.computeVertexNormals();
  warpedMap.object.rotateZ(-Math.PI / 2.0);
  
  const backgroundRenderer = getGridBackgroundRenderer(renderer, backgroundRenderTarget);

  createProgramManager({
    'terrain': {
      object: warpedMap.object as MaterialObject,
      onChange: (program) => {
        warpedMap.updateShader(program);
        return warpedMap.object.material as THREE.ShaderMaterial;
      }
    },
    'background': {
      object: backgroundRenderer as unknown as MaterialObject,
      defaultProgram: decodeProgram(encodedGridProgram as unknown as EncodedProgram)
    }
  }, gui, 'terrain');

  return {
    sceneConfigurator: (scene: THREE.Scene) => {
      scene.background = backgroundRenderTarget.texture;
    },
    backgroundRenderer, 
    synthetics: [
      warpedMap
    ]
  }
}