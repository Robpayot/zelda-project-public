import { Color, ShaderMaterial } from 'three'
import EnvManager from '../../managers/EnvManager'
import OceanHeightMap from '../Ocean/OceanHeightMap'
import { REPEAT_OCEAN, SCALE_OCEAN } from '../Ocean'
import LoaderManager from '../../managers/LoaderManager'

// Toon Shaders
import vertexToonHeighmapShader from '@glsl/partials/toonHeightmap.vert'
import fragmentBarrelShader from '@glsl/game/barrel.frag'
import { randInt } from 'three/src/math/MathUtils'
import { MODE } from '../../utils/constants'

export default class Barrels {
  #material
  #avail = []
  #mesh
  #hitbox = 16
  #scale = 0.2
  constructor(scene, mode) {
    if (mode === MODE.EXPLORE) {
      this.#scale = 0.18
    } else {
      this.#scale = 0.2
    }

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
    const gltf = LoaderManager.get('barrel').gltf
    const barrelGroup = gltf.scene.getObjectByName('skeleton_root').clone()

    const s = this.#scale
    barrelGroup.scale.set(s, s, s)
    barrelGroup.position.y = -11
    barrelGroup.name = 'barrel'

    const mesh1 = barrelGroup.children[0]
    const material1 = new ShaderMaterial({
      vertexShader: vertexToonHeighmapShader,
      fragmentShader: fragmentBarrelShader,
      uniforms: {
        ambientColor: { value: EnvManager.ambientLight.color },
        coefShadow: { value: EnvManager.settings.coefShadow },
        map: { value: mesh1.material.map },
        heightMap: { value: OceanHeightMap.heightMap.texture },
        scaleOcean: { value: SCALE_OCEAN },
        fogColor: { value: new Color(EnvManager.settingsOcean.fogColor) },
        fogDensity: { value: EnvManager.settingsOcean.fogDensity },
      },
      defines: {
        USE_BONES: mesh1.type === 'SkinnedMesh',
      },
    })

    mesh1.geometry.computeVertexNormals()

    mesh1.material = material1

    const mesh2 = barrelGroup.children[1]
    const material2 = new ShaderMaterial({
      vertexShader: vertexToonHeighmapShader,
      fragmentShader: fragmentBarrelShader,
      uniforms: {
        ambientColor: { value: EnvManager.ambientLight.color },
        coefShadow: { value: EnvManager.settings.coefShadow },
        map: { value: mesh2.material.map },
        heightMap: { value: OceanHeightMap.heightMap.texture },
        scaleOcean: { value: SCALE_OCEAN },
        fogColor: { value: new Color(EnvManager.settingsOcean.fogColor) },
        fogDensity: { value: EnvManager.settingsOcean.fogDensity },
      },
      defines: {
        USE_BONES: mesh2.type === 'SkinnedMesh',
      },
    })

    mesh2.geometry.computeVertexNormals()

    mesh2.material = material2

    barrelGroup.visible = false
    barrelGroup.canVisible = false

    return barrelGroup
  }

  add(rangeX, rangeXMarge, zIncr = 0) {
    this.rangeX = rangeX
    this.rangeXMarge = rangeXMarge
    this.zIncr = zIncr

    const mesh = this.#mesh.clone()
    mesh.hitbox = this.#hitbox

    this.#avail.push(mesh)

    return mesh
  }

  getAvail({ i, z, slotX, mode, gridPos }) {
    const mesh = this.#avail[0]

    if (!mesh) return null

    if (mode === MODE.EXPLORE) {
      mesh.position.x = gridPos.x
      mesh.position.z = gridPos.y
    } else {
      const posXChoice = [(-this.rangeX * REPEAT_OCEAN) / 2.5, 0, (this.rangeX * REPEAT_OCEAN) / 2.5]
      mesh.slotX = slotX || randInt(0, 2)

      mesh.position.x = posXChoice[mesh.slotX]
      mesh.position.z = z || -i * this.zIncr - this.zIncr
    }

    mesh.initPos = mesh.position.clone()
    // remove from array
    this.#avail.shift()

    return mesh
  }

  free(mesh) {
    this.#avail.push(mesh)
  }
}
