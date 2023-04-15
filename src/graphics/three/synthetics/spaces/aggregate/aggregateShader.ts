import * as THREE from 'three';
import { makeCustomNormalWarpShader } from "../../../../glsl/shaders/normalWarp/customNormalWarpShader.ts";
import { mapNormalShader } from "../../../../glsl/shaders/normalWarp/mapNormalShader";
import { updateShaderUtil } from "../../scene";

// import encodedProgram from '../../../../../assets/substrates/jolt-gate/gate2.json';
// import encodedProgram from '../../../../../assets/substrates/jolt-gate/gate5.json';
import encodedProgram from '../../../../../assets/substrates/moss-structure/moss-structure2.json';
import { Program } from '../../../../../modules/substrates/src/interface/types/program/program';
import { buildProgramFunction } from '../../../../../modules/substrates/src/shader/builder/programBuilder';
import { buildShader } from '../../../../../modules/substrates/src/shader/builder/shaderBuilder';
import { variableValueToGLSL } from '../../../../../modules/substrates/src/shader/builder/utils/glsl';

export { 
  encodedProgram
}

const makeShader = (
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

  const constants = {
    octaves: 5,
    persistance: 0.5,
    lacunarity: 2.0,
    minSteps: 5,
    maxSteps: 100
  };

  programFunction.functions = {
    ...programFunction.functions,
    mapLinear: {
      parameters: [
        [ 'float', 'value' ],
        [ 'float', 'min1' ],
        [ 'float', 'max1' ],
        [ 'float', 'min2' ],
        [ 'float', 'max2' ]
      ],
      returnType: 'float',
      body: `
        return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
      `
    },
    quantize: {
      parameters: [
        [ 'float', 'value' ],
        [ 'float', 'steps' ]
      ],
      returnType: 'float',
      body: `
        return floor(value * steps) / steps;
      `
    },
    getOffset: {
      parameters: [
        [ 'vec3', 'position' ]
      ],
      returnType: 'float',
      body: `
        float f = frequency;
        float a = amplitude;
        float offset = 0.0;
        for(int i = 0; i < ${constants.octaves}; i++) {
          float n = a * ${programFunction.functionName}(
            f * position
          );

          offset += quantize(
            n, 
            floor(
              mapLinear(float(i), 0.0, float(${constants.octaves}), float(${constants.minSteps}), float(${constants.maxSteps}))
            )
          );

          f *= ${variableValueToGLSL({ type: 'float', value: constants.lacunarity })};
          a *= ${variableValueToGLSL({ type: 'float', value: constants.persistance })};
        }

        return offset;
      `
    }
  }

  const uniforms = {
    ...JSON.parse(JSON.stringify(fragmentShader.uniforms)),
    frequency: {
      value: 0.00000001,
      type: 'float'
    },
    amplitude: {
      value: 10,
      type: 'float'
    },
    ...programFunction.uniforms
  };

  const vertexSourceData = {
    imports: programFunction.imports, 
    functions: programFunction.functions,
    main: `
      vUv = uv;

      /*
      float n = getOffset(
        position + vec3(0.0, 0.0, time)
      );

      vec3 pos = vec3(
        position.x,
        position.y,
        position.z
      );

      pos += normal * n;
      normalOffset = n;
      */

      vec3 samplePosition = position + vec3(0.0, 0.0, time);

      vec3 offset = vec3(
        getOffset(samplePosition + 13.5),
        getOffset(samplePosition + 1312.34),
        getOffset(samplePosition - 234.181)
      );

      vec3 pos = position + offset;

      normalOffset = pos.y;

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
  shader.vertexShader = shader.vertexShader.replaceAll('gl_FragCoord', 'point');

  return shader;
}

// TODO: try makeFuseShader for making the fuse image part of the code?

export const makeShaderUpdater = (object: THREE.Mesh) => updateShaderUtil(
  object,
  program => makeShader(program, mapNormalShader),
  material => {
    material.side = THREE.DoubleSide;
    material.extensions.derivatives = true;
  },
  {
    baseColor: new THREE.Color('black'),
    lineColor: new THREE.Color('white'),
    frequency: 1,
    scale: new THREE.Vector3(
      0, 
      10,
      0,
    ),
    amplitude: 20
  }
);