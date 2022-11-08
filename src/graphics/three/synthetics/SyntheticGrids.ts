import * as THREE from 'three';
import * as dat from 'dat.gui';
import { AbstractRenderScene } from "../AbstractRenderScene";
import type { VoidCallback } from "../core";
import { TrackballControls } from '../examples/TrackballControls';
import { addGUI } from '../systems/GuiUtils';
import { makeCamera } from './camera/cameraManager';
import { getComposer } from './post/postprocessing';
import type { SceneProperties, SyntheticSpace } from './scene';

export class SyntheticGrids extends AbstractRenderScene {
  private controls: TrackballControls;

  private guiVisible: boolean = true;

  private space: SyntheticSpace
  private properties: SceneProperties;

  private mouseLocked = false;

  constructor(
    canvas: HTMLCanvasElement, 
    spaceCreator: (renderScene: AbstractRenderScene, interactive?: boolean) => SyntheticSpace,
    spaceMetadata: Record<string, any>,
    onLoad?: VoidCallback | undefined,
    interactive = true
  ) {
    super(canvas, onLoad, spaceMetadata.postProcessing);

    this.space = spaceCreator(this, interactive);
    this.space.sceneConfigurator(this.scene, this.camera, this.renderer);

    if(this.space.controls ?? true) {
      this.controls = new TrackballControls(
        this.camera,
        canvas
      );

      this.controls.panSpeed = 1.8;
      this.controls.zoomSpeed = 0.5;

      this.space.setupControls?.(this.controls);
    }

    if(this.controls && interactive) {
      addGUI(this.gui.addFolder('controls'), this.controls, {
        'panSpeed': {
          min: 0.0,
          max: 50
        },
        'zoomSpeed': {
          min: 0,
          max: 10
        }
      });
    }

    this.properties = {
      time: 0.0,
      delta: 0.0,
      mousePosition: new THREE.Vector2(),
      dimensions: new THREE.Vector2(this.canvas.width, this.canvas.height),
      scale: 1.0,
      ...this.space.defaultSceneProperties ?? {}
    };

    this.space.synthetics
      .forEach(synthetic => {
        this.scene.add(synthetic.object);
      });

    if(this.space.postProcessing) {
      const {
        composer,
        // update: updateComposer
      } = getComposer(
        this.renderer,
        this.scene,
        this.camera,
        20,
        this.gui.addFolder('postprocessing'),
        this.space.defaultPasses ?? true,
        this.space.additionalPasses,
        this.space.postProcessingPassSettings
      );

      this.composer = composer;
    }
  }

  protected createCamera(): THREE.Camera {
    return makeCamera(this);
  }

  update(delta: number, now: number): void {
    this.controls?.update();
    this.properties.time = now / 10.0;
    this.properties.delta = delta;

    delta = Math.min(delta, 1.0);

    this.space.synthetics.forEach(synthetic => {
      if(synthetic.update) {
        synthetic.update(this.properties, this, delta);
      }
    });

    this.space?.backgroundRenderer?.update(this.properties, this, delta);
  }

  onMouseMove(x: number, y: number): void {
    if(!this.mouseLocked) {
      this.properties.mousePosition.set(x, y);
      this.space.onMouseMove?.(this.properties.mousePosition, this);
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
    this.space?.backgroundRenderer?.render();
    this.space?.onResize?.(width, height, this);
    this.properties.dimensions.set(width, height);
  }

  protected beforeRender(): void {
    super.beforeRender();
    if(this.captureNext) {
      this.properties.scale /= this.captureFrameResolutionMultiplier;
    }
  }

  protected afterRender(): void {
    super.afterRender();
    this.properties.scale *= this.captureFrameResolutionMultiplier;
  }

  render(delta: number, now: number): void {
    this.space?.backgroundRenderer?.render();
    super.render(delta, now);
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

  onMouseClick(mouseX: number, mouseY: number) {
    const x = (mouseX / window.innerWidth) * 2 - 1;
	  const y = -(mouseY / window.innerHeight) * 2 + 1;

    this.space?.onClick?.(new THREE.Vector2(x, y), this);
  }

  getSpace() {
    return this.space;
  }

  regenerate() {
    if(!this.space.regenerate) return false;
    this.space.regenerate(this);
    return true;
  }
}