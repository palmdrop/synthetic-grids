import * as THREE from 'three';
import * as dat from 'dat.gui';
import { AbstractRenderScene } from "../AbstractRenderScene";
import type { VoidCallback } from "../core";
import { TrackballControls } from '../examples/TrackballControls';
import { addGUI } from '../systems/GuiUtils';
import { makeCamera } from './camera/cameraManager';
import { getComposer } from './post/postprocessing';
import type { SceneProperties, SyntheticSpace } from './scene';
import { getLandscapeMap } from './spaces/landscapeMap';

export class SyntheticGrids extends AbstractRenderScene {
  private backgroundRenderTarget: THREE.WebGLRenderTarget;

  private controls: TrackballControls;

  private gui: dat.GUI;
  private guiVisible: boolean = true;

  private space: SyntheticSpace
  private properties: SceneProperties;

  private mouseLocked = false;

  constructor( canvas : HTMLCanvasElement, onLoad ?: VoidCallback ) {
    super(canvas, onLoad);

    this.backgroundRenderTarget = new THREE.WebGLRenderTarget(
      canvas.width, canvas.height,
      {
      }
    );

    this.gui = new dat.GUI();

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

    this.properties = {
      time: 0.0,
      mousePosition: new THREE.Vector2(),
      dimensions: new THREE.Vector2(this.canvas.width, this.canvas.height)
    };

    this.space = getLandscapeMap(
      this.renderer,
      this.backgroundRenderTarget,
      this.gui
    );
    this.space.sceneConfigurator(this.scene);

    this.space.synthetics
      .forEach(synthetic => {
        this.scene.add(synthetic.object);
      });

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

  protected createCamera(): THREE.Camera {
    return makeCamera(this);
  }

  update(delta: number, now: number): void {
    this.controls.update();
    this.properties.time = now / 10.0;

    this.space.synthetics.forEach(synthetic => {
      if(synthetic.update) {
        synthetic.update(this.properties);
      }
    });

    this.space?.backgroundRenderer?.update(this.properties);
  }

  onMouseMove(x: number, y: number): void {
    if(!this.mouseLocked) {
      this.properties.mousePosition.set(x, y);
    }
  }

  resize(width?: number, height?: number, force?: boolean): void {
    // Workaround for postprocessing pass that seems to disallow automatic resize of canvas
    if( !width || !height ) {
      width = this.canvas.parentElement?.clientWidth;
      height = this.canvas.parentElement?.clientHeight;
    }

    super.resize( width, height, force );
    // For some reason, automatic resizing does not work when using postprocessing library composer

    this.space?.backgroundRenderer?.setSize(width, height);
    this.properties.dimensions.set(width, height);
  }

  render(delta: number, now: number): void {
    super.render(delta, now);
    this.space?.backgroundRenderer.render();
  }

  toggleGUI() {
    if(this.guiVisible) {
      this.gui.hide();
    } else {
      this.gui.show();
    }

    this.guiVisible = !this.guiVisible;
  }

  toggleMouseLocked() {
    this.mouseLocked = !this.mouseLocked;
  }
}