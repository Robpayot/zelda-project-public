// Vendor
import { gsap } from 'gsap'
import Stats from 'stats-js'
import { Clock } from 'three'
// import { GPUStatsPanel } from 'three/addons/utils/GPUStatsPanel'

// Modules
import Debugger from '@/js/managers/Debugger'
import Renderer from '@/js/components/Renderer'
import MainView from './views/MainView'
import Settings from './utils/Settings'
import LoaderManager from './managers/LoaderManager'
import EnvManager from './managers/EnvManager'
// import { ShadowMapViewer } from 'three/addons/utils/ShadowMapViewer.js'
import OceanHeightMap from './components/Ocean/OceanHeightMap'
import GameManager from './managers/GameManager'
import ModeManager from './managers/ModeManager'
import { MODE } from './utils/constants'
import UIManager from './managers/UIManager'
import query from './utils/query'

const FPS_LIMIT = 30

export default class WebGLApp {
  #canvas
  #isDevelopment
  #isViewRenderingEnabled
  #isStatsGpuQueryStarted
  #clock
  #renderer
  #isActive
  #views
  #stats
  #statsGpuPanel
  #composer
  #activeView
  constructor({ canvas, isDevelopment }) {
    // Options
    this.#canvas = canvas
    this.#isDevelopment = isDevelopment

    // Props
    this.#isActive = true
    // this._renderScale = globalConfig.rendering.scale
    this.#isViewRenderingEnabled = true
    this.#isStatsGpuQueryStarted = false

    if (this.#isDevelopment && Debugger) {
      Debugger.addTab('Main')
    }

    // this.depthViewer = new ShadowMapViewer(EnvManager.sunDir)
    // this.depthViewer.size.set(500, 500)
    // Setup
    // this._debug = this._createDebug()
    this.#clock = this._createClock()
    this.#renderer = this._createRenderer()
    // this.#composer = this._createComposer()

    if (this.#isDevelopment || query('fps')) {
      this.#stats = this._createStats()
    }

    // if (this.#isDevelopment) {
    //   // this.#statsGpuPanel = this._createStatsGpuPanel()
    // }

    this._initViews()
    this._precompile()

    gsap.ticker.fps(60)

    this._setupEventListeners()
    this._resize()

    Settings.sceneInit = true
  }

  destroy() {
    this._removeDebug()
    this._removeStats()
    this._removeEventListeners()
    this._viewManager?.destroy()
    this.#composer?.destroy()
    this.#renderer.destroy()
  }

  /**
   * Public
   */

  /**
   * Private
   */

  _setupEventListeners() {
    window.addEventListener('resize', this._resizeHandler)
    window.addEventListener('deviceorientation', this._resizeHandler)
    window.addEventListener('orientationchange', this._resizeHandler)
    gsap.ticker.add(this._tickHandler)
    // Visibility.addEventListener('change', this._visibilityChangeHandler)
  }

  _removeEventListeners() {
    window.removeEventListener('resize', this._resizeHandler)
    window.removeEventListener('deviceorientation', this._resizeHandler)
    window.removeEventListener('orientationchange', this._resizeHandler)
    gsap.ticker.remove(this._tickHandler)
    // Visibility.removeEventListener('change', this._visibilityChangeHandler)
  }

  _start() {
    // this.#composer.setup()
    this._viewManager.setup()
    this._startStatsGpuQuery()
  }

  _startStatsGpuQuery() {
    if (this.#isDevelopment) {
      setTimeout(() => {
        this.#isStatsGpuQueryStarted = true
      }, 2000)
    }
  }

