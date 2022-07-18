import * as THREE from 'three';
import type { Synthetic } from '../../synthetics/scene';
import { getNoise3D } from '../noise/noise';

import * as EASING from '../../../utils/easing';

type NoiseSettings = {
  frequency: number,
  min: number,
  max: number
}

type Forces = {
  gravity: number,
  twist: number,
  turn: THREE.Vector3,
  direction: number
}

type StrawConfig = {
  width: number,
  height: number,
  widthSegments: number,
  heightSegments: number,
  thicknessController: (n: number) => number,

  directionNoiseSettings: NoiseSettings,
  twistNoiseSettings: NoiseSettings,

  forces: Forces
}

type Segment = {
  position: THREE.Vector3,
  direction: THREE.Vector3,
  rotation: number // Rotation around direction
}


const gravity = new THREE.Vector3(0, -1, 0);
const right = new THREE.Vector3(1, 0, 0);

const createStrawSkeleton = (
  config: StrawConfig, 
  startPosition: THREE.Vector3,
  noiseOffset: THREE.Vector3 = new THREE.Vector3()
) => {
  // Forces
  const forces = config.forces;

  const segmentLength = config.height / config.heightSegments;
  const skeleton: Segment[] = [];

  let currentSegment: Segment = {
    position: startPosition,
    direction: gravity.clone().multiplyScalar(-1),
    rotation: 0
  };
  skeleton.push(currentSegment);

  for(let i = 1; i < config.heightSegments; i++) {
    const directionNoise = new THREE.Vector3(
      getNoise3D(currentSegment.position, {
        offset: new THREE.Vector3(0, 1000, 0).add(noiseOffset),
        ...config.directionNoiseSettings
      }),
      getNoise3D(currentSegment.position, {
        offset: new THREE.Vector3(0, 0, 0).add(noiseOffset),
        ...config.directionNoiseSettings
      }),
      getNoise3D(currentSegment.position, {
        offset: new THREE.Vector3(-315, 0, 0).add(noiseOffset),
        ...config.directionNoiseSettings
      }),
    );

    const direction = 
      currentSegment.direction.clone()
        .multiplyScalar(forces.direction)
        .add(
          directionNoise.multiply(forces.turn)
        )
        .add(
          gravity.clone().multiplyScalar(-forces.gravity)
        )
        .normalize();

    const position = currentSegment.position.clone()
      .add(
        direction.clone().multiplyScalar(segmentLength)
      );

    const rotation = currentSegment.rotation
      + getNoise3D(currentSegment.position, {
        offset: new THREE.Vector3(15, 415, 31.6),
        ...config.twistNoiseSettings
      });

    const nextSegment: Segment = {
      direction,
      position,
      rotation
    }

    // Add
    skeleton.push(nextSegment);
    currentSegment = nextSegment;
  }

  return skeleton;
}

const warpGeometry = (
  strawMesh: THREE.Mesh<THREE.PlaneGeometry>, 
  skeleton: Segment[], 
  config: StrawConfig,
) => {
  const geometry = strawMesh.geometry;
  const positions = geometry.getAttribute('position');

  for(let sy = 0; sy < skeleton.length; sy++) {
    const {
      position,
      rotation,
      direction
    } = skeleton[sy];

    const thickness = config.thicknessController(1.0 - sy / (skeleton.length - 1.0));

    const widthOffset = thickness * config.width / 2.0;
    const widthStep = thickness * config.width / config.widthSegments;

    const perpendicular = new THREE.Vector3()
      .crossVectors(direction, right)
      .normalize()
      .applyAxisAngle(direction, rotation);

    for(let sx = 0; sx < config.widthSegments; sx++) {
      const point = position.clone()
        .add(
          perpendicular.clone().multiplyScalar(widthStep * sx - widthOffset)
        );

      positions.setXYZ(sx + sy * config.widthSegments, point.x, point.y, point.z);
    }
  };

  geometry.computeVertexNormals();
}


export const getStraw = (noiseOffset = new THREE.Vector3()) => {
  const config: StrawConfig = {
    width: 1, 
    height: 30,
    widthSegments: 5, 
    heightSegments: 30,
    
    thicknessController: (n) => EASING.easeOutElastic(n),

    directionNoiseSettings: {
      frequency: 0.2,
      min: -2.3,
      max: 2.3
    },
    twistNoiseSettings: {
      frequency: 0.2,
      min: -0.9,
      max: 0.9
    },

    forces: {
      gravity: 0.3,
      twist: 0.2,
      turn: new THREE.Vector3(0.2, 0.2, 0.2),
      direction: 0.3
    }
  }

  const strawMesh = new THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial | THREE.ShaderMaterial>(
    new THREE.PlaneGeometry(
      config.width, config.height,
      config.widthSegments - 1, config.heightSegments - 1
    ),
    new THREE.MeshStandardMaterial({
      color: 'red',
      metalness: 0.3,
      roughness: 0.8,
      side: THREE.DoubleSide
    })
  );

  const skeleton = createStrawSkeleton(config, strawMesh.position, noiseOffset);

  warpGeometry(strawMesh, skeleton, config);

  strawMesh.rotateY(Math.PI / 2.0);

  strawMesh.position.set(0, -15, 0);

  const straw: Synthetic = {
    object: strawMesh
  }

  return straw;
}
