import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { createFormation } from '../formations/formation';
import { createLineBox } from '../../../../utils/lines';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { createBackgroundRenderer } from '../formations/background';
import { getTree } from './tree';
import { updateFormations } from './formations';
import { volumeToBox3 } from '../../../tools/math';
import { getBackgroundRenderer } from '../../background/background';
import { decodeProgram } from '../../../../../modules/substrates/src/stores/programStore';
import encodedGateProgram from '../../programs/skies5.json';
import { rgbToHsl } from '../../../../utils/color';

// import bg from '../../../../../assets/images/sky4.jpg';

const backgrounds = Object.values(import.meta.globEager('../../../../../assets/images/sky*.jpg')).map((module: any) => module.default);
const backgroundPalettes = Object.values(import.meta.globEager('../../../../../assets/palettes/skies/*.json')).map((module: any) => module.default);
const backgroundIndex = Math.floor(Math.random() * backgrounds.length);

const backgroundImage = backgrounds[backgroundIndex];
const backgroundPalette = backgroundPalettes[backgroundIndex];

export const spaceMetadata = {
  postProcessing: true
}

const updateCamera = (box: THREE.Box3, renderScene: AbstractRenderScene, margin = 0.4) => {
  if(!(renderScene.camera as THREE.OrthographicCamera).isOrthographicCamera) return;

  const camera = renderScene.camera;

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

export const getCliffscapeSpace
 = (
  renderScene: AbstractRenderScene,
  interactive?: boolean
): SyntheticSpace => {
  const parent = new THREE.Object3D();

  // updateFormation(parent, renderScene);
  const { object, octree } = getTree(backgroundPalette[0].color);

  // parent.add(object);
  // parent.rotateX(0.3);
  // parent.rotateY(0.5);

  // TODO: Try calm cloud background?

  const synthetic: Synthetic = {
    object: parent,
    metadata: {},
  };

  updateFormations(synthetic, renderScene, octree);
  synthetic.object.add(object);

  // Background
  /*
  const {
    backgroundRenderer,
    renderTarget: backgroundRenderTarget
  } = createBackgroundRenderer(renderScene.renderer, renderScene.scene, renderScene.camera);
  */

  const backgroundRenderTarget = new THREE.WebGLRenderTarget(1, 1, {});
  const backgroundRenderer = getBackgroundRenderer(
    renderScene.renderer, backgroundRenderTarget, 
    decodeProgram(encodedGateProgram)
  );

  // renderScene.resizeables.push(backgroundRenderer);

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      updateCamera(volumeToBox3(octree.getVolume()), renderScene);
    },
    onClick: () => {
      updateFormations(synthetic, renderScene, octree);
      synthetic.object.add(object);
      updateCamera(volumeToBox3(octree.getVolume()), renderScene);
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      // scene.background = backgroundRenderTarget.texture;
      const background = new THREE.TextureLoader().load(backgroundImage);
      // scene.background = new THREE.Color('#696666');
      const backgroundColor = backgroundPalette[backgroundPalette.length - 1].color;
      /*
      scene.background = new THREE.Color(
        backgroundColor.r / 255,
        backgroundColor.g / 255,
        backgroundColor.b / 255
      );
      */
      scene.background = background;

      camera.position.set(0, 0, 80);

      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const directionalLight = new THREE.DirectionalLight('white', 4.8);
      directionalLight.position.set(-10, 5, 10);
      directionalLight.castShadow = true;

      directionalLight.castShadow = true;
      directionalLight.shadow.bias = -0.001;

      directionalLight.shadow.mapSize.width = 1024 * 2;
      directionalLight.shadow.mapSize.height = 1024 * 2;
      directionalLight.shadow.camera.near = 0.0;
      directionalLight.shadow.camera.far = 1024;

      directionalLight.shadow.camera.left = -75;
      directionalLight.shadow.camera.right = 75;
      directionalLight.shadow.camera.top = 75;
      directionalLight.shadow.camera.bottom = -75;

      const ambientLight = new THREE.AmbientLight('white', 1.2);

      let { h, s, l } = rgbToHsl(backgroundPalette[Math.floor(Math.random() * backgroundPalette.length)].color);
      h /= 360;
      s /= 100;
      l /= 100;

      const pointLightColor = new THREE.Color().setHSL(
        h, 
        Math.pow(s, 0.4),
        Math.pow(l, 0.6)
      );

      const pointLight = new THREE.PointLight(pointLightColor, 8.0, 1000, 0.3);
      // pointLight.position.set(0, -100, 0);
      pointLight.position.set(0, 0, 0);

      const plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(),
        new THREE.MeshBasicMaterial({
          map: background
        })
      );

      // TODO: try rotating monuments floating ABOVE "sky"

      plane.scale.set(1.0, 1.5, 1.0).multiplyScalar(30);
      plane.position.set(0, 0, -30);

      scene.add(
        directionalLight,
        ambientLight,
        pointLight,
        // plane
      );
    },
    synthetics: [
      synthetic,
    ],
    postProcessing: true,
    defaultPasses: true,
    controls: interactive,
    setupControls: (controls) => {
      // controls.noPan = true;
    },
    postProcessingPassSettings: {
      bloom: {
        threshold: 0.8,
        intensity: 2.0,
        smoothing: 0.1
      },
      depthOfField: {
        bokehScale: 0,
        focusDistance: 0.01,
        focalLength: 0.005
      },
      vignette: {
        darkness: 0.2
      }
    },
    backgroundRenderer,
    defaultSceneProperties: {
      scale: 0.003
    }
  };

  return space;
}