import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { createBackgroundRenderer } from './background';
import { configMakers } from './configs';
import { createFormation } from '../formations/formation';
import { getRockConfig } from './configs';
import { transparentMapShader } from '../../../../glsl/shaders/transparentMapShader';
import { createLineBox } from '../../../../utils/lines';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { randomGaussian } from '../../../tools/math';

export const spaceMetadata = {
  postProcessing: true
}

const c = Object.values(import.meta.globEager('../../../../../assets/palettes/*.json'));
console.log(c);
const palettes = Object.values(import.meta.globEager('../../../../../assets/palettes/*.json')).map((module: any) => module.default);

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

const getObject = (parent: THREE.Object3D, renderScene: AbstractRenderScene) => {
  const object = createFormation(
    getRockConfig()
  );

  object.geometry.center();

  const material = new THREE.ShaderMaterial(
    transparentMapShader
  );

  const paletteIndex = Math.floor(Math.random() * palettes.length);
  const palette = palettes[paletteIndex];
  console.log(paletteIndex, palette);

  const colors = palette.map(entry => entry.color).map(({ r, g, b }) => {
    const { h, s, l } = new THREE.Color(r / 255, g / 255, b / 255).getHSL({ h: 0, s: 0, l: 0 });
    const color = new THREE.Color().setHSL(
      h, 
      s,
      Math.max(Math.pow(l, 0.5), 0.7),
    );

    return color;
  });

  material.uniforms.lineColor.value = new THREE.Vector3(colors[0].r, colors[0].g, colors[0].b);
  
  material.uniforms.width.value = 0.01;
  material.uniforms.scale.value.multiplyScalar(0.01);

  (object as any).material = material;

  parent.clear();
  parent.add(object);

  const lineBox = createLineBox(new THREE.Box3().setFromObject(object), new LineMaterial({
    color: colors[0].getHex(),
    linewidth: 0.00002
  }));

  lineBox.position.copy(object.position);
  object.add(lineBox);

  updateCamera(object, renderScene);

  return colors;
}

const updateScene = (synthetic: Synthetic, renderScene: AbstractRenderScene) => {
  const rotationForce = 0; // 0.0003;
  const updateFrequency = 0.03;
  const resizeProbability = 0; // 0.003;
  const resizeScale = new THREE.Vector2(0.7, 1.5);
  const updateFrame = true;

  const parent = synthetic.object;

  let visible = true;

  const rotationVelocity = new THREE.Vector3().randomDirection().multiplyScalar(rotationForce);

  const thin = Math.random() > 0.5;
  let scale: number;
  let value: number;

  if(thin) {
    scale = THREE.MathUtils.randFloat(0.05, 0.1);
    value = THREE.MathUtils.randFloat(0.5, 0.8);
  } else {
    scale = THREE.MathUtils.randFloat(0.005, 0.02);
    value = THREE.MathUtils.randFloat(3.0, 10.0);
  }

  const colors = getObject(parent, renderScene);

  let timeSinceLastUpdate = 0;
  synthetic.update = (_, renderScene, delta) => {
    const object = parent.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

    object.rotation.x += rotationVelocity.x;
    object.rotation.y += rotationVelocity.y;
    object.rotation.z += rotationVelocity.z;

    timeSinceLastUpdate += delta;
    if(!updateFrequency || timeSinceLastUpdate > updateFrequency) {
      visible = !visible;

      object.visible = visible;

      timeSinceLastUpdate -= updateFrequency;

      (object.material.uniforms.scale.value as any)
        // .randomDirection()
        .set(
          THREE.MathUtils.randFloatSpread(1),
          THREE.MathUtils.randFloatSpread(1),
          THREE.MathUtils.randFloat(-0.2, -1)
        )
        .multiplyScalar(Math.random() * scale + 0.002)

      object.material.uniforms.width.value = value * Math.random() / renderScene.renderer.getPixelRatio();

      const color = colors[Math.floor(Math.random() * colors.length)];
      object.material.uniforms.lineColor.value.set(
        color.r, color.g, color.b
      ).multiplyScalar(THREE.MathUtils.randFloat(0.8, 1.5));

      if(updateFrame) {
        object.children[0].scale.set(
          1.0, 1.0, 1.0
        ).multiplyScalar(Math.abs(randomGaussian(0.8)) + 0.8);
      }

      if(Math.random() < resizeProbability) {
        parent.scale.set(
          1.0, 1.0, 1.0
        ).multiplyScalar(THREE.MathUtils.randFloat(resizeScale.x, resizeScale.y));
      }
    }
  }
}

export const getMappingsSpace = (
  renderScene: AbstractRenderScene,
  interactive?: boolean
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

  const sceneLifeTime = new THREE.Vector2(7000, 15000);
  const sceneDeadTime = new THREE.Vector2(2000, 4000);

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
    onClick: () => {
      updateScene(synthetic, renderScene);
      updateBackgroundEffect();
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      renderer.autoClearDepth = true;
      scene.background = backgroundRenderTarget.texture;

      camera.position.set(0, 0, 80);
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
      // controls.noRotate = true;
    },
    backgroundRenderer,
    defaultSceneProperties: {
      scale: 1.0
    },
  };

  return space;
}