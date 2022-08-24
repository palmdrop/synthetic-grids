import * as THREE from 'three';
import type * as dat from 'dat.gui';

import type { Synthetic, SyntheticSpace } from '../../scene';
import { CellData, getWeedsGrid, WeedsGridConfig } from '../../../procedural/organic/weedsGenerator';
import { addDirectionalLight, addPointLight } from '../../../systems/GuiUtils';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { colors, configMaker, defaultMutationParameters } from './defaultConfig';
import { mutate } from '../../../procedural/genetic/geneticGenerator';
import type { AbstractRenderScene } from '../../../AbstractRenderScene';

const updateWeeds = (
  weedsSynthetic: Synthetic, 
  config: WeedsGridConfig,
  gui: dat.GUI
): Synthetic => {
  weedsSynthetic.metadata = {};
  weedsSynthetic.object.children = [];

  const { object: weeds, cellsData } = getWeedsGrid(
    () => mutate(config, defaultMutationParameters),
    gui
  );

  weedsSynthetic.object.add(weeds);
  weedsSynthetic.metadata['cellsData'] = cellsData;

  return weedsSynthetic;
}

export const spaceMetadata = {
  postProcessing: false
}

export const getWeedsSpace = (
  renderScene: AbstractRenderScene,
  interactive?: boolean
): SyntheticSpace => {
  const gui = renderScene.gui;
  const renderer = renderScene.renderer;
  const size = renderer.getSize(new THREE.Vector2());

  const weedsParent = new THREE.Object3D();
  const weedsSynthetic: Synthetic = {
    object: weedsParent,
    metadata: {}
  };

  weedsParent.rotateY(0.2);
  weedsParent.rotateX(0.2);
  weedsParent.rotateZ(0.03);

  weedsSynthetic.update = (properties) => {
    // weedsSynthetic.object.rotateY(0.002);
    weedsSynthetic.object.children[0].children.forEach(child => {
      if(!(child instanceof Line2)) {
        child.rotateY(0.005)
      }
    });
  }

  const config = configMaker();
  updateWeeds(
    weedsSynthetic, 
    config,
    gui
  );
  
  if(interactive ?? true) {
    gui.add({ generate: () => updateWeeds(weedsSynthetic, config, gui) }, 'generate');
    window.addEventListener('keydown', event => {
      if(event.key === 'g') updateWeeds(weedsSynthetic, config, gui);
    });
  }

  return {
    onClick: (mousePosition, renderScene) => {
      const cellsData: CellData[] | undefined = weedsSynthetic.metadata!['cellsData'];
      if(!cellsData) return;

      const rayCaster = new THREE.Raycaster();

      rayCaster.setFromCamera(mousePosition, renderScene.camera);
      rayCaster.far = 1000000;

      cellsData.forEach(({ box, object, index, config: strawConfig }) => {
        const result = rayCaster.ray.intersectBox(box, new THREE.Vector3());
        if(result) {
          config.strawConfig = strawConfig;
          updateWeeds(weedsSynthetic, config, gui);
        }

      });
    },
    sceneConfigurator: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      camera.position.set(0, 0, 80);

      scene.background = new THREE.Color(colors.background);

      const ambientLight = new THREE.AmbientLight('white', 1.5)

      const directionalLight = new THREE.DirectionalLight('white', 2.2);
      directionalLight.position.set(-6, 8, 16);
      directionalLight.castShadow = true;
      directionalLight.shadow.bias = -0.001;

      directionalLight.shadow.mapSize.width = 1024 * 2;
      directionalLight.shadow.mapSize.height = 1024 * 2;
      directionalLight.shadow.camera.near = 0.0;
      directionalLight.shadow.camera.far = 1024;

      directionalLight.shadow.camera.left = -75;
      directionalLight.shadow.camera.right = 75;
      directionalLight.shadow.camera.top = 75;
      directionalLight.shadow.camera.bottom = -75;

      addDirectionalLight(gui.addFolder('directional light'), directionalLight);

      const pointLightColor = config.gridConfig.color;
      const pointLight = new THREE.PointLight(pointLightColor, 20);
      pointLight.position.set(0, 0, 0);

      addPointLight(gui.addFolder('point light'), pointLight);

      scene.add(
        ambientLight,
        directionalLight,
        pointLight,
      );
    },
    synthetics: [
      weedsSynthetic,
    ],
    defaultPasses: true,
    postProcessing: true
  }
}