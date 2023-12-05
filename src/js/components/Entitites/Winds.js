import { BufferAttribute, DoubleSide } from 'three'
import { ShaderMaterial } from 'three'
import { BufferGeometry } from 'three'
import { Vector3 } from 'three'

import vertexShader from '@glsl/wind/wind.vert'
import fragmentShader from '@glsl/wind/wind.frag'
import { Mesh } from 'three'
import { degToRad, randInt } from 'three/src/math/MathUtils'
import LoaderManager from '../../managers/LoaderManager'
import { gsap } from 'gsap'
import ControllerManager from '../../managers/ControllerManager'

const NB_POINTS = 120

export default class Winds {
  #geo
  #mesh
  #material
  #index
  constructor(index) {
    this.#geo
    this.#index = index
    switch (index) {
      case 0:
        this.#geo = this._createLoopGeometry()
        break
      case 1:
        this.#geo = this._createLineGeometry()
        break
      case 2:
        this.#geo = this._createLineGeometry2()
        break
    }
    this.#material = this._createMaterial()
    this.#mesh = this._createMesh(index)
  }

  get mesh() {
    return this.#mesh
  }

  get material() {
    return this.#material
  }
  _createLoopGeometry() {
    const gltf = LoaderManager.get('wind').gltf
    const mesh = gltf.scene.getObjectByName('wind')

    return mesh.geometry
  }

  _createLineGeometry() {
    // create spiral of points
    let points = []
    let incrZ = 20
    let incrX = 5
    let incrY = 3
    for (let i = 0; i < NB_POINTS; i++) {
      let percent = i / NB_POINTS

      points.push(new Vector3(Math.sin(percent * incrX), Math.sin(percent * incrY), percent * incrZ))
    }

    // Create the flat geometry
    const geometry = new BufferGeometry()

    // create two times as many vertices as points, as we're going to push them in opposing directions to create a ribbon
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(points.length * 3 * 2), 3))
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(points.length * 2 * 2), 2))
    geometry.setIndex(new BufferAttribute(new Uint16Array(points.length * 6), 1))

    points.forEach((b, i) => {
      let o = 0.1

      geometry.attributes.position.setXYZ(i * 2 + 0, b.x, b.y + o, b.z)
      geometry.attributes.position.setXYZ(i * 2 + 1, b.x, b.y - o, b.z)

      geometry.attributes.uv.setXY(i * 2 + 0, i / (points.length - 1), 0)
      geometry.attributes.uv.setXY(i * 2 + 1, i / (points.length - 1), 1)

      if (i < points.length - 1) {
        geometry.index.setX(i * 6 + 0, i * 2)
        geometry.index.setX(i * 6 + 1, i * 2 + 1)
        geometry.index.setX(i * 6 + 2, i * 2 + 2)

        geometry.index.setX(i * 6 + 0 + 3, i * 2 + 1)
        geometry.index.setX(i * 6 + 1 + 3, i * 2 + 3)
        geometry.index.setX(i * 6 + 2 + 3, i * 2 + 2)
      }
    })

    return geometry
  }

  _createLineGeometry2() {
    // create spiral of points
    let points = []
    let incrZ = 22
    let incrX = 1
    let incrY = -3
    for (let i = 0; i < NB_POINTS; i++) {
      let percent = i / NB_POINTS

      points.push(new Vector3(Math.sin(percent * incrX + 50), Math.sin(percent * incrY + 10), percent * incrZ))
    }

    // Create the flat geometry
    const geometry = new BufferGeometry()

    // create two times as many vertices as points, as we're going to push them in opposing directions to create a ribbon
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(points.length * 3 * 2), 3))
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(points.length * 2 * 2), 2))
    geometry.setIndex(new BufferAttribute(new Uint16Array(points.length * 6), 1))

    points.forEach((b, i) => {
      let o = 0.1

      geometry.attributes.position.setXYZ(i * 2 + 0, b.x, b.y + o, b.z)
      geometry.attributes.position.setXYZ(i * 2 + 1, b.x, b.y - o, b.z)

      geometry.attributes.uv.setXY(i * 2 + 0, i / (points.length - 1), 0)
      geometry.attributes.uv.setXY(i * 2 + 1, i / (points.length - 1), 1)

      if (i < points.length - 1) {
        geometry.index.setX(i * 6 + 0, i * 2)
        geometry.index.setX(i * 6 + 1, i * 2 + 1)
        geometry.index.setX(i * 6 + 2, i * 2 + 2)

        geometry.index.setX(i * 6 + 0 + 3, i * 2 + 1)
        geometry.index.setX(i * 6 + 1 + 3, i * 2 + 3)
        geometry.index.setX(i * 6 + 2 + 3, i * 2 + 2)
      }
    })

    return geometry
  }

  _createMaterial() {
    const material = new ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: DoubleSide,
      transparent: true,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
      },
    })

    return material
  }

  _createMesh(index) {
    let mesh = new Mesh(this.#geo, this.#material)
    // mesh.rotation.y = Math.random() * 10;
    // mesh.scale.setScalar(0.5 + Math.random());
    // mesh.scale.y = Math.random() * 0.2 + 0.9;
    let s = 7

    if (index === 0) {
      s = 10
      mesh.rotation.y += degToRad(90)
    }
    mesh.scale.set(s, s, s)
    mesh.position.y = 10

    return mesh
  }

  kill() {
    this.tl?.kill()
  }

  anim() {
    // position randomly + take rotation of the boat
    this.tl?.kill()
    this.tl = new gsap.timeline({ repeat: -1, repeatDelay: 8, delay: 1 })
    this.tl.add(() => {
      this.#mesh.rotation.y = ControllerManager.boat.angleDir + Math.PI
      if (this.#index === 0) {
        this.#mesh.rotation.y -= Math.PI / 2
      }
      this.#mesh.position.y = randInt(20, 23)
      this.#mesh.position.x = randInt(-10, 10)
      this.#mesh.position.z = randInt(0, 30)
    })
    this.tl.fromTo(
      this.material.uniforms.uTime,
      {
        value: 0,
      },
      {
        value: 8,
        duration: 8,
      }
    )
  }
}
