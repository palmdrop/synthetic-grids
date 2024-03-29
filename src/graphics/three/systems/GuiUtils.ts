import type * as THREE from 'three';
import type * as dat from 'dat.gui';
import { setUniform } from '../../../modules/substrates/src/utils/shader';

type PropertySettings = {
  min: number,
  max: number,
  step?: number,
  displayName?: string
}

export type PropertyMap = {
  [properties: string]: PropertyMap | PropertySettings
};

export const isPropertySettings = (value: PropertyMap | PropertySettings): value is PropertySettings => {
  // return !(value)
  // value.max === undefined && value.min === undefined && value.step === undefined;
  const keys = Object.keys(value);
  const correctCount = keys.length >= 2 && keys.length <= 4;
  if(!correctCount) return false;

  const correctKeys = keys.every(key => (['min', 'max', 'step', 'displayName'].includes(key)));
  if(!correctKeys) return false;

  const correctTypes = keys.every(key => {
    if(key === 'displayName') return value[key] === 'string';
    return typeof value[key] === 'number';
  });

  return correctTypes;
}

// TODO: add support for object uniforms
export const addUniforms = (
  gui: dat.GUI,
  target: Parameters<typeof setUniform>[2],
  toAdd: { [name: string]: PropertySettings }
) => {
  if(!target.uniforms) return;

  Object.entries(toAdd).forEach(([uniformName, settings]) => {
    if(!target.uniforms[uniformName]) return;

    const value = target.uniforms[uniformName].value;
    if(typeof value === 'object') {
      const folder = gui.addFolder(uniformName);
      const properties = Object.keys(value);
      properties.forEach(property => {
        const subValue = value[property];
        if(property.startsWith('_') || typeof subValue !== 'number') return;
        const name = settings.displayName ?? property;
        folder.add(
          { [name]: subValue ?? 0.0 }, 
          name, 
          settings.min,
          settings.max,
          settings.step
        ).onChange(newSubValue => {
          value[property] = newSubValue;
          setUniform(uniformName, value, target);
        });
      })
    } else {
      const name = settings.displayName ?? uniformName;
      gui.add(
        { [name]: target.uniforms[uniformName].value ?? 0.0 }, 
        name, 
        settings.min,
        settings.max,
        settings.step
      ).onChange(value => {
        setUniform(uniformName, value, target)
      });
    }
  });
}

export const addThreeColor = (
  gui: dat.GUI,
  target: Record<string, any>,
  property: string,
  forUniform: boolean = false
) => {
  const original = !forUniform 
    ? target[property]
    : target.uniforms[property].value;

  gui.addColor(
    { 
      [property]: {
        r: original.r * 255.0,
        g: original.g * 255.0,
        b: original.b * 255.0,
      }
    }, property 
  ).onChange(color => {
    const object: THREE.Color = !forUniform 
      ? target[property]
      : target.uniforms[property].value;

    object.setRGB(
      color.r / 255.0,
      color.g / 255.0,
      color.b / 255.0,
    );
  });
}

export const addGUI = (
  gui: dat.GUI, 
  target: Record<string, any>,
  properties: PropertyMap,
) => {
  if(!target || !properties || !gui) return;
  
  Object.entries(properties).forEach(([property, value]) => {
    if(!isPropertySettings(value)) {
      const folder = gui.addFolder(property);
      addGUI(folder, target[property], value);
    } else {
      const min = value.min;
      const max = value.max;
      const step = value.step;
      gui.add(target, property, min, max, step);
    }
  });
}

export const addDirectionalLight = (gui: dat.GUI, target: THREE.DirectionalLight) => {
  addGUI(gui, target, {
    intensity: {
      min: 0, max: 20
    },
    position: {
      x: { min: -50, max: 50 },
      y: { min: -50, max: 50 },
      z: { min: -50, max: 50 },
    }
  });

  addThreeColor(gui, target, 'color');
}

export const addPointLight = (gui: dat.GUI, target: THREE.PointLight) => {
  addGUI(gui, target, {
    intensity: {
      min: 0, max: 100
    },
    position: {
      x: { min: -50, max: 50 },
      y: { min: -50, max: 50 },
      z: { min: -50, max: 50 },
    },
    distance: {
      min: 0, max: 300
    }
  });

  addThreeColor(gui, target, 'color');
}