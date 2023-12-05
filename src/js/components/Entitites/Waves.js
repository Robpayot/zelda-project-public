import { Float32BufferAttribute, Points } from 'three'
import { ShaderMaterial } from 'three'
import { BufferGeometry } from 'three'

import vertexShader from '@glsl/ocean/waves.vert'
import fragmentShader from '@glsl/ocean/waves.frag'
import { randFloatSpread } from 'three/src/math/MathUtils'
import LoaderManager from '../../managers/LoaderManager'
import { randFloat } from 'three/src/math/MathUtils'
import { gsap } from 'gsap'
import GridManager from '../../managers/GridManager'
import { REPEAT_OCEAN, SCALE_OCEAN } from '../Ocean'
import EnvManager from '../../managers/EnvManager'
import OceanHeightMap from '../Ocean/OceanHeightMap'

const NB_POINTS = 300
const RANGE = 1200
export default class Waves {
  #geo
  #mesh
  #material
  #index
  constructor() {
    this.#geo
    this.#material = this._createMaterial()
    this.#mesh = this._createMesh()

    this.tlReset = new gsap.timeline({ repeat: -1, repeatDelay: 5 })
    this.tlReset.to(this.material.uniforms.opacity, {
      value: 0,
      duration: 0.8,
    })
    this.tlReset.add(() => {
      this.mesh.initPos.x = GridManager.offsetUV.x * (SCALE_OCEAN / REPEAT_OCEAN)
      this.mesh.initPos.z = -GridManager.offsetUV.y * (SCALE_OCEAN / REPEAT_OCEAN)
    })
    this.tlReset.to(this.material.uniforms.opacity, {
      value: 1,
      duration: 0.8,
    })
  }

  get mesh() {
    return this.#mesh
  }

  get material() {
    return this.#material
  }

  _createMaterial() {
    const texture = LoaderManager.get('wave').texture

    const textureW = texture.source.data.naturalWidth
    const textureH = texture.source.data.naturalHeight

    texture.flipY = false

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        map: { value: texture },
        heightMap: { value: OceanHeightMap.heightMap.texture },
        scaleOcean: { value: SCALE_OCEAN },
        uRatioTexture: { value: textureH / textureW },
        uSize: { value: 450 },
        uTime: { value: 0 },
        opacity: { value: 1 },
        globalOpacity: { value: EnvManager.settingsOcean.alphaWaves },
      },
      transparent: true,
      // depthTest: false,
      // alphaTest: 0.5,
    })

    return material
  }

  _createMesh() {
    const vertices = []
    const offsets = []
    const speeds = []

    for (let i = 0; i < NB_POINTS; i++) {
      const x = randFloatSpread(RANGE)
      const y = 0
      const z = randFloatSpread(RANGE)

      vertices.push(x, y, z)

      const offset = randFloat(0, 100)
      offsets.push(offset)

      const speed = randFloat(1, 1.5)
      speeds.push(speed)
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('offset', new Float32BufferAttribute(offsets, 1))
    geometry.setAttribute('speed', new Float32BufferAttribute(speeds, 1))
    let mesh = new Points(geometry, this.#material)
    mesh.position.y = 4

    mesh.initPos = mesh.position.clone()

    return mesh
  }
}
