<script lang="ts">
  import "./global.css";
	import { SyntheticGrids } from "./graphics/three/synthetics/SyntheticGrids";
  import Canvas from "./components/Canvas.svelte";
  import { onMount } from 'svelte';
  import { getBioTerraSpace, spaceMetadata } from "./graphics/three/synthetics/spaces/bioTerra/bioTerraScene";
  import { promptDownload } from "./modules/substrates/src/utils/general";

  export let interactive = true;
  export let isLoaded = false;

  let scene: SyntheticGrids;
  let canvas: HTMLCanvasElement;

  const onResize = () => {
    scene.resize();
  }

  const onLoad = () => {
    isLoaded = true;
  }

  const setupCanvas = (canvasElement: HTMLCanvasElement) => {
    canvas = canvasElement;
  }

  const onKeyDown = (event: KeyboardEvent) => {
    switch(event.key) {
      case 'c': {
        if(scene) {
          scene.captureFrame(data => {
            promptDownload(data, 'bioTerra.png');
          })
        }
      } break;
    }
  }

  onMount(() => {
    scene = new SyntheticGrids(canvas, getBioTerraSpace, spaceMetadata, onLoad, interactive);
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
  on:keydown={onKeyDown}
/>

<div>
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
    overflow-y: hidden;

    display: flex;
    justify-content: center;
    
    cursor: pointer;

    overflow: hidden;
  }
</style>