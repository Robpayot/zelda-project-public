import { Object3D, ShaderMaterial, Vector2, Vector3 } from 'three'
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
  #scale = 130 // 130
  #LODRatio = 30
  #LODScale = 12
  #farRadius = 2.5 // 3
  #islands = []
  #settings = {
    border: 0.091,
    borderY: 0.028,
  }
  constructor(scene, mode) {
    this.scene = scene
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

    // add oasis island
    const islandMesh = this._createIsland({ i: 0, angle, isOasis: true })

    const obj = new Object3D()

    if (islandMesh) {
      scene.add(islandMesh)
      obj.island = islandMesh
    }

    this.#islands.push(obj)

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

  _createIsland({ i, angle, isOasis }) {
    let loadObject
    if (isOasis) {
      loadObject = LoaderManager.get(`island_oasis`)
    } else {
      loadObject = LoaderManager.get(`island_${i}`)
    }

    if (!loadObject) return null
    const mesh = loadObject.gltf.scene
    const s = this.#scale

    mesh.iAngle = angle

    if (isOasis) {
      mesh.position.set(0, 0, -300)
      mesh.initPos = mesh.position.clone()

      mesh.scale.set(s, s, s)
      mesh.name = `island_oasis`
    } else {
      mesh.position.x = Math.cos(angle) * 1470 * this.#farRadius
      mesh.position.z = Math.sin(angle) * 1470 * this.#farRadius
      mesh.position.y -= 1
      mesh.initPos = mesh.position.clone()

      mesh.scale.set(s, s, s)
      mesh.name = `island_${i}`
    }

    mesh.renderOrder = 10

    const collisions = []
    let indTest = 0
    mesh.traverse((object) => {
      if (object.isMesh) {
        // object
        let material
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
          let shape = 'circle'
          let polyShape = []

          if (object.name.toLowerCase().includes('plane')) {
            shape = 'plane'
            // Access the position attribute
            const positionAttribute = geo.getAttribute('position')

            // Get the array of vertices

            // Create a new THREE.Shape

            // Add the vertices to the shape
            for (let i = 0; i < positionAttribute.count; i++) {
              const x = positionAttribute.getX(i)
              const z = positionAttribute.getZ(i)

              // apply any Y rotation of the 2D polygone
              // Apply the rotation matrix manually (adjust rotation values)
              const rotatedX = Math.cos(object.rotation.y) * x - Math.sin(object.rotation.y) * z
              const rotatedZ = Math.sin(object.rotation.y) * x + Math.cos(object.rotation.y) * z
              // apply parent scale
              polyShape.push([rotatedX * this.#scale, rotatedZ * this.#scale])
            }

            // Sort clockWise to avoid 'crossed ploygone" where we get empty spaces on edges
            // Calculate the centroid
            const centroid = new Vector2()
            for (const vertex of polyShape) {
              centroid.add(new Vector2(vertex[0], vertex[1]))
            }
            centroid.divideScalar(polyShape.length)

            //Sort vertices based on polar angle
            polyShape.sort((a, b) => {
              const angleA = Math.atan2(a[1] - centroid.y, a[0] - centroid.x)
              const angleB = Math.atan2(b[1] - centroid.y, b[0] - centroid.x)
              return angleA - angleB
            })
            indTest++
          }

          collisions.push({ pos: object.position, bb, worldPos: pos, radius, shape, polyShape })
        } else {
          material = new ShaderMaterial({
            vertexShader: vertexToonShader,
            fragmentShader: fragmentIslandShader,
            uniforms: {
              ambientColor: { value: EnvManager.ambientLight.color },
              coefShadow: { value: EnvManager.settings.coefShadow },
              map: { value: object.material.map },
            },
            // transparent: object.name.includes('alpha'),
            defines: {
              USE_BONES: object.type === 'SkinnedMesh',
              USE_ALPHAMAP: object.name.includes('alpha'),
              USE_ALPHAMAP_CUTY: object.name.includes('cutY'),
            },
            name: 'toon',
          })
        }

        // object.renderOrder = 10

        if (object.name.includes('hidden')) {
          object.visible = false
        } else {
          object.material = material
        }
      }
    })

    mesh.collisions = collisions

    if (!isOasis) {
      mesh.visible = false
    }

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
