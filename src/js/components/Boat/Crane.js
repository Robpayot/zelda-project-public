import { AnimationMixer, Color, DoubleSide, Euler, LoopOnce, ShaderMaterial, Vector3 } from 'three'
import EnvManager from '../../managers/EnvManager'

// Toon
import vertexToonShader from '@glsl/partials/toon.vert'
import vertexToonScaleShader from '@glsl/partials/toonScaleY.vert'
import fragmentToonShader from '@glsl/partials/toon.frag'
import fragmentRopeShader from '@glsl/boat/rope.frag'
import gsap from 'gsap'
import { degToRad } from 'three/src/math/MathUtils'
import Seabox from './Seabox'
import CinematicManager from '../../managers/CinematicManager'
import ControllerManager from '../../managers/ControllerManager'
import ExploreManager from '../../managers/ExploreManager'

export default class Crane {
  #mesh
  #mirrorMesh
  #material
  #crane
  #rope
  #hook
  #mixer
  #debug
  #boneRope
  #bonePivot
  #settings = {
    rope: {
      position: {
        x: 2.44,
        y: 68.62,
        z: 21.87,
      },
      rotation: {
        x: -0.0278375626,
        y: -0.6751888815,
        z: 1.5247742844,
      },
    },
    hook: {
      position: {
        x: -3.3,
        y: 265,
        z: 18,
      },
      rotation: {
        x: -3.23,
        y: -2.42,
        z: 1.45,
      },
    },
  }
  #action
  #mixerRotate
  #actionRotate
  #bodyMesh1
  #bodyMesh2
  boneRopeScaleY = 0.772
  hookScaleX = 1.22
  #boatMesh
  #seaboxMesh
  #dir = -1
  constructor(gltf, boatMesh, debug) {
    this.#debug = debug
    this.#boatMesh = boatMesh
    // Custom Material

    const animations = gltf.animations
    const scene = gltf.scene

    this.#crane = scene.getObjectByName('crane')

    this.initRotaPivot = this.#crane.rotation.y

    // animation
    this.#mixer = new AnimationMixer(this.#crane)
    this.#mixerRotate = new AnimationMixer(this.#crane)

    animations.forEach((animation) => {
      if (animation.name === 'craneAction') {
        this.#action = this.#mixer.clipAction(animation)
      } else if (animation.name === 'craneRotate2') {
        this.#actionRotate = this.#mixerRotate.clipAction(animation)
      }
    })

    this.#rope = scene.getObjectByName('crane-rope')
    this.#hook = scene.getObjectByName('crane-hook')
    this.#bodyMesh1 = scene.getObjectByName('crane-1')
    this.#bodyMesh2 = scene.getObjectByName('crane-2')
    this.#bodyMesh1.geometry.computeVertexNormals()
    this.#bodyMesh1.geometry.computeVertexNormals()

    this.#boneRope = scene.getObjectByName('Bone002')
    this.#bonePivot = scene.getObjectByName('Bone001')

    this.#crane.children.forEach((child) => {
      if (child.name === 'crane-rope') {
        child.material = new ShaderMaterial({
          vertexShader: vertexToonShader,
          fragmentShader: fragmentRopeShader,
          uniforms: {
            sunDir: { value: EnvManager.sunDir.position },
            ambientColor: { value: EnvManager.ambientLight.color },
            coefShadow: { value: EnvManager.settings.coefShadow },
            sRGBSpace: { value: 0 },
            color1: { value: new Color('#eabf5f') },
            color2: { value: new Color('#c68221') },
          },
          defines: {
            USE_BONES: child.type === 'SkinnedMesh',
          },
          name: 'toon',
        })
      } else if (child.type === 'SkinnedMesh' || child.type === 'Mesh') {
        const textureOg = child.material.map
        child.material = new ShaderMaterial({
          vertexShader: child.name === 'crane-hook' ? vertexToonScaleShader : vertexToonShader,
          fragmentShader: fragmentToonShader,
          uniforms: {
            map: { value: textureOg },
            sunDir: { value: EnvManager.sunDir.position },
            ambientColor: { value: EnvManager.ambientLight.color },
            coefShadow: { value: EnvManager.settings.coefShadow },
            sRGBSpace: { value: 0 },
            scaleY: { value: 1 },
          },
          defines: {
            USE_BONES: child.type === 'SkinnedMesh',
          },
          name: 'toon',
        })
      }
    })

    this._createDebugFolder()

    this.#seaboxMesh = this._createSeaboxMesh()

    // setTimeout(() => {
    //   CinematicManager.play('treasure_found', { cameraAngle: ControllerManager.deltaAngle })
    // }, 2000)
  }

  get mesh() {
    return this.#mesh
  }

  get mirrorMesh() {
    return this.#mirrorMesh
  }

  _createSeaboxMesh() {
    return new Seabox(this.#boatMesh, this.#debug)
  }

  close(fast) {
    this.#action.paused = false
    this.#action.setLoop(LoopOnce)
    this.#action.timeScale = -1
    if (fast) {
      this.#action.time = 0
    } else {
      this.#action.play()
    }
  }

  open() {
    this.#action.reset()
    this.#action.timeScale = 1
    this.#action.clampWhenFinished = true
    this.#action.setLoop(LoopOnce)
    this.#action.play()
  }

  turn(dir) {
    if (dir === this.#dir) return
    const tl = new gsap.timeline()
    this.#dir = dir

    if (dir > 0) {
      tl.to(this.#crane.rotation, { y: this.initRotaPivot - degToRad(180), duration: 2 }, 0)
    } else {
      tl.to(this.#crane.rotation, { y: this.initRotaPivot, duration: 2 })
    }

    tl.to(this.#boneRope.scale, { y: 0.6, duration: 0.6 }, 0.1)
    tl.to(this.#boneRope.scale, { y: this.boneRopeScaleY, duration: 0.6 }, 1)
  }

  putAway() {
    if (this.hasTreasure) return
    this.tlPutAway?.kill()
    this.tlReset?.kill()
    this.tlPutAway = new gsap.timeline()
    this.tlPutAway.to(this.#boneRope.scale, { y: 2.5, duration: 2, ease: 'linear' }, 0)
  }

  reset(hasTreasure) {
    this.hasTreasure = hasTreasure
    if (this.hasTreasure) {
      this.#boneRope.rotation.x = 0
      this.#boneRope.rotation.y = 0
      CinematicManager.isPlaying = true // force to fix issue on mobile

      this.#seaboxMesh.pull(this.#dir)
    }

    const coefseaboxCrane = 4

    this.tlPutAway?.kill()
    this.tlReset?.kill()
    this.tlReset = new gsap.timeline()
    this.tlReset.to(
      this.#boneRope.scale,
      {
        y: this.boneRopeScaleY,
        duration: 0.8,
        ease: 'linear',
        onUpdate: () => {
          if (this.hasTreasure) {
            this.#seaboxMesh.object.position.y =
              this.#seaboxMesh.object.initY + (this.boneRopeScaleY - this.#boneRope.scale.y) * coefseaboxCrane
          }
        },
      },
      0
    )
    this.tlReset.add(() => {
      if (this.hasTreasure) {
        this.close(true)
        // treasure found
        ExploreManager.hideTreasure()
        CinematicManager.play('treasure_found', { cameraAngle: ControllerManager.deltaAngle })
      }
    }, '+=0.5')
  }

  resetSeabox() {
    this.hasTreasure = false
    this.#seaboxMesh.reset()
  }

  update({ time, delta }) {
    if (!this.stopAction) {
      this.#mixer?.update(0.055)
      this.#mixerRotate?.update(0.055)
    }

    // this.#mesh.material.uniforms.uTime.value += (delta / 16) * (0.01 + ControllerManager.boat.velocityP * 0.025)
    // this.#mesh.material.uniforms.uVelocity.value = ControllerManager.boat.velocityP
    if (this.#boneRope && !this.hasTreasure) {
      this.#boneRope.rotation.x = Math.sin(time) / 3
      this.#boneRope.rotation.y = Math.sin(time) / 3
    }
  }

  /**
   * Debug
   */
  _createDebugFolder() {
    if (!this.#debug) return

    const settingsChangedHandler = (e) => {
      this.#hook.position.x = this.#settings.position.x
      this.#hook.position.y = this.#settings.position.y
      this.#hook.position.z = this.#settings.position.z

      this.#hook.rotation.copy(
        new Euler(this.#settings.rotation.x, this.#settings.rotation.y, this.#settings.rotation.z, 'XYZ')
      )
    }

    const debug = this.#debug.addFolder({ title: 'Crane', expanded: true })

    // debug.addInput(this.#settings, 'position', { step: 100 }).on('change', settingsChangedHandler)
    // debug.addInput(this.#settings, 'rotation', { step: 0.1 }).on('change', settingsChangedHandler)
    // debug.addInput(this.#rope, 'rotation')
    const btn = debug.addButton({
      title: 'Copy settings',
      label: 'copy', // optional
    })

    // btn.on('click', () => {
    //   navigator.clipboard.writeText(JSON.stringify(this.#settings))
    //   console.log('copied to clipboard', this.#settings)
    // })

    return debug
  }
}
