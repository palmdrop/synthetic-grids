import * as THREE from 'three';
import { mapShader } from '../../../../glsl/shaders/mapShader';
import { transparentMapShader } from '../../../../glsl/shaders/transparentMapShader';
import { getFernsConfig } from '../../configs/weeds/ferns1';
import { getForGlowConfig } from '../../configs/weeds/for-glow1';
import { getGardenConfig } from '../../configs/weeds/garden1';
import { getSwampshrubConfig } from '../../configs/weeds/swampshrub1';

export const weedsMaterial = new THREE.ShaderMaterial(
  {
    ...transparentMapShader,
    alphaTest: 0.0,
  }
);

export const getWeedsConfig = 
  // getSwampshrubConfig;
  getForGlowConfig;
  // getFernsConfig;
  /*
  (material: THREE.Material) => {
    const config = getGardenConfig(material);
    return {
      ...config,
      colors: getForGlowConfig(material).colors
    }
  };
  */