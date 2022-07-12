import type { Program } from '../../../modules/substrates/src/interface/types/program/program';
import * as THREE from 'three';
import type * as dat from 'dat.gui';
import { createWarpedTerrain } from './terrain/warpedTerrain';
import { mapNormalShader } from '../../../graphics/glsl/shaders/normalWarp/mapNormalShader';
import { FullscreenQuadRenderer } from '../tools/FullscreenQuadRenderer';
import { buildProgramShader } from '../../../modules/substrates/src/shader/builder/programBuilder';
import { decodeProgram, EncodedProgram } from '../../../modules/substrates/src/stores/programStore';
import encodedGridProgram from './programs/grid1.json';
import { setUniform } from '../../../modules/substrates/src/utils/shader';
import { createProgramManager, MaterialObject } from './programs/programManager';
import { getBackgroundWall } from './background/wall';

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
  'render' | 'renderTarget' | 'setSize' | 'material'
>;

export type SyntheticSpace = {
  sceneConfigurator: (scene: THREE.Scene) => void, 
  backgroundRenderer?: BackgroundRenderer,
  synthetics: Synthetic[]
}

export const updateShaderUtil = (
  object: Synthetic<THREE.Mesh>['object'],
  shaderMaker: (program: Program) => THREE.Shader,
  materialCallback: (material: THREE.ShaderMaterial) => void,
  uniformDefaults: { [name: string]: any },
) => {
  let material: THREE.ShaderMaterial | undefined = undefined;

  return (program: Program) => {
    const oldMaterial = material;

    const shader = shaderMaker(program);
    material = new THREE.ShaderMaterial(shader);

    if(oldMaterial) {
      Object.keys(oldMaterial.uniforms).forEach(uniformName => {
        if(!material.uniforms[uniformName]) return;
        material.uniforms[uniformName].value = oldMaterial.uniforms[uniformName].value;
      });
    } else {
      Object.entries(uniformDefaults).forEach(([name, value]) => {
        value = (typeof value === 'object' && typeof value.clone === 'function') 
          ? value.clone() 
          : value;

        setUniform(name, value, material);
      })
    }

    object.material = material;
    materialCallback(material);
  }
}

// Configurations //

const getGridBackgroundRenderer = (
  renderer: THREE.WebGLRenderer, 
  renderTarget: THREE.WebGLRenderTarget,
  program: Program
) => {
  const shader = buildProgramShader(program);

  const material = new THREE.ShaderMaterial(shader);

  const fullscreenRenderer = new FullscreenQuadRenderer(
    renderer,
    material,
    renderTarget
  ) as unknown as BackgroundRenderer;

  fullscreenRenderer.update = function (properties) {
    setUniform(
      'time',
      properties.time,
      this.quad.material
    );
  }

  return fullscreenRenderer;
}

export const getWarpSpace = (
  renderer: THREE.WebGLRenderer,
  backgroundRenderTarget: THREE.WebGLRenderTarget,
  gui: dat.GUI
): SyntheticSpace => {
  const terrain = createWarpedTerrain(
    new THREE.SphereBufferGeometry(
      10, 1000, 1000
    ),
    mapNormalShader,
    gui
  );

  terrain.object.geometry.computeVertexNormals();
  terrain.object.rotateZ(-Math.PI / 2.0);
  
  const defaultBackgroundProgram = decodeProgram(encodedGridProgram as unknown as EncodedProgram);

  const backgroundRenderer = getGridBackgroundRenderer(renderer, backgroundRenderTarget, defaultBackgroundProgram);
  const backgroundWall = getBackgroundWall(defaultBackgroundProgram, gui);

  createProgramManager({
    'terrain': {
      object: terrain.object as MaterialObject,
      onChange: (program) => {
        terrain.updateShader(program);
        return terrain.object.material as THREE.ShaderMaterial;
      }
    },
    'background': {
      object: backgroundRenderer as MaterialObject,
      defaultProgram: defaultBackgroundProgram
    },
    'wall': {
      object: backgroundWall.object as MaterialObject,
      onChange: (program) => {
        backgroundWall?.updateShader(program);
        return backgroundWall.object.material as THREE.ShaderMaterial;
      }
    }
  }, gui, 'terrain');

  const testObject: Synthetic = {
    object: new THREE.Mesh(
      new THREE.PlaneBufferGeometry(30, 30),
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('/src/assets/images/bush1.png', 
          t => console.log(t),
          e => console.log(e)
        )
      })
    )
  }

  return {
    sceneConfigurator: (scene: THREE.Scene) => {
      scene.background = backgroundRenderTarget.texture;
    },
    backgroundRenderer, 
    synthetics: [
      // terrain,
      // testObject,
      backgroundWall
    ]
  }
}