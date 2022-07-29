<script lang="ts">
	import Substrates from './modules/substrates/src/App.svelte';
	import './global.css';

	import { SyntheticGrids } from "./graphics/three/synthetics/SyntheticGrids";
  import Canvas from "./components/Canvas.svelte";
  import { onMount } from 'svelte';
  import { promptDownload } from './modules/substrates/src/utils/general';

  let scene: SyntheticGrids;
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
        builderVisible = !builderVisible;
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
      case 'm': {
        if(scene) {
          scene.toggleMouseLocked();
        }
      }
    }
  }

  let mouseMoving = false;

  const onMouseMove = (event: MouseEvent) => {
    if(!scene) return;  
    scene.onMouseMove(
      event.clientX, event.clientY
    );

    mouseMoving = true;
  }

  const onMouseDown = () => {
    mouseMoving = false;
  }

  const onMouseUp = (event: MouseEvent) => {
    if(!scene || mouseMoving) return;
    scene.onMouseClick(
      event.clientX, event.clientY
    );
  }

  onMount(() => {
    scene = new SyntheticGrids(canvas);
    scene.resize();
    scene.start();

    scene.setCaptureFrameResolutionMultiplier(3.0);

    return () => {
      scene.stop();
    }
  });

</script>

<svelte:window 
  on:resize={onResize} 
  on:keydown={onKeyDown}
  on:mousemove={onMouseMove}
  on:mousedown={onMouseDown}
  on:mouseup={onMouseUp}
/>

<div class='substrates' class:show={builderVisible}>
  <Substrates 
    loadFromLocalStorage={false} 
  />
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