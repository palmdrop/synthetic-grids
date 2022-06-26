import * as THREE from 'three';

export type GeometryGrid3dConfig = {
  width: number,
  height: number,
  depth: number,
  cellsX: number,
  cellsY: number,
  cellsZ: number,
  lineColor?: THREE.Color,
  lineWidth?: number,
  material?: THREE.LineBasicMaterial | THREE.LineDashedMaterial
}

export const makeGeometryGrid3d = (config: GeometryGrid3dConfig) => {
  const {
    width, height, depth,
    cellsX, cellsY, cellsZ,
    lineColor
  } = config;

  const geometry = new THREE.EdgesGeometry(
    new THREE.BoxBufferGeometry()
  );

  const material = config.material ?? new THREE.LineBasicMaterial({
    color: lineColor ?? 0xffffff,
    linewidth: 2
  });

  const object = new THREE.Object3D();

  const cellWidth = width / cellsX;
  const cellDepth = depth / cellsY;
  const cellHeight = height / cellsZ;

  for(let x = 0; x < cellsX; x++)
  for(let y = 0; y < cellsY; y++)
  for(let z = 0; z < cellsZ; z++) {
    const segments = new THREE.LineSegments(
      geometry,
      material
    );

    segments.scale.set(cellWidth, cellDepth, cellHeight);
    segments.position.set(
      x * cellWidth - width / 2,
      y * cellDepth - depth / 2,
      z * cellHeight - height / 2,
    );

    object.add(segments);
  }

  return object;
}