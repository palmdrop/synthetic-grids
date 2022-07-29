import * as THREE from 'three';

type MutationParameter = {
  min: number,
  max: number,
  variation: number,
  integer?: boolean
};

export type MutationParameters = {
  [property: string]: MutationParameter | MutationParameters
};

export const isMutationParameter = (value: MutationParameter | MutationParameters): value is MutationParameter => {
  return typeof value.max === 'number' && typeof value.min === 'number' && typeof value.variation === 'number';
}

export const mutate = <T extends Record<string, any>>(object: T, mutationParameters: MutationParameters): T => {
  const copy: T = {
    ...object
  };

  const propertiesToMutate = Object.keys(mutationParameters);
  propertiesToMutate.forEach(property => {
    if(!(property in copy)) return;

    const mutationData = mutationParameters[property];
    if(isMutationParameter(mutationData)) {
      let value: number = copy[property] + THREE.MathUtils.randFloatSpread(mutationData.variation);
      
      value = THREE.MathUtils.clamp(
        value,
        mutationData.min,
        mutationData.max
      );

      if(mutationData.integer) value = Math.floor(value);

      (copy as any)[property] = value;
    } else {
      (copy as any)[property] = mutate({ ...copy[property]}, mutationData);
    }
  });

  return copy;
}