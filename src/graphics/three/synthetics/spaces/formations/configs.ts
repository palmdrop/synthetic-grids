import * as THREE from 'three';
import type { FormationConfig } from './formation';

const getColors = (rockOnly = false) => {
  return Math.random() > 0.5 || rockOnly ? 
    [
      new THREE.Color('#a3adad'),
      new THREE.Color('#dad9cc'),
      new THREE.Color('#b9b7b5'),
      new THREE.Color('#d9f2e1'),
    ] : [
      new THREE.Color('#bac9b7'),
      new THREE.Color('#b4b4cc'),
      new THREE.Color('#bfa2a2'),
      new THREE.Color('#cadbc9'),
    ];
}

export const getPolyAggregateConfig = (): FormationConfig => ({
  size: 50,
  detail: 200,
  amount: 50,
  minSteps: 3,
  maxSteps: 300,

  scale: {
    x: THREE.MathUtils.randFloat(0.8, 1.5),
    y: THREE.MathUtils.randFloat(0.8, 1.5),
    z: THREE.MathUtils.randFloat(0.8, 1.5),
  },

  colors: getColors(true),

  defaultRoughness: 0.8,
  defaultMetalness: 0.15,
  normalScale: 3.0,

  textureRepeat: 10,

  noiseSettings: {
    octaves: 5,
    frequency: 0.005,
    min: -1.0,
    max: 1.0,
    lacunarity: 1.4,
    persistance: 0.55,
  }
});

export const getStairsConfig = (): FormationConfig => ({
  size: 50,
  detail: 400,
  amount: 30,
  minSteps: 3,
  maxSteps: 400,

  scale: {
    x: THREE.MathUtils.randFloat(0.8, 1.5),
    y: THREE.MathUtils.randFloat(0.8, 1.5),
    z: THREE.MathUtils.randFloat(0.8, 1.5),
  },

  colors: getColors(true),

  defaultRoughness: 0.8,
  defaultMetalness: 0.15,
  normalScale: 3.0,

  textureRepeat: 10,

  noiseSettings: {
    octaves: 5,
    frequency: 0.008,
    min: -1.0,
    max: 1.0,
    lacunarity: 1.49,
    persistance: 0.35,
  }
});

export const getRockConfig = (): FormationConfig => ({
  size: 50,
  detail: 400,
  amount: 40,
  minSteps: 200,
  maxSteps: 1000,

  scale: {
    x: THREE.MathUtils.randFloat(0.8, 1.5),
    y: THREE.MathUtils.randFloat(0.8, 1.5),
    z: THREE.MathUtils.randFloat(0.8, 1.5),
  },

  colors: getColors(),

  defaultRoughness: 0.8,
  defaultMetalness: 0.15,
  normalScale: 3.0,

  textureRepeat: 10,

  noiseSettings: {
    octaves: 5,
    frequency: 0.006,
    min: -1.0,
    max: 1.0,
    lacunarity: 1.80,
    persistance: 0.23,
  }
});

export const getSharpConfig = (): FormationConfig => ({
  size: 50,
  detail: THREE.MathUtils.randInt(5, 30),
  amount: 40,
  minSteps: 1,
  maxSteps: 1000,

  scale: {
    x: THREE.MathUtils.randFloat(0.8, 1.5),
    y: THREE.MathUtils.randFloat(0.8, 1.5),
    z: THREE.MathUtils.randFloat(0.8, 1.5),
  },

  colors: [
    new THREE.Color('#a3adad'),
    new THREE.Color('#dad9cc'),
    new THREE.Color('#b9b9b5'),
    new THREE.Color('#d9f2e1'),
  ],

  defaultRoughness: 0.8,
  defaultMetalness: 0.15,
  normalScale: 2.0,

  textureRepeat: 10,

  noiseSettings: {
    octaves: 5,
    frequency: 0.006,
    min: -1.0,
    max: 1.0,
    lacunarity: 1.80,
    persistance: 0.23,
  }
});