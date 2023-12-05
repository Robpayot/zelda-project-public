// Vendor
import {
  ACESFilmicToneMapping,
  CineonToneMapping,
  Color,
  LinearToneMapping,
  NoToneMapping,
  ReinhardToneMapping,
  WebGL1Renderer,
  WebGLRenderer,
} from 'three'
import WebGL from 'three/addons/capabilities/WebGL.js'

// Configs
// import globalConfig from '@/js/webgl/configs/global'

// Modules
import Debugger from '@/js/managers/Debugger'
import Settings from '../utils/Settings'
import UIManager from '../managers/UIManager'

export default class Renderer {
  #canvas
  #debug
  #debugStats
  #instance
  constructor({ canvas }) {
    // Options
    this.#canvas = canvas

    // Setup
    this.#debug = this._createDebug()
    this.#instance = this._createRenderer()
    this.#debugStats = this._createDebugStats()
  }

  destroy() {
    this.#instance.dispose()
    this._removeDebug()
  }

  /**
   * Getters & Setters
   */
  get instance() {
    return this.#instance
  }

  /**
   * Public
   */
  updateStats() {
    Debugger?.pane.refresh()
    this.#instance.info.reset()
  }

  /**
   * Private
   */
  _createRenderer() {
    const RendererClass = WebGL.isWebGL2Available() ? WebGLRenderer : WebGL1Renderer
    const renderer = new RendererClass({
      canvas: this.#canvas,
      antialias: Settings.antialias,
      powerPreference: 'high-performance',
    })

    const clearColor = new Color(0xffffff)
    const clearAlpha = 1
    renderer.setClearColor(clearColor, clearAlpha)
    renderer.toneMapping = LinearToneMapping
    // renderer.shadowMap.enabled = true
    // renderer.shadowMap.type = PCFSoftShadowMap
    // renderer.shadowMap.type = BasicShadowMap
    // renderer.info.autoReset = false
    // renderer.outputColorSpace = SRGBColorSpace
    renderer.autoClear = false

    if (this.#debug) {
      const props = {
        clearColor: clearColor.getStyle(),
      }

      const toneMaps = {
        NoToneMapping,
        LinearToneMapping,
        ReinhardToneMapping,
        CineonToneMapping,
        ACESFilmicToneMapping,
      }
      this.#debug.addInput(props, 'clearColor').on('change', () => {
        renderer.setClearColor(new Color(props.clearColor), clearAlpha)
      })
      this.#debug.addInput(renderer, 'toneMapping', { options: toneMaps })
      this.#debug.addInput(renderer, 'toneMappingExposure', { min: 0, max: 10 })
    }

    return renderer
  }

  /**
   * Render
   */
  render(scene, camera) {
    this.#instance.render(scene, camera)
  }

  /**
   * Resize
   */
  resize({ width, height, dpr }) {
    this.#instance.setPixelRatio(dpr)
    this.#instance.setSize(width, height)

    const mainEl = document.querySelector('main')
    // mainEl.style.overflow = 'hidden'
    // console.log(document.children[0])
    // document.body.style.height = `${height}px`
    // document.children[0].style.height = `${height}px`
  }

  /**
   * Handlers
   */
  onExposureChange(exposure) {
    this.#instance.toneMappingExposure = exposure
  }

  capture() {
    const base64 = this.#canvas.toDataURL('img/png')

    UIManager.screenshotElImg.src = base64
  }

  /**
   * Debug
   */
  _createDebug() {
    if (!Debugger) return

    const debug = Debugger.addFolder({ title: 'Renderer', index: 1 })
    return debug
  }

  _createDebugStats() {
    if (!this.#debug) return
    const stats = this.#debug.addFolder({ title: 'Stats' })
    const memory = stats.addFolder({ title: 'Memory' })
    memory.addMonitor(this.#instance.info.memory, 'geometries')
    memory.addMonitor(this.#instance.info.memory, 'textures')
    const render = stats.addFolder({ title: 'Render' })
    render.addMonitor(this.#instance.info.render, 'calls')
    render.addMonitor(this.#instance.info.render, 'triangles')
    render.addMonitor(this.#instance.info.render, 'points')
    render.addMonitor(this.#instance.info.render, 'lines')
    return stats
  }

  _removeDebug() {
    if (this.#debug) this.#debug.dispose()
  }
}
