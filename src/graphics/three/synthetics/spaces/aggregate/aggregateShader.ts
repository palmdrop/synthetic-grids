import * as THREE from 'three';
import { mapNormalShader } from "../../../../glsl/shaders/normalWarp/mapNormalShader";
import { updateShaderUtil } from "../../scene";

import { Program } from '../../../../../modules/substrates/src/interface/types/program/program';
import { buildProgramFunction, buildProgramShader } from '../../../../../modules/substrates/src/shader/builder/programBuilder';
import { buildShader } from '../../../../../modules/substrates/src/shader/builder/shaderBuilder';

// import encodedProgram from '../../../../../assets/substrates/jolt-gate/gate2.json';
// import encodedProgram from '../../../../../assets/substrates/jolt-gate/gate5.json';
// import encodedProgram from '../../../../../assets/substrates/moss-structure/moss-structure2.json';

// NICE ONE
// import encodedDisplacementProgram from '../../../../../assets/substrates/moss-structure/moss-structure3.json';
// import encodedDisplacementProgram from '../../../../../assets/substrates/sediments/sediment5.json';
import encodedDisplacementProgram from '../../../../../assets/substrates/swamp-mass/swamp3.json';
const encodedFragmentPrograms = Object.values(import.meta.globEager('../../../../../assets/substrates/aggregates/*.json'));
// import encodedFragmentProgram from '../../../../../assets/substrates/aggregates/aggregate10.json';
const encodedFragmentProgram = encodedFragmentPrograms[Math.floor(Math.random() * encodedFragmentPrograms.length)];

import { makeSampleFuseShader } from '../../../../glsl/shaders/fuse/fuseSampleShader';

export { 
  encodedDisplacementProgram,
  encodedFragmentProgram
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
        [ 'vec3', 'position' ],
        [ 'bool', 'correct' ]
      ],
      returnType: 'float',
      body: `
        float f = frequency;
        float a = amplitude;
        float offset = 0.0;
        float maxOffset = 0.0;
        for(int i = 0; i < ${constants.octaves}; i++) {
          // NOTE: this is not the correct formations implementation.
          // NOTE: Do not multiply with "a" here, instead, multiply the result of the quantize function below
          float n = a * ${programFunction.functionName}(
            f * position
          );

          offset += quantize(
            n, 
            floor(
              mapLinear(float(i), 0.0, float(${constants.octaves}), float(minSteps), float(maxSteps))
            )
          );

          maxOffset += a;
          f *= lacunarity;
          a *= persistance;
        }

        return (offset - (correct ? (amplitude * correction + add) : 0.0)) * mult;
      `
    },
    get3dOffset: {
      parameters: [
        [ 'vec3', 'samplePosition' ],
        [ 'bool', 'correct' ],
      ],
      returnType: 'vec3',
      body: `
        return vec3(
          getOffset(samplePosition, correct),
          getOffset(samplePosition + 120.34, correct),
          getOffset(samplePosition - 145.181, correct)
        );
      `
    }
  }

  const uniforms = {
    // ...JSON.parse(JSON.stringify(fragmentShader.uniforms)),
    ...fragmentShader.uniforms,
    frequency: {
      value: 0.00000001,
      type: 'float'
    },
    amplitude: {
      value: 10,
      type: 'float'
    },
    speed: {
      value: new THREE.Vector3(1, 1, 1),
      type: 'vec3'
    },
    animationTime: {
      value: 0,
      type: 'float'
    },
    substrateFrequency: {
      value: 5,
      type: 'float'
    },
    correction: {
      value: 0.0,
      type: 'float'
    },
    persistance: {
      value: 0.5,
      type: 'float'
    },
    lacunarity: {
      value: 2.0,
      type: 'float'
    },
    minSteps: {
      value: 5,
      type: 'int'
    },
    maxSteps: {
      value: 100,
      type: 'int'
    },
    add: {
      value: 0,
      type: 'float'
    },
    mult: {
      value: 1,
      type: 'float'
    },
    translationX: {
      value: 0,
      type: 'float'
    },
    translationY: {
      value: 0,
      type: 'float'
    },
    translationZ: {
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
        position + speed * time, false
      );

      vec3 pos = vec3(
        position.x,
        position.y,
        position.z
      );

      pos += normal * n;
      normalOffset = n;
      */

      float sampleRange = 120.0;

      vec3 samplePosition = position + vec3(
        sin(animationTime * speed.x) * sampleRange + translationX,
        cos(animationTime * speed.y) * sampleRange + translationY,
        /*
        animationTime * speed.x + translationX,
        animationTime * speed.y + translationY,
        */
        0.0 + translationZ
      );

      vec3 centerOffset = get3dOffset(vec3(0.0, 0.0, 0.0), false);
      vec3 offset = get3dOffset(samplePosition, true);
      vec3 pos = position + offset - centerOffset;

      normalOffset = length(normal) + length(offset);

      vertexPosition = (vec4( pos, 1.0 )).xyz;
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
    .replaceAll(') * time', ')')
    .replaceAll('gl_FragCoord', 'point');

  return shader;
}

// TODO: try makeFuseShader for making the fuse image part of the code?

export const makeShaderUpdater = (object: THREE.Mesh, ...rest: THREE.Mesh[]) => updateShaderUtil(
  [object, ...rest],
  // program => makeShader(program, mapNormalShader),
  (program, substrateProgram) => {
    // const { fuseShader, textures } = getFuseShader();
    const { shader: substrateShader } = buildProgramShader(substrateProgram);

    substrateShader.fragmentShader = substrateShader
      .fragmentShader
      .replace(
        'varying vec2 vUv;',
        `varying vec2 vUv;
         varying vec3 vertexPosition;
         uniform float substrateFrequency;
         uniform float translationX;
         uniform float translationY;
         uniform float translationZ;
        `
      )
      .replace(
        'vec3 point = vec3(gl_FragCoord.xy, 0.0);',
        `
          float x = vertexPosition.x;
          float y = vertexPosition.y;
          float z = vertexPosition.z;
          float speed = 10.0;

          vec3 point = vec3(
            x * cos(time * speed) - z * sin(time * speed),
            y,
            z * cos(time * speed) + x * sin(time * speed)
          ) * substrateFrequency;

          // point += vec3(translationX, translationY, translationZ);
        `
      )

    const shader = makeShader(program, substrateShader);
    // const shader = makeShader(program, mapNormalShader);
    /*
    const shader = makeShader(program, fuseShader);
    setUniform('textures', textures.slice(1), shader);
    setUniform('sampler', textures[0], shader);
    */
    return shader;
  },
  material => {
    material.side = THREE.DoubleSide;
    material.extensions.derivatives = true;
  },
  {
    lineColor: new THREE.Color('#edeaea'),
    baseColor: new THREE.Color('#232020'),
    frequency: 0.1,
    substrateFrequency: 20,
  
    scale: new THREE.Vector3(
      0, 
      15,
      0,
    ),
    amplitude: 200,
    speed: new THREE.Vector3(
      1,
      1,
      70
    ),
    width: 1.0
  }
);