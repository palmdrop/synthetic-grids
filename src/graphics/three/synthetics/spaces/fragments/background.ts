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


export const createBackgroundRenderer = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => {
  const size = renderer.getSize(new THREE.Vector2());
  const renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
  });
  renderTarget.samples = 4;

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

  VerticalBlurShader.uniforms['v'].value = THREE.MathUtils.randFloat(0.02, 0.009);
  // VerticalBlurShader.uniforms['v'].value = 0.01; // Nice display background effect
  //VerticalBlurShader.uniforms['v'].value = 0.000003; // Nice foliage effect
  HorizontalBlurShader.uniforms['h'].value = VerticalBlurShader.uniforms['v'].value;
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
      distortionPass.uniforms['time'].value = sceneProperties.time;
    } 
  }

  return {
    backgroundRenderer,
    renderTarget
  }
}
