import type { Program } from '../../../../modules/substrates/src/interface/types/program/program';
import type * as THREE from 'three';
import { buildProgramFunction } from '../../../../modules/substrates/src/shader/builder/programBuilder';
import { buildShader } from '../../../../modules/substrates/src/shader/builder/shaderBuilder';
import { addUniforms } from '../../../three/systems/GuiUtils';

export const addNormalWarpGUI = (gui: dat.GUI, material: THREE.ShaderMaterial, folderName = 'warpMaterial') => {
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
      max: 20.0,
      step: 0.001,
    },
    amplitude: {
      min: 0.0,
      max: 100.0,
      step: 0.001,
    },
  });

  return folder;
}

export const makeCustomNormalWarpShader = (
  program: Program,
  fragmentShader: THREE.Shader
): THREE.Shader => {
  const programFunction = buildProgramFunction(
    program,
    '_warp',
    'float'
  );

  const attributes = {
    'normalOffset': {
      type: 'float'
    },
    ...programFunction.attributes
  } as const;

  const uniforms = {
    ...JSON.parse(JSON.stringify(fragmentShader.uniforms)),
    frequency: {
      value: 0.000001,
      type: 'float'
    },
    amplitude: {
      value: 1.0,
      type: 'float'
    },
    ...programFunction.uniforms
  };

  const vertexSourceData = {
    imports: programFunction.imports, 
    functions: programFunction.functions,
    main: `
      vUv = uv;

      float n = amplitude * ${programFunction.functionName}(
        frequency * position + vec3(0.0, 0.0, time)
      );

      vec3 pos = vec3(
        position.x,
        position.y,
        position.z
      );

      pos += normal * n;

      normalOffset = n;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
    `
  };

  const fragmentSourceData = {
    imports: [],
    main: fragmentShader.fragmentShader
  }

  const shader = buildShader(
    attributes,
    uniforms,
    vertexSourceData,
    fragmentSourceData
  );

  shader.fragmentShader = fragmentShader.fragmentShader;

  return shader;
}