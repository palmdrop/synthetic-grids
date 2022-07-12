import * as THREE from 'three';
import type { Program } from "../../../../modules/substrates/src/interface/types/program/program";
import { setUniform } from '../../../../modules/substrates/src/utils/shader';
import { makeFuseShader } from "../../../glsl/shaders/fuse/fuseShader";
import { addNormalWarpGUI, makeCustomNormalWarpShader } from "../../../glsl/shaders/normalWarp/customNormalWarpShader.ts";
import { addUniforms } from '../../systems/GuiUtils';
import { Synthetic, updateShaderUtil } from "../scene";


const images = Object.values(import.meta.globEager('../../../../assets/images/*')).map(module => module.default);


export const getBackgroundWall = (defaultProgram: Program, gui: dat.GUI): Synthetic<THREE.Mesh> => {
  const offset = Math.floor(Math.random() * images.length) + 1.0;
  const pickedImages: string[] = [];
  for(let i = 1; i <= 3; i++) {
    const index = (i * offset) % images.length;
    pickedImages.push(images[index]);
  }

  const textureLoader = new THREE.TextureLoader();
  const textures = pickedImages.map(image => (
    textureLoader.load(image, t => {
      console.log(t);
    }, undefined, (err) => {
      console.log(err, image);
    })
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
      frequency: 0.25,
      amplitude: 1.0
    }
  );

  updateShader(defaultProgram);

  return {
    object: mesh,
    updateShader,
    update
  }
}