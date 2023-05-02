import * as THREE from 'three';
export type BackgroundConfig = Record<string, any>;

export const grayFade = (): BackgroundConfig => ({
  distortion: {
    scale: new THREE.Vector2(
      1.02, 
      1.02
    ),
    offset: new THREE.Vector2(),
    rotation: 0.0,
    /*
    colorCorrection: new THREE.Vector3(
      1.0, 1.0, 1.0
    ).multiplyScalar(0.98)
    ,
    dithering: 0.035,
    */
  },
  blur: {
    x: 0.00002,
    y: 0.00002,
  }
});

export const configMakers = [
  grayFade,
];