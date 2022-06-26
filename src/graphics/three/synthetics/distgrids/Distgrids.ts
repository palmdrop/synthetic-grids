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

  private layers: number;
  private offset: number;
  private colors: { [name: string]: THREE.Color }

  constructor( canvas : HTMLCanvasElement, onLoad ?: VoidCallback ) {
    super(canvas, onLoad);

    this.gui = new dat.GUI();

    this.colors = {
      background: new THREE.Color('black'),
      base: new THREE.Color('black'),
      line: new THREE.Color('white')
    }

    this.scene.background = this.colors.background;

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

    // const defaultMaterial = new THREE.ShaderMaterial(mapWarpShader);
    this.layers = 1;
    this.offset = 1.0;

    this.updateMaterials(mapWarpShader);

    for(let i = 0; i < this.layers; i++) {
      const layer = generateTerrain({
        dimensions: { 
          width: 20.0, 
          height: 20.0 
        },
        tesselation: {
          x: 500,
          y: 500
        },
        flatShading: true,
        noiseParams: {
          frequency: 1.3 * i + 0.1,
          min: 0.0,
          max: 1.3 * i
        }
      }, this.materials[i]);

      layer.position.z = (this.layers * this.offset / 2.0) - i * this.offset;

      this.object.add(layer);
    }

    this.object.rotateX(Math.PI / 2.0)

    this.scene.add(this.object);
  }

  public updateMaterials = (shader: THREE.Shader) => {
    const materialTemplate = new THREE.ShaderMaterial(shader);

    this.materials = [];

    for(let i = 0; i < this.layers; i++) {
      const material = materialTemplate.clone()

      material.extensions.derivatives = true;
      material.side = THREE.DoubleSide;

      material.uniforms.baseColor.value = this.colors.base;
      material.uniforms.lineColor.value = this.colors.line;
      material.uniforms.frequency.value = 1.31 * (this.layers - i);
      material.uniforms.scale.value = new THREE.Vector3(
        0, 
        10 + i * 1,
        0,
      );
      material.uniforms.amplitude.value = 0.5;

      this.materials.push(material);

      if(i < this.object.children.length) {
        this.object.children[i].material = material;
      }
    }
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
  }

  stop() {
    super.stop();
    this.gui.destroy();
  }
}