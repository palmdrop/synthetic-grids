import * as THREE from 'three';

export const createRenderer = (
  canvas: HTMLCanvasElement
) => {
    const renderer = new THREE.WebGLRenderer( {
      canvas,
      powerPreference: 'high-performance',
      antialias: false,
      stencil: false,
      depth: false
    } );

    renderer.setClearColor( new THREE.Color( '#000000' ), 0.0 );

    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.LinearToneMapping;

    renderer.setPixelRatio( window.devicePixelRatio );

    return renderer;
}