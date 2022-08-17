<script lang="ts">
	import './global.css';

	import { SyntheticGrids } from "./graphics/three/synthetics/SyntheticGrids";
  import Canvas from "./components/Canvas.svelte";
  import { onMount } from 'svelte';
  import { promptDownload } from './modules/substrates/src/utils/general';
  import NoiseOverlay from './components/NoiseOverlay.svelte';
  import { getTaxonomySpace, spaceMetadata } from './graphics/three/synthetics/spaces/neon-moss/neonMossSpace';
  import type { WeedsConfig } from './graphics/three/procedural/organic/weedsGenerator';

  let scene: SyntheticGrids;
  let canvas: HTMLCanvasElement;
  let colors: Record<string, string>;
  let plantData: { image: string, config: WeedsConfig }[] = [];

  const updateSpeed = 3000;

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

  onMount(() => {
    scene = new SyntheticGrids(canvas, getTaxonomySpace, spaceMetadata);
    scene.resize();
    scene.start();

    scene.setCaptureFrameResolutionMultiplier(1.0);

    // scene.toggleGUI();

    colors = scene.getSpace().data['colors'];

    const updateScene = () => {
      const config: WeedsConfig = scene.getSpace().data.config;
      scene.captureFrame(image => {
        plantData = [...plantData, { image, config }];
      });

      setTimeout(() => {
        scene.regenerate(); 

        setTimeout(() => {
          updateScene();
        }, updateSpeed / 2.0)
      }, updateSpeed / 2.0)
    }

    setTimeout(() => {
      updateScene();
    }, updateSpeed / 2.0);

    return () => {
      scene.stop();
    }
  });
</script>

<svelte:window 
  on:resize={onResize} 
  on:keydown={onKeyDown}
/>

<main 
  style="
    --bg: {colors ? colors.background : 'black'};
    --fg: {colors ? colors.lines : 'white'};
    --glow: {colors ? colors.glow : 'green'};
    --fgFaint: {colors ? colors.lines : '#ffffff'}3b;

    background-color: var(--bg);
  "
>
  <div
    class="images-container"
  >
    {#each plantData as { image, config }, i}
      <img
        width={300}  
        height={300}  
        src={image}
        alt=""
        on:click={() => {
          // promptDownload(config, `plant${i + 1}.json`);
        }}
      />
    {/each}
  </div>

  <div 
    class="canvas-container"
  >
    <Canvas
      onMountCallback={setupCanvas}
    />

    <div class="glow" />
    <div class="shadow" />
  </div>
</main>

<NoiseOverlay 
  style="
    opacity: 0.9;
  "
/>

<style>
  .canvas-container {
    position: fixed;
    width: 100vw;
    height: 100vh;
    inset: 0;

    z-index: 0;

    pointer-events: none;
  }

  .glow {
    position: fixed;
    top: 55%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: 100vh;
    height: 110vh;
    border-radius: 100%;

    background: radial-gradient(
      circle, 
      var(--glow) 0%, 
      rgba(0, 0, 0, 0) 40%, 
      rgba(0, 0, 0, 0) 100%
    );

    z-index: -1;
    opacity: 0.7;
  }

  .shadow {
    position: fixed;
    top: 60%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: 150vh;
    height: 150vh;
    border-radius: 100%;

    background: radial-gradient(
      circle, 
      black 0%, 
      rgba(0, 0, 0, 0) 55%, 
      rgba(0, 0, 0, 0) 100%
    );

    z-index: -2;
    opacity: 0.4;
  }

  main {
    min-width: 100vw;
    height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;

    display: flex;
    justify-content: center;
  }

  .images-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-start;

    max-width: 1200px;
  }

  img {
    object-fit: cover;

    margin: 8px;
    border: 2px solid #00000022;

    flex-grow: 1;
    max-width: 330px;
  }

  img:hover {
    z-index: 10;
    background-color: var(--bg);

    box-shadow: 0px 0px 40px -10px black;
  }
</style>