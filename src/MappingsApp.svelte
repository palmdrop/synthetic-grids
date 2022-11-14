<script lang="ts">
  import "./global.css";
	import { SyntheticGrids } from "./graphics/three/synthetics/SyntheticGrids";
  import Canvas from "./components/Canvas.svelte";
  import { onMount } from 'svelte';
  import { promptDownload } from './modules/substrates/src/utils/general';
  import { getMappingsSpace, spaceMetadata } from "./graphics/three/synthetics/spaces/mappings/mappingsScene";

  export let interactive = true;

  let scene: SyntheticGrids;
  let canvas: HTMLCanvasElement;

  const onResize = () => {
    scene.resize();
  }

  const setupCanvas = (canvasElement: HTMLCanvasElement) => {
    canvas = canvasElement;
  }

  onMount(() => {
    scene = new SyntheticGrids(canvas, getMappingsSpace, spaceMetadata, undefined, interactive);
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