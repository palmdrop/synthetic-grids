import * as THREE from 'three';
export type BackgroundConfig = Record<string, any>;

export const hyperTunnel1 = (): BackgroundConfig => ({
  distortion: {
    scale: new THREE.Vector2(1.0, 1.0).multiplyScalar(THREE.MathUtils.randFloat(1.21, 1.34)),
    offset: new THREE.Vector2(),
    rotation: 0.0,
    colorCorrection: new THREE.Vector3(0.9, 0.98, 0.98),
    dithering: 0.1,
  },
  blur: {
    x: 0.0,
    y: 0.0
  }
});

export const glow = (): BackgroundConfig => ({
  distortion: {
    scale: new THREE.Vector2(1.0, 1.0).multiplyScalar(THREE.MathUtils.randFloat(1.01, 1.04)),
    offset: new THREE.Vector2(),
    rotation: 0.0,
    colorCorrection: new THREE.Vector3(0.9, 0.98, 0.98),
    dithering: 0.1,
  },
  blur: {
    x: 0.01,
    y: 0.0,
  }
});

export const remnants = (): BackgroundConfig => ({
  distortion: {
    scale: new THREE.Vector2(1.0, 1.0),
    offset: new THREE.Vector2(),
    rotation: 0.0,
    colorCorrection: new THREE.Vector3(0.94, 0.98, 0.96),
    dithering: 0.1,
  },
  blur: {
    x: 0.0,
    y: 0.0,
  }
});

export const flow = (): BackgroundConfig => ({
  distortion: {
    scale: new THREE.Vector2(1.0, 1.0).multiplyScalar(THREE.MathUtils.randFloat(1.005, 1.01)),
    offset: new THREE.Vector2(),
    rotation: 0.0,
    colorCorrection: new THREE.Vector3(0.98, 0.98, 0.96),
    dithering: 0.1,
  },
  blur: {
    x: 0.0,
    y: 0.0,
  }
});

export const consume = (): BackgroundConfig => ({
  distortion: {
    scale: new THREE.Vector2(0.99, 1.001),
    offset: new THREE.Vector2(),
    rotation: 0.0,
    colorCorrection: new THREE.Vector3(0.98, 0.98, 0.96),
    dithering: 0.1,
  },
  blur: {
    x: 0.1,
    y: 0.00,
  }
});


export const configMakers = [
  hyperTunnel1,
  glow,
  remnants,
  flow,
  consume
];