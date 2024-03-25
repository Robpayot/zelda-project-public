import { ShaderMaterial } from 'three'
import EnvManager from '../../managers/EnvManager'
import { REPEAT_OCEAN } from '../Ocean'
import LoaderManager from '../../managers/LoaderManager'

// Toon Shaders
import vertexShader from '@glsl/game/wall.vert'
import fragmentShader from '@glsl/game/barrel.frag'
import { degToRad } from 'three/src/math/MathUtils'
import gsap from 'gsap'

const offsetZ = 258
export default class Walls {
  #material
  #availLeft = []
  #availRight = []
  #mesh
  #scale = 950
  resetZ = offsetZ
  constructor(scene, rangeX, side) {
    this.rangeX = rangeX
    this.#mesh = this._createMeshMat()
  }

  get availRight() {
    return this.#availRight
  }

  get availLeft() {
    return this.#availLeft
  }

  get mesh() {
    return this.#mesh
  }

  _createMeshMat() {
    const gltf = LoaderManager.get('wall').gltf
    const wallGroup = gltf.scene.getObjectByName('wall')

    wallGroup.scale.set(this.#scale, this.#scale * 0.62, this.#scale)
    wallGroup.position.y += 5
    wallGroup.rotation.y = degToRad(90)
    wallGroup.name = 'wall'

    const mesh1 = wallGroup.children[0]
    const material1 = new ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        ambientColor: { value: EnvManager.ambientLight.color },
        coefShadow: { value: EnvManager.settings.coefShadow },
        map: { value: mesh1.material.map },
        sunDir: { value: EnvManager.sunDir.position },
      },
    })

    mesh1.material = material1

    const mesh2 = wallGroup.children[1]
    const material2 = new ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        ambientColor: { value: EnvManager.ambientLight.color },
        coefShadow: { value: EnvManager.settings.coefShadow },
        map: { value: mesh2.material.map },
        sunDir: { value: EnvManager.sunDir.position },
      },
    })

    mesh2.material = material2

    const mesh3 = wallGroup.children[2]
    const material3 = new ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        ambientColor: { value: EnvManager.ambientLight.color },
        coefShadow: { value: EnvManager.settings.coefShadow },
        map: { value: mesh3.material.map },
        sunDir: { value: EnvManager.sunDir.position },
      },
    })

    mesh3.material = material3

    wallGroup.visible = false

    return wallGroup
  }

  add(i, side) {
    const mesh = this.#mesh.clone()
    mesh.position.x = (side * this.rangeX * REPEAT_OCEAN) / 1.5
    mesh.position.z = i * -offsetZ
    if (side === 1) {
      mesh.rotation.y = degToRad(-90)
    }
    mesh.initPos = mesh.position.clone()

    mesh.visible = true
    mesh.canVisible = true

    if (side === 1) {
      this.#availRight.push(mesh)
    } else {
      this.#availLeft.push(mesh)
    }

    return mesh
  }

  reset(z, side) {
    const avail = side === 1 ? this.#availRight : this.#availLeft
    const mesh = avail[0]

    avail.shift()
    mesh.canVisible = false
    mesh.visible = false
    mesh.position.x = (side * this.rangeX * REPEAT_OCEAN) / 1.5
    mesh.position.z = z
    if (side === 1) {
      mesh.rotation.y = degToRad(-90)
    }
    mesh.initPos = mesh.position.clone()

    avail.push(mesh)

    const tl = gsap.timeline()
    tl.add(() => {
      mesh.canVisible = true
      mesh.visible = true
    }, 0.2)
  }
}
