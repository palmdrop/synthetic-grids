import type { Program } from '../../../../modules/substrates/src/interface/types/program/program';
import type * as THREE from 'three';
import { buildProgramFunction } from '../../../../modules/substrates/src/shader/builder/programBuilder';
import { buildShader } from '../../../../modules/substrates/src/shader/builder/shaderBuilder';
import type { Attributes, GLSL, Uniforms } from '../../../../modules/substrates/src/shader/types/core';
import { attributesToGLSL } from '../../../../modules/substrates/src/shader/builder/utils/shader';

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
    }
  };
   
	const fragmentShader = `
    ${attributesToGLSL(attributes)}
		varying vec2 vUv;

    // uniform sampler2D textures[${Math.max(textures.length, 1)}];

		void main() {
      gl_FragColor = vec4(normalOffset, 0.0, 0.0, 1.0);
		}
  `;

  return {
    uniforms,
    vertexShader: '',
    fragmentShader
  };
}