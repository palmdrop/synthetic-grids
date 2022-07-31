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

const getNormalizedMousePosition = (properties: SceneProperties) => {
  const nx = properties.mousePosition.x / properties.dimensions.x;
  const ny = properties.mousePosition.y / properties.dimensions.y;
  return { nx, ny };
}

const rotateObjectWithMouse = (
  synthetic: Synthetic, 
  xAmount: number,
  yAmount: number
) => {
  const oldUpdateMethod = synthetic.update;

  synthetic.update = (properties) => {
    oldUpdateMethod?.(properties);
    const { nx, ny } = getNormalizedMousePosition(properties);

    const xRotation = THREE.MathUtils.mapLinear(
      ny, 0, 1,
      -xAmount, xAmount
    );
    const yRotation = THREE.MathUtils.mapLinear(
      nx, 0, 1,
      -yAmount, yAmount
    );

    synthetic.object.rotation.x = xRotation;
    synthetic.object.rotation.y = yRotation;
  }
}

export const spaceMetadata = {
  postProcessing: true
}

export const getLandscapeMap = (
  renderer: THREE.WebGLRenderer,
  backgroundRenderTarget: THREE.WebGLRenderTarget,
  gui: dat.GUI
): SyntheticSpace => {
  const terrain = createWarpedTerrain(
    new THREE.PlaneBufferGeometry(
      20, 20, 1000, 1000
    ),
    mapNormalShader,
    gui
  );

  terrain.object.geometry.computeVertexNormals();
  // terrain.object.rotateX(-Math.PI / 2.0 + THREE.MathUtils.randFloat(0.3, 1.0));
  // terrain.object.rotateZ(THREE.MathUtils.randFloatSpread(0.5));

  terrain.object.position.y += -20;
  
  const defaultWallProgram = decodeProgram(encodedGateProgram as unknown as EncodedProgram);
  const defaultBackgroundProgram = decodeProgram(encodedGridProgram as unknown as EncodedProgram);
  const backgroundRenderer = getBackgroundRenderer(renderer, backgroundRenderTarget, defaultBackgroundProgram);
  const { synthetic: backgroundWall, materialObject: wallObject } = getBackgroundWall(defaultWallProgram, gui);

  // On update
  rotateObjectWithMouse(
    terrain,
    Math.PI / 3.0, Math.PI / 3.0
  );

  rotateObjectWithMouse(
    backgroundWall,
    Math.PI / 8.0, Math.PI / 8.0
  );


  // Programs
  createProgramManager({
    'terrain': {
      object: terrain.object as MaterialObject,
      defaultProgram: defaultWallProgram,
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
      object: wallObject as MaterialObject,
      onChange: (program) => {
        backgroundWall?.updateShader(program);
        return wallObject.material as THREE.ShaderMaterial;
      }
    },
    'combined': {
      object: { material: new THREE.MeshBasicMaterial() },
      onChange: (program) => {
        terrain.updateShader(program);
        backgroundWall.updateShader(program);
        return terrain.object.material as THREE.ShaderMaterial;
      }
    }
  }, gui, 'terrain');

  return {
    sceneConfigurator: (scene: THREE.Scene) => {
      scene.background = backgroundRenderTarget.texture;
    },
    backgroundRenderer, 
    synthetics: [
      terrain,
      backgroundWall
    ],
    postProcessing: true
  }
}