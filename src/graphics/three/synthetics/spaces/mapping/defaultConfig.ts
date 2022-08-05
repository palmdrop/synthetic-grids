import * as THREE from 'three';
import * as EASING from '../../../../utils/easing';
import type { WeedsConfig } from '../../../procedural/organic/weedsGenerator';

const colors = {
  plant: '#79a500',
  light: '#951c11',
  background: '#475a2c',
}

export const completeWeedsConfig: WeedsConfig = {
  count: 300,
  colors,
  spawner: () => new THREE.Vector3()
    .randomDirection()
    .multiply(new THREE.Vector3(1, 1, 1))
    .multiplyScalar(2),
  strawConfig: (position, index, cell) => ({
    width: 1.7,
    height: 100,
    widthSegments: 3, 
    heightSegments: 200,

    bend: -0.5,
    bendController: (n) => (
      1.0 - EASING.easeOutCubic(1.0 - n)
    ),
    
    thicknessController: (n) => (
      EASING.easeOutCirc(n) *
      EASING.easeOutBack(1.0 - Math.pow(n * 0.9, 4))
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
      frequency: n => 0.02 + Math.sqrt(n) * 0.08,
      min: -1.0,
      max: 1.0
    },
    twistNoiseSettings: {
      frequency: 0.1,
      min: -1.0,
      max: 1.0
    },

    forces: {
      gravity: n => THREE.MathUtils.mapLinear(Math.pow(n, 3), 0, 1, 0.02, -0.1),
      twist: 0.2,
      turn: n => 0.2,
      direction: 0.2, 
      random: 0.10
    },

    materialGenerator: (index, position) => {
      return new THREE.MeshPhysicalMaterial({
        color: colors.plant,
        metalness: 0.1,
        roughness: 0.6,
        reflectivity: 1.0,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide,
      });
    }
  })
}