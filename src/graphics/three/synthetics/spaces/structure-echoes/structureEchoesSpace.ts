import * as THREE from 'three';
import { createWarpedTerrain } from '../../terrain/warpedTerrain';
import { mapNormalShader } from '../../../../glsl/shaders/normalWarp/mapNormalShader';
import { createProgramManager, MaterialObject } from '../../programs/programManager';
import type { SceneProperties, Synthetic, SyntheticSpace } from '../../scene';
import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';

const updateCamera = (object: THREE.Object3D, renderScene: AbstractRenderScene, margin = 0.1) => {
  if(!(renderScene.camera as THREE.OrthographicCamera).isOrthographicCamera) return;

  const camera = renderScene.camera;

  const box = new THREE.Box3().expandByObject(object);
  const size = box.getSize(new THREE.Vector3());

  const maxDimension = Math.max(size.x, size.y);
  const rendererSize = renderScene.renderer.getSize(new THREE.Vector2());

  const dimensionMultiplier = rendererSize.x > rendererSize.y ? rendererSize.x / rendererSize.y : 1.0;

  const resizer = makeAspectOrthoResizer(
    camera as THREE.OrthographicCamera, 
    dimensionMultiplier * maxDimension * (1.0 + margin)
  );

  resizer.setSize(rendererSize.x, rendererSize.y);
}

const getNormalizedMousePosition = (properties: SceneProperties) => {
  const nx = properties.mousePosition.x / properties.dimensions.x;
  const ny = properties.mousePosition.y / properties.dimensions.y;
  return { nx, ny };
}

const rotateObjectWithMouse = (
  synthetic: Synthetic, 
  xAmount: number,
  yAmount: number
) => {
  const oldUpdateMethod = synthetic.update;

  synthetic.update = (properties, renderScene, delta) => {
    oldUpdateMethod?.(properties, renderScene, delta);
    const { nx, ny } = getNormalizedMousePosition(properties);

    const xRotation = THREE.MathUtils.mapLinear(
      ny, 0, 1,
      -xAmount, xAmount
    );
    const yRotation = THREE.MathUtils.mapLinear(
      nx, 0, 1,
      -yAmount, yAmount
    );

    synthetic.object.rotation.x = xRotation;
    synthetic.object.rotation.y = yRotation;
  }
}

export const spaceMetadata = {
  postProcessing: true
}

export const getStructureEchoesSpace = (
  renderScene: AbstractRenderScene,
  interactive?: boolean,
  data?: Record<string, any>
): SyntheticSpace => {
  const gui = renderScene.gui;
  const renderer = renderScene.renderer;
  const size = renderer.getSize(new THREE.Vector2());
  const backgroundRenderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {});

  const terrain = createWarpedTerrain(
    new THREE.PlaneBufferGeometry(
      20, 20, 1000, 1000
    ),
    mapNormalShader,
    gui
  );

  terrain.object.geometry.computeVertexNormals();
  // terrain.object.rotateX(-Math.PI / 2.0 + THREE.MathUtils.randFloat(0.3, 1.0));
  // terrain.object.rotateZ(THREE.MathUtils.randFloatSpread(0.5));

  // terrain.object.position.y += -20;
  
  const defaultWallProgram = data!.program;
  
  // const backgroundRenderer = getBackgroundRenderer(renderer, backgroundRenderTarget, defaultBackgroundProgram);
  // const { synthetic: backgroundWall, materialObject: wallObject } = getBackgroundWall(defaultWallProgram, gui);

  // On update
  /*
  rotateObjectWithMouse(
    terrain,
    Math.PI / 3.0, Math.PI / 3.0
  );

  rotateObjectWithMouse(
    backgroundWall,
    Math.PI / 8.0, Math.PI / 8.0
  );
  */

  if(interactive ?? true) {
    // Programs
    createProgramManager({
      'terrain': {
        object: terrain.object as MaterialObject,
        // defaultProgram: defaultWallProgram,
        onChange: (program) => {
          terrain.updateShader(program);
          return terrain.object.material as THREE.ShaderMaterial;
        }
      },
      /*
      'background': {
        object: backgroundRenderer as MaterialObject,
        defaultProgram: defaultBackgroundProgram
      },
     
      'wall': {
        object: wallObject as MaterialObject,
        onChange: (program) => {
          backgroundWall?.updateShader(program);
          return wallObject.material as THREE.ShaderMaterial;
        }
      },
      'combined': {
        object: { material: new THREE.MeshBasicMaterial() },
        onChange: (program) => {
          terrain.updateShader(program);
          backgroundWall.updateShader(program);
          return terrain.object.material as THREE.ShaderMaterial;
        }
      }
      */
    }, gui, 'terrain');
  }

  return {
    sceneConfigurator: (scene: THREE.Scene) => {
      scene.background = backgroundRenderTarget.texture;
    },
    onResize: () => {
      updateCamera(terrain.object, renderScene);
    },
    // backgroundRenderer, 
    synthetics: [
      terrain,
      // backgroundWall
    ],
    postProcessing: true
  }
}