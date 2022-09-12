import * as THREE from 'three';
import { rgbToHsl } from '../../../../utils/color';
import { random } from '../../../tools/math';
import type { FormationConfig } from '../formations/formation';

const palettes = Object.values(import.meta.globEager('../../../../../assets/palettes/*.json')).map((module: any) => module.default);

const getColors = () => {
  const palette = palettes[Math.floor(Math.random() * palettes.length)];
  const colors = palette.map(entry => {
    let { h, s, l } = rgbToHsl(entry.color);

    h /= 360;
    s /= 100;
    l /= 100;

    s = Math.pow(s, 2.0);
    l = Math.pow(l, 0.3);

    return new THREE.Color().setHSL(h, s, l);
  });

  return colors;
}

export const getRockConfig = (): FormationConfig => ({
  size: 50,
  detail: 200,
  amount: 50,
  minSteps: 200,
  maxSteps: 1000,

  scale: {
    x: THREE.MathUtils.randFloat(0.8, 1.2),
    y: THREE.MathUtils.randFloat(0.8, 1.2),
    z: THREE.MathUtils.randFloat(0.8, 1.2),
  },

  colors: getColors(),

  defaultRoughness: 0.8,
  defaultMetalness: 0.15,
  normalScale: 3.0,

  textureRepeat: 10,

  noiseSettings: {
    octaves: 6,
    frequency: random(0.004, 0.008),
    min: -1.0,
    max: 1.0,
    lacunarity: random(1.6, 1.9),
    persistance: random(0.20, 0.25)
  }
});