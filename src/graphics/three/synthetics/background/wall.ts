import * as THREE from 'three';
import type { Program } from "../../../../modules/substrates/src/interface/types/program/program";
import { makeFuseShader } from "../../../glsl/shaders/fuse/fuseShader";
import { addNormalWarpGUI, makeCustomNormalWarpShader } from "../../../glsl/shaders/normalWarp/customNormalWarpShader.ts";
import { Synthetic, updateShaderUtil } from "../scene";

export const getBackgroundWall = (defaultProgram: Program, gui: dat.GUI): Synthetic<THREE.Mesh> => {
  const buildShader = (program: Program) => {
    const fuseShaderData = makeFuseShader({
      normalOffset: { type: 'float' }
    }, '', []);

    return makeCustomNormalWarpShader(program, fuseShaderData);
  }

  const geometry = new THREE.PlaneBufferGeometry(
    40, 60, 1000, 1000
  );

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.ShaderMaterial(buildShader(defaultProgram))
  );

  mesh.position.set(
    0, 0, -30
  );

  const updateShader = updateShaderUtil(
    mesh,
    buildShader,
    material => {
      material.side = THREE.DoubleSide;
      material.extensions.derivatives = true;
      if(gui) addNormalWarpGUI(gui, material, 'wall');
    },
    {
      frequency: 0.25,
      amplitude: 1.0
    }
  );

  updateShader(defaultProgram);

  return {
    object: mesh,
    updateShader
  }
}