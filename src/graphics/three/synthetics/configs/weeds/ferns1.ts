import * as THREE from 'three';
import { mapShader } from '../../../../glsl/shaders/mapShader';
import * as EASING from '../../../../utils/easing';
import type { WeedsConfig } from '../../../procedural/organic/weedsGenerator';

const primaryColor = '#364208';

const colors = {
  light: '#951c11',
  lines: '#e7e8da',
  plant: primaryColor,
  background: primaryColor
}

export const getFernsConfig = (material: THREE.Material): WeedsConfig => ({
  count: 500,

  colors,

  spawner: () => new THREE.Vector3()
    .randomDirection()
    .multiply(new THREE.Vector3(2, 0.1, 1))
    .multiplyScalar(50),

  strawConfig: (position, index, cell) => ({
    width: 4.7,
    height: Math.random() * 150 + 100,
    widthSegments: 5, 
    heightSegments: 200,

    bend: -0.2,
    bendController: (n) => (
      1.0 - EASING.easeOutCubic(1.0 - n)
    ),
    
    thicknessController: (n) => (
      EASING.easeOutElastic(Math.pow(n, 0.8)) * (1.0 - n * n + 0.3)
    )
    ,

    noiseOffsetMultiplier: 5.0,
    startDirection: () => new THREE.Vector3().randomDirection(),

    widthNoiseSettings: {
      frequency: 0.2,
      min: 1.0,
      max: 1.0
    },

    directionNoiseSettings: {
      frequency: 0.01,
      min: -1.0,
      max: 1.0
    },
    twistNoiseSettings: {
      frequency: 0.1,
      min: -1.0,
      max: 1.0
    },

    forces: {
      gravity: 0.08,
      twist: 0.10,
      turn: 0.1,
      direction: 0.3, 
      random: 0.05
    },

    materialGenerator: () => {
      return material;
    }
  })
});