import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { createBackgroundRenderer } from './background';
import { configMakers } from './configs';
import { createFormation } from '../formations/formation';
import { getRockConfig } from './configs';

export const spaceMetadata = {
  postProcessing: true
}

const updateCamera = (object: THREE.Object3D, renderScene: AbstractRenderScene, margin = 0.15) => {
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

const createObject = (parent: THREE.Object3D, renderScene: AbstractRenderScene) => {
  const object = createFormation(
    getRockConfig()
  );

  const material = new THREE.MeshStandardMaterial({
    color: '#777777',
    side: THREE.DoubleSide
  });

  object.geometry.center();
  object.material = material;

  parent.clear();
  parent.add(object);

  updateCamera(object, renderScene);

  return object;
}

const updateScene = (synthetic: Synthetic, renderScene: AbstractRenderScene) => {
  const rotationForce = 0.005; // 0.0003;

  const parent = synthetic.object;

  const rotationVelocity = new THREE.Vector3(
    0, 1, 0
  ).multiplyScalar(rotationForce);

  let scale: number;
  let value: number;

  if(Math.random() > 0.5) {
    scale = THREE.MathUtils.randFloat(0.07, 0.1);
    value = THREE.MathUtils.randFloat(0.4, 0.8);
  } else {
    scale = THREE.MathUtils.randFloat(0.01, 0.04);
    value = THREE.MathUtils.randFloat(3.0, 10.0);
  }

  createObject(parent, renderScene);

  synthetic.update = (_, renderScene, delta) => {
    const object = parent.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

    object.rotation.x += rotationVelocity.x * delta;
    object.rotation.y += rotationVelocity.y * delta;
    object.rotation.z += rotationVelocity.z * delta;
  }
}

export const getFuseEntitiesSpace = (
  renderScene: AbstractRenderScene,
): SyntheticSpace => {
  // Background
  const updateBackgroundEffect = () => {
    const backgroundConfig = configMakers[Math.floor(Math.random() * configMakers.length)]();
    updateBackground(backgroundConfig);
  }

  const {
    backgroundRenderer,
    renderTarget: backgroundRenderTarget,
    update: updateBackground
  } = createBackgroundRenderer(renderScene.renderer, renderScene.scene, renderScene.camera);

  updateBackgroundEffect();
  renderScene.resizeables.push(backgroundRenderer);

  // Scene
  const parent = new THREE.Object3D();
  const synthetic: Synthetic = {
    object: parent,
    metadata: {}
  };

  const sceneLifeTime = new THREE.Vector2(
    10 * 1000,
    30 * 1000
  );

  const sceneDeadTime = new THREE.Vector2(1800, 4000);

  const sceneUpdateLoop = () => {
    parent.visible = true;
    updateScene(synthetic, renderScene);
    updateBackgroundEffect();

    setTimeout(() => {
      parent.visible = false;

      setTimeout(
        sceneUpdateLoop, 
        THREE.MathUtils.randFloat(sceneDeadTime.x, sceneDeadTime.y)
      );
    }, THREE.MathUtils.randFloat(sceneLifeTime.x, sceneLifeTime.y));
  }

  sceneUpdateLoop();

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      if(parent.children.length) updateCamera(parent.children[0], renderScene);
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      renderer.autoClearDepth = true;
      scene.background = backgroundRenderTarget.texture;
        
      const directionalLight = new THREE.DirectionalLight(
        'white',
        5
      );
      directionalLight.position.set(2, 10, 5);

      scene.add(
        directionalLight
      );

      camera.position.set(0, 0, 80);
    },
    synthetics: [
      synthetic,
    ],
    postProcessing: false,
    defaultPasses: false,
    controls: true,
    setupControls: (controls) => {
      controls.zoomSpeed = 1;
      controls.noPan = true;
    },
    backgroundRenderer,
    defaultSceneProperties: {
      scale: 1.0
    },
  };

  return space;
}