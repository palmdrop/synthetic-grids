<script lang="ts">
	import './global.css';

  import type { AbstractRenderScene } from "./graphics/three/AbstractRenderScene";
	import { Distgrids } from "./graphics/three/synthetics/distgrids/Distgrids";
  import Canvas from "./components/Canvas.svelte";
  import { onMount } from 'svelte';

  let scene: AbstractRenderScene;
  let canvas: HTMLCanvasElement;

  const onResize = () => {
    scene.resize();
  }

  const setupCanvas = (canvasElement: HTMLCanvasElement) => {
    canvas = canvasElement;
  }

  onMount(() => {
    scene = new Distgrids(canvas);
    scene.resize();
    scene.start();
  });

  /*
  onMount(() => {
    window.addEventListener('resize', onResize) 

    return () => {
      scene?.stop();
      window.removeEventListener('resize', onResize) 
    }
  })
  */
</script>

<svelte:window on:resize={onResize} />

<Canvas
  onMountCallback={setupCanvas}
/>

<style>
</style>