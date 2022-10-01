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
      value: new THREE.Vector2(1.3, 1.3), 
      type: 'vec2'
    },
    'offset': {
      value: new THREE.Vector3(0.0, 0.0), 
      type: 'vec2'
    },
    'rotation': {
      value: 0.0,
      type: 'float'
    },
    'colorCorrection': {
      value: new THREE.Vector3(
        0.9, 0.98, 0.98
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
		uniform vec2 offset;
		uniform float rotation;
		uniform vec3 colorCorrection;
		uniform vec4 backgroundColor;

    vec2 rotate(vec2 point, float angle) {
      float s = sin(angle);
      float c = cos(angle);
      mat2 matrix = mat2(c, -s, s, c);
      return matrix * point;
    }

		void main() {
      vec2 centeredUv = vUv - 0.5;

      centeredUv = rotate(centeredUv, rotation);
      centeredUv += offset;

      vec2 uv = centeredUv / scale + 0.5;

			vec4 color = texture2D(tDiffuse, uv);
      color.rgb *= colorCorrection;
      gl_FragColor = mix(backgroundColor, color, color.a);
			gl_FragColor.a = opacity;
		}`
} as const;