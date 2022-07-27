import * as THREE from 'three';
import { getNoise3D } from '../noise/noise';

import normalTexturePath from '../../../../assets/normal/normal-texture1_x2.jpg';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { createLineBox } from '../../../utils/lines';

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

export type GridConfig = {
  cells: {
    x: number,
    y: number,
    z: number
  },
  padding?: number,
  scaleToFit?: boolean,
  color?: THREE.ColorRepresentation
}

export type StrawConfig = {
  width: number,
  height: number,
  widthSegments: number,
  heightSegments: number,

  widthNoiseSettings?: NoiseSettings,

  bend: number,

  bendController: (n: number) => number,
  thicknessController: (n: number) => number,

  noiseOffsetMultiplier: number,

  startDirection?: THREE.Vector3 | (() => THREE.Vector3),
  directionNoiseSettings: NoiseSettings,
  twistNoiseSettings: NoiseSettings,

  forces: Forces,

  materialGenerator?: (index: number, position: THREE.Vector3) => THREE.Material,
}

export type ConfigGenerator = (position: THREE.Vector3, index: number, cell: number) => StrawConfig;

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

  const startDirection = !config.startDirection 
    ? gravity.clone().multiplyScalar(-1)
    : typeof config.startDirection === 'function'
      ? config.startDirection()
      : config.startDirection;

  let currentSegment: Segment = {
    position: startPosition,
    direction: startDirection,
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
      }) * config.forces.twist;

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

    const widthVariation = config.widthNoiseSettings 
      ? getNoise3D(position, {
          offset: new THREE.Vector3(-41.31, 0.31, -131.3), 
          ...config.widthNoiseSettings
        }) 
      : 1.0;

    const thickness = widthVariation * config.thicknessController(1.0 - sy / (skeleton.length - 1.0));

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
        config.bendController(
          Math.abs(sx - (config.widthSegments - 1) / 2.0) / ((config.widthSegments - 1.0 ) / 2.0)
        );

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


const c1 = new THREE.Color('#555500');
const c2 = new THREE.Color('#00331a');
export const defaultNormalMap = new THREE.TextureLoader().load(normalTexturePath);

const mapScale = 10;

export const getStraw = (
  config: StrawConfig,
  noiseOffset = new THREE.Vector3(),
  index?: number
) => {
  // TODO: do not set every time, move to weeds function
  const normalMap = defaultNormalMap;
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;

  normalMap.repeat.set(
    mapScale * (config.width / config.height), mapScale
  );

  const strawMesh = new THREE.Mesh<THREE.PlaneGeometry, THREE.Material>(
    new THREE.PlaneGeometry(
      config.width, config.height,
      config.widthSegments - 1, config.heightSegments - 1
    ),
    config.materialGenerator 
      ? new THREE.MeshBasicMaterial({})
      : new THREE.MeshStandardMaterial({
        color: new THREE.Color().lerpColors(c1, c2, Math.random()),
        metalness: 0.0,
        roughness: 0.5,
        side: THREE.DoubleSide,
        normalMap,
        normalScale: new THREE.Vector2(1, 1).multiplyScalar(0.2)
      })
  );

  const skeleton = createStrawSkeleton(config, strawMesh.position, noiseOffset);

  warpGeometry(strawMesh, skeleton, config);

  if(config.materialGenerator) {
    const center = new THREE.Box3().setFromObject(strawMesh).getCenter(new THREE.Vector3());
    strawMesh.material = config.materialGenerator(index ?? 0, center);
  }

  return strawMesh;
}