  _initViews() {
    this.#views = {
      main: new MainView({ renderer: this.#renderer.instance, config: { name: 'Main' }, debug: Debugger }),
    }

    this.#activeView = this.#views.main
  }

  // precompile shaders and materials
  _precompile() {
    const { scene, camera } = this.#activeView
    this.#renderer.instance.compile(scene, camera)

    // precompile textures
    const textures = LoaderManager.textures
    textures.forEach((texture) => {
      this.#renderer.instance.initTexture(texture)
    })
  }

  _createStats() {
    const stats = new Stats()
    document.body.appendChild(stats.dom)
    return stats
  }

  // _createStatsGpuPanel() {
  //   const panel = new GPUStatsPanel(this.#renderer.instance.getContext())
  //   this.#stats.addPanel(panel)
  //   // this.#stats.showPanel(3);
  //   return panel
  // }

  _removeStats() {
    if (!this.#stats) return
    document.body.removeChild(this.#stats.dom)
    this.#stats = null
  }

  _createClock() {
    const clock = new Clock()
    return clock
  }

  _createRenderer() {
    const renderer = new Renderer({
      canvas: this.#canvas,
    })
    return renderer
  }

  // _createComposer() {
  //   const composer = new Composer()
  //   bidello.registerGlobal('composer', composer)
  //   return composer
  // }

  /**
   * Update cycle
   */
  _tick() {
    if (!this.#isActive) return

    this.#stats?.begin()
    this._update()
    this._render()
    this.#stats?.end()

    // if (this.#isDevelopment && this.#renderer) this.#renderer.instance.info.reset()
    if (this.#renderer) this.#renderer.instance.info.reset()
    // R.P.: Continue to reset info in production to fix an issue using webworkers
  }

  _update() {
    // call all components updates
    let delta = this.#clock.getDelta() * 1000
    const time = this.#clock.getElapsedTime()
    // TODO: update all views
    const view = this.#views.main

    delta = Math.min(delta, 19)

    view?.update({ time, delta })
    // this._triggerBidelloUpdate()
  }

  _render() {
    // const view = this._viewManager?.active

    // if (!view) return

    if (this.#isDevelopment && this.#isStatsGpuQueryStarted) {
      // this.#statsGpuPanel?.startQuery()
    }

    const view = this.#views.main

    // render Target for Ocean Height Map
    if (OceanHeightMap.scene && Settings.heightMap) {
      this.#renderer.instance.setRenderTarget(OceanHeightMap.heightMap)
      this.#renderer.instance.clear()
      this.#renderer.render(OceanHeightMap.scene, OceanHeightMap.camera)
      this.#renderer.instance.setRenderTarget(null)
    }

    // render Target for Shadow Map
    if (view.components.ocean.mesh && EnvManager.settings.castShadows === true && Settings.castShadows) {
      view.components.ocean.mesh.material = EnvManager.shadowMaterial
      for (let i = 0; i < view.meshShadows.length; i++) {
        view.meshShadows[i].material = view.meshShadows[i].shadowMaterial
      }

      for (let i = 0; i < view.meshReceiveShadows.length; i++) {
        if (view.meshReceiveShadows[i].material.uniforms.uDepthMap) {
          view.meshReceiveShadows[i].material.uniforms.uDepthMap.value = null
        }
      }

      // make visible false all mesh that don't need castShadows here
      if (ModeManager.state === MODE.GAME || ModeManager.state === MODE.GAME_STARTED) {
        for (let i = 0; i < GameManager.objects.length; i++) {
          const mesh = GameManager.objects[i]
          mesh.visible = false
        }

        for (let i = 0; i < GameManager.wallObject.children.length; i++) {
          const mesh = GameManager.wallObject.children[i]
          mesh.visible = false
        }
      }

      this.#renderer.instance.setRenderTarget(EnvManager.sunShadowMap.map)
      this.#renderer.instance.clear()
      this.#renderer.render(view.scene, EnvManager.sunShadowMap.camera)
      this.#renderer.instance.setRenderTarget(null)

      // replace with their default materials
      view.components.ocean.mesh.material = view.components.ocean.mainMaterial
      for (let i = 0; i < view.meshShadows.length; i++) {
        view.meshShadows[i].material = view.meshShadows[i].mainMaterial
        if (view.meshShadows[i].material.uniforms.uDepthMap) {
          // Fix warning on Chrome : Feedback loop formed between Framebuffer and active Texture.
          view.meshShadows[i].material.uniforms.uDepthMap.value = EnvManager.sunShadowMap.map.texture
        }
      }

      for (let i = 0; i < view.meshReceiveShadows.length; i++) {
        if (view.meshReceiveShadows[i].material.uniforms.uDepthMap) {
          view.meshReceiveShadows[i].material.uniforms.uDepthMap.value = EnvManager.sunShadowMap.map.texture
        }
      }
      // reshow meshes taht don't need cast shadows

      if (ModeManager.state === MODE.GAME || ModeManager.state === MODE.GAME_STARTED) {
        for (let i = 0; i < GameManager.objects.length; i++) {
          const mesh = GameManager.objects[i]
          if (mesh.canVisible) {
            mesh.visible = true
          }
        }

        for (let i = 0; i < GameManager.wallObject.children.length; i++) {
          const mesh = GameManager.wallObject.children[i]
          if (mesh.canVisible) {
            mesh.visible = true
          }
        }
      }
    }

    if (view && this.#isViewRenderingEnabled) {
      this.#renderer.render(view.scene, view.camera)
      this.depthViewer?.render(this.#renderer.instance)

      // this.#composer?.render(view)

      if (UIManager.snap) {
        this.#renderer.capture()
        UIManager.snap = false
      }

      // if (GameManager.snap) {
      //   GameManager.capture()
      //   GameManager.snap = false
      // }
    }

    if (this.#isDevelopment && this.#isStatsGpuQueryStarted) {
      // this.#statsGpuPanel?.endQuery()
    }

    if (this.#isDevelopment) {
      this.#renderer.updateStats()
    }
  }

  /**
   * Resize
   */
  _resize() {
    const width = (this.width = window.innerWidth)
    const height = (this.height = window.innerHeight)
    const dpr = (this.dpr = Settings.dpr)
    this.#renderer.resize({ width, height, dpr })

    // for each views
    // call components resize

    this.#views.main.resize({ width, height })
    this.depthViewer?.updateForWindowResize()
  }

  /**
   * Handlers
   */
  _resizeHandler = () => {
    this._resize()
  }

  _tickHandler = () => {
    this._tick()
  }

  _visibilityChangeHandler({ isHidden }) {
    if (isHidden) {
      this.#clock.stop()
      this.#isActive = false
    } else {
      this.#clock.start()
      this.#isActive = true
    }
  }

  /**
   * Debug
   */
  // _createDebug() {
  //   if (!Debugger) return

  //   const debug = Debugger.addFolder({ title: 'WebGL', index: 1 })
  //   debug.addInput(this, '_renderScale', { label: 'Render scale', min: 0.01, max: 2 }).on('change', () => {
  //     this._resize()
  //   })
  //   return debug
  // }

  // _removeDebug() {
  //   if (this._debug) this._debug.dispose()
  // }
}
