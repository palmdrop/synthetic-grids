<script lang="ts">
	import Substrates from './modules/substrates/src/App.svelte';
	import './global.css';

	import { Distgrids } from "./graphics/three/synthetics/distgrids/Distgrids";
  import Canvas from "./components/Canvas.svelte";
  import { onMount } from 'svelte';
  import { programHistoryStore$, subscribeToProgram } from './modules/substrates/src/stores/programStore';
  import { makeCustomWarpShader } from './graphics/glsl/shaders/customWarpShader';
  import { mapShader } from './graphics/glsl/shaders/mapShader';
  import type { Program } from './modules/substrates/src/interface/types/program/program';


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

    const updateMaterials = (program: Program | undefined) => {
      if(!program || !scene) return;
      scene.updateMaterials(
        makeCustomWarpShader(
          program,
          mapShader
        )
      );
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