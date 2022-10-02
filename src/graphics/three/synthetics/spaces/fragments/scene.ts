import * as THREE from 'three';

const fragments = import.meta.glob('../../../../../assets/fragments/**/*.png');

const groups = Object.entries(fragments).reduce((acc, entry) => {
  const [path, importFunction] = entry;

  const folder = path.split('/').at(-2);

  if(!acc[folder]) acc[folder] = [];
  acc[folder].push(importFunction);

  return acc;
}, {} as Record<string, (() => Promise<{ [key: string]: any }>)[]>);

const textureCache = new Map<string, THREE.Texture>();
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

const loadTexture = (imagePath: string) => new Promise<THREE.Texture>((resolve, reject) => {
  if(textureCache.has(imagePath)) {
    resolve(textureCache.get(imagePath));
    return;
  }

  textureLoader.load(imagePath, 
    texture => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.NearestFilter;

      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;

      textureCache.set(imagePath, texture);

      resolve(texture);
    }, 
    undefined, 
    (err) => {
      reject(err);
    }
  );
});

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

  return fragment;
}

const updateTexture = (imagePath: string, fragment: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>) => {
  return loadTexture(imagePath).then(texture => {
    setFragmentRatio(texture, fragment);
    fragment.material.map = texture;
    fragment.material.opacity = 1.0;
  });
}

export const getSingleFragmentScene = async () => {
  const object = new THREE.Object3D();

  // const groupKeys = Object.keys(groupedFragments);
  // const group = groupedFragments[groupKeys[Math.floor(Math.random() * groupKeys.length)]];
  const groupKeys = Object.keys(groups);
  const group: string[] = await Promise.all(groups[groupKeys[Math.floor(Math.random() * groupKeys.length)]].map(
    importFunction => importFunction().then(module => module.default)
  ));

  const getRandomImagePath = () => {
    return group[Math.floor(Math.random() * group.length)];
  }

  const fragment = makeFragment(getRandomImagePath());
  fragment.position.z = 3;
  object.add(fragment);

  const update = () => {
    const imagePath = getRandomImagePath();
    updateTexture(imagePath, fragment);
  }

  update();

  return { object, update };
}