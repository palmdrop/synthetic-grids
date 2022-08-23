<script lang="ts">
	import { SyntheticGrids } from "./graphics/three/synthetics/SyntheticGrids";
  import Canvas from "./components/Canvas.svelte";
  import { onMount } from 'svelte';
  import { promptDownload } from './modules/substrates/src/utils/general';
  import { getNeonMossSpace, spaceMetadata } from './graphics/three/synthetics/spaces/neon-moss/neonMossSpace';
import { getBoulderTunnelSpace } from "./graphics/three/synthetics/spaces/formations/formationsSpace";

  let scene: SyntheticGrids;
  let canvas: HTMLCanvasElement;

  const onResize = () => {
    scene.resize();
  }

  const setupCanvas = (canvasElement: HTMLCanvasElement) => {
    canvas = canvasElement;
  }

  const onKeyDown = (event: KeyboardEvent) => {
    switch(event.key) {
      case 'c': {
        if(scene) {
          scene.captureFrame(data => {
            promptDownload(data, 'synthetics.png');
          })
        }
      } break;
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
    scene = new SyntheticGrids(canvas, getBoulderTunnelSpace, spaceMetadata, undefined, true);
    scene.resize();
    scene.start();

    scene.setCaptureFrameResolutionMultiplier(1.0);

    return () => {
      scene.stop();
    }
  });
</script>

<svelte:window 
  on:resize={onResize} 
/>

<div
  on:keydown={onKeyDown}
  on:mousemove={onMouseMove}
  on:mousedown={onMouseDown}
  on:mouseup={onMouseUp}
>
  <Canvas
    onMountCallback={setupCanvas}
  />
</div>

<style>
  div {
    position: relative;
    z-index: 0;
    min-width: 100vw;
    height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;

    display: flex;
    justify-content: center;
    
    cursor: pointer;

    overflow: hidden;
  }
</style>