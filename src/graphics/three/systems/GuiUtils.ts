import type * as THREE from 'three';
import type * as dat from 'dat.gui';
import { setUniform } from '../../../modules/substrates/src/utils/shader';

type PropertySettings = {
  min: number,
  max: number,
  step?: number
}

type PropertyMap = {
  [properties: string]: PropertyMap | PropertySettings
};

export const isPropertyMap = (value: PropertyMap | PropertySettings): value is PropertyMap => {
  return value.max === undefined && value.min === undefined && value.step === undefined;
}

// TODO: add support for object uniforms
export const addUniforms = (
  gui: dat.GUI,
  target: Parameters<typeof setUniform>[2],
  toAdd: { [name: string]: PropertySettings }
) => {
  if(!target.uniforms) return;

  Object.entries(toAdd).forEach(([uniformName, settings]) => {
    const value = target.uniforms[uniformName].value;
    if(typeof value === 'object') {
      const folder = gui.addFolder(uniformName);
      const properties = Object.keys(value);
      properties.forEach(property => {
        const subValue = value[property];
        if(property.startsWith('_') || typeof subValue !== 'number') return;
        folder.add(
          { [property]: subValue ?? 0.0 }, 
          property, 
          settings.min,
          settings.max,
          settings.step
        ).onChange(newSubValue => {
          value[property] = newSubValue;
          setUniform(uniformName, value, target);
        });
      })
    } else {
      gui.add(
        { [uniformName]: target.uniforms[uniformName].value ?? 0.0 }, 
        uniformName, 
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
    if(isPropertyMap(value)) {
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