import type { Program } from '../../../modules/substrates/src/interface/types/program/program';
import type * as THREE from 'three';
import { buildProgramFunction } from '../../../modules/substrates/src/shader/builder/programBuilder';
import { buildShader } from '../../../modules/substrates/src/shader/builder/shaderBuilder';

export const makeCustomWarpShader = (
  program: Program,
  fragmentShader: THREE.Shader
): THREE.Shader => {
  const programFunction = buildProgramFunction(
    program,
    '_warp',
    'float'
  );

  const attributes = {
    'vertex': {
      type: 'vec4'
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

      // vec3 offsetDir = normalize(pos - vec3(0.0, 0.0, -10.0));
      // vec3(0.0, 0.0, 1.0);

      pos += normal * n;

      vertex = vec4(pos, 1.0) * modelMatrix;
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