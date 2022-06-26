import { getNoise3D, type NoiseParams } from '../../../procedural/noise/noise';
import * as THREE from 'three';
import { gridShader } from '../../../../glsl/shaders/gridShader';
import { mapShader } from '../../../../glsl/shaders/mapShader';
import { mapWarpShader } from '../../../../glsl/shaders/mapWarpShader';

export type LayerConfig = {
  dimensions: { width: number, height: number },
  tesselation: { x: number, y: number },
  noiseParams?: NoiseParams,
  octaves?: number,
  flatShading?: boolean
}

export const generateTerrain = (
  config: LayerConfig,
  material: THREE.Material
) => {
  /*
  const planeGeometry = new THREE.PlaneBufferGeometry(
    config.dimensions.width,
    config.dimensions.height,
    config.tesselation.x,
    config.tesselation.y
  );
  */
  const planeGeometry = new THREE.SphereBufferGeometry(
    config.dimensions.width,
    // config.dimensions.height,
    config.tesselation.x,
    config.tesselation.y
  );

  const mesh = new THREE.Mesh(
    planeGeometry,
    material
  );

  return mesh;
}

const warpGeometry = (
  geometry: THREE.BufferGeometry,
  config: LayerConfig
) => {
  const octaves = config.octaves ?? 1.0;

  const positionAttribute = geometry.attributes.position;
  for(let octave = 0; octave < octaves; octave++) {
    for(let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      const n = getNoise3D(
        { x, y, z }, 
        config.noiseParams ?? {
          frequency: 3.1,
          min: 0.0,
          max: 1.0
        }
      );

      positionAttribute.setXYZ(
        i,
        x, y, z + n * 0.4
      );
    }
  }

  geometry.computeVertexNormals();

  return geometry;
}