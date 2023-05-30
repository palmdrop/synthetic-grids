import * as THREE from 'three';

import type { Synthetic, SyntheticSpace } from '../../scene';

import type { AbstractRenderScene } from '../../../AbstractRenderScene';
import { makeAspectOrthoResizer } from '../../../systems/AspectOrthoResizer';
import { setUniform } from '../../../../../modules/substrates/src/utils/shader';
import { addThreeColor, addUniforms } from '../../../systems/GuiUtils';
import { mapNormalShader } from '../../../../glsl/shaders/normalWarp/mapNormalShader';
import { createFormation } from '../formations/formation';
import { getSharpConfig, getPolyAggregateConfig } from '../formations/configs';
import { numToGLSL } from '../../../../../modules/substrates/src/shader/builder/utils/glsl';

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

const createObject = (parent: THREE.Object3D, renderScene: AbstractRenderScene, onLoad?: () => void) => {
  const gui = renderScene.gui;

  const config = getPolyAggregateConfig()
  const object = createFormation(
    config
  );

  const shader = {
    ...mapNormalShader
  };

  shader.vertexShader = shader.vertexShader.replace(
    `vertex = vec4(position, 1.0) * modelMatrix;`,
    `vertex = vec4(position, 1.0) * modelMatrix;
     normalOffset = length(vertex);
    `,
  );

  shader.fragmentShader = 
    shader.fragmentShader.replace(
      'uniform float opacity;',
      `uniform float opacity;
       uniform vec3 midColor;
       uniform float midMultiplier; 
       uniform float midPow; 
      `,
    )
    .replace(
    `gl_FragColor = vec4(mix(baseColor, lineColor, n), 1.0);`,
    `gl_FragColor = vec4(mix(baseColor, lineColor, n), 1.0);
     gl_FragColor = vec4(mix(gl_FragColor.xyz, midColor, 1.0 - pow(normalOffset * midMultiplier / ${numToGLSL(config.amount)}, midPow)), 1.0);
    `
  );

  shader.uniforms['midColor'] = {
    value: new THREE.Color('#777777'),
    type: 'vec3'
  }
  shader.uniforms['midMultiplier'] = {
    value: 1.0,
    type: 'float'
  }
  shader.uniforms['midPow'] = {
    value: 1.5,
    type: 'float'
  }

  const material = new THREE.ShaderMaterial(
    shader
  );

  object.geometry.center();

  (object as any).material = material;
  object.visible = true;

  // Gui
  const materialFolder = gui.addFolder('material');

  // addUniformSlider(materialFolder, 'scale', 13, 0, 100);

  (material as any).uniforms.scale.value.y = 0.5;
  addUniforms(materialFolder, material, {
    scale: {
      min: 0.0,
      max: 5.0,
      step: 0.001,
    },
    width: {
      min: 0.01,
      max: 10.0,
      step: 0.001,
    },
    midMultiplier: {
      min: 0,
      max: 10
    },
    midPow: {
      min: 0,
      max: 5
    },
  });

  material.uniforms.baseColor.value.set(0, 0, 0);
  addThreeColor(
    materialFolder, material, 'baseColor',
    true
  );
  addThreeColor(
    materialFolder, material, 'lineColor',
    true
  );
  addThreeColor(
    materialFolder, material, 'midColor',
    true
  );

    /*
  'scale': { value: new THREE.Vector3(0, 100, 0), type: 'vec3' },
  'baseColor': { value: new THREE.Color( 0.0, 0.0, 1.0 ), type: 'vec3' },
  'lineColor': { value: new THREE.Color( 1.0, 1.0, 1.0 ), type: 'vec3' },
  'width': { value: 1.0, type: 'float' },
  */

  parent.clear();
  parent.add(object);

  updateCamera(parent, renderScene);
  onLoad?.();

  return object;
}

const updateScene = (synthetic: Synthetic, renderScene: AbstractRenderScene, onLoad?: () => void) => {
  const parent = synthetic.object;

  createObject(parent, renderScene, onLoad);

  synthetic.update = (sceneProperties, renderScene, delta) => {
    parent.children.forEach((object: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>) => {
      // const object = parent.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

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
        sceneProperties.time * 30.7,
        object.material
      );

      setUniform(
        'time',
        sceneProperties.time * 0.1,
        object.material
      );
    });

  }
}

export const getBioTerraSpace = (
  renderScene: AbstractRenderScene,
  interactive?: boolean,
  onLoad?: () => void
): SyntheticSpace => {
  if(interactive) {
    renderScene.gui.show();
  }
  // Background
  /*
  const {
    backgroundRenderer,
    renderTarget: backgroundRenderTarget,
    update: updateBackground
  } = createBackgroundRenderer(renderScene.renderer, renderScene.scene, renderScene.camera);
  */

  /*
  const updateBackgroundEffect = () => {
    const backgroundConfig = configMakers[Math.floor(Math.random() * configMakers.length)]();
    updateBackground(backgroundConfig);
  }

  updateBackgroundEffect();
  renderScene.resizeables.push(backgroundRenderer);
  */

  // Scene
  const parent = new THREE.Object3D();
  const synthetic: Synthetic = {
    object: parent,
    metadata: {},
  };

  updateScene(synthetic, renderScene, onLoad);

  const space: SyntheticSpace = {
    onResize: (width, height, renderScene) => {
      if(parent.children.length) updateCamera(parent.children[0], renderScene);
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      renderer.autoClearDepth = true;
      scene.background = new THREE.Color('#666666');
        
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
      orthographicCamera.zoom = 0.9;
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