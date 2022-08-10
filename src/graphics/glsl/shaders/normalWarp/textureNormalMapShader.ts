import type { Uniforms } from "../../../../modules/substrates/src/shader/types/core";
import { CopyShader } from "../copy/copyShader";
import { mapNormalShader } from "./mapNormalShader";

let fragmentShader = '' + mapNormalShader.fragmentShader;

fragmentShader = fragmentShader.replace(
  'varying float normalOffset;',
  ''
);

fragmentShader = fragmentShader.replace(
  'float coord = normalOffset * scale.y;',
  `
    vec4 texel = texture(tDiffuse, vUv);
    float bri = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
    float coord = bri * scale.y;
  `
);

// new String(mapNormalShader.fragmentShader);

export const textureNormalMapShader: Omit<THREE.Shader, 'uniforms'> & { uniforms: Uniforms } = {
  vertexShader: CopyShader.vertexShader,
  fragmentShader,
  // fragmentShader: CopyShader.fragmentShader,
  uniforms: {
    ...mapNormalShader.uniforms
  }
}