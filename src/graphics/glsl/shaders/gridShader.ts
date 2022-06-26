import * as THREE from 'three';

// Based on https://madebyevan.com/shaders/grid/

export const gridShader: THREE.Shader = {
  uniforms: {
    'tDiffuse': { value: null },
		'opacity': { value: 1.0 },
    'gridScale': {
      value: new THREE.Vector2(10, 10)
    }
  },

  vertexShader: /* glsl */`
		varying vec2 vUv;
    varying vec4 vertex;
		void main() {
			vUv = uv;
      vertex = vec4(position, 1.0) * modelMatrix;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
  `,

	fragmentShader: /* glsl */`
		uniform float opacity;
		uniform sampler2D tDiffuse;
    uniform vec2 gridScale;
		varying vec2 vUv;
    varying vec4 vertex;
		void main() {
      // Pick a coordinate to visualize in a grid
      vec2 coord = vertex.xz * gridScale;
    
      // Compute anti-aliased world-space grid lines
      vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
      float line = min(grid.x, grid.y);
    
      // Just visualize the grid lines directly
      float color = 1.0 - min(line, 1.0);
    
      // Apply gamma correction
      color = pow(color, 1.0 / 2.2);
      gl_FragColor = vec4(vec3(color), 1.0);
		}
  `
}