import {
  AdditiveBlending,
  Color,
  CylinderGeometry,
  DoubleSide,
  Mesh,
  Object3D,
  ShaderMaterial,
} from 'three'

// Toon Shaders
import vertexBasicHeighmapShader from '@glsl/partials/basicHeightmap.vert'
import fragmentLightRing from '@glsl/game/lightRing.frag'
import fragmentLightColumn from '@glsl/game/lightColumn.frag'
import OceanHeightMap from '../Ocean/OceanHeightMap'
import { SCALE_OCEAN } from '../Ocean'

export const LIGHT_RING_TYPE = {
  RUPEE_0: 'RUPEE_0',
  RUPEE_1: 'RUPEE_1',
  TRIFORCE: 'TRIFORCE'
}

export default class LightRing {
  #materialRing
  #materialColumn
  #avail = []
  #mesh = new Object3D()
  #meshRing
  #meshColumn
  #hitbox = 30
  #scale = 2
  #object3D = new Object3D()
  constructor() {
    this.#materialRing = this._createMaterialRing()
    this.#materialColumn = this._createMaterialColumn()
    this.#meshRing = this._createMeshRing()
    this.#meshColumn = this._createMeshColumn()

    this.#mesh.add(this.#meshRing)
    this.#mesh.add(this.#meshColumn)

    const s = this.#scale
    this.#mesh.position.y = 8
    this.#mesh.scale.set(s, s, s)

    this.#mesh.name = 'lightRing'
  }

  get materialRing() {
    return this.#materialRing
  }

  get materialColumn() {
    return this.#materialColumn
  }

  get mesh() {
    return this.#mesh
  }

  get avail() {
    return this.#avail
  }

  _createMaterialRing() {
    const material = new ShaderMaterial({
      vertexShader: vertexBasicHeighmapShader,
      fragmentShader: fragmentLightRing,
      uniforms: {
        color: { value: new Color('#b9deeb') },
        heightMap: { value: OceanHeightMap.heightMap.texture },
        scaleOcean: { value: SCALE_OCEAN },
        uTime: { value: 0 },
      },
      side: DoubleSide,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })

    return material
  }

  _createMaterialColumn() {
    const material = new ShaderMaterial({
      vertexShader: vertexBasicHeighmapShader,
      fragmentShader: fragmentLightColumn,
      uniforms: {
        color: { value: new Color('#b9deeb') },
        heightMap: { value: OceanHeightMap.heightMap.texture },
        scaleOcean: { value: SCALE_OCEAN },
        uTime: { value: 0 },
      },
      side: DoubleSide,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })

    return material
  }

  _createMeshRing() {
    const geometry = new CylinderGeometry(8, 5, 7, 20, 20, true)

    const lightRing = new Mesh(geometry, this.#materialRing)

    return lightRing
  }

  _createMeshColumn() {
    const height = 200
    const geometry = new CylinderGeometry(3, 3, height, 20, 20, true)

    geometry.translate(0, height / 2 - 5, 0)

    const lightRing = new Mesh(geometry, this.#materialColumn)

    return lightRing
  }

  add(gridPos, type, triforceNb) {
    const mesh = this.#mesh.clone()
    mesh.position.x = gridPos.x
    mesh.position.z = gridPos.y
    mesh.initPos = mesh.position.clone()
    mesh.hitbox = this.#hitbox
    mesh.type = type
    mesh.triforceNb = triforceNb

    if (type === LIGHT_RING_TYPE.TRIFORCE) {
      mesh.children[1].visible = true
    } else {
      mesh.children[1].visible = false
    }

    this.#avail.push(mesh)

    return mesh
  }
}
