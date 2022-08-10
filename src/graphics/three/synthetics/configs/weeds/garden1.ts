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

const getVariedRandomRange = (min: number, max: number, minVariation: number, maxVariation?: number | undefined) => {
  if(!maxVariation) maxVariation = minVariation;

  const valueRange = max - min;
  const anchor = THREE.MathUtils.randFloat(min, max - valueRange * maxVariation);

  const variation = THREE.MathUtils.randFloat(minVariation, maxVariation);

  const rangeMin = anchor;
  const rangeMax = (anchor + 1.0) * variation;

  const range = {
    min: rangeMin,
    max: rangeMax
  };

  return () => randomInRange(range);
}

const randomInRange = (range: { min: number, max: number }) => {
  return THREE.MathUtils.randFloat(range.min, range.max);
}

export const getGardenConfig = (material: THREE.Material): WeedsConfig => {
  const count = Math.floor(Math.pow(Math.random(), 0.5) * 500);

  const spawnRange = randomInRange({ 
    min: 3, 
    max: count / 12 + 3
  });

  const width = getVariedRandomRange(
    3.0, 8,
    0.05, 0.2
  );

  const height = getVariedRandomRange(
    100, 200,
    0.1, 0.25
  );

  const bend = getVariedRandomRange(
    -0.1, -0.3,
    0.2
  );

  const thicknessPow = THREE.MathUtils.randFloat(0.5, 0.9);
  const thicknessRootMin = THREE.MathUtils.randFloat(0.1, 0.3);
  const thicknessRootFalloff = THREE.MathUtils.randFloat(1.0, 3.0);

  const noiseOffsetMultiplier = THREE.MathUtils.randFloat(1.5, 10);

  const directionalNoiseFrequency = THREE.MathUtils.randFloat(0.01, 0.08);
  const twistNoiseFrequency = THREE.MathUtils.randFloat(0.0, 0.1);

  const gravity = Math.pow(Math.random(), 2.0) * 0.20 + Math.random() * 0.05;
  const twist = THREE.MathUtils.randFloat(0.0, 0.25);
  const turn = THREE.MathUtils.randFloat(0.15, 0.3);
  const direction = THREE.MathUtils.randFloat(0.05, 0.3);
  const random = Math.pow(Math.random(), 2.0) * 0.2;

  return {
    count: Math.floor(Math.pow(Math.random(), 0.5) * 500),
    colors,

    spawner: () => new THREE.Vector3()
      .randomDirection()
      .multiply(new THREE.Vector3(1, 0.3, 1))
      .multiplyScalar(spawnRange),

    strawConfig: () => ({
      width: width(),
      height: height(),
      widthSegments: 5, 
      heightSegments: 200,

      bend: bend(),
      bendController: (n) => (
        1.0 - EASING.easeOutCubic(1.0 - n)
      ),
      
      thicknessController: (n) => (
        EASING.easeOutElastic(Math.pow(n, thicknessPow)) * (1.0 - Math.pow(n, thicknessRootFalloff) + thicknessRootMin)
      )
      ,

      noiseOffsetMultiplier: noiseOffsetMultiplier,
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
        frequency: twistNoiseFrequency,
        min: -1.0,
        max: 1.0
      },

      forces: {
        gravity,
        twist,
        turn,
        direction, 
        random
      },

      materialGenerator: () => {
        return material;
      }
      /*
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
      */
    })
  }
};