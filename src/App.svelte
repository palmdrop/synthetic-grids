<script lang="ts">
	import Substrates from './modules/substrates/src/App.svelte';
	import './global.css';

	import { Distgrids } from "./graphics/three/synthetics/Distgrids";
  import Canvas from "./components/Canvas.svelte";
  import { onMount } from 'svelte';
  import { programHistoryStore$, subscribeToProgram } from './modules/substrates/src/stores/programStore';
  import { makeCustomWarpShader } from './graphics/glsl/shaders/customWarpShader';
  import { mapShader } from './graphics/glsl/shaders/mapShader';
  import type { Program } from './modules/substrates/src/interface/types/program/program';
import { promptDownload } from './modules/substrates/src/utils/general';


  let scene: Distgrids;
  let canvas: HTMLCanvasElement;

  const onResize = () => {
    scene.resize();
  }

  const setupCanvas = (canvasElement: HTMLCanvasElement) => {
    canvas = canvasElement;
  }

  let builderVisible = false;
  const onKeyDown = (event: KeyboardEvent) => {
    switch(event.key) {
      case 'e': {
        if(event.ctrlKey) {
          builderVisible = !builderVisible;
        }
      } break;
      case 'h': {
        if(scene) {
          scene.toggleGUI();
        }
      } break;
      case 'c': {
        if(scene) {
          scene.captureFrame(data => {
            promptDownload(data, 'synthetics.png');
          })
        }
      } break;
    }
  }

  onMount(() => {
    scene = new Distgrids(canvas);
    scene.resize();
    scene.start();

    scene.setCaptureFrameResolutionMultiplier(4.0);

    const updateMaterials = (program: Program | undefined) => {
      if(!program || !scene) return;
      scene.updateMaterials(program);
    }

    subscribeToProgram(program => {
      updateMaterials(program);
    })

    programHistoryStore$.subscribe(state => {
      if(state) {
        updateMaterials(state.program);
      }
    });

    window.addEventListener('keydown', onKeyDown);

    return () => {
      scene.stop();
      window.removeEventListener('keydown', onKeyDown);
    }
  });

</script>

<svelte:window on:resize={onResize} />

<div class='substrates' class:show={builderVisible}>
  <Substrates />
</div>

<div class="canvas-container">
  <Canvas
    onMountCallback={setupCanvas}
  />
</div>

<style>
  .substrates {
    position: absolute;
    visibility: hidden;

    z-index: 10;
  }

  .show {
    visibility: visible;
  }


  .canvas-container {
    position: fixed;
    width: 100vw;
    height: 100vh;
    inset: 0;

    z-index: 0;
  }
</style>