import { Euler, Vector3 } from 'three'

export default {
  // file: './src/script/webgl/scenes/SceneSky/settings.js',
  camera: {
    default: 'orbit',
    explore: {
      position: new Vector3(46.219816468774205, 17.72181497535984, 66.78034473667405),
      rotation: new Euler(-0.1565015595180362, 0.6139170676655783, 0.090650643731658, 'XYZ'),
      fov: 50, // 83
      near: 0.1,
      far: 100000,
      zoom: 0.8,
    },
    exploreTouch: {
      position: new Vector3(0, 24, 100),
      rotation: new Euler(-0.16680667608499267, 0.006665680861614376, 0.0011222998596041723, 'XYZ'),
      fov: 50, // 83
      near: 0.1,
      far: 100000,
      zoom: 0.8,
    },
    game: {
      position: new Vector3(0, 36, 77),
      rotation: new Euler(-0.36314700994617627, 0, 0, 'XYZ'),
      fov: 50, // 83
      near: 0.1,
      far: 100000,
      zoom: 0.8,
    },
  },
}
