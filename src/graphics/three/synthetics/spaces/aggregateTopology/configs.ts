import * as THREE from 'three';
export type BackgroundConfig = Record<string, any>;

export const grayFade = (): BackgroundConfig => ({
  distortion: {
    scale: new THREE.Vector2(
      /* 1.035, 
      1.035*/
      1.035, 
      1.035
    ),
  },
  blur: {
    x: 0.00002,
    y: 0.00002,
  }
});

export const configMakers = [
  grayFade,
];