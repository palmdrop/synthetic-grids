import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { createBackgroundRenderer } from './background';
import { configMakers } from './configs';
import { createFormation } from '../formations/formation';
import { getRockConfig } from './configs';
import { transparentMapShader } from '../../../../glsl/shaders/transparentMapShader';
import { randomGaussian } from '../../../tools/math';

export const spaceMetadata = {
  postProcessing: true
}

const updateCamera = (object: THREE.Object3D, renderScene: AbstractRenderScene, margin = 0.0) => {
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

const getObject = async (parent: THREE.Object3D, renderScene: AbstractRenderScene) => {
  const object = createFormation(
    getRockConfig()
  );

  const material = new THREE.ShaderMaterial(
    transparentMapShader
  );

  material.uniforms.lineColor.value = new THREE.Vector3(
    0.9, 1, 0.8
  );

  material.uniforms.width.value = 5.5;

  material.uniforms.scale.value.set(
    0.0, 0.0, 0.002
  );

  (object as any).material = material;

  object.position.set(0, 0, 300);

  parent.clear();
  parent.add(object);

  updateCamera(object, renderScene);
}

const updateScene = (synthetic: Synthetic, renderScene: AbstractRenderScene) => {
  const rotationForce = 0.003;
  // const visibilityTime = 0.1;

  const parent = synthetic.object;

  let visible = false;

  const rotationVelocity = new THREE.Vector3().randomDirection().multiplyScalar(rotationForce);

  getObject(parent, renderScene).then(() => {
    let timeSinceLastUpdate = 0;
    let updateFrequency = 0.0;
    synthetic.update = (_, __, delta) => {
      const object = parent.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

      object.rotation.x += rotationVelocity.x;
      object.rotation.y += rotationVelocity.y;
      object.rotation.z += rotationVelocity.z;

      timeSinceLastUpdate += delta;
      if(timeSinceLastUpdate > updateFrequency) {
        // rotationVelocity.randomDirection().multiplyScalar(rotationForce);
        visible = !visible;

        object.visible = visible;
        // object.rotation.set(0, 0, 0);

        timeSinceLastUpdate -= updateFrequency;

        /*
        object.geometry.applyMatrix4(
          new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3().randomDirection(),
            Math.random() * Math.PI * 2
          )
        );
        */
        (object.material.uniforms.scale.value as any)
          .randomDirection()
          .multiplyScalar(Math.random() * 0.01 + 0.005)

        object.material.uniforms.width.value = 5.0 * Math.random() + 1.0;

          /*
        object.scale.set(
          1.0, 1.0, 1.0
        ).multiplyScalar(
          // Math.random() + 1.0
          Math.abs(randomGaussian(1)) + 0.0
        );
        */
      }
    }
  });
}

export const getMappingsSpace = (
  renderScene: AbstractRenderScene,
  interactive?: boolean
): SyntheticSpace => {
  const parent = new THREE.Object3D();

  const synthetic: Synthetic = {
    object: parent,
    metadata: {}
  };

  updateScene(synthetic, renderScene);

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

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      if(parent.children.length) updateCamera(parent.children[0], renderScene);
    },
    onClick: () => {
      updateScene(synthetic, renderScene);
      updateBackgroundEffect();
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      renderer.autoClearDepth = true;
      scene.background = backgroundRenderTarget.texture;

      camera.position.set(0, 0, 80);

      const directionalLight = new THREE.DirectionalLight('#88ff77', 9.7);
      directionalLight.position.set(-10, 5, 10);
      directionalLight.castShadow = true;

      // const ambientLight = new THREE.AmbientLight('white', 2.3);

      scene.add(
        directionalLight,
        // ambientLight,
      );
    },
    synthetics: [
      synthetic,
    ],
    postProcessing: false,
    defaultPasses: false,
    controls: interactive,
    setupControls: (controls) => {
      controls.zoomSpeed = 1;
      controls.noPan = true;
      controls.noRotate = true;
    },
    postProcessingPassSettings: {
      bloom: {
        threshold: 0.4,
        intensity: 0.0,
        smoothing: 1.4
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
      scale: 1.0
    },
  };

  return space;
}