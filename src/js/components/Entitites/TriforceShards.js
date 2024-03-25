import { Color, ShaderMaterial } from 'three'
import EnvManager from '../../managers/EnvManager'
import LoaderManager from '../../managers/LoaderManager'

// Toon Shaders
import vertexToonShader from '@glsl/partials/toon.vert'
import fragmentToonShader from '@glsl/game/triforce.frag'

export default class TriforceShards {
  #material
  #mesh
  #hitbox = 16
  #scale = 0.023
  #baseY = 2
  #shards = []
  constructor(scene) {
    const gltf = LoaderManager.get('triforce_shards').gltf

    for (let i = 0; i < 3; i++) {
      const mesh = this._createMeshMat(gltf, i)
      this.#shards.push(mesh)
      scene.add(mesh)
    }
  }

  get shards() {
    return this.#shards
  }

  _createMeshMat(gltf, index) {
    const shard = gltf.scene.getObjectByName(`tri${index + 1}`).clone()

    const textureOg = shard.children[0].material.map
    const mat1 = new ShaderMaterial({
      vertexShader: vertexToonShader,
      fragmentShader: fragmentToonShader,
      uniforms: {
        map: { value: textureOg },
        sunDir: { value: EnvManager.sunDir.position },
        ambientColor: { value: EnvManager.ambientLight.color },
        coefShadow: { value: EnvManager.settings.coefShadow },
        sRGBSpace: {
          value: 0,
        },
      },
      defines: {
        USE_BONES: shard.children[0].type === 'SkinnedMesh',
      },
      name: 'toon',
    })

    shard.children[0].material = mat1

    shard.position.y = this.#baseY
    shard.scale.set(this.#scale, this.#scale, this.#scale)

    return shard
  }
}