export const getWeeds = (
  config: StrawConfig | ConfigGenerator,
  count: number,
  spawner: (index: number) => THREE.Vector3,
  boxColor: THREE.ColorRepresentation | undefined = undefined,
  offset?: THREE.Vector3,
  cell?: number,
  center: boolean = true
): THREE.Object3D => {
  const object = new THREE.Object3D();
  for(let j = 0; j < count; j++) {
    const position = spawner(j);
    const strawConfig = typeof config === 'function'
      ? config(position, j, cell ?? 0)
      : config;

    const straw = getStraw(
      strawConfig, 
      position.clone().multiplyScalar(
        strawConfig.directionNoiseSettings.frequency * strawConfig.noiseOffsetMultiplier
      ).add(offset ?? new THREE.Vector3()),
      j
    );

    straw.position.copy(position);

    straw.castShadow = true;
    straw.receiveShadow = true;

    object.add(straw);
  }

  if(boxColor) {
    const boxHelper = new THREE.BoxHelper(
      object,
      boxColor
    );

    boxHelper.update();
  }

  if(center) {
    const box = new THREE.Box3().setFromObject(object);
    const centerPoint = box.getCenter(new THREE.Vector3());

    object.children.forEach(child => {
      child.position.sub(centerPoint);
    });
  }


  return object;
}

export const getWeedsGrid = (
  config: StrawConfig | ConfigGenerator,
  count: number,
  spawner: (index: number) => THREE.Vector3,
  gridConfig: GridConfig,
  gui?: dat.GUI
): THREE.Object3D => {
  const weedsObject = new THREE.Object3D();
  const objects: { 
    cell: THREE.Vector3, 
    object: THREE.Object3D,
    box: THREE.Box3
  }[] = [];
  const cells = gridConfig.cells;
  const offset = new THREE.Vector3(new Date().getMilliseconds(), 0, 0);

  const getIndex = (x: number, y: number, z: number) => {
    return x + cells.x * (y + cells.y * z);
  }

  let maxBox: THREE.Box3 = new THREE.Box3();
  for(let x = 0; x < gridConfig.cells.x; x++) 
  for(let y = 0; y < gridConfig.cells.y; y++) 
  for(let z = 0; z < gridConfig.cells.z; z++) {
    const index = getIndex(x, y, z);
    const cell = new THREE.Vector3(x, y, z);

    const object = getWeeds(
      config,
      count,
      spawner,
      undefined,
      // offset,
      cell.clone().add(offset),
      index
    );

    const box = new THREE.Box3().setFromObject(object);
    maxBox.union(box);

    objects[index] = {
      object,
      cell,
      box
    };
  }

  const maxBoxValues = new THREE.Vector3(
    Math.max(Math.abs(maxBox.min.x), Math.abs(maxBox.max.x)),
    Math.max(Math.abs(maxBox.min.y), Math.abs(maxBox.max.y)),
    Math.max(Math.abs(maxBox.min.z), Math.abs(maxBox.max.z))
  );

  maxBox.max.copy(maxBoxValues).multiplyScalar(1 + (gridConfig.padding ?? 0));
  maxBox.min.copy(maxBoxValues).multiplyScalar(-(1 + (gridConfig.padding ?? 0)));

  const cellDimensions = maxBox.getSize(new THREE.Vector3());

  const lineMaterial = new LineMaterial({
    color: new THREE.Color(gridConfig.color).getHex(),
    linewidth: 0.002,
  });

  if(gui) {
    // gui.removeFolder('lineMaterial');
    const folder = gui.__folders['lineMaterial'];
    if(folder) gui.removeFolder(folder);
    const lineMaterialFolder = gui.addFolder('lineMaterial');
    lineMaterialFolder.add(lineMaterial, 'linewidth', 0.0, 0.1);
  }

  objects.forEach(({ object, cell }) => {
    object.position
      .copy(cell)
      .sub(new THREE.Vector3(
        (cells.x - 1.0) / 2.0,
        (cells.y - 1.0) / 2.0,
        (cells.z - 1.0) / 2.0
      ))
      .multiply(cellDimensions);
    
    weedsObject.add(object);

    if(gridConfig.color) {
      const lineBox = createLineBox(maxBox, lineMaterial);
      lineBox.position.copy(object.position);

      weedsObject.add(
        lineBox
      );
    }
  });

  return weedsObject;
}
