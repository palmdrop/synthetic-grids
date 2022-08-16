<script lang="ts">
  export let onMountCallback: ((canvas: HTMLCanvasElement) => void) | undefined;
  export let style = "";

  const useCanvas = (canvas: HTMLCanvasElement) => {
    onMountCallback?.(canvas);
  }
</script>

<canvas 
  style={style}
  use:useCanvas
/>

<style>
  canvas {
    position: fixed;
    width: 100vw;
    height: 100vh;

    inset: 0;

    z-index: 2;
  }
</style>