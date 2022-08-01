import * as THREE from 'three';
import type * as dat from 'dat.gui';
import * as EASING from '../../../../utils/easing';
import type { StrawConfig, StrawConfigGenerator, WeedsGridConfig } from '../../../procedural/organic/weedsGenerator';
import { addGUI, PropertyMap } from '../../../systems/GuiUtils';
import { mutate, MutationParameters } from '../../../procedural/genetic/geneticGenerator';


export const colors = {
  plant: '#9fd900',
  light: '#630000',
  background: '#686868',
}

export const completeWeedsConfig: { 
  configGenerator: StrawConfigGenerator, 
  count: number, 
  spawner: (index: number) => THREE.Vector3,  
} = {
  count: 1000,
  spawner: () => new THREE.Vector3().randomDirection().multiply(new THREE.Vector3(7, 10, 7)),
  configGenerator: (position, index, cell) => ({
    width: 0.7,
    height: 100,
    widthSegments: 3, 
    heightSegments: 150,

    bend: 0.3,
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
      frequency: n => 0.05 + n * 0.2,
      min: -1.0,
      max: 1.0
    },
    twistNoiseSettings: {
      frequency: 0.1,
      min: -1.0,
      max: 1.0
    },

    forces: {
      gravity: n => THREE.MathUtils.mapLinear(Math.pow(n, 3), 0, 1, 0.15, -0.3),
      twist: 0.2,
      turn: n => n * 0.1 + 0.3,
      direction: n => 0.2, 
      random: 0.05
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