import * as THREE from 'three';

import ditheringTexturePath from '../../../../../assets/blue-noise/LDR_RGBA_7.png';
import { createDitheringTexture } from '../../../tools/texture/texture';

const ditheringTexture = createDitheringTexture(ditheringTexturePath);
const ditheringTextureDimensions = new THREE.Vector2(
  128, 128
);

export const BackgroundDistortionShader = {
	uniforms: {
		'tDiffuse': { value: null, type: 'sampler2D' },
		'opacity': { value: 1.0, type: 'float' },

    'backgroundColor': {
      value: new THREE.Vector4(0.0, 0.0, 0.0, 1.0),
      type: 'vec4'
    },
    'scale': {
      value: new THREE.Vector2(1.0, 1.0).multiplyScalar(THREE.MathUtils.randFloat(1.21, 1.34)), 
      type: 'vec2'
    },
    'offset': {
      value: new THREE.Vector3(0.0, 0.0), 
      type: 'vec2'
    },
    'rotation': {
      value: 0.0,
      // THREE.MathUtils.randFloat(-0.05, 0.05),
      type: 'float'
    },
    'colorCorrection': {
      value: new THREE.Vector3(
        0.9, 0.98, 0.98
      ),
      type: 'vec3'
    },
    'dithering': {
      type: 'float',
      value: 0.1
    },
    'ditheringTextureDimensions': {
      type: 'vec2',
      value: ditheringTextureDimensions,
    },
    'tDithering': {
      type: 'sampler2D',
      value: ditheringTexture,
    },
    'time': {
      type: 'float',
      value: 0.0
    },
    'delta': {
      type: 'float',
      value: 0.0
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

    uniform float dithering;
    uniform vec2 ditheringTextureDimensions;
    uniform sampler2D tDithering;

    uniform float time;
    uniform float delta;

    vec2 rotate(vec2 point, float angle) {
      float s = sin(angle);
      float c = cos(angle);
      mat2 matrix = mat2(c, -s, s, c);
      return matrix * point;
    }

		void main() {
      vec2 centeredUv = vUv - 0.5;

      centeredUv = rotate(centeredUv, rotation * delta);
      centeredUv += offset * delta;

      vec2 scaleFactor = (scale - 1.0) * delta;

      vec2 uv = centeredUv / (1.0 + scaleFactor) + 0.5;

			vec4 color = texture2D(tDiffuse, uv);
      vec3 corrected = color.rgb * colorCorrection;
      color.rgb = mix(color.rgb, corrected, delta);
      gl_FragColor = mix(backgroundColor, color, color.a);

      vec2 ditheringCoord = gl_FragCoord.xy / ditheringTextureDimensions + vec2(fract(time * 13.41), fract(time * 3.451));
      vec3 ditheringValue = dithering * texture(tDithering, ditheringCoord).rgb - dithering / 2.0;
      gl_FragColor.rgb += ditheringValue;      

			gl_FragColor.a = opacity;
		}`
} as const;