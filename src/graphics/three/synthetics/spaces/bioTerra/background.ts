import * as THREE from 'three';
import type { BackgroundRenderer } from '../../scene';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader';

// Custom shader passes
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { BackgroundDistortionShader } from './backgroundDistortionShader';
import { BackgroundConfig } from './configs';

export const createBackgroundRenderer = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, config?: BackgroundConfig) => {
  const size = renderer.getSize(new THREE.Vector2());
  const renderTarget = new THREE.WebGLRenderTarget(
    size.x, 
    size.y, 
    {}
  );

  renderTarget.samples = 1;

  const composer = new EffectComposer(renderer, renderTarget);
  composer.renderToScreen = false;

  composer.addPass(
    new RenderPass(scene, camera)
  );

  const distortionPass = new ShaderPass(
    BackgroundDistortionShader
  );

  composer.addPass(
    distortionPass
  );

  const verticalBlurPass = new ShaderPass(
    VerticalBlurShader
  );

  const horizontalBlurPass = new ShaderPass(
    HorizontalBlurShader
  )

  composer.addPass(
    verticalBlurPass
  );

  composer.addPass(
    horizontalBlurPass
  );

  composer.addPass(
    new ShaderPass(
      CopyShader
    )
  );

  if(composer.passes.length % 2 === 0) {
    composer.addPass(
      new ShaderPass(
        CopyShader
      )
    );
  }

  const backgroundRenderer: BackgroundRenderer = {
    renderTarget,
    setSize(width, height) {
      composer.setSize(width, height);
    },
    material: new THREE.MeshBasicMaterial(),
    render() {
      composer.render();
    },
    update(sceneProperties) {
      distortionPass.uniforms['delta'].value = sceneProperties.delta;
      distortionPass.uniforms['time'].value = Math.random();
    } 
  }

  const update = (config: BackgroundConfig) => {
    Object.entries(config.distortion).forEach(([property, value]) => {
      if(!distortionPass.uniforms[property]) return;
      distortionPass.uniforms[property].value = value;
    });

    verticalBlurPass.uniforms['v'].value = config.blur.x;
    horizontalBlurPass.uniforms['h'].value = config.blur.y;
  }

  if(config) update(config);

  return {
    backgroundRenderer,
    renderTarget,
    update
  }
}
