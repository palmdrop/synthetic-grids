import * as THREE from 'three';
import type { Program } from "../../../../modules/substrates/src/interface/types/program/program";
import { buildProgramShader } from "../../../../modules/substrates/src/shader/builder/programBuilder";
import { getUniformName } from '../../../../modules/substrates/src/shader/builder/utils/shader';
import { setUniform } from "../../../../modules/substrates/src/utils/shader";
import { FullscreenQuadRenderer } from "../../tools/FullscreenQuadRenderer";
import type { BackgroundRenderer } from "../scene";

export const getBackgroundRenderer = (
  renderer: THREE.WebGLRenderer, 
  renderTarget: THREE.WebGLRenderTarget,
  program: Program
) => {
  const shader = buildProgramShader(program);

  const material = new THREE.ShaderMaterial(shader);

  const fullscreenRenderer = new FullscreenQuadRenderer(
    renderer,
    material,
    renderTarget
  ) as unknown as BackgroundRenderer;

  const scaleUniform = getUniformName(program.rootNode, 'scale');

  fullscreenRenderer.update = function (properties) {
    setUniform(
      'time',
      properties.time,
      this.quad.material
    );

    setUniform(
      scaleUniform,
      properties.scale,
      this.quad.material
    );
  }

  return fullscreenRenderer;
}