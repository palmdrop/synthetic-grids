import * as THREE from 'three';
import { FormationConfig } from '../formations/formation';
export type BackgroundConfig = Record<string, any>;

export const remnants = (): BackgroundConfig => ({
  distortion: {
    scale: new THREE.Vector2(1.0, 1.0),
    offset: new THREE.Vector2(),
    rotation: 0.0,
    // colorCorrection: new THREE.Vector3(0.98, 0.99, 0.97),
    colorCorrection: new THREE.Vector3(
      1.0, 1.0, 1.0
    )
      .add(new THREE.Vector3().randomDirection().multiplyScalar(0.25))
      .multiplyScalar(0.8),
    dithering: 0.03,
  },
  blur: {
    x: 0.000007,
    y: 0.000007,
  }
});

export const configMakers = [
  remnants,
];

export const getRockConfig = (): FormationConfig => ({
  size: 50,
  detail: 350,
  amount: THREE.MathUtils.randFloat(150, 200),
  minSteps: THREE.MathUtils.randInt(1, 5),
  maxSteps: THREE.MathUtils.randInt(100, 1000),

  scale: {
    x: THREE.MathUtils.randFloat(0.8, 1.5),
    y: THREE.MathUtils.randFloat(0.8, 1.5),
    z: THREE.MathUtils.randFloat(0.8, 1.5),
  },

  colors: [
    new THREE.Color('white')
  ],

  defaultRoughness: 0.8,
  defaultMetalness: 0.15,
  normalScale: 3.0,

  textureRepeat: 10,

  noiseSettings: {
    octaves: 5,
    frequency: THREE.MathUtils.randFloat(0.001, 0.005),
    min: -1.0,
    max: 1.0,
    lacunarity: 1.80,
    persistance: 0.25,
  }
});