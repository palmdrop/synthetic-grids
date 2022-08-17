import * as THREE from 'three';

export const createRenderer = (
  canvas: HTMLCanvasElement
) => {
    const renderer = new THREE.WebGLRenderer( {
      canvas,
      powerPreference: 'high-performance',
      antialias: true,
      stencil: false,
      alpha: true
    } );

    renderer.setClearColor( new THREE.Color( '#000000' ), 0.0 );

    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.LinearToneMapping;

    renderer.setPixelRatio( window.devicePixelRatio );

    return renderer;
}