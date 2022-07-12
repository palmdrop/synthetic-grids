import type { Program } from '../../../../modules/substrates/src/interface/types/program/program';
import type * as THREE from 'three';
import { buildProgramFunction } from '../../../../modules/substrates/src/shader/builder/programBuilder';
import { buildShader } from '../../../../modules/substrates/src/shader/builder/shaderBuilder';
import type { Attributes, GLSL, Uniforms } from '../../../../modules/substrates/src/shader/types/core';
import { attributesToGLSL, uniformsToGLSL } from '../../../../modules/substrates/src/shader/builder/utils/shader';

export const makeFuseShader = (
  attributes: Attributes,
  sampleGLSL: GLSL,
  textures: THREE.Texture[],
): THREE.Shader => {
  const uniforms: Uniforms = {
    textures: {
      value: textures,
      type: 'tv' as any, // TODO
      ignore: true
    },
    test: {
      value: textures[0],
      type: 't' as any,
      ignore: true
    },
    strength: {
      value: 1.0,
      type: 'float'
    }
  };
   
	const fragmentShader = `
    ${attributesToGLSL(attributes)}
    ${uniformsToGLSL(uniforms)}
		varying vec2 vUv;

    uniform sampler2D textures[${Math.max(textures.length, 1)}];

		void main() {
      ${sampleGLSL} 
      float l = float(textures.length());
      n = max(pow(n, strength) * l, 0.0);
      n = mod(n, l);
      vec4 color;

      ${ textures.map(
        (_, i) => (
          `
            ${i > 0 ? 'else ' : ''} ${ i !== textures.length - 1 ? `if(n < ${i + 1}.0)` : ''} {
              color = texture2D(textures[${i}], vUv);
            }
          `
        )
      ).join('') }

      gl_FragColor = color;
		}
  `;

  console.log("AAAAAAAAAA", fragmentShader);

  return {
    uniforms,
    vertexShader: '',
    fragmentShader
  };
}