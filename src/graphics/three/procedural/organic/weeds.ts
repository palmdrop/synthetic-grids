import * as THREE from 'three';
import { getNoise3D } from '../noise/noise';

import normalTexturePath from '../../../../assets/normal/normal-texture1_x2.jpg';

type NoiseSettings = {
  frequency: number,
  min: number,
  max: number
}

type Forces = {
  gravity: number,
  twist: number,
  turn: THREE.Vector3,
  direction: number,
  random: number
}

export type StrawConfig = {
  width: number,
  height: number,
  widthSegments: number,
  heightSegments: number,

  bend: number,

  thicknessController: (n: number) => number,

  noiseOffsetMultiplier: number,

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
        .add(
          new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * config.forces.random)
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

    const perpendicular2 = new THREE.Vector3()
      .crossVectors(direction, perpendicular)
      .normalize();

    for(let sx = 0; sx < config.widthSegments; sx++) {
      const bendAmount = 
        config.bend * 
        Math.abs(sx - (config.widthSegments - 1) / 2.0) / ((config.widthSegments - 1.0 ) / 2.0);

      const point = position.clone()
        .add(
          perpendicular.clone().multiplyScalar(widthStep * sx - widthOffset)
        ).add(
          perpendicular2.clone().multiplyScalar(bendAmount * widthOffset)
        );

      positions.setXYZ(sx + sy * config.widthSegments, point.x, point.y, point.z);
    }
  };

  geometry.computeVertexNormals();
}


const c1 = new THREE.Color('#3e3f22');
const c2 = new THREE.Color('#202c10');
const normalMap = new THREE.TextureLoader().load(normalTexturePath);
normalMap.wrapS = THREE.RepeatWrapping;
normalMap.wrapT = THREE.RepeatWrapping;

const mapScale = 10;

export const getStraw = (
  config: StrawConfig,
  noiseOffset = new THREE.Vector3()
) => {
  // TODO: do not set every time, move to weeds function
  normalMap.repeat.set(
    mapScale * (config.width / config.height), mapScale
  );

  const strawMesh = new THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial | THREE.ShaderMaterial>(
    new THREE.PlaneGeometry(
      config.width, config.height,
      config.widthSegments - 1, config.heightSegments - 1
    ),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().lerpColors(c1, c2, Math.random()),
      metalness: 0.2,
      roughness: 0.4,
      side: THREE.DoubleSide,
      normalMap,
      normalScale: new THREE.Vector2(1, 1).multiplyScalar(0.5)
    })
  );

  const skeleton = createStrawSkeleton(config, strawMesh.position, noiseOffset);

  warpGeometry(strawMesh, skeleton, config);

  return strawMesh;
}

export const getWeeds = (
  config: StrawConfig,
  count: number,
  spawner: (index: number) => THREE.Vector3
) => {
  const object = new THREE.Object3D();

  for(let i = 0; i < count; i++) {
    const position = spawner(i);
    const straw = getStraw(
      config, 
      position.clone().multiplyScalar(
        config.directionNoiseSettings.frequency * config.noiseOffsetMultiplier
      )
    );

    straw.position.copy(position);

    straw.castShadow = true;
    straw.receiveShadow = true;

    object.add(straw);
  }

  return {
    object
  }
}