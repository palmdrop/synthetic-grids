import * as THREE from 'three';
import type { BackgroundRenderer } from '../../scene';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Custom shader passes
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { BackgroundDistortionShader } from './backgroundDistortionShader';


export const createBackgroundRenderer = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => {
  const size = renderer.getSize(new THREE.Vector2());
  const renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {});
  const composer = new EffectComposer(renderer, renderTarget);
  composer.renderToScreen = false;

  composer.addPass(
    new RenderPass(scene, camera)
  );

  composer.addPass(
    new ShaderPass(
      BackgroundDistortionShader
    )
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
    update() {} 
  }

  return {
    backgroundRenderer,
    renderTarget
  }
}
