import { ShaderMaterial } from 'three'
import EnvManager from '../../managers/EnvManager'
import OceanHeightMap from '../Ocean/OceanHeightMap'
import { REPEAT_OCEAN, SCALE_OCEAN } from '../Ocean'
import LoaderManager from '../../managers/LoaderManager'

// Toon Shaders
import vertexToonHeighmapShader from '@glsl/partials/toonHeightmap.vert'
import fragmentShader from '@glsl/game/barrel.frag'
import { degToRad, randInt } from 'three/src/math/MathUtils'

export default class Ship {
  #avail = []
  #mesh
  #hitbox = 16
  constructor(scene) {
    this.#mesh = this._createMeshMat()

    // scene.add(this.#mesh)
  }

  get mesh() {
    return this.#mesh
  }

  set avail(val) {
    this.#avail = val
  }

  _createMeshMat() {
    const gltf = LoaderManager.get('ship').gltf
    const shipGroup = gltf.scene

    const s = 0.31
    shipGroup.scale.set(s, s, s)
    shipGroup.rotation.y = degToRad(90)
    // shipGroup.position.y = -11
    shipGroup.name = 'ship'

    const mesh1 = shipGroup.children[0]
    const material1 = new ShaderMaterial({
      vertexShader: vertexToonHeighmapShader,
      fragmentShader: fragmentShader,
      uniforms: {
        ambientColor: { value: EnvManager.ambientLight.color },
        coefShadow: { value: EnvManager.settings.coefShadow },
        map: { value: mesh1.material.map },
        heightMap: { value: OceanHeightMap.heightMap.texture },
        scaleOcean: { value: SCALE_OCEAN },
      },
    })

    mesh1.geometry.computeVertexNormals()

    mesh1.material = material1

    const mesh2 = shipGroup.children[1]
    const material2 = new ShaderMaterial({
      vertexShader: vertexToonHeighmapShader,
      fragmentShader: fragmentShader,
      uniforms: {
        ambientColor: { value: EnvManager.ambientLight.color },
        coefShadow: { value: EnvManager.settings.coefShadow },
        map: { value: mesh2.material.map },
        heightMap: { value: OceanHeightMap.heightMap.texture },
        scaleOcean: { value: SCALE_OCEAN },
      },
    })

    mesh2.geometry.computeVertexNormals()

    mesh2.material = material2

    shipGroup.visible = false
    shipGroup.canVisible = false

    return shipGroup
  }

  add(rangeX, rangeXMarge, zIncr) {
    this.rangeX = rangeX
    this.rangeXMarge = rangeXMarge
    this.zIncr = zIncr

    const mesh = this.#mesh.clone()
    mesh.hitbox = this.#hitbox

    this.#avail.push(mesh)

    return mesh
  }

  getAvail({ i, z, slotX }) {
    const mesh = this.#avail[0]

    if (!mesh) return null

    const posXChoice = [(-this.rangeX * REPEAT_OCEAN) / 2.5, 0, (this.rangeX * REPEAT_OCEAN) / 2.5]
    mesh.slotX = slotX || randInt(0, 2)

    mesh.position.x = posXChoice[mesh.slotX]
    mesh.position.z = z || -i * this.zIncr - this.zIncr

    mesh.initPos = mesh.position.clone()
    // remove from array
    this.#avail.shift()

    return mesh
  }

  free(mesh) {
    this.#avail.push(mesh)
  }
}
