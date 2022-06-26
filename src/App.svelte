<script lang="ts">
	import Substrates from './modules/substrates/src/App.svelte';
	import './global.css';

  import type { AbstractRenderScene } from "./graphics/three/AbstractRenderScene";
	import { Distgrids } from "./graphics/three/synthetics/distgrids/Distgrids";
  import Canvas from "./components/Canvas.svelte";
  import { onMount } from 'svelte';
  import { programHistoryStore$, subscribeToProgram } from './modules/substrates/src/stores/programStore';
import { makeCustomWarpShader } from './graphics/glsl/shaders/customWarpShader';
import { mapShader } from './graphics/glsl/shaders/mapShader';


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
      }
    }
  }

  onMount(() => {
    scene = new Distgrids(canvas);
    scene.resize();
    scene.start();

    window.addEventListener('keydown', onKeyDown);

    return () => {
      scene.stop();
      window.removeEventListener('keydown', onKeyDown);
    }
  });

  // subscribeToProgram(program => {
  programHistoryStore$.subscribe(state => {
    if(scene && state.program) {
      scene.updateMaterials(
        makeCustomWarpShader(
          state.program,
          mapShader
        )
      );
    }
  });
</script>

<svelte:window on:resize={onResize} />

<div class='substrates' class:show={builderVisible}>
  <Substrates />
</div>

<Canvas
  onMountCallback={setupCanvas}
/>

<style>
  .substrates {
    position: absolute;
    visibility: hidden;
  }

  .show {
    visibility: visible;
  }
</style>