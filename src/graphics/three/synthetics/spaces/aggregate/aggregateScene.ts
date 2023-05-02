import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { createBackgroundRenderer } from './background';
import { configMakers } from './configs';
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

  /*
  const rows = 2;
  const columns = 3;
  */
  const rows = 1;
  const columns = 1;

  const objects: THREE.Mesh[] = [];
  for(let x = 0; x < columns; x++) for(let y = 0; y < rows; y++) {
    const dx = x - ((columns - 1) / 2.0);
    const dy = y - ((rows - 1) / 2.0);
    const object = new THREE.Mesh(
      new THREE.SphereBufferGeometry(20, 200, 200),
      // new THREE.BoxBufferGeometry(100, 100, 100, 300, 300, 300),
      material
    );
    object.position.set(dx * 60, dy * 60, 0);
    // object.scale.set(0.5, 1, 1);
    object.userData.translationX = object.position.x;
    object.userData.translationY = object.position.y;
    object.userData.translationZ = object.position.z;

    object.rotateY(Math.random() * Math.PI);
    
    object.visible = false;
    
    objects.push(object);
  }

  const updateShader = makeShaderUpdater(objects[0], ...objects.slice(1));
  Promise.all([
    decodeProgram(encodedDisplacementProgram as any),
    decodeProgram(encodedFragmentProgram as any),
  ])
    .then(([displacementProgram, fragmentProgram]) => {
      updateShader(displacementProgram, fragmentProgram);

      objects.forEach(object => object.visible = true);

      // Gui
      const objectFolder = gui.addFolder('object');
      const materialFolder = gui.addFolder('material');

      /*
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
      */
      const addUniformSlider = (
        gui: dat.GUI,
        name: string,
        defaultValue: number,
        min: number,
        max: number,
        step?: number
      ) => {
        objects.forEach(object => setUniform(name, defaultValue, object.material as any));
        gui
          .add({ [name]: defaultValue }, name, min, max, step)
          .onChange(value => {
            objects.forEach(object => {
              setUniform(name, value, object.material as any)
            })
          });
      }

      // TODO: save to local storage and read on app load
      addUniformSlider(objectFolder, 'correction', 0.0, -1, 1, 0.0001);
      addUniformSlider(objectFolder, 'frequency', THREE.MathUtils.randFloat(0.05, 0.09), 0, 1);
      addUniformSlider(objectFolder, 'amplitude', THREE.MathUtils.randFloat(400, 600), 0, 800);

      addUniformSlider(objectFolder, 'persistance', THREE.MathUtils.randFloat(0.45, 0.55), 0, 1);
      addUniformSlider(objectFolder, 'lacunarity', THREE.MathUtils.randFloat(1.8, 2.3), 0, 10);

      addUniformSlider(objectFolder, 'minSteps', 5, 0, 100, 1);
      addUniformSlider(objectFolder, 'maxSteps', 100, 0, 1000, 1);

      addUniformSlider(objectFolder, 'add', 0, -200, 200);
      addUniformSlider(objectFolder, 'mult', 1, 0, 100);

      addUniformSlider(materialFolder, 'substrateFrequency', 15, 0, 100);
    });

  parent.clear();
  parent.add(...objects);

  updateCamera(parent, renderScene);

  return objects;
}

const updateScene = (synthetic: Synthetic, renderScene: AbstractRenderScene) => {
  const rotationForce = 0.03;

  const parent = synthetic.object;
  parent.rotation.set(
    0.3, THREE.MathUtils.randFloat(-Math.PI, Math.PI), 0
  )

  const rotationVelocity = new THREE.Vector3(
    0, 1, 0
  ).multiplyScalar(rotationForce);

  createObject(parent, renderScene);

  synthetic.update = (sceneProperties, renderScene, delta) => {
    parent.children.forEach((object: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>) => {
      // const object = parent.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

      object.rotation.x += rotationVelocity.x * delta;
      object.rotation.y += rotationVelocity.y * delta;
      object.rotation.z += rotationVelocity.z * delta;

      setUniform(
        'translationX',
        object.userData.translationX ?? 0,
        object.material
      );
      setUniform(
        'translationY',
        object.userData.translationY ?? 0,
        object.material
      );
      setUniform(
        'translationZ',
        object.userData.translationZ ?? 0,
        object.material
      );

      setUniform(
        'animationTime',
        sceneProperties.time * 3,
        object.material
      );

      setUniform(
        'time',
        sceneProperties.time * 0.5,
        object.material
      );
    });

  }
}

export const getAggregateSpace = (
  renderScene: AbstractRenderScene,
): SyntheticSpace => {
  const gui = renderScene.gui;
  gui.show();
  // Background
  const {
    backgroundRenderer,
    renderTarget: backgroundRenderTarget,
    update: updateBackground
  } = createBackgroundRenderer(renderScene.renderer, renderScene.scene, renderScene.camera);

  const updateBackgroundEffect = () => {
    const backgroundConfig = configMakers[Math.floor(Math.random() * configMakers.length)]();
    updateBackground(backgroundConfig);
  }

  updateBackgroundEffect();
  renderScene.resizeables.push(backgroundRenderer);

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
      scene.background = backgroundRenderTarget.texture;
        
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
    backgroundRenderer,
    defaultSceneProperties: {
      scale: 1.0
    },
  };

  return space;
}