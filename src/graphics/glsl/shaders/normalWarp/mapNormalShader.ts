import type { Uniforms } from '../../../../modules/substrates/src/shader/types/core';
import * as THREE from 'three';

// Based on https://madebyevan.com/shaders/grid/

export const mapNormalShader: Omit<THREE.Shader, 'uniforms'> & { uniforms: Uniforms } = {
  uniforms: {
    'tDiffuse': { value: null, type: 'sampler2D' },
		'opacity': { value: 1.0, type: 'float' },
    'scale': { value: new THREE.Vector3(0, 100, 0), type: 'vec3' },
    // 'scale': { value: 10.0, type: 'float' },
    'baseColor': { value: new THREE.Color( 0.0, 0.0, 1.0 ), type: 'vec3' },
    'lineColor': { value: new THREE.Color( 1.0, 1.0, 1.0 ), type: 'vec3' },
    'width': { value: 1.0, type: 'float' },
  },

  vertexShader: ``,

	fragmentShader: /* glsl */`
		uniform float opacity;
		uniform sampler2D tDiffuse;
    uniform vec3 scale;
    uniform vec3 baseColor;
    uniform vec3 lineColor;
    uniform float width;
		varying vec2 vUv;
    varying float normalOffset;

		void main() {
      // Pick a coordinate to visualize in a grid
      float coord = normalOffset * scale.y;

      // Compute anti-aliased world-space grid lines
      float line = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);

      line *= 1.0 / width;

      // Just visualize the grid lines directly
      float n = 1.0 - min(line, 1.0);

      // Apply gamma correction
      n = pow(n, 1.0 / 2.2);
      gl_FragColor = vec4(mix(baseColor, lineColor, n), 1.0);
		}
  `
}