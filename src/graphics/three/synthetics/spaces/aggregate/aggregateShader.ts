import * as THREE from 'three';
import { mapNormalShader } from "../../../../glsl/shaders/normalWarp/mapNormalShader";
import { updateShaderUtil } from "../../scene";

import { Program } from '../../../../../modules/substrates/src/interface/types/program/program';
import { buildProgramFunction } from '../../../../../modules/substrates/src/shader/builder/programBuilder';
import { buildShader } from '../../../../../modules/substrates/src/shader/builder/shaderBuilder';
import { variableValueToGLSL } from '../../../../../modules/substrates/src/shader/builder/utils/glsl';

// import encodedProgram from '../../../../../assets/substrates/jolt-gate/gate2.json';
// import encodedProgram from '../../../../../assets/substrates/jolt-gate/gate5.json';
import encodedProgram from '../../../../../assets/substrates/moss-structure/moss-structure2.json';

// NICE ONE
// import encodedProgram from '../../../../../assets/substrates/swamp-mass/swamp3.json';

// import encodedProgram from '../../../../../assets/substrates/forest-reflections/forest-reflection6.json';
import { makeFuseShader } from '../../../../glsl/shaders/fuse/fuseShader';
import { setUniform } from '../../../../../modules/substrates/src/utils/shader';
import { makeSampleFuseShader } from '../../../../glsl/shaders/fuse/fuseSampleShader';

export { 
  encodedProgram
}

const images = Object.values(import.meta.globEager('../../../../../assets/images/*')).map(module => module.default);
const offset = Math.floor(Math.random() * images.length) + 1.0;
const pickedImages: string[] = [];
for(let i = 1; i <= 5; i++) {
  const index = (i * offset) % images.length;
  pickedImages.push(images[index]);
}

export const getFuseShader = () => {
  const textureLoader = new THREE.TextureLoader();
  const textures = pickedImages.map(image => {
    const texture = textureLoader.load(image)

    texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;
    /*
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    */
    texture.repeat.set(
      1, 1
    ).multiplyScalar(THREE.MathUtils.randFloat(0.3, 0.7));

    return texture;
  });

  return {
    fuseShader: makeSampleFuseShader(
      {
        normalOffset: { type: 'float' },
        vertexPosition: { type: 'vec3' },
      }, 
      {
        sampleScale: {
          type: 'float',
          value: 0.0005
        },
        animationTime: {
          type: 'float',
          value: 0
        }
      },
      // TODO: add uniform for controlling sample position multiplier
      `
        vec2 samplePosition = vec2(
          vertexPosition.x * vertexPosition.z + animationTime * 100.0,
          vertexPosition.y * vertexPosition.z + animationTime * 100.0
        ) * sampleScale;

        vec4 samplerColor = texture2D(sampler, samplePosition);
        float n = length(samplerColor) * 7.0;
      `,
      textures.slice(1),
      textures[0]
    ),
    textures
    /*
    fuseShader: makeFuseShader(
      {
        normalOffset: { type: 'float' },
      }, 
      `float n = normalOffset;`, 
      textures
    ),
    textures
    */
  }
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
    'vertexPosition': {
      type: 'vec3'
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
        float maxAmount = 0.0;
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

          maxAmount += a;
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
    speed: {
      value: new THREE.Vector3(0, 0, 1),
      type: 'vec3'
    },
    animationTime: {
      value: 0,
      type: 'float'
    },
    ...programFunction.uniforms
  };

  // TODO: Try polar warp!?

  // TODO: use GUI to control how much influence sample image has!
  // TODO: aaaaaaand the repeat frequency
  // TODO: sort images and use similar/complementary images as textures!

  // TODO: use substrate as color! use noisy image mixing and display on formation!
  // TODO: make more dirty, grainy, specks, patches, loose structure, overlayed, fragmented

  const vertexSourceData = {
    imports: programFunction.imports, 
    functions: programFunction.functions,
    main: `
      vUv = uv;

      /*
      float n = getOffset(
        position + speed * time
      );

      vec3 pos = vec3(
        position.x,
        position.y,
        position.z
      );

      pos += normal * n;
      normalOffset = n;
      */

      /*
      vec3 centerOffset = vec3(
        getOffset(vec3(0.0)),
        getOffset(vec3(0.0)),
        getOffset(vec3(0.0))
      );
      */

      vec3 samplePosition = position + speed * animationTime;

      vec3 offset = vec3(
        getOffset(samplePosition + 13.5),
        getOffset(samplePosition + 1312.34),
        getOffset(samplePosition - 234.181)
      );

      // vec3 pos = position + offset - centerOffset;
      vec3 pos = position + offset;

      normalOffset = (length(normal) + length(offset));

      vertexPosition = (modelMatrix * vec4( pos, 1.0 )).xyz;
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
  shader.vertexShader = shader
    .vertexShader
    .replaceAll('gl_FragCoord', 'point');

  return shader;
}

// TODO: try makeFuseShader for making the fuse image part of the code?

export const makeShaderUpdater = (object: THREE.Mesh) => updateShaderUtil(
  object,
  // program => makeShader(program, mapNormalShader),
  program => {
    const { fuseShader, textures } = getFuseShader();
    const shader = makeShader(program, fuseShader);
    setUniform('textures', textures.slice(1), shader);
    setUniform('sampler', textures[0], shader);
    return shader;
  },
  material => {
    material.side = THREE.DoubleSide;
    material.extensions.derivatives = true;
  },
  {
    baseColor: new THREE.Color('black'),
    lineColor: new THREE.Color('white'),
    frequency: 0.5,
  
    scale: new THREE.Vector3(
      0, 
      5,
      0,
    ),
    amplitude: 55,
    speed: new THREE.Vector3(
      0,
      0,
      70
    ),
    width: 1.1
  }
);