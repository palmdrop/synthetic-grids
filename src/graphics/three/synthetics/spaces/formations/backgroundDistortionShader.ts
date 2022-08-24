import * as THREE from 'three';

export const BackgroundDistortionShader = {
	uniforms: {
		'tDiffuse': { value: null, type: 'sampler2D' },
		'opacity': { value: 1.0, type: 'float' },

    'backgroundColor': {
      value: new THREE.Vector4(0.3, 0.3, 0.3, 1.0),
      type: 'vec4'
    },
    'scale': {
      value: new THREE.Vector2(1.4, 1.4), 
      type: 'vec2'
    },
    'colorCorrection': {
      value: new THREE.Vector3(
        0.8, 0.9, 0.9
      ),
      type: 'vec3'
    }
	},

	vertexShader: /* glsl */`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

	fragmentShader: /* glsl */`
		uniform float opacity;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		uniform vec2 scale;
		uniform vec3 colorCorrection;
		uniform vec4 backgroundColor;

		void main() {
      vec2 uv = (vUv - 0.5) / scale + 0.5;

			gl_FragColor = texture2D(tDiffuse, uv);
      gl_FragColor.rgb *= colorCorrection;

      // if(gl_FragColor.a < 1.0) gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      gl_FragColor = mix(backgroundColor, gl_FragColor, gl_FragColor.a);
			gl_FragColor.a = opacity;
		}`
} as const;