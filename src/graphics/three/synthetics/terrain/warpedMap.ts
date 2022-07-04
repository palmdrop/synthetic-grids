import type { Program } from '../../../../modules/substrates/src/interface/types/program/program';
import * as THREE from 'three';
import * as gui from 'dat.gui';
import { makeCustomWarpShader } from '../../../glsl/shaders/customWarpShader';
import { addThreeColor, addUniforms } from '../../systems/GuiUtils';
import { additionalShaderMaterials$ } from '../../../../modules/substrates/src/stores/shaderStore';

export type WarpedMapContext = {
  object: THREE.Mesh,
  updateShader: (program: Program) => void
}

const addGUI = (gui: dat.GUI, material: THREE.ShaderMaterial, folderName = 'warpMaterial') => {
  if(gui.__folders[folderName]) gui.removeFolder(gui.__folders[folderName])
  const folder = gui.addFolder(folderName);
  addUniforms(folder, material, {
    frequency: {
      min: 0.0,
      max: 10.0,
      step: 0.001,
    },
    scale: {
      min: 0.0,
      max: 10.0,
      step: 0.001,
    },
    amplitude: {
      min: 0.0,
      max: 100.0,
      step: 0.001,
    },
    width: {
      min: 0.01,
      max: 10.0,
      step: 0.001,
    },
  });

  addThreeColor(
    folder, material, 'baseColor',
    true
  );
  addThreeColor(
    folder, material, 'lineColor',
    true
  );
}

export const createWarpedMap = (geometry: THREE.BufferGeometry, coreShader: THREE.Shader, gui?: dat.GUI): WarpedMapContext => {
  let material: THREE.ShaderMaterial | undefined = undefined;

  const object = new THREE.Mesh(
    geometry,
    new THREE.ShaderMaterial(coreShader)
  );

  const updateShader = (program: Program) => {
    const oldMaterial = material;

    const shader = makeCustomWarpShader(
      program,
      coreShader
    );

    material = new THREE.ShaderMaterial(shader);
    material.side = THREE.DoubleSide;
    material.extensions.derivatives = true;

    additionalShaderMaterials$.set([material as any]);

    if(oldMaterial) {
      Object.keys(oldMaterial.uniforms).forEach(uniformName => {
        if(!material.uniforms[uniformName]) return;
        material.uniforms[uniformName].value = oldMaterial.uniforms[uniformName].value;
      });
    } else {
      material.uniforms.baseColor.value = new THREE.Color('black');
      material.uniforms.lineColor.value = new THREE.Color('white');
      material.uniforms.frequency.value = 0.25;
      material.uniforms.scale.value = new THREE.Vector3(
        0, 
        10,
        0,
      );
      material.uniforms.amplitude.value = 1.0;
    }
 
    object.material = material;

    if(gui) {
      addGUI(gui, material);

    }
  }


  return {
    object,
    updateShader
  };
}