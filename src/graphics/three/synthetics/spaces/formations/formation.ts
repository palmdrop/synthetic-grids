import * as THREE from 'three';
import { textureFromSmoothGeometry } from '../../../../utils/material';
import { getNoise3D } from '../../../procedural/noise/noise';
import normalTexturePath from '../../../../../assets/normal/normal-texture1.jpg';
import mapTexturePath from '../../../../../assets/normal/normal-texture1-grayscale.jpg';
import { lerpColors } from '../../../../utils/color';

export const createBoulder = () => {
  const octaves = 5;
  const size = 50;
  const detail = 400;
  const amount = 30;
  // TODO: distorted rocks with low step count
  // TODO: and also low detail... make grid
  const minSteps = 3;
  const maxSteps = 1000;

  const scale = {
    x: THREE.MathUtils.randFloat(0.8, 1.5),
    y: THREE.MathUtils.randFloat(0.8, 1.5),
    z: THREE.MathUtils.randFloat(0.8, 1.5),
  };

  const colors = [
    new THREE.Color('#a3adad'),
    new THREE.Color('#dad9cc'),
    new THREE.Color('#b9b9b5'),
    new THREE.Color('#d9f2e1'),
  ];

  const defaultRoughness = 0.8;
  const defaultMetalness = 0.15;
  const normalScale = 3.0;

  const textureRepeat = 10;

  const noiseSettings = {
    frequency: 0.008,
    min: -1.0,
    max: 1.0,
    lacunarity: 1.49,
    persistance: 0.35,
  }

  // TODO: add scale to object! scale in diff direction, then rotate
  const geometry = new THREE.SphereBufferGeometry(size, detail, detail);
  // const geometry = new THREE.BoxBufferGeometry(size, size, size, detail, 10, detail);
  const positionAttribute = geometry.getAttribute('position');

  const material = new THREE.MeshStandardMaterial({
    color: 'gray',
    roughness: 1.0,
    metalness: 1.0,
    side: THREE.DoubleSide,
    vertexColors: true,
    dithering: true
  });


  /*
  const geometry = new THREE.BoxBufferGeometry(
    50, 50, 50,
    detail, detail, detail
  );
  */
  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute( new Float32Array( positionAttribute.count * 3 ), 3 )
  );

  const colorAttribute = geometry.getAttribute('color');

  const getNoise = (position: THREE.Vector3, offset: THREE.Vector3 | undefined) => {
    const settings = {
      offset,
      ...noiseSettings
    };

    let value = 0.0;
    for(let i = 0; i < octaves; i++) {
      let n = getNoise3D(position, settings);
      settings.min *= settings.persistance;
      settings.max *= settings.persistance;
      settings.frequency *= settings.lacunarity;
      settings.frequency *= settings.lacunarity;

      n = amount * quantize(n, Math.floor(THREE.MathUtils.mapLinear(i, 0, octaves, minSteps, maxSteps)));

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
    
  for(let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);

    const position = new THREE.Vector3(x, y, z);

    const offset = getOffset(position);

    positionAttribute.setXYZ(i, 
      (x + offset.x) * scale.x, 
      (y + offset.y) * scale.y, 
      (z + offset.z) * scale.z
    );

    /*
    const color = new THREE.Color().lerpColors(
      startColor, 
      endColor, 
      Math.abs(0.3 * (offset.x + offset.z * offset.y) / amount + Math.random() * 0.5) % 1.0
    );
    */
    const color = lerpColors(
      colors,
      0.8 * Math.abs(0.3 * (offset.x + offset.z * offset.y) / amount + Math.random() * 0.5) % 1.0
    );

    colorAttribute.setXYZ(i, color.r, color.g, color.b);
  }

  geometry.computeVertexNormals();

  // Texture
  const normalMap = new THREE.TextureLoader().load(normalTexturePath);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;

  normalMap.repeat.set(
    textureRepeat, textureRepeat
  );

  material.normalMap = normalMap;
  material.normalScale = new THREE.Vector2(1.0, 1.0).multiplyScalar(normalScale);

  const map = new THREE.TextureLoader().load(mapTexturePath);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  map.repeat.set(
    textureRepeat, textureRepeat
  );

  material.map = map;

  const defaultRoughnessMetalness = new THREE.Color(
    1.0,
    defaultRoughness,
    defaultMetalness,
  );

  const roughnessMetalnessMap = textureFromSmoothGeometry(
    geometry,
    (x, y, z, u, v, i) => {
      const r = colorAttribute.getX(i);
      const g = colorAttribute.getY(i);
      const b = colorAttribute.getZ(i);

      return new THREE.Color(
        1.0,
        defaultRoughness - 0.1 * r - b * 0.15,
        defaultMetalness + 0.2 * g - b * 0.3,
      );
    },
    defaultRoughnessMetalness
  );

  material.metalnessMap = roughnessMetalnessMap;
  material.roughnessMap = roughnessMetalnessMap;


  const mesh = new THREE.Mesh(
    geometry,
    material
  );


  return mesh;
}