import {
  HalfFloatType,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from 'three'
// Modules
import Debugger from '@/js/managers/Debugger'
import vertexHeightmapShader from '@glsl/ocean/heightmap.vert'
import fragmentHeightmapShader from '@glsl/ocean/heightmap.frag'
import { SCALE_OCEAN } from '.'
import Settings from '../../utils/Settings'

class OceanHeightmap {
  #camera
  #scene
  #settings = {
    heightMapCoef: 0.04,
  }
  #heightMap
  #material
  constructor() {}

  get heightMap() {
    return this.#heightMap
  }

  get material() {
    return this.#material
  }

  get scene() {
    return this.#scene
  }

  get camera() {
    return this.#camera
  }

  _createHeightMap() {
    const frustumSize = 3000

    // create Ortho camera for custom shadow map

    this.#camera = new OrthographicCamera(
      -frustumSize / 2,
      frustumSize / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      frustumSize
    )

    this.#camera.position.z = 1
    this.#camera.lookAt(new Vector3(0, 0, 0))

    // Create the texture
    const mapSize = Settings.textureSize

    const pars = {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      // samples: 12, // anti-aliasing
      type: HalfFloatType,
      // minFilter: LinearMipmapLinearFilter,
      // magFilter: LinearFilter,
      // format: RGBAFormat,
      // stencilBuffer: false,
      // generateMipmaps: true,
    }

    const texture = new WebGLRenderTarget(mapSize, mapSize, pars)

    this.#material = new ShaderMaterial({
      vertexShader: vertexHeightmapShader,
      fragmentShader: fragmentHeightmapShader,
      uniforms: {
        timeWave: { value: 0 },
        yScale: { value: 0 },
        yStrength: { value: 0 },
        dirTex: { value: new Vector2(0, 0) },
        heightMapCoef: { value: this.#settings.heightMapCoef },
      },
      // side: DoubleSide,
    })

    return texture
  }

  init(scene) {
    this.#heightMap = this._createHeightMap()

    this.#scene = new Scene()
    this._createDebugFolder()

    const mesh = new Mesh(new PlaneGeometry(1, 1, 200, 200), this.#material)
    mesh.position.y = 0
    mesh.scale.set(SCALE_OCEAN, SCALE_OCEAN, 1)
    // mesh.rotateX(degToRad(90))
    this.#scene.add(mesh)
  }

  /**
   * Debug
   */
  _createDebugFolder() {
    if (!Debugger) return

    const settingsChangedHandler = () => {
      this.#material.uniforms.heightMapCoef.value = this.#settings.heightMapCoef
    }

    const debugFolder = Debugger.addFolder({ title: `Ocean heightmap`, expanded: true })

    debugFolder.addInput(this.#settings, 'heightMapCoef').on('change', settingsChangedHandler)

    const btn = debugFolder.addButton({
      title: 'Copy settings',
      label: 'copy', // optional
    })

    btn.on('click', () => {
      navigator.clipboard.writeText(JSON.stringify(this.#settings))
      console.log('copied to clipboard', this.#settings)
    })
    return debugFolder
  }
}

export default new OceanHeightmap()
