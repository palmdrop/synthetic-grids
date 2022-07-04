import * as THREE from 'three';
import * as dat from 'dat.gui';
import { AbstractRenderScene } from "../AbstractRenderScene";
import type { VoidCallback } from "../core";
import { TrackballControls } from '../examples/TrackballControls';
import { addGUI, addThreeColor } from '../systems/GuiUtils';
import { createWarpedMap, WarpedMapContext } from './terrain/warpedMap';
import { mapShader } from '../../../graphics/glsl/shaders/mapShader';
import type { Program } from '../../../modules/substrates/src/interface/types/program/program';
import { setUniform } from '../../../modules/substrates/src/utils/shader';
import { makeCamera } from './camera/cameraManager';
import { getComposer } from './post/postprocessing';

export class Distgrids extends AbstractRenderScene {
  private controls: TrackballControls;

  private gui: dat.GUI;
  private guiVisible: boolean = true;

  private colors: { [name: string]: THREE.Color }

  private warpedMap: WarpedMapContext;

  constructor( canvas : HTMLCanvasElement, onLoad ?: VoidCallback ) {
    super(canvas, onLoad);

    this.gui = new dat.GUI();

    this.colors = {
      background: new THREE.Color('black'),
      base: new THREE.Color('black'),
      line: new THREE.Color('white')
    }

    this.scene.background = this.colors.background;

    const sceneFolder = this.gui.addFolder('scene');
    addThreeColor(sceneFolder, this.scene, 'background');

    this.controls = new TrackballControls(
      this.camera,
      canvas
    );

    this.controls.panSpeed = 1;
    this.controls.zoomSpeed = 0.5;

    addGUI(this.gui.addFolder('controls'), this.controls, {
      'panSpeed': {
        min: 0.0,
        max: 50
      },
      'zoomSpeed': {
        min: 0,
        max: 10
      }
    })

    this.warpedMap = createWarpedMap(
      /*
      new THREE.SphereBufferGeometry(
        10, 1000, 1000
      ),
      */
      /*
      new THREE.PlaneBufferGeometry(
        20, 20, 
        1000, 1000 
      ),
      */
      new THREE.CylinderBufferGeometry(
        20,
        20,
        20,
        1000,
        1000,
        true,
        Math.PI / 2.0,
        Math.PI / 2.0,
      ),

      mapShader,
      this.gui
    );

    this.warpedMap.object.geometry.computeVertexNormals();
    this.warpedMap.object.rotateZ(-Math.PI / 2.0);

    this.scene.add(this.warpedMap.object);

    const {
      composer,
      // update: updateComposer
    } = getComposer(
      this.renderer,
      this.scene,
      this.camera,
      20,
      this.gui.addFolder('postprocessing')
    );

    this.composer = composer;
  }

  public updateMaterials = (program: Program) => {
    this.warpedMap.updateShader(program);
  }

  protected createCamera(): THREE.Camera {
    return makeCamera(this);
  }

  update(delta: number, now: number): void {
    this.controls.update();

    setUniform(
      'time',
      now / 10.0,
      this.warpedMap.object.material as THREE.ShaderMaterial
    )
  }

  resize(width?: number, height?: number, force?: boolean): void {
         // Workaround for postprocessing pass that seems to disallow automatic resize of canvas
    if( !width || !height ) {
      width = this.canvas.parentElement?.clientWidth;
      height = this.canvas.parentElement?.clientHeight;
    }

    super.resize( width, height, force );
    // For some reason, automatic resizing does not work when using postprocessing library composer
  }

  toggleGUI() {
    if(this.guiVisible) {
      this.gui.hide();
    } else {
      this.gui.show();
    }

    this.guiVisible = !this.guiVisible;
  }
}