import { Color, ShaderMaterial } from 'three'
import EnvManager from '../../managers/EnvManager'
import OceanHeightMap from '../Ocean/OceanHeightMap'
import { REPEAT_OCEAN, SCALE_OCEAN } from '../Ocean'
import LoaderManager from '../../managers/LoaderManager'

// Toon Shaders
import vertexToonHeighmapShader from '@glsl/partials/toonHeightmap.vert'
import fragmentRupeeShader from '@glsl/game/rupee.frag'
import { randInt } from 'three/src/math/MathUtils'

import DATA_RUPEES from '../../data/rupees_score.json'
import { MODE } from '../../utils/constants'

export default class Rupees {
  #materials = []
  #avail = []
  #mesh
  #hitbox = 10
  #baseY
  #scale
  constructor(scene, mode) {
    if (mode === 'treasure') {
      this.#baseY = 2
      this.#scale = 0.014
    } else if (mode === MODE.EXPLORE) {
      this.#baseY = 7
      this.#hitbox = 10
      this.#scale = 0.16
    } else {
      this.#baseY = 14
      this.#scale = 0.2
    }
    this._createMaterials()

    this.#mesh = this._createMesh()
    // scene.add(this.#mesh)
  }

  get mesh() {
    return this.#mesh
  }

  get materials() {
    return this.#materials
  }

  set avail(val) {
    this.#avail = val
  }

  _createMaterials() {
    const uniforms = {
      ambientColor: { value: EnvManager.ambientLight.color },
      coefShadow: { value: EnvManager.settings.coefShadow },
      color: { value: new Color(0, 0.314, 0) },
      heightMap: { value: OceanHeightMap.heightMap.texture },
      scaleOcean: { value: SCALE_OCEAN },
    }

    const mat1 = new ShaderMaterial({
      vertexShader: vertexToonHeighmapShader,
      fragmentShader: fragmentRupeeShader,
      uniforms,
    })

    this.#materials.push(mat1)

    const mat2 = new ShaderMaterial({
      vertexShader: vertexToonHeighmapShader,
      fragmentShader: fragmentRupeeShader,
      uniforms: {
        ...uniforms,
        color: { value: new Color('#365ad3') },
      },
    })
    mat2.uniforms.color.value = new Color('#365ad3')
    this.#materials.push(mat2)

    const mat3 = new ShaderMaterial({
      vertexShader: vertexToonHeighmapShader,
      fragmentShader: fragmentRupeeShader,
      uniforms: {
        ...uniforms,
        color: { value: new Color('#bfc84e') },
      },
    })
    this.#materials.push(mat3)

    const mat4 = new ShaderMaterial({
      vertexShader: vertexToonHeighmapShader,
      fragmentShader: fragmentRupeeShader,
      uniforms: {
        ...uniforms,
        color: { value: new Color('#f54c4b') },
      },
    })
    this.#materials.push(mat4)

    const mat5 = new ShaderMaterial({
      vertexShader: vertexToonHeighmapShader,
      fragmentShader: fragmentRupeeShader,
      uniforms: {
        ...uniforms,
        color: { value: new Color('#8561ab') },
      },
    })
    this.#materials.push(mat5)

    const mat6 = new ShaderMaterial({
      vertexShader: vertexToonHeighmapShader,
      fragmentShader: fragmentRupeeShader,
      uniforms: {
        ...uniforms,
        color: { value: new Color('#ed7f21') },
      },
    })
    this.#materials.push(mat6)

    const mat7 = new ShaderMaterial({
      vertexShader: vertexToonHeighmapShader,
      fragmentShader: fragmentRupeeShader,
      uniforms: {
        ...uniforms,
        color: { value: new Color('#f0f0f0') },
      },
    })
    this.#materials.push(mat7)
  }

  _createMesh() {
    const gltf = LoaderManager.get('rupee').gltf
    const rupeeMesh = gltf.scene.getObjectByName('rupee').clone()
    rupeeMesh.name = 'rupee'

    const s = this.#scale
    rupeeMesh.material = this.#materials[0]
    rupeeMesh.position.y = this.#baseY
    rupeeMesh.scale.set(s, s, s)

    rupeeMesh.initPos = rupeeMesh.position.clone()

    rupeeMesh.visible = false
    rupeeMesh.canVisible = false

    return rupeeMesh
  }

  add(rangeX, zIncr) {
    this.rangeX = rangeX
    this.zIncr = zIncr
    const mesh = this.#mesh.clone()
    mesh.rotation.y = randInt(0, 2 * Math.PI)
    mesh.hitbox = this.#hitbox

    mesh.geometry.computeVertexNormals() // fix normals bug from model

    mesh.initPos = mesh.position.clone()

    this.#avail.push(mesh)

    return mesh
  }

  getAvail({ i, z, slotX, mat = 0, mode, gridPos }) {
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

    mesh.rotation.y = randInt(0, 2 * Math.PI)

    mesh.material = this.#materials[mat]
    mesh.score = DATA_RUPEES[mat]

    mesh.initPos = mesh.position.clone()

    // remove from array
    this.#avail.shift()

    return mesh
  }

  free(mesh) {
    this.#avail.push(mesh)
  }
}
