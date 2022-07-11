import * as THREE from 'three';
import { addThreeColor, addUniforms } from '../../systems/GuiUtils';
import { addNormalWarpGUI, makeCustomNormalWarpShader } from '../../../glsl/shaders/normalWarp/customNormalWarpShader.ts';
import { Synthetic, updateShaderUtil } from '../scene';
import { setUniform } from '../../../../modules/substrates/src/utils/shader';

const addGUI = (gui: dat.GUI, material: THREE.ShaderMaterial, folderName = 'warpMaterial') => {
  const folder = addNormalWarpGUI(gui, material, folderName);
  addUniforms(folder, material, {
    width: {
      min: 0.01,
      max: 10.0,
      step: 0.001,
    }
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

export const createWarpedMap = (geometry: THREE.BufferGeometry, coreShader: THREE.Shader, gui?: dat.GUI): Synthetic<THREE.Mesh> => {
  const object = new THREE.Mesh(
    geometry,
    new THREE.ShaderMaterial(coreShader)
  );

  const updateShader = updateShaderUtil(
    object,
    program => makeCustomNormalWarpShader(program, coreShader),
    material => {
      material.side = THREE.DoubleSide;
      material.extensions.derivatives = true;
      if(gui) addGUI(gui, material, 'warped map');
    },
    {
      baseColor: new THREE.Color('black'),
      lineColor: new THREE.Color('white'),
      frequency: 0.25,
      scale: new THREE.Vector3(
        0, 
        10,
        0,
      ),
      amplitude: 1.0
    }
  );

  return {
    object,
    updateShader,
    update: (properties) => {
      setUniform(
        'time',
        properties.time,
        object.material
      );
    }
  };
}