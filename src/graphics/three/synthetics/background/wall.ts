import * as THREE from 'three';
import type { Program } from "../../../../modules/substrates/src/interface/types/program/program";
import { setUniform } from '../../../../modules/substrates/src/utils/shader';
import { makeFuseShader } from "../../../glsl/shaders/fuse/fuseShader";
import { addNormalWarpGUI, makeCustomNormalWarpShader } from "../../../glsl/shaders/normalWarp/customNormalWarpShader.ts";
import { addUniforms } from '../../systems/GuiUtils';
import { Synthetic, updateShaderUtil } from "../scene";

const images = Object.values(import.meta.globEager('../../../../assets/images/*')).map(module => module.default);

export const getBackgroundWall = (defaultProgram: Program, gui: dat.GUI): { synthetic: Synthetic<THREE.Object3D>, materialObject: THREE.Mesh } => {
  const offset = Math.floor(Math.random() * images.length) + 1.0;
  const pickedImages: string[] = [];
  for(let i = 1; i <= 5; i++) {
    const index = (i * offset) % images.length;
    pickedImages.push(images[index]);
  }

  const textureLoader = new THREE.TextureLoader();
  const textures = pickedImages.map(image => (
    textureLoader.load(image)
  ));

  const buildShader = (program: Program) => {
    const fuseShaderData = makeFuseShader({
        normalOffset: { type: 'float' },
      }, 
      `float n = normalOffset;`, 
      textures
    );

    return makeCustomNormalWarpShader(program, fuseShaderData);
  }

  const geometry = 
    // new THREE.SphereBufferGeometry(50, 1000, 1000);
    new THREE.PlaneBufferGeometry(
      60, 100, 1000, 1000
    );

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.ShaderMaterial(buildShader(defaultProgram))
  );

  mesh.position.set(
    0, 0, -30
  );

  const object = new THREE.Object3D();
  object.add(mesh);

  const update = (properties) => {
    setUniform(
      'time',
      properties.time,
      mesh.material
    );
  }

  const updateShader = updateShaderUtil(
    mesh,
    buildShader,
    material => {
      material.side = THREE.DoubleSide;
      setUniform('textures', textures, material);
      if(gui) {
        const folder = addNormalWarpGUI(gui, material, 'wall');
        addUniforms(folder, material, {
          strength: {
            min: 0.0,
            max: 2.0,
            step: 0.001
          }
        });
      }
    },
    {
      frequency: 0.063,
      amplitude: 2.0
    },
    material => {
      mesh.material = material;
    }
  );

  updateShader(defaultProgram);

  const synthetic = {
    object,
    updateShader,
    update
  };

  return {
    synthetic,
    materialObject: mesh
  }
}