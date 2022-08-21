import * as THREE from 'three';
import * as EASING from '../../../../utils/easing';
import type { WeedsConfig } from '../../../procedural/organic/weedsGenerator';

const lineColors = [
  '#bfff00',
  '#37ff6c',
  '#ffbe6f',
  '#fffc63',
  '#54ff4b'
];

export const getForGlowConfig = (material: THREE.Material): WeedsConfig => {
  const directionalNoiseFrequency = THREE.MathUtils.randFloat(0.005, 0.03);

  return {
    count: 300,
    colors: {
      lines: lineColors[Math.floor(Math.random() * lineColors.length)]
    },
    spawner: () => new THREE.Vector3()
      .randomDirection()
      .multiply(new THREE.Vector3(1, 1, 1))
      .multiplyScalar(20),
    strawConfig: (position, index, cell) => ({
      width: THREE.MathUtils.randFloat(4.0, 10.0),
      height: Math.random() * 50 + 125,
      widthSegments: 5, 
      heightSegments: 200,

      bend: -0.3,
      bendController: (n) => (
        1.0 - EASING.easeOutCubic(1.0 - n)
      ),
      
      thicknessController: (n) => (
        EASING.easeOutCirc(n) *
        EASING.easeOutBack(1.0 - Math.pow(n * 0.9, 4))
      )
      ,

      noiseOffsetMultiplier: 1.0,
      startDirection: () => new THREE.Vector3().randomDirection(),

      widthNoiseSettings: {
        frequency: 0.2,
        min: 1.0,
        max: 1.0
      },

      directionNoiseSettings: {
        frequency: directionalNoiseFrequency,
        min: -1.0,
        max: 1.0
      },
      twistNoiseSettings: {
        frequency: 0.1,
        min: -1.0,
        max: 1.0
      },

      forces: {
        gravity: n => THREE.MathUtils.mapLinear(Math.pow(n, 2), 0, 1, 0.05, 0.25),
        twist: 0.1,
        turn: 0.4,
        direction: n => THREE.MathUtils.mapLinear(n, 0, 1, 0.8, 0.2),
        random: n => THREE.MathUtils.mapLinear(n**2, 0, 1, 0.1, 0.2)
        
      },

      materialGenerator: () => {
        return material;
      }
    })
  }
};