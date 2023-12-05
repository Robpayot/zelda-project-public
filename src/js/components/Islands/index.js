import { ShaderMaterial, Vector3 } from 'three'
import EnvManager from '../../managers/EnvManager'
import LoaderManager from '../../managers/LoaderManager'

// Toon Shaders
import vertexToonShader from '@glsl/partials/toonWorld.vert'
import fragmentIslandShader from '@glsl/game/islands.frag'
import { SCALE_OCEAN } from '../Ocean'
import { degToRad } from 'three/src/math/MathUtils'

import Debugger from '@/js/managers/Debugger'

export default class Islands {
  #material
  #mesh
  #scale = 130
  #LODRatio = 30
  #LODScale = 12
  #farRadius = 3 // 3
  #islands = []
  #settings = {
    border: 0.091,
    borderY: 0.028,
  }

  constructor(scene, mode) {
    this._createIslands(scene)
    // this.#mesh = this._createMeshMat()

    // scene.add(this.#mesh)
    this._createDebugFolder()
  }

  get islands() {
    return this.#islands
  }

  get farRadius() {
    return this.#farRadius
  }

  get LODRatio() {
    return this.#LODRatio
  }

  get LODScale() {
    return this.#LODScale
  }

  _createIslands(scene) {
    const LODGLTF = LoaderManager.get('islands').gltf
    const s = this.#LODRatio
    LODGLTF.scene.scale.set(s, s, s)

    const children = LODGLTF.scene.children
    let angle = degToRad(-120)
    const radius = SCALE_OCEAN / 2 / s - 1

    for (let i = 0; i < children.length; i++) {
      const obj = {}
      const lodMesh = this._createLOD({ i, radius, angle, LODGLTF })
      obj.lod = lodMesh

      // create
      const islandMesh = this._createIsland({ i, angle })

      if (islandMesh) {
        scene.add(islandMesh)

        obj.island = islandMesh
      }

      angle += degToRad(60)

      this.#islands.push(obj)
    }

    scene.add(LODGLTF.scene)
  }

  _createLOD({ i, angle, radius, LODGLTF }) {
    const mesh = LODGLTF.scene.getObjectByName(`mesh-${i}`)

    mesh.position.x = Math.cos(angle) * radius * this.#farRadius
    mesh.position.z = Math.sin(angle) * radius * this.#farRadius

    mesh.initPos = mesh.position.clone()

    // mesh.material = new MeshBasicMaterial({ transparent: true, opacity: 0.2 })

    const s = this.#LODScale
    mesh.scale.set(s, s, s)

    mesh.renderOrder = 0

    return mesh
  }

  _createIsland({ i, angle }) {
    const loadObject = LoaderManager.get(`island_${i}`)

    if (!loadObject) return null
    const mesh = loadObject.gltf.scene
    const s = this.#scale

    mesh.iAngle = angle
    mesh.position.x = Math.cos(angle) * 1470 * this.#farRadius
    mesh.position.z = Math.sin(angle) * 1470 * this.#farRadius
    mesh.position.y -= 1
    mesh.initPos = mesh.position.clone()

    mesh.scale.set(s, s, s)
    mesh.name = `island_${i}`

    mesh.renderOrder = 10

    const collisions = []
    mesh.traverse((object) => {
      if (object.isMesh) {
        // object
        const material = new ShaderMaterial({
          vertexShader: vertexToonShader,
          fragmentShader: fragmentIslandShader,
          uniforms: {
            ambientColor: { value: EnvManager.ambientLight.color },
            coefShadow: { value: EnvManager.settings.coefShadow },
            map: { value: object.material.map },
          },
          transparent: object.name.includes('alpha'),
          defines: {
            USE_BONES: object.type === 'SkinnedMesh',
            USE_ALPHAMAP: object.name.includes('alpha'),
            USE_ALPHAMAP_CUTY: object.name.includes('cutY'),
          },
          name: 'toon',
        })

        if (object.name.includes('collision')) {
          const pos = new Vector3()
          object.getWorldPosition(pos)

          // pos.divideScalar(this.#scale)
          const geo = object.geometry
          geo.computeBoundingBox()

          const bb = geo.boundingBox

          let radius
          // const distX = Math.abs(bb.max.x + bb.min.x) / 1
          // const distY = Math.abs(bb.max.y + bb.min.y) / 1
          // const distZ = Math.abs(bb.max.z + bb.min.z) / 1

          const distX = bb.max.x
          const distY = bb.max.y
          const distXNeg = Math.abs(bb.min.x)
          const distYNeg = Math.abs(bb.min.y)
          // const distZ = Math.abs(bb.max.z + bb.min.z) / 1

          const largest = Math.max(distX, distY, distXNeg, distYNeg) * (this.#scale + 18) // 15.5 scale value ratio

          radius = largest

          collisions.push({ pos: object.position, bb, worldPos: pos, radius })
        }

        if (object.name.includes('hidden')) {
          object.visible = false
        } else {
          object.material = material
        }
      }
    })

    mesh.collisions = collisions

    mesh.visible = false

    return mesh
  }

  /**
   * Debug
   */
  _createDebugFolder() {
    if (!Debugger) return

    const settingsChangedHandler = () => {
      const s = this.#settings.border
      this.border.scale.set(s, this.#settings.borderY, s)
    }

    const debug = Debugger.addFolder({ title: 'Borders', expanded: true })

    debug.addInput(this.#settings, 'border', { step: 0.001 }).on('change', settingsChangedHandler)
    debug.addInput(this.#settings, 'borderY', { step: 0.001 }).on('change', settingsChangedHandler)

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
