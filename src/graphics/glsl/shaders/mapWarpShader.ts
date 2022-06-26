import type * as THREE from 'three';
import { simplex3dChunk } from '../chunk/simplex3d';
import { mapShader } from "./mapShader";

export const mapWarpShader: THREE.Shader = {
  uniforms: {
    ...JSON.parse(JSON.stringify(mapShader.uniforms)),
    time: {
      value: 0.0
    },
    frequency: {
      value: 5.531
    },
    amplitude: {
      value: 0.2
    },
  },

  vertexShader: `
    ${ simplex3dChunk }

		varying vec2 vUv;
    varying vec4 vertex;

    uniform float time;
    uniform float frequency;
    uniform float amplitude;

		void main() {
			vUv = uv;
      float n = amplitude * simplex3d(frequency * position + vec3(0.0, 0.0, time));

      vec3 pos = vec3(
        position.x,
        position.y,
        position.z + n
      );

      vertex = vec4(pos, 1.0) * modelMatrix;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
		}
  `,
  fragmentShader: mapShader.fragmentShader
}