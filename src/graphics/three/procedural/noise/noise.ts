import { makeNoise3D } from 'fast-simplex-noise';
import * as THREE from 'three';
// import { clamp } from 'three/src/math/MathUtils';

export type Vector3 = { x : number, y : number, z : number };

export type NoiseParams = { 
  offset? : Vector3
  frequency : number | Vector3,
  min ?: number, 
  max ?: number
};

export const noise3D = makeNoise3D();

export const getNoise3D = (
  position: Vector3, 
  { 
    offset,
    frequency,
    min = -1.0, 
    max = 1.0 
  }: NoiseParams
): number => {
  let x = position.x;
  let y = position.y;
  let z = position.z;

  if( typeof frequency === 'number' ) {
    x *= frequency;
    y *= frequency;
    z *= frequency;
  } else {
    x *= frequency.x;
    y *= frequency.y;
    z *= frequency.z;
  }

  if( offset ) {
    x += offset.x;
    y += offset.y;
    z += offset.z;
  }
  const n = ( noise3D( x, y, z ) + 2.0 ) / 4.0;
  return THREE.MathUtils.clamp( min + ( max - min ) * n, min, max );
};