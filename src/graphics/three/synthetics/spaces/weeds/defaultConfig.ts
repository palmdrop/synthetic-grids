import * as THREE from 'three';
import type * as dat from 'dat.gui';
import * as EASING from '../../../../utils/easing';
import type { WeedsGridConfig } from '../../../procedural/organic/weedsGenerator';
import { addGUI, PropertyMap } from '../../../systems/GuiUtils';
import { mutate, MutationParameters } from '../../../procedural/genetic/geneticGenerator';


export const colors = {
  /*
  plant: '#bdf0fd',
  background: '#afced3',
  grid: '#70ad00'
  */

  /*
  plant: '#70aa4f',
  background: '#2d3517',
  grid: '#ffe600'
  */

  /*
  plant: '#9fd7ca',
  background: '#000000',
  grid: '#9a0000'
  */
  plant: '#c7c89b',
  background: '#000000',
  grid: '#27d400'
}

export const defaultMutationParameters: MutationParameters = {
  strawConfig: {
    width: {
      min: 0,
      max: 10,
      variation: 0.02
    },
    height: {
      min: 0,
      max: 150,
      variation: 0.2
    },
    heightSegments: {
      min: 50,
      max: 150,
      variation: 5.0,
      integer: true
    },
    noiseOffsetMultiplier: {
      min: 0,
      max: 10,
      variation: 0.2
    },
    widthNoiseSettings: {
      frequency: {
        min: 0,
        max: 3,
        variation: 0.025
      },
      min: {
        min: 0.0,
        max: 1.0,
        variation: 0.02
      },
    },
    directionNoiseSettings: {
      frequency: {
        min: 0,
        max: 3,
        variation: 0.025
      },
    },
    twistNoiseSettings: {
      frequency: {
        min: 0,
        max: 3,
        variation: 0.1
      },
    },
    forces: {
      gravity: {
        min: -1,
        max: 1,
        variation: 0.05
      },
      twist: {
        min: -1,
        max: 1,
        variation: 0.05
      },
      turn: {
        min: -1,
        max: 1,
        variation: 0.05
      },
      direction: {
        min: -1,
        max: 1,
        variation: 0.05
      },
      random: {
        min: -1,
        max: 1,
        variation: 0.05
      }
    },
  }
}

export const configMaker = (): WeedsGridConfig => {
  const config = {
    strawConfig: {
      width: 0.9,
      height: 35,
      widthSegments: 3, 
      heightSegments: 50,

      bend: -0.3,
      bendController: (n) => (
        1.0 - EASING.easeOutCubic(1.0 - n)
      ),
      
      thicknessController: (n) => (
        EASING.easeOutCirc(n) *
        EASING.easeOutBack(1.0 - n * n)
      )
      ,

      noiseOffsetMultiplier: 1.2,
      startDirection: () => new THREE.Vector3().randomDirection(),

      widthNoiseSettings: {
        frequency: 0.2,
        min: 1.0,
        max: 1.0
      },

      directionNoiseSettings: {
        frequency: 0.04,
        min: -1.0,
        max: 1.0
      },
      twistNoiseSettings: {
        frequency: 0.1,
        min: -1.0,
        max: 1.0
      },

      forces: {
        gravity: 0.1,
        twist: 0.2,
        turn: 0.4,
        direction: 0.2, 
        random: 0.05
      },

      materialGenerator: (index, position) => {
        return new THREE.MeshPhysicalMaterial({
          color: colors.plant,
          metalness: 0.2,
          roughness: 0.7,
          reflectivity: 1.0,
          clearcoat: 0.5,
          clearcoatRoughness: 0.1,
          side: THREE.DoubleSide,
        });
      }
    },
    strawCount: 250,
    strawSpawner: () => new THREE.Vector3().randomDirection().multiply(
      new THREE.Vector3(1.0, 1.0, 1.0).multiplyScalar(3)
    ),
    gridConfig: {
      cells: {
        x: 3,
        y: 2,
        z: 1
      },
      padding: -0.1,
      color: colors.grid,
      lineWidth: 0.0017
    },
  }

  mutate(config, defaultMutationParameters);

  return config;
};

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