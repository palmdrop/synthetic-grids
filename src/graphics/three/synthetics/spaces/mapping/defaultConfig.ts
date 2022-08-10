import * as THREE from 'three';
import { mapShader } from '../../../../glsl/shaders/mapShader';
import { getFernsConfig } from '../../configs/weeds/ferns1';
import { getGardenConfig } from '../../configs/weeds/garden1';
import { getSwampshrubConfig } from '../../configs/weeds/swampshrub1';

export const weedsMaterial = new THREE.ShaderMaterial(
  {
    ...mapShader,
    side: THREE.DoubleSide
  }
);

export const getWeedsConfig = 
  // getSwampshrubConfig;
  // getFernsConfig;
  getGardenConfig;