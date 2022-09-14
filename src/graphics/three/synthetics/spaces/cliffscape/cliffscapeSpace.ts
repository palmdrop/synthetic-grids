import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { getTree } from './tree';
import { updateFormations } from './formations';
import { random, volumeToBox3 } from '../../../tools/math';
import { rgbToHsl } from '../../../../utils/color';

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
  const { octree } = getTree();

  const lightColor = backgroundPalette[0].color;
  // backgroundPalette[Math.floor(Math.random() * backgroundPalette.length)].color;

  const synthetic: Synthetic = {
    object: parent,
    metadata: {},
  };

  const { h, l } = new THREE.Color(lightColor.r / 255, lightColor.g / 255, lightColor.b / 255).getHSL({ h: 0, s: 0, l: 0 });
  const gridColor = new THREE.Color().setHSL(
    h, 
    1.0,
    Math.max(Math.pow(l, 0.15), 0.8),
  );
  updateFormations(synthetic, octree, gridColor);

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      updateCamera(volumeToBox3(octree.getVolume()), renderScene);
    },
    onClick: () => {
      updateFormations(synthetic, octree, gridColor);
      updateCamera(volumeToBox3(octree.getVolume()), renderScene);
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      const background = new THREE.TextureLoader().load(backgroundImage);
      scene.background = background;

      camera.position.set(0, 0, 80);

      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const ambientLight = new THREE.AmbientLight('white', 1.3);

      let { h, s, l } = rgbToHsl(lightColor);
      h /= 360;
      s /= 100;
      l /= 100;

      const pointLightColor = new THREE.Color().setHSL(
        h, 
        Math.pow(s, random(0.2, 0.4)),
        Math.pow(l, 0.6)
      );

      const pointLight = new THREE.PointLight(pointLightColor, 5.0, 500, 0.2);
      pointLight.position.set(0, 0, 0);

      const plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(),
        new THREE.MeshBasicMaterial({
          map: background
        })
      );

      plane.scale.set(1.0, 1.5, 1.0).multiplyScalar(30);
      plane.position.set(0, 0, -30);

      scene.add(
        ambientLight,
        pointLight,
      );
    },
    synthetics: [
      synthetic,
    ],
    postProcessing: true,
    defaultPasses: true,
    controls: interactive,
    setupControls: (controls) => {
      controls.noPan = true;
    },
    postProcessingPassSettings: {
      bloom: {
        threshold: 0.68,
        intensity: 3.0,
        smoothing: 0.2
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
    defaultSceneProperties: {
      scale: 0.003
    }
  };

  return space;
}