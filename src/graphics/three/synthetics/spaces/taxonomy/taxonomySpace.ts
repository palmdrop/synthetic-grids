import * as THREE from 'three';
import type * as dat from 'dat.gui';

import type { Synthetic, SyntheticSpace } from '../../scene';
import { getWeedsFromConfig } from '../../../procedural/organic/weedsGenerator';

import { addDirectionalLight, addThreeColor, addUniforms } from '../../../systems/GuiUtils';
import { getWeedsConfig, weedsMaterial } from './defaultConfig';
import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';

export const spaceMetadata = {
  postProcessing: true
}

const updateCamera = (weedsObject: THREE.Object3D, renderScene: AbstractRenderScene, margin = 0.1) => {
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

const updateWeeds = (parent: THREE.Object3D, renderScene: AbstractRenderScene) => {
  parent.clear();

  const config = getWeedsConfig(weedsMaterial);

  const weedsObject = getWeedsFromConfig(
    config 
  );

  weedsObject.rotateZ(THREE.MathUtils.randFloatSpread(Math.PI / 4.0));

  parent.add(weedsObject);

  updateCamera(weedsObject, renderScene);
}

const weedsConfig = getWeedsConfig(weedsMaterial);

export const getTaxonomySpace = (
  renderScene: AbstractRenderScene
): SyntheticSpace => {
  const weedsParent = new THREE.Object3D();

  updateWeeds(weedsParent, renderScene);

  const weedsSynthetic: Synthetic = {
    object: weedsParent,
    metadata: {}
  };

  weedsSynthetic.update = (properties) => {
    weedsParent.children[0].rotateY(0.001);
  }

  // Map
  const mapMaterial = weedsMaterial;
  mapMaterial.uniforms['baseColor'].value = new THREE.Color(weedsConfig.colors!.plant);
  mapMaterial.uniforms['lineColor'].value = new THREE.Color(weedsConfig.colors!.lines);
  mapMaterial.uniforms['scale'].value.set(0.05, 0.4, 0.6);

  return {
    regenerate: (renderScene) => {
      updateWeeds(weedsParent, renderScene);
    },
    onResize: (width, height, renderScene) => {
      updateCamera(weedsParent.children[0], renderScene);
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      // scene.background = backgroundRenderTarget.texture;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x000000, 0);

      camera.position.set(0, 0, 80);

      const directionalLight = new THREE.DirectionalLight('white', 2.2);
      directionalLight.position.set(-1, 1, 100);
      directionalLight.castShadow = true;
      directionalLight.shadow.bias = -0.001;

      directionalLight.shadow.mapSize.width = 1024 * 2;
      directionalLight.shadow.mapSize.height = 1024 * 2;
      directionalLight.shadow.camera.near = 0.0;
      directionalLight.shadow.camera.far = 1024;

      directionalLight.shadow.camera.left = -100;
      directionalLight.shadow.camera.right = 100;
      directionalLight.shadow.camera.top = 100;
      directionalLight.shadow.camera.bottom = -100;

      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(1000, 1000),
        new THREE.ShadowMaterial({
          opacity: 0.1,
        })
      );

      shadowPlane.receiveShadow = true;

      shadowPlane.position.set(0, 0, -400);

      scene.add(
        directionalLight,
        shadowPlane
      );
    },
    synthetics: [
      weedsSynthetic,
    ],
    postProcessing: false,
    defaultPasses: false,
    data: {
      colors: weedsConfig.colors
    }
  }
}