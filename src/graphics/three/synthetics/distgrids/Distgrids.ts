import * as THREE from 'three';
import * as dat from 'dat.gui';
import { AbstractRenderScene } from "../../AbstractRenderScene";
import type { VoidCallback } from "../../core";
import { makeAspectOrthoResizer } from '../../systems/AspectOrthoResizer';
import { generateTerrain } from './terrain/generateTerrain';
import { TrackballControls } from '../../examples/TrackballControls';
import { mapWarpShader } from '../../../glsl/shaders/mapWarpShader';
import { makeGeometryGrid3d } from '../../procedural/grids/GeometryGrid3d';
import { getNoise3D } from '../../procedural/noise/noise';

export class Distgrids extends AbstractRenderScene {
  private object: THREE.Object3D;
  private controls: TrackballControls;
  private gui: dat.GUI;
  private materials: THREE.ShaderMaterial[];

  private grid: THREE.Object3D;
  private cellDefaultScale: THREE.Vector3;

  constructor( canvas : HTMLCanvasElement, onLoad ?: VoidCallback ) {
    super(canvas, onLoad);

    this.gui = new dat.GUI();

    const colors = {
      background: new THREE.Color('#2e1a80'),
      base: new THREE.Color('#338844'),
      line: new THREE.Color('#ffff99')
    }

    this.scene.background = colors.background;

    this.scene.fog = new THREE.Fog(this.scene.background, 5.0, 300);
    const fogFolder = this.gui.addFolder('fog');
    fogFolder.add(this.scene.fog, 'near', 0.0, 10);
    fogFolder.add(this.scene.fog, 'far', 0.0, 1000);

    this.controls = new TrackballControls(
      this.camera,
      canvas
    );

    this.controls.panSpeed = 50;
    this.controls.zoomSpeed = 5;

    this.object = new THREE.Object3D();
    
    this.materials = [];

    const defaultMaterial = new THREE.ShaderMaterial(mapWarpShader);
    const layers = 5;
    const offset = 3.5;


    for(let i = 0; i < layers; i++) {
      const material = defaultMaterial.clone()

      material.extensions.derivatives = true;
      material.side = THREE.DoubleSide;

      material.uniforms.baseColor.value = colors.base;
      material.uniforms.lineColor.value = colors.line;
      material.uniforms.frequency.value = 1.31 * (layers - i);
      material.uniforms.scale.value = new THREE.Vector3(
        0, 
        10 + i * 1,
        // 10 * i,
        0,
      );
      material.uniforms.amplitude.value = i * 0.3 + 0.3;

      this.materials.push(material);

      const layer = generateTerrain({
        dimensions: { 
          width: 2.0, 
          height: 2.0 
        },
        tesselation: {
          x: i * 10 + 100,
          y: i * 10 + 100
        },
        flatShading: true,
        noiseParams: {
          frequency: 1.3 * i + 0.1,
          min: 0.0,
          max: 1.3 * i
        }
      }, material);

      layer.position.z = (layers * offset / 2.0) - i * offset;

      this.object.add(layer);
    }

    this.object.rotateX(Math.PI / 2.0)

    this.scene.add(this.object);
    const gridConfig = {
      width: 20,
      height: 20,
      depth: 20,
      cellsX: 20,
      cellsY: 20,
      cellsZ: 20,
    };


    this.grid = makeGeometryGrid3d(gridConfig);
    this.cellDefaultScale = new THREE.Vector3().copy(this.grid.children[0].scale);

    this.grid.position.set(0, 0, 0);
    this.scene.add(this.grid);

    // this.gui.hide();
  }

  protected createCamera(): THREE.Camera {
    const camera = new THREE.OrthographicCamera(
      -1, 1,
      -1, 1,
      0.1, 1000
    );

    camera.position.set( 0, 0, 100 );

    this.resizeables.push(makeAspectOrthoResizer(
      camera as THREE.OrthographicCamera, 0.4 
    ));

    return camera;
  }

  update(delta: number, now: number): void {
    this.controls.update();

    this.materials.forEach(material => material.uniforms.time.value = now / 10.0);
    this.grid.children.forEach(child => {
      const position = child.position;
      let n = getNoise3D(position, {
        offset: {
          x: 0,
          y: 0,
          z: now * 0.2
        },
        frequency: 0.1
      });

      n = Math.pow(n, 2.1);

      n = THREE.MathUtils.mapLinear(
        n, 0, 1, 0.0, 2.0
      );

      child.scale.copy(
        this.cellDefaultScale
      ).multiplyScalar(n);
    });
  }
}