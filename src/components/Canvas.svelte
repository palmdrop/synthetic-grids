<script lang="ts">
  export let onMountCallback: ((canvas: HTMLCanvasElement) => void) | undefined;

  const useCanvas = (canvas: HTMLCanvasElement) => {
    onMountCallback?.(canvas);
  }
</script>

<canvas 
  use:useCanvas
/>

<style>
  canvas {
    width: 100vw;
    height: 100vh;

    z-index: 2;
  }
</style>