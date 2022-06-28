import * as THREE from 'three';
import * as dat from 'dat.gui';
import { AbstractRenderScene } from "../../AbstractRenderScene";
import type { VoidCallback } from "../../core";
import { makeAspectOrthoResizer } from '../../systems/AspectOrthoResizer';
import { generateTerrain } from './terrain/generateTerrain';
import { TrackballControls } from '../../examples/TrackballControls';
import { mapWarpShader } from '../../../glsl/shaders/mapWarpShader';
import { addGUI, addUniforms } from '../../systems/GuiUtils';

export class Distgrids extends AbstractRenderScene {
  private object: THREE.Object3D<THREE.Mesh>;
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

    addGUI(this.gui, this.scene.fog, {
      'near': {
        min: 0.0,
        max: 10,
        step: 0.01
      },
      'far': {
        min: 0.0,
        max: 1000,
        step: 0.01
      }
    });

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

      layer.position.z = (this.layers * this.offset / 2.0) - i * this.offset + 0.0;

      this.object.add(layer);
    }

    this.object.rotateX(Math.PI / 2.0)

    this.scene.add(this.object);
  }

  public updateMaterials = (shader: THREE.Shader) => {
    const materialTemplate = new THREE.ShaderMaterial(shader);

    const oldMaterials = this.materials;

    this.materials = [];

    for(let i = 0; i < this.layers; i++) {
      const material = materialTemplate.clone()

      material.extensions.derivatives = true;
      material.side = THREE.DoubleSide;

      if(i >= oldMaterials.length) {
        material.uniforms.baseColor.value = this.colors.base;
        material.uniforms.lineColor.value = this.colors.line;
        material.uniforms.frequency.value = 1.31 * (this.layers - i);
        material.uniforms.scale.value = new THREE.Vector3(
          0, 
          10 + i * 1,
          0,
        );
        material.uniforms.amplitude.value = 0.5;
      } else {
        // material.uniforms = oldMaterials[i].uniforms;
        Object.keys(oldMaterials[i].uniforms).forEach(uniformName => {
          if(!material.uniforms[uniformName]) return;

          material.uniforms[uniformName].value = oldMaterials[i].uniforms[uniformName].value;
        });
      }

      const folderName = `material_${i}`;
      if(this.gui.__folders[folderName]) this.gui.removeFolder(this.gui.__folders[folderName])
      const folder = this.gui.addFolder(folderName);
      addUniforms(folder, material, {
        frequency: {
          min: 0.0,
          max: 10.0,
          step: 0.001,
        },
        scale: {
          min: 0.0,
          max: 10.0,
          step: 0.001,
        },
        amplitude: {
          min: 0.0,
          max: 100.0,
          step: 0.001,
        },
      });

      this.materials.push(material);

      if(i < this.object.children.length) {
        (this.object.children[i] as THREE.Mesh).material = material;
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