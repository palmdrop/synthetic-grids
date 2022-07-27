import * as THREE from 'three';

type MutationParameter = {
  min: number,
  max: number,
  variation: number
};

export type MutationParameters = {
  [property: string]: MutationParameter | MutationParameters
};

export const isMutationParameter = (value: MutationParameter | MutationParameters): value is MutationParameter => {
  return typeof value.max === 'number' && typeof value.min === 'number' && typeof value.variation === 'number';
}

const mutate = <T extends Record<string, any>>(object: T, mutationParameters: MutationParameters): T => {
  const propertiesToMutate = Object.keys(mutationParameters);
  propertiesToMutate.forEach(property => {
    if(!(property in object)) return;

    const mutationData = mutationParameters[property];
    if(isMutationParameter(mutationData)) {
      let value = 
        THREE.MathUtils.clamp(
          (object[property] as number) + THREE.MathUtils.randFloatSpread(mutationData.variation),
          mutationData.min,
          mutationData.max
        );

      (object as any)[property] = value;
    } else {
      mutate(object[property], mutationData);
    }
  });

  return object;
}