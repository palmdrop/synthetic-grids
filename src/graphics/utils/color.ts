import * as THREE from 'three';

export const lerpColors = (colors: THREE.Color[], alpha: number) => {
  if(colors.length === 0) throw new Error("You must supply at least one color");
  if(colors.length === 1) return colors[0];
  if(alpha >= 1.0) return colors[colors.length - 1];

  const stepSize = 1.0 / (colors.length - 1)

  const index = Math.floor((colors.length - 1.0) * alpha);

  const a = THREE.MathUtils.mapLinear(
    alpha, stepSize * index, stepSize * (index + 1),
    0, 1
  );

  const c1 = colors[index];
  const c2 = colors[index + 1];

  return new THREE.Color().lerpColors(c1, c2, a);
}

export const rgbToHsb = (color: { r: number, g: number, b: number }) => {
  let r = color.r;
  let g = color.g;
  let b = color.b;

  r /= 255;
  g /= 255;
  b /= 255;
  const v = Math.max(r, g, b),
    n = v - Math.min(r, g, b);
  const h =
    n === 0 ? 0 : n && v === r ? (g - b) / n : v === g ? 2 + (b - r) / n : 4 + (r - g) / n;

  return {
    h: 60 * (h < 0 ? h + 6 : h),
    s: v && (n / v) * 100, 
    b: v * 100
  }
}
