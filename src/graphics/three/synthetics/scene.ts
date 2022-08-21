import type { Program } from '../../../modules/substrates/src/interface/types/program/program';
import * as THREE from 'three';
import type * as POSTPROCESSING from 'postprocessing';
import type { FullscreenQuadRenderer } from '../tools/FullscreenQuadRenderer';
import { setUniform } from '../../../modules/substrates/src/utils/shader';
import type { AbstractRenderScene } from '../AbstractRenderScene';

export type SceneProperties = {
  time: number,
  mousePosition: THREE.Vector2,
  dimensions: THREE.Vector2,
  scale: number
}

export type Synthetic<ObjectType = THREE.Object3D> = {
  object: ObjectType,
  updateShader?: (program?: Program) => void,
  update?: (sceneProperties: SceneProperties, renderScene: AbstractRenderScene) => void,
  resize?: (width: number, height: number) => void,
  metadata?: Record<string, any>,
}

export type BackgroundRenderer = { update: Synthetic['update'] } & Pick<
  FullscreenQuadRenderer, 
  'render' | 'renderTarget' | 'setSize' | 'material'
>;

export type SyntheticSpace = {
  sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => void, 
  onClick?: (mousePosition: THREE.Vector2, renderScene: AbstractRenderScene) => void,
  regenerate?: (renderScene: AbstractRenderScene) => void,
  onResize?: (width: number, height: number, renderScene: AbstractRenderScene) => void,
  backgroundRenderer?: BackgroundRenderer,
  synthetics: Synthetic[],
  postProcessing: boolean,
  defaultPasses?: boolean,
  controls?: boolean,
  additionalPasses?: POSTPROCESSING.Pass[],
  postProcessingPassSettings?: Record<string, Record<string, any>>,
  data?: Record<string, any>,
  defaultSceneProperties?: Partial<SceneProperties>
}

export const updateShaderUtil = (
  object: Synthetic<THREE.Mesh>['object'],
  shaderMaker: (program: Program) => THREE.Shader,
  materialCallback: (material: THREE.ShaderMaterial) => void,
  uniformDefaults: { [name: string]: any },
  setter?: (material: THREE.ShaderMaterial, object: Synthetic<THREE.Mesh>['object']) => void
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

    if(!setter) {
      object.material = material;
    } else {
      setter(material, object);
    }
    materialCallback(material);
  }
}