import * as THREE from 'three';

const fragments: string[] = Object.values(import.meta.globEager('../../../../../assets/fragments/flowers2/*.png')).map((module: any) => module.default);

const groupedFragments = fragments.reduce((acc, fragment) => {
  const folder = fragment.split('/').at(-2);

  if(!acc[folder]) acc[folder] = [];
  acc[folder].push(fragment);

  return acc;
}, {} as Record<string, string[]>);

const textureLoader = new THREE.TextureLoader();
const planeGeometry = new THREE.PlaneBufferGeometry();

// Simple ratio setter based on this https://discourse.threejs.org/t/centered-background-texture/13079
const setFragmentRatio = (texture: THREE.Texture, object: THREE.Object3D) => {
  const imageRatio = texture.image.width / texture.image.height;
  const planeRatio = 1.0 / 1.0;
  const ratio = planeRatio / imageRatio;

  if(ratio < 1.0) {
    object.scale.set(1.0, ratio, 1.0);
  } else {
   
    object.scale.set(1.0 / ratio, 1.0, 1.0);
  }

  texture.needsUpdate = true;
}

const makeFragment = (imagePath: string) => {
  const material = new THREE.MeshStandardMaterial({
    transparent: true,
    color: 'white',
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    dithering: true
  });
  
  const fragment = new THREE.Mesh(
    planeGeometry,
    material
  );

  fragment.rotation.set(
    0,
    0,
    THREE.MathUtils.randInt(0, 4) * Math.PI
  );

  textureLoader.load(imagePath, texture => {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.NearestFilter;

    texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;

    setFragmentRatio(texture, fragment);
    material.map = texture;
    material.opacity = 1.0;
  });

  return fragment;
}

export const getSingleFragmentScene = () => {
  const object = new THREE.Object3D();

  const groupKeys = Object.keys(groupedFragments);
  const group = groupedFragments[groupKeys[Math.floor(Math.random() * groupKeys.length)]];

  const getRandomImagePath = () => {
    return group[Math.floor(Math.random() * group.length)];
  }

  const fragment = makeFragment(getRandomImagePath());

  fragment.position.z = 1;

  object.add(fragment);

  return object;
}