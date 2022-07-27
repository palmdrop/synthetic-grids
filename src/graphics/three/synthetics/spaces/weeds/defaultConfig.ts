import * as THREE from 'three';
import type * as dat from 'dat.gui';
import * as EASING from '../../../../utils/easing';
import { defaultNormalMap } from '../../../procedural/organic/weedsGenerator';
import { addGUI, PropertyMap } from '../../../systems/GuiUtils';

export const configMaker = () => ({
  strawConfig: {
    width: Math.random() + 0.7,
    height: 50,
    widthSegments: 3, 
    heightSegments: 50,

    bend: 0.3,
    bendController: (n) => (
      1.0 - EASING.easeOutCubic(1.0 - n)
    ),
    
    thicknessController: (n) => (
      EASING.easeOutCirc(n) *
      EASING.easeOutBack(1.0 - n * n)
    )
    ,

    noiseOffsetMultiplier: 1.0,
    startDirection: () => new THREE.Vector3().randomDirection(),

    widthNoiseSettings: {
      frequency: Math.random() * 0.5 + 0.2,
      min: 1.0,
      max: 1.0
    },

    directionNoiseSettings: {
      frequency: Math.random() * 0.05 + 0.02,
      min: -1.0,
      max: 1.0
    },
    twistNoiseSettings: {
      frequency: 0.1,
      min: -0.9,
      max: 0.9
    },

    forces: {
      gravity: 0.0 + Math.random() * 0.2,
      twist: 0.0,
      turn: new THREE.Vector3(1, 1, 1)
        .multiplyScalar(0.4),
      direction: 0.2, 
      random: Math.random() * 0.2
    },

    materialGenerator: (index, position) => {
      return new THREE.MeshStandardMaterial({
        color: '#665b20',
        metalness: 0.1,
        roughness: 0.8,
        side: THREE.DoubleSide,
        normalMap: defaultNormalMap,
        normalScale: new THREE.Vector2(1, 1).multiplyScalar(0.2)
      });
    }
  },
  strawCount: Math.round(0 + Math.random() * 350),
  strawSpawner: () => new THREE.Vector3().randomDirection().multiply(
    new THREE.Vector3(1.0, 0.0, 1.0).multiplyScalar(1)
  ),
  gridConfig: {
    cells: {
      x: 2,
      y: 2,
      z: 1
    },
    padding: -0.0,
    color: '#15ff00'
  },
});

export const makeConfigGUI = (gui: dat.GUI, config: ReturnType<typeof configMaker>, minDivider = 5, maxMultiplier = 5) => {
  const propertyMap: PropertyMap = {};

  const addProperties = (value: number | Record<string, any>, propertyMap: PropertyMap) => {
    Object.entries(value).forEach(([key, value]) => {
      if(typeof value === 'object') {
        propertyMap[key] = {};
        addProperties(value, propertyMap[key] as PropertyMap);

        return;
      } 

      if(typeof value !== 'number') return;

      const max = value * maxMultiplier + maxMultiplier;
      const min = value / minDivider - minDivider;
      const step = (max - min) / 1000;

      propertyMap[key] = {
        max, min, step
      };
    });
  }

  console.log(propertyMap);

  addProperties(config, propertyMap);
  addGUI(gui, config, propertyMap);
}