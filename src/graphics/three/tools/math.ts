import * as THREE from 'three';

export const random = THREE.MathUtils.randFloat;

export type Volume = {
  x : number,
  y : number,
  z : number,
  w : number,
  h : number,
  d : number
}

export const randomUnitVector3 = ( vector ?: THREE.Vector3 ) => {
  if( !vector ) vector = new THREE.Vector3();

  const angle = random( 0.0, Math.PI * 2.0 );
  const vz = random( 0.0, 2.0 ) - 1;
  const vzBase = Math.sqrt( 1 - vz * vz );
  const vx = vzBase * Math.cos( angle );
  const vy = vzBase * Math.sin( angle );

  return vector.set( vx, vy, vz );
};

export const remap = ( value : number, min : number, max : number, newMin : number, newMax : number ) => {
  const normalized = ( value - min ) / ( max - min );
  return normalized * ( newMax - newMin ) + newMin;
};
export const square = ( v : number ) => v * v;

export const volumePointIntersection = ( volume : Volume, point : THREE.Vector3 ) => {
  const { x, y, z, w, h, d } = volume;

  return ( point.x >= x ) && ( point.x < ( x + w ) )
        && ( point.y >= y ) && ( point.y < ( y + h ) )
        && ( point.z >= z ) && ( point.z < ( z + d ) );
};

export const spherePointIntersection = ( sphere : THREE.Sphere, point : THREE.Vector3 ) => {
  const { center, radius } = sphere;
    
  const distanceSquared = center.distanceToSquared( point );

  return distanceSquared < square( radius );
};


const box3 = new THREE.Box3();
export const sphereVolumeIntersection = ( sphere : THREE.Sphere, volume : Volume ) => {
  const { x, y, z, w, h, d } = volume;

  box3.min.set( x, y, z );
  box3.max.set( x + w, y + h, z + d );

  return box3.intersectsSphere( sphere );
};

export const getContainingVolume = ( points : THREE.Vector3[] ) => {
  const box = new THREE.Box3();

  points.forEach( point => {
    box.expandByPoint( point );
  } );

  return {
    x: box.min.x,
    y: box.min.y,
    z: box.min.z,
    w: box.max.x - box.min.x,
    h: box.max.y - box.min.y,
    d: box.max.z - box.min.z,
  };
};


export function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min( max, value ));
}

export function mapLinear( x: number, a1: number, a2: number, b1: number, b2: number ) {
	return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}

export const randomInVolume = (volume: Volume) => {
  const x = random(volume.x, volume.w);
  const y = random(volume.y, volume.h);
  const z = random(volume.z, volume.d);
  return new THREE.Vector3(x, y, z);
}

export const calculateVolume = (volume: Volume) => {
  return volume.w * volume.h * volume.d;
}

export const getVolumeCenter = (volume: Volume) => {
  return new THREE.Vector3( 
    volume.x + volume.w / 2.0,
    volume.y + volume.h / 2.0,
    volume.z + volume.d / 2.0
  )
}

export const volumeToBox3 = (volume: Volume) => {
  return new THREE.Box3(
    new THREE.Vector3(volume.x, volume.y, volume.z),
    new THREE.Vector3(volume.x + volume.w, volume.y + volume.h, volume.z + volume.d)
  );
}

// adapted from https://stackoverflow.com/a/49434653
export const randomGaussian = (mean: number) => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) return randomGaussian(mean) // resample between 0 and 1
  return mean * num
}