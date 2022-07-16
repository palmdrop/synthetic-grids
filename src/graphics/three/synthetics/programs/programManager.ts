import type * as dat from 'dat.gui';
import type { Unsubscriber } from 'svelte/store';
import * as THREE from 'three';
import type { Program } from '../../../../modules/substrates/src/interface/types/program/program';
import { buildProgramShader } from '../../../../modules/substrates/src/shader/builder/programBuilder';
import { programHistoryStore$, programStore$, setProgram, subscribeToProgram } from '../../../../modules/substrates/src/stores/programStore';
import { additionalShaderMaterials$ } from '../../../../modules/substrates/src/stores/shaderStore';

export type MaterialObject = {
  material: THREE.Material
}

export type ProgramConfig = {
  defaultProgram?: Program
  program?: Program
  object: MaterialObject,
  createMaterial?: (program: Program) => THREE.ShaderMaterial
  onChange?: (program: Program) => THREE.ShaderMaterial
};

export const createProgramManager = (
  configs: { [name: string]: ProgramConfig },
  gui: dat.GUI,
  defaultConfig: string | undefined,
  propertyName: string = 'programs'
) => {
  const configEntries = Object.entries(configs) as [string, ProgramConfig][];

  defaultConfig = defaultConfig || configEntries[0][0];

  const unsubscribers: Unsubscriber[] = [];

  const onChange = (name: string) => {
    let unsubscriber: Unsubscriber;
    while(unsubscriber = unsubscribers.pop()) {
      unsubscriber();
    }

    const config = configs[name];

    const program = config.program ?? config.defaultProgram;
    if(program) setProgram(program);

    const updateMaterial = (program: Program) => {
      let material: THREE.ShaderMaterial;
      if(config.onChange) {
        material = config.onChange(program);
      } else {
        material = config.createMaterial 
          ? config.createMaterial(program)
          : new THREE.ShaderMaterial(buildProgramShader(program));
      }

      config.object.material = material;

      config.program = program;
      additionalShaderMaterials$.set([material as any]);
    }

    unsubscribers.push(
      programStore$.subscribe(updateMaterial),
      programHistoryStore$.subscribe(store => {
        if(!store || !store.program) return;
        updateMaterial(store.program);
      })
    );
  }

  gui.add(
    { [propertyName]: defaultConfig },
    propertyName,
    configEntries.reduce((acc, [name]) => {
      acc[name] = name;
      return acc;
    }, {} as { [name: string]: string }),
  ).onChange(onChange);

  onChange(defaultConfig);
}