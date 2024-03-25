import { ShaderMaterial } from 'three'
import ControllerManager from '../../managers/ControllerManager'
import sailVertexShader from '@glsl/boat/sail.vert'
import sailFragmentShader from '@glsl/boat/sail.frag'
import EnvManager from '../../managers/EnvManager'

export default class Sail {
  #mesh
  #mirrorMesh
  #material
  #mastBone
  constructor(parent) {
    // Custom Material

    this.#mastBone = parent.getObjectByName('j_fn_sail1')

    // make material transparent
    this.#mesh = parent.getObjectByName('boat-sail')
    const originMat = this.#mesh.material.clone()

    // apply morph
    this.#mesh.morphTargetInfluences[0] = 1

    const sailMaterial = new ShaderMaterial({
      vertexShader: sailVertexShader,
      fragmentShader: sailFragmentShader,
      uniforms: {
        map: { value: originMat.map },
        sunDir: { value: EnvManager.sunDir.position },
        ambientColor: { value: EnvManager.ambientLight.color },
        coefShadow: { value: EnvManager.settings.coefShadow },
        uTime: { value: 0 },
        uVelocity: { value: 0 },
      },
      defines: {
        USE_BONES: false,
        // USE_MORPHTARGETS: true,
      },
      // side: DoubleSide,
      transparent: true,
      name: 'toon',
    })

    this.#mesh.material = sailMaterial
    this.#mesh.castCustomShadow = true

    // reset scale for morph animation
    this.mesh.scale.x = 0.1
  }

  get mesh() {
    return this.#mesh
  }

  get mirrorMesh() {
    return this.#mirrorMesh
  }

  get mastBone() {
    return this.#mastBone
  }

  update({ time, delta }) {
    this.#mesh.material.uniforms.uTime.value += (delta / 16) * (0.01 + ControllerManager.boat.velocityP * 0.025)
    this.#mesh.material.uniforms.uVelocity.value = ControllerManager.boat.velocityP
  }
}
