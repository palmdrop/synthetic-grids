import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { createBackgroundRenderer } from './background';
import { configMakers } from './configs';
import { createFormation } from '../formations/formation';
import { getRockConfig } from './configs';
import { 
  encodedDisplacementProgram, 
  encodedFragmentProgram,
  makeShaderUpdater 
} from './aggregateShader';
import { decodeProgram } from '../../../../../modules/substrates/src/stores/programStore';
import { setUniform } from '../../../../../modules/substrates/src/utils/shader';

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
  const gui = renderScene.gui;
  const material = new THREE.MeshStandardMaterial({
    color: '#777777',
    side: THREE.DoubleSide
  });

  const object = new THREE.Mesh(
    new THREE.SphereBufferGeometry(20, 500, 500),
    // new THREE.BoxBufferGeometry(100, 100, 100, 300, 300, 300),
    material
  );

  object.geometry.center();

  const updateShader = makeShaderUpdater(object);
  Promise.all([
    decodeProgram(encodedDisplacementProgram as any),
    decodeProgram(encodedFragmentProgram as any),
  ])
    .then(([displacementProgram, fragmentProgram]) => {
      updateShader(displacementProgram, fragmentProgram);

      // Gui
      const objectFolder = gui.addFolder('object');
      const materialFolder = gui.addFolder('material');

      objectFolder
        .add({ samplerStrength: 0.001 }, 'samplerStrength', 0, 2)
        .onChange(value => {
          setUniform('strength', value, object.material as any)
        });

      objectFolder
        .add({ sampleScale: 0.0005 }, 'sampleScale', 0, 0.1)
        .onChange(value => {
          setUniform('sampleScale', value, object.material as any)
        });

      objectFolder
        .add({ samplePower: 1 }, 'samplePower', 0, 5)
        .onChange(value => {
          setUniform('power', value, object.material as any)
        });

      objectFolder
        .add({ frequency: 1 }, 'frequency', 0, 1)
        .onChange(value => {
          setUniform('frequency', value, object.material as any)
        });

      objectFolder
        .add({ amplitude: 1 }, 'amplitude', 0, 1000)
        .onChange(value => {
          setUniform('amplitude', value, object.material as any)
        });

      materialFolder
        .add({ frequency: 1 }, 'frequency', 0, 100)
        .onChange(value => {
          setUniform('substrateFrequency', value, object.material as any)
        });
    });

  parent.clear();
  parent.add(object);

  updateCamera(object, renderScene);

  return object;
}

const updateScene = (synthetic: Synthetic, renderScene: AbstractRenderScene) => {
  // const rotationForce = 0.1; // 0.0003;
  const rotationForce = 0.0; // 0.0003;

  const parent = synthetic.object;
  parent.rotation.set(
    0.3, 0, 0
  )

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

  synthetic.update = (sceneProperties, renderScene, delta) => {
    const object = parent.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

    object.rotation.x += rotationVelocity.x * delta;
    object.rotation.y += rotationVelocity.y * delta;
    object.rotation.z += rotationVelocity.z * delta;

    /*
    setUniform(
      'time',
      sceneProperties.time,
      object.material
    );
    */
    setUniform(
      'animationTime',
      sceneProperties.time,
      object.material
    );

    setUniform(
      'time',
      sceneProperties.time * 10.0,
      object.material
    );
  }
}

export const getAggregateSpace = (
  renderScene: AbstractRenderScene,
): SyntheticSpace => {
  const gui = renderScene.gui;
  gui.show();
  // Background
  /*
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
  */

  // Scene
  const parent = new THREE.Object3D();
  const synthetic: Synthetic = {
    object: parent,
    metadata: {},
  };

  /*
  const sceneLifeTime = new THREE.Vector2(
    10 * 1000,
    30 * 1000
  );

  const sceneDeadTime = new THREE.Vector2(1800, 4000);

  const sceneUpdateLoop = () => {
    parent.visible = true;
    updateScene(synthetic, renderScene);
    // updateBackgroundEffect();

    setTimeout(() => {
      parent.visible = false;

      setTimeout(
        sceneUpdateLoop, 
        THREE.MathUtils.randFloat(sceneDeadTime.x, sceneDeadTime.y)
      );
    }, THREE.MathUtils.randFloat(sceneLifeTime.x, sceneLifeTime.y));
  }

  sceneUpdateLoop();
  */
  updateScene(synthetic, renderScene);

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      if(parent.children.length) updateCamera(parent.children[0], renderScene);
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      renderer.autoClearDepth = true;
      scene.background = new THREE.Color('#838281');
      // scene.background = backgroundRenderTarget.texture;
        
      const directionalLight = new THREE.DirectionalLight(
        'white',
        7
      );
      directionalLight.position.set(2, 10, 5);

      const ambientLight = new THREE.AmbientLight(
        'white',
        0.3
      );

      scene.add(
        directionalLight,
        ambientLight
      );

      const orthographicCamera = camera as THREE.OrthographicCamera;
      orthographicCamera.zoom = 0.6;
    },
    synthetics: [
      synthetic,
    ],
    postProcessing: false,
    defaultPasses: false,
    controls: true,
    setupControls: (controls) => {
      controls.zoomSpeed = 1;
      // controls.noPan = true;
    },
    // backgroundRenderer,
    defaultSceneProperties: {
      scale: 1.0
    },
  };

  return space;
}