import * as POSTPROCESSING from 'postprocessing';
import * as THREE from 'three';
import type * as dat from 'dat.gui';

export const getComposer = (
  renderer : THREE.WebGLRenderer,
  scene : THREE.Scene,
  camera : THREE.Camera,
  focalLength : number,
  gui : dat.GUI,
  defaultPasses?: boolean,
  additionalPasses?: POSTPROCESSING.Pass[],
  defaultSettings?: Record<string, Record<string, any>>
) => {
  const composer = new POSTPROCESSING.EffectComposer( renderer );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const effects : any[] = [];

  composer.addPass(
    new POSTPROCESSING.RenderPass( scene, camera )
  );

  {
    const bloomEffect = new POSTPROCESSING.BloomEffect( {
      luminanceThreshold: defaultSettings?.bloom?.threshold ?? 0.82,
      intensity: defaultSettings?.bloom?.intensity ?? 0.1,
      kernelSize: POSTPROCESSING.KernelSize.LARGE
    } );
    effects.push( bloomEffect );

    const bloomFolder = gui.addFolder( 'bloom' );
    bloomFolder.add( bloomEffect, 'intensity', 0, 10 );
    bloomFolder.add( bloomEffect.luminanceMaterial, 'threshold', 0, 1.0 );
    bloomFolder.add( bloomEffect.luminanceMaterial, 'smoothing', 0, 0.05 );
  }

  let updateFocusDistance : ( ( distance ?: number ) => void ) | undefined = undefined;
  {
    const depthOfFieldEffect = new POSTPROCESSING.DepthOfFieldEffect(
      camera, {
        focusDistance: defaultSettings?.depthOfField.focusDistance ?? 0.0,
        focalLength: defaultSettings?.depthOfField.focalLength ?? focalLength,
        bokehScale: defaultSettings?.depthOfField.bokehScale ?? 4.0,
      }
    );
    effects.push( depthOfFieldEffect );

    const depthOfFieldFolder = gui.addFolder( 'depth of field' );
    depthOfFieldFolder.add( depthOfFieldEffect, 'bokehScale', 0.0, 10.0 );

    const uniforms = depthOfFieldEffect.circleOfConfusionMaterial.uniforms;

    depthOfFieldFolder.add( 
      { focalLength: uniforms.focalLength.value }, 
      'focalLength', 0.0, 1.0, 0.001,
    ).onChange( ( value ) => {
      uniforms.focalLength.value = value;
      depthOfFieldEffect.circleOfConfusionMaterial.uniformsNeedUpdate = true;
    } );

    const rayCaster = new THREE.Raycaster();
    rayCaster.setFromCamera( 
      new THREE.Vector2( 0, 0 ),
      camera
    );

    updateFocusDistance = ( distance : number | undefined ) => {
      if( !distance ) {
        distance = depthOfFieldEffect.calculateFocusDistance( new THREE.Vector3() ) - 0.01;
      }

      uniforms.focusDistance.value = distance;
      depthOfFieldEffect.circleOfConfusionMaterial.uniformsNeedUpdate = true;
    };

    depthOfFieldFolder.add( 
      { focusDistance: uniforms.focusDistance.value }, 
      'focusDistance', 0.0, 1.0, 0.001,
    ).onChange( ( value ) => ( updateFocusDistance as ( distance : number ) => void )( value ) );
  }

  {
    const vignetteEffect = new POSTPROCESSING.VignetteEffect( {
      eskil: false,
      offset: 0.5,
      darkness: defaultSettings?.vignette?.darkness ?? 0.4
    } );
    effects.push( vignetteEffect );

    const vignetteFolder = gui.addFolder( 'vignette' );
    vignetteFolder.add(
      { offset: vignetteEffect.uniforms.get( 'offset' )!.value },
      'offset', 0.0, 1.0,
    ).onChange( ( value ) => {
      vignetteEffect.uniforms.get( 'offset' )!.value = value;
    } );

    vignetteFolder.add(
      { darkness: vignetteEffect.uniforms.get( 'darkness' )!.value },
      'darkness', 0.0, 1.0,
    ).onChange( ( value ) => {
      vignetteEffect.uniforms.get( 'darkness' )!.value = value;
    } );
  }

  {
    const smaaEffect = new POSTPROCESSING.SMAAEffect({});
    effects.push( smaaEffect );
  }

  if(defaultPasses ?? true) {
    effects.forEach( effect => composer.addPass( new POSTPROCESSING.EffectPass( camera, effect ) ) );
  }

  if(additionalPasses) {
    additionalPasses.forEach(pass => composer.addPass(pass));
  }

  const update = () => {
    updateFocusDistance?.();
  };

  return { 
    composer,
    update
  };
};