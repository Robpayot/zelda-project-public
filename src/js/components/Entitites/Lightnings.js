import { Float32BufferAttribute, Points } from 'three'
import { ShaderMaterial } from 'three'
import { BufferGeometry } from 'three'

import vertexShader from '@glsl/ocean/lightnings.vert'
import fragmentShader from '@glsl/ocean/lightnings.frag'
import LoaderManager from '../../managers/LoaderManager'
import { randFloat } from 'three/src/math/MathUtils'
import { gsap } from 'gsap'
import GridManager from '../../managers/GridManager'
import { REPEAT_OCEAN, SCALE_OCEAN } from '../Ocean'
import EnvManager from '../../managers/EnvManager'

const NB_POINTS = 10
const RANGE_MAX = 3000
const RANGE_MIN = 2500
export default class Lightnings {
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
    const texture = LoaderManager.get('lightning').texture

    const textureW = texture.source.data.naturalWidth
    const textureH = texture.source.data.naturalHeight

    texture.flipY = false

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        map: { value: texture },
        uRatioTexture: { value: textureH / textureW },
        uSize: { value: 1000 },
        uTime: { value: 0 },
        opacity: { value: 1 },
        globalOpacity: { value: EnvManager.settingsOcean.alphaLightnings },
      },
      transparent: true,
      depthWrite: false,
      // alphaTest: 0.5,
    })

    return material
  }

  _createMesh() {
    const vertices = []
    const offsets = []
    const speeds = []
    const scales = []

    let angle = 0

    for (let i = 0; i < NB_POINTS; i++) {
      const radius = randFloat(RANGE_MIN, RANGE_MAX)
      angle += 0.4
      const x = radius * Math.cos(angle)
      const y = 0
      const z = radius * Math.sin(angle)

      vertices.push(x, y, z)

      const offset = randFloat(0, 100)
      offsets.push(offset)

      const speed = randFloat(1, 1.5)
      speeds.push(speed)

      const scale = randFloat(0, 0.4)
      scales.push(scale)
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('offset', new Float32BufferAttribute(offsets, 1))
    geometry.setAttribute('speed', new Float32BufferAttribute(speeds, 1))
    geometry.setAttribute('scale', new Float32BufferAttribute(scales, 1))
    let mesh = new Points(geometry, this.#material)
    mesh.position.y = randFloat(60, 100)

    mesh.initPos = mesh.position.clone()

    return mesh
  }
}
