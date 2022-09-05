import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { createFormation } from '../formations/formation';
import { getRockConfig, getStairsConfig } from '../formations/configs';
import { createLineBox } from '../../../../utils/lines';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { Octree, OctreeHelper } from '../../../tools/space/Octree';
import { randomInVolume } from '../../../tools/math';
import { SpaceColonizationTree } from '../../../tools/space/SpaceColonizationTree';
// import { createBackgroundRenderer } from './background';

export const spaceMetadata = {
  postProcessing: true
}

const updateCamera = (weedsObject: THREE.Object3D, renderScene: AbstractRenderScene, margin = 0.5) => {
  if(!(renderScene.camera as THREE.OrthographicCamera).isOrthographicCamera) return;

  const camera = renderScene.camera;

  const box = new THREE.Box3().expandByObject(weedsObject);
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

const updateFormation = (parent: THREE.Object3D, renderScene: AbstractRenderScene) => {
  parent.clear();

  const formation = createFormation(
    Math.random() > 0.5 
      ? getRockConfig()
      : getStairsConfig()
  );

  parent.add(formation);
  updateCamera(formation, renderScene);

  const lineBox = createLineBox(new THREE.Box3().setFromObject(formation), new LineMaterial({
    color: new THREE.Color('#13de00').getHex(),
    linewidth: 0.0020
  }));

  lineBox.position.copy(formation.position);
  formation.add(lineBox);
}

export const getLandscapeSpace = (
  renderScene: AbstractRenderScene,
  interactive?: boolean
): SyntheticSpace => {
  const parent = new THREE.Object3D();
  parent.rotateX(0.08);

  updateFormation(parent, renderScene);

  const synthetic: Synthetic = {
    object: parent,
    metadata: {}
  };

  synthetic.update = (properties) => {
    parent.children[0].rotateY(0.002);
  }

  // Background
  /*
  const {
    backgroundRenderer,
    renderTarget: backgroundRenderTarget
  } = createBackgroundRenderer(renderScene.renderer, renderScene.scene, renderScene.camera);
  */

  // renderScene.resizeables.push(backgroundRenderer);

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      updateCamera(parent.children[0], renderScene);
    },
    onClick: () => {
      updateFormation(parent, renderScene);
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      const volume = {
        x: -10,
        y: -10,
        z: -10,
        w: 20,
        h: 20,
        d: 20,
      }

      // const octree = new Octree(volume, 1, 10);
      const points: THREE.Vector3[] = [];
      for(let i = 0; i < 10000; i++) {
        // octree.insert(randomInVolume(volume), undefined);
        points.push(randomInVolume(volume));
      }

      const tree = new SpaceColonizationTree(
        0.4, // Min dist
        5.5, // Max dist
        0.5, // Dynamics
        0.20, // Step size
        0.02 // Random
      );

      tree.generate(points, volume, new THREE.Vector3(), new THREE.Vector3(), 100);

      const octreeHelper = new OctreeHelper(tree.getSegments());
      scene.add(octreeHelper);

      scene.add(tree.buildInstancedThreeObject(new THREE.MeshBasicMaterial({ color: 'green' })));

      // scene.background = backgroundRenderTarget.texture;
      scene.background = new THREE.Color('black');

      camera.position.set(0, 0, 80);

      const directionalLight = new THREE.DirectionalLight('white', 4.7);
      directionalLight.position.set(-10, 5, 10);
      directionalLight.castShadow = true;

      const ambientLight = new THREE.AmbientLight('white', 1.3);

      const pointLight = new THREE.PointLight('red', 200.0, 1000, 1.1);
      pointLight.position.set(0, -100, 0);

      scene.add(
        directionalLight,
        ambientLight,
        pointLight
      );
    },
    synthetics: [
      // synthetic,
    ],
    postProcessing: true,
    defaultPasses: true,
    controls: interactive,
    setupControls: (controls) => {
      controls.noPan = true;
    },
    postProcessingPassSettings: {
      bloom: {
        threshold: 0.6,
        intensity: 2.0,
        smoothing: 0.1
      },
      depthOfField: {
        bokehScale: 2,
        focusDistance: 0.01,
        focalLength: 0.005
      },
      vignette: {
        darkness: 0.2
      }
    },
    // backgroundRenderer,
    defaultSceneProperties: {
      scale: 1.0
    }
  };

  return space;
}