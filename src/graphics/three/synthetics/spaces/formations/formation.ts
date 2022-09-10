import * as THREE from 'three';
import { textureFromSmoothGeometry } from '../../../../utils/material';
import { getNoise3D } from '../../../procedural/noise/noise';
import normalTexturePath from '../../../../../assets/normal/normal-texture1.jpg';
import mapTexturePath from '../../../../../assets/normal/normal-texture1-grayscale.jpg';
import { lerpColors } from '../../../../utils/color';

export type FormationConfig = {
  size: number,
  detail: number,
  amount: number,
  minSteps: number,
  maxSteps: number,

  scale: { x: number, y: number, z: number },

  colors: THREE.Color[],

  defaultRoughness: number,
  defaultMetalness: number,
  normalScale: number,

  textureRepeat: number,

  noiseSettings: {
    octaves: number,
    frequency: number,
    min: number,
    max: number,
    lacunarity: number,
    persistance: number,
  }
}

export type InstancedConfig = {
  count: number
}

export const createFormation = (config: FormationConfig, instancedConfig: undefined | InstancedConfig = undefined) => {
  const geometry = new THREE.SphereBufferGeometry(config.size, config.detail, config.detail);
  const positionAttribute = geometry.getAttribute('position');

  const material = new THREE.MeshStandardMaterial({
    color: 'gray',
    roughness: 1.0,
    metalness: 1.0,
    side: THREE.DoubleSide,
    vertexColors: true,
    dithering: true
  });


  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute( new Float32Array( positionAttribute.count * 3 ), 3 )
  );

  const colorAttribute = geometry.getAttribute('color');

  const getNoise = (position: THREE.Vector3, offset: THREE.Vector3 | undefined) => {
    const settings = {
      offset,
      ...config.noiseSettings
    };

    let value = 0.0;
    for(let i = 0; i < config.noiseSettings.octaves; i++) {
      let n = getNoise3D(position, settings);
      settings.min *= settings.persistance;
      settings.max *= settings.persistance;
      settings.frequency *= settings.lacunarity;
      settings.frequency *= settings.lacunarity;

      n = config.amount * quantize(n, Math.floor(THREE.MathUtils.mapLinear(i, 0, config.noiseSettings.octaves, config.minSteps, config.maxSteps)));

      value += n;
    }

    return value;
  };

  const offsets = {
    x: new THREE.Vector3(0, 0, Math.random() * 130.41),
    y: new THREE.Vector3(0, Math.random() * -100.31, 0),
    z: new THREE.Vector3(Math.random() * 312.15, 0, 0)
  };

  const quantize = (value: number, steps: number) => {
    return Math.floor(value * steps) / steps;
  }

  const getOffset = (position: THREE.Vector3) => {
    let x = getNoise(position, offsets.x);
    let y = getNoise(position, offsets.y);
    let z = getNoise(position, offsets.z);

    return new THREE.Vector3(x, y, z);
  }
    
  const averageOffset = new THREE.Vector3();
  for(let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);

    const position = new THREE.Vector3(x, y, z);

    const offset = getOffset(position);

    positionAttribute.setXYZ(i, 
      (x + offset.x) * config.scale.x, 
      (y + offset.y) * config.scale.y, 
      (z + offset.z) * config.scale.z
    );

    const color = lerpColors(
      config.colors,
      0.8 * Math.abs(0.3 * (offset.x + offset.z * offset.y) / config.amount + Math.random() * 0.5) % 1.0
    );

    colorAttribute.setXYZ(i, color.r, color.g, color.b);

    averageOffset.add(new THREE.Vector3().copy(offset).multiplyScalar(1.0 / positionAttribute.count))
  }

  geometry.applyMatrix4(
    new THREE.Matrix4().makeTranslation(-averageOffset.x, -averageOffset.y, -averageOffset.z)
  );
  geometry.computeVertexNormals();

  // Texture
  const normalMap = new THREE.TextureLoader().load(normalTexturePath);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;

  normalMap.repeat.set(
    config.textureRepeat, config.textureRepeat
  );

  material.normalMap = normalMap;
  material.normalScale = new THREE.Vector2(1.0, 1.0).multiplyScalar(config.normalScale);

  const map = new THREE.TextureLoader().load(mapTexturePath);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  map.repeat.set(
    config.textureRepeat, config.textureRepeat
  );

  material.map = map;

  const defaultRoughnessMetalness = new THREE.Color(
    1.0,
    config.defaultRoughness,
    config.defaultMetalness,
  );

  const roughnessMetalnessMap = textureFromSmoothGeometry(
    geometry,
    (x, y, z, u, v, i) => {
      const r = colorAttribute.getX(i);
      const g = colorAttribute.getY(i);
      const b = colorAttribute.getZ(i);

      return new THREE.Color(
        1.0,
        config.defaultRoughness - 0.1 * r - b * 0.15,
        config.defaultMetalness + 0.2 * g - b * 0.3,
      );
    },
    defaultRoughnessMetalness
  );

  material.metalnessMap = roughnessMetalnessMap;
  material.roughnessMap = roughnessMetalnessMap;

  geometry.rotateX(
    THREE.MathUtils.randFloatSpread(Math.PI)
  );
  geometry.rotateY(
    THREE.MathUtils.randFloatSpread(Math.PI)
  );
  geometry.rotateZ(
    THREE.MathUtils.randFloatSpread(Math.PI)
  );

  if(instancedConfig) {
    return new THREE.InstancedMesh(
      geometry,
      material,
      instancedConfig.count
    )
  } else {
    return new THREE.Mesh(
      geometry,
      material
    );
  }
}