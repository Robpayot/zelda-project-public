import { Float32BufferAttribute, Points } from 'three'
import { ShaderMaterial } from 'three'
import { BufferGeometry } from 'three'

import vertexShader from '@glsl/stars/stars.vert'
import fragmentShader from '@glsl/stars/stars.frag'
import { degToRad } from 'three/src/math/MathUtils'
import { randFloat } from 'three/src/math/MathUtils'
import EnvManager from '../../managers/EnvManager'

const NB_POINTS = 1000
export default class Stars {
  #geo
  #mesh
  #material
  #index
  constructor() {
    this.#geo
    this.#material = this._createMaterial()
    this.#mesh = this._createMesh()
  }

  get mesh() {
    return this.#mesh
  }

  get material() {
    return this.#material
  }

  _createMaterial() {
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uSize: { value: 50 },
        uTime: { value: 0 },
        opacity: { value: 1 },
        globalOpacity: { value: EnvManager.settings.alphaStars },
      },
      // transparent: true,
      depthTest: false,
      // depthWrite: false
      // alphaTest: 0.5,
    })

    return material
  }

  _createMesh() {
    const vertices = []
    const offsets = []
    const speeds = []

    const radius = 1600

    for (let i = 0; i < NB_POINTS; i++) {
      // put randomly points in half a sphere
      const phi = Math.random() * Math.PI * 2 // Azimuthal angle (0 to 2*pi)
      const theta = (Math.random() * Math.PI) / 2 // Polar angle (0 to pi/2) for the upper hemisphere

      // Calculate Cartesian coordinates from spherical coordinates
      const x = radius * Math.sin(theta) * Math.cos(phi)
      const y = radius * Math.sin(theta) * Math.sin(phi)
      const z = radius * Math.cos(theta)

      // Apply the rotation by Math.PI radians (180 degrees)
      const rotationAngle = degToRad(-90)
      const rotatedY = y * Math.cos(rotationAngle) - z * Math.sin(rotationAngle)
      const rotatedZ = y * Math.sin(rotationAngle) + z * Math.cos(rotationAngle)

      vertices.push(x, rotatedY, rotatedZ)

      const offset = randFloat(0, 100)
      offsets.push(offset)

      const speed = randFloat(0.5, 1)
      speeds.push(speed)
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('offset', new Float32BufferAttribute(offsets, 1))
    geometry.setAttribute('speed', new Float32BufferAttribute(speeds, 1))
    let mesh = new Points(geometry, this.#material)
    mesh.position.y = 1

    mesh.initPos = mesh.position.clone()
    mesh.renderOrder = -1

    return mesh
  }
}
