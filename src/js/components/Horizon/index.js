import { BackSide, Color, Object3D, ShaderMaterial } from 'three'
import LoaderManager from '@/js/managers/LoaderManager'

import vertexShader from '@glsl/partials/common.vert'
import fragmentShader from '@glsl/horizon/main.frag'
import EnvManager from '../../managers/EnvManager'

export default class Horizon extends Object3D {
  #material
  #debug
  #settings = {
    scaleY: 13,
    scaleXZ: 16.259999999999998,
    color1: EnvManager.settings.sky,
    color2: EnvManager.settings.sky2,
  }
  #scale = 15
  constructor({ debug }) {
    super()

    this.#debug = debug

    this._createMaterial()
    this._createMesh()

    this._createDebugFolder()
  }

  _createMaterial() {
    this.#material = new ShaderMaterial({
      uniforms: {
        color1: { value: new Color(this.#settings.color1) },
        color2: { value: new Color(this.#settings.color2) },
      },
      fragmentShader,
      vertexShader,
      side: BackSide,
      // transparent: true,
      // depthWrite: false,
      depthTest: false,
    })
  }

  _createMesh() {
    const gltf = LoaderManager.get('horizon').gltf
    const scene = gltf.scene.clone()

    const mesh = scene.getObjectByName('Horizon')

    mesh.material = this.#material

    const geo = mesh.geometry
    geo.computeBoundingBox()

    const bb = geo.boundingBox

    geo.translate(0, bb.max.y, 0)

    this.scale.set(this.#settings.scaleXZ, this.#settings.scaleY, this.#settings.scaleXZ)

    mesh.renderOrder = -1

    this.renderOrder = -1

    // mesh.scale.set(2, 1, 2)

    this.add(mesh)
  }

  /**
   * Update
   */
  update({ time, delta }) {
    // this.#material.uniforms.uTime.value += (delta / 16) * this.#settings.speedTex

    this.#material.uniforms.color1.value = new Color(EnvManager.settings.sky)
    this.#material.uniforms.color2.value = new Color(EnvManager.settings.sky2)
  }

  resize({ width, height }) {}

  /**
   * Debug
   */
  _createDebugFolder() {
    if (!this.#debug) return

    const settingsChangedHandler = () => {
      this.scale.set(this.#settings.scaleXZ, this.#settings.scaleY, this.#settings.scaleXZ)
    }

    const debug = this.#debug.addFolder({ title: 'Horizon', expanded: false })

    debug.addInput(this.#settings, 'scaleY').on('change', settingsChangedHandler)
    debug.addInput(this.#settings, 'scaleXZ', { step: 0.01 }).on('change', settingsChangedHandler)

    const btn = debug.addButton({
      title: 'Copy settings',
      label: 'copy', // optional
    })

    btn.on('click', () => {
      navigator.clipboard.writeText(JSON.stringify(this.#settings))
      console.log('copied to clipboard', this.#settings)
    })

    return debug
  }
}
