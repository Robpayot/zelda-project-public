import { Object3D, ShaderMaterial } from 'three'
import { degToRad, lerp } from 'three/src/math/MathUtils'
import ControllerManager from '../../managers/ControllerManager'
import { gsap } from 'gsap'

import Splashes from './Splashes'
import ParticlesSide from './ParticlesSide'
import Sail from './Sail'
import ParticlesFront from './ParticlesFront'
import ParticlesJump from './ParticlesJump'

// Toon
import vertexToonShader from '@glsl/partials/toon.vert'
import fragmentToonShader from '@glsl/partials/toon.frag'
// Receive shadows
import vertexReceiveShadowShader from '@glsl/shadows/receiveShadow.vert'
import fragmentReceiveShadowShader from '@glsl/shadows/receiveShadow.frag'
import EnvManager from '../../managers/EnvManager'
import { EVENT_HIT } from '../../utils/constants'
import { EventBusSingleton } from 'light-event-bus'
import Settings from '../../utils/Settings'

export default class Boat {
  #debug
  #settings = {
    color: '#4c6ed4',
    power: 0.91,
    speedTex: 0.01,
  }
  #scale = 5 // 5
  #initRotaY = degToRad(180)
  #initRotaZ = degToRad(0)
  #initRotaX = degToRad(0)
  #mesh
  #splashMeshes
  #mastBone
  #sailMesh
  mastPos = 0
  sailState = 0.25
  #particleSideMesh
  #particlesFrontMesh
  #particlesJumpMesh
  #absTurnForce = 0
  #absTurnForceTarget = 0
  #scene
  #gltf
  rotaZ = 1
  #object
  constructor({ debug, scene, gltf }) {
    this.#debug = debug
    this.#scene = scene
    this.#gltf = gltf
    this.#object = new Object3D()

    this.#mesh = this._createMesh()
    this._createMaterials()

    this.#object.add(this.#mesh)
  }

  get object() {
    return this.#object
  }

  get mastBone() {
    return this.#mastBone
  }

  get sailMesh() {
    return this.#sailMesh
  }

  initSubObjects() {
    // fix issue objects no appearing
    this.#sailMesh = this._createSailMesh()
    this.#splashMeshes = this._createSplashMeshes()
    this.#particleSideMesh = this._createParticlesSideMesh()
    this.#particlesFrontMesh = this._createParticlesFrontMesh()
    this.#particlesJumpMesh = this._createParticlesJumpMesh()

    this._createDebugFolder()

    // events
    EventBusSingleton.subscribe(EVENT_HIT, this._eventHit)

    const s = 0.25
    this.sailMesh.mesh.scale.set(s, this.sailMesh.mesh.scale.y, this.sailMesh.mesh.scale.z)
  }

  _createMesh() {
    let mesh = this.#gltf.scene

    mesh.scale.set(this.#scale, this.#scale, this.#scale)

    this.#object.rotation.y = this.#initRotaY

    mesh.visible = true

    // mesh.renderOrder = 10000000

    return mesh
  }

  _createMaterials() {
    const boatMesh = this.#mesh.getObjectByName('boat')

    // Replace materials by custom Toon materials

    boatMesh.children.forEach((child) => {
      if (child.name !== 'boat-sail' && (child.type === 'SkinnedMesh' || child.type === 'Mesh')) {
        const textureOg = child.material.map

        if (child.name === 'boat-body') {
          // add receive shadows
          child.material = new ShaderMaterial({
            vertexShader: vertexReceiveShadowShader,
            fragmentShader: fragmentReceiveShadowShader,
            uniforms: {
              map: { value: textureOg },
              sunDir: { value: EnvManager.sunDir.position },
              ambientColor: { value: EnvManager.ambientLight.color },
              // receive shadows
              uDepthMap: {
                value: null, // EnvManager.sunShadowMap.map.texture,
              },
              uShadowCameraP: {
                value: EnvManager.sunShadowMap.camera.projectionMatrix,
              },
              uShadowCameraV: {
                value: EnvManager.sunShadowMap.camera.matrixWorldInverse,
              },
              coefShadow: {
                value: EnvManager.settings.coefShadow,
              },
              sRGBSpace: { value: 0 },
            },
            defines: {
              USE_BONES: child.type === 'SkinnedMesh',
              USE_SHADOWS: Settings.castShadows,
            },
            name: 'toon',
          })
        } else {
          child.material = new ShaderMaterial({
            vertexShader: vertexToonShader,
            fragmentShader: fragmentToonShader,
            uniforms: {
              map: { value: textureOg },
              sunDir: { value: EnvManager.sunDir.position },
              ambientColor: { value: EnvManager.ambientLight.color },
              coefShadow: { value: EnvManager.settings.coefShadow },
              sRGBSpace: { value: 0 },
            },
            defines: {
              USE_BONES: child.type === 'SkinnedMesh',
            },
            name: 'toon',
          })
        }

        child.castCustomShadow = true
      }
    })
  }

  _createSailMesh() {
    return new Sail(this.#mesh)
  }

  _createSplashMeshes() {
    return new Splashes(this.#object)
  }

  _createParticlesSideMesh() {
    return new ParticlesSide(this.#mesh, this.#debug)
  }

  _createParticlesFrontMesh() {
    // todo: check le this, car pas encore init
    return new ParticlesFront(this.#object, this.#debug)
  }

  _createParticlesJumpMesh() {
    return new ParticlesJump(this.#object, this.#debug)
  }

  _eventHit = () => {
    this.tlHit?.kill()
    this.tlHit = new gsap.timeline()
    this.tlHit.fromTo(this, { rotaZ: 1 }, { rotaZ: 10, duration: 1 }, 0)
  }

  /**
   * Update
   */
  update({ time, delta }) {
    this.#object.rotation.y = this.#initRotaY + ControllerManager.boat.angleDir

    this.#mesh.rotation.z =
      this.#initRotaZ + Math.sin(time + this.rotaZ) * (0.1 + ControllerManager.boat.turnForce * 0.5)
    this.#mesh.rotation.x = this.#initRotaX + Math.sin(time) * (ControllerManager.boat.velocity * 6)

    this.#sailMesh?.update({ time, delta })
    this.#splashMeshes?.update({ time, delta })

    this.#absTurnForceTarget = Math.abs(ControllerManager.boat.turnForce)

    this.#absTurnForce = lerp(this.#absTurnForce, this.#absTurnForceTarget, 0.1)

    this.#mesh.position.y = ControllerManager.boat.up

    // if (absTurnForce > 0) {

    if (ControllerManager.stopped) {
      this.#particleSideMesh.mesh.visible = false
      this.#particlesFrontMesh.mesh.visible = false
      this.#particlesJumpMesh.mesh.visible = false
      this.canShowP = false
    } else {
      this.#particleSideMesh?.update({
        time,
        delta,
        turnForce: this.#absTurnForce,
        velocity: ControllerManager.boat.velocity * 100,
      })

      this.#particlesFrontMesh?.update({
        time,
        delta,
        velocity: ControllerManager.boat.velocityP,
      })

      this.#particlesJumpMesh?.update({
        time,
        delta,
        velocity: ControllerManager.boat.velocityP,
      })

      if (!this.canShowP) {
        this.canShowP = true

        setTimeout(() => {
          if (this.#particleSideMesh) {
            this.#particleSideMesh.mesh.visible = true
            this.#particlesFrontMesh.mesh.visible = true
            this.#particlesJumpMesh.mesh.visible = true
          }
        }, 500)
      }
    }

    // }

    if (ControllerManager.boat.velocityP > 0.1) {
      let boatAngle = ControllerManager.boat.angleDir % (Math.PI * 2)

      if (boatAngle < 0) {
        boatAngle = Math.PI * 2 + boatAngle
      }
      if (this.mastPos >= 0 && boatAngle < Math.PI) {
        this.turnMast(-1)
      } else if (this.mastPos <= 0 && boatAngle > Math.PI) {
        this.turnMast(1)
      }
    }

    if (ControllerManager.boat.velocityP > 0.5) {
      this.animSail(1.1)
    } else if (ControllerManager.boat.velocityP > 0.1) {
      this.animSail(0.6)
    } else {
      this.animSail(0.25)
    }
    // this.sailMesh.scale.x = ControllerManager.boat.velocityP * -this.mastPos
  }

  resize({ width, height }) {}

  turnMast(dir = 1) {
    const maxDeg = 36
    const tl = new gsap.timeline()
    this.mastPos = dir

    tl.to(this.sailMesh.mastBone.rotation, { y: degToRad(-90 + maxDeg * dir), duration: 2.1 }, 0)
    tl.to(this.sailMesh.mesh.rotation, { z: degToRad(-maxDeg * dir), duration: 2.1 }, 0)
    tl.add(() => {
      if (ControllerManager.boat.velocityP > 0.5) {
        this.animSail(1.1, true)
      } else {
        this.animSail(0.6, true)
      }
    }, 1)
  }

  animSail(force, turn) {
    if (force === this.sailState && !turn) return
    this.sailState = force
    const s = -this.mastPos * force

    if (s > 0 || s < 0) {
      const tl = new gsap.timeline()

      tl.to(this.sailMesh.mesh.scale, { x: s, duration: 1.7, ease: 'bounce.out' }, 0)
    }
  }

  /**
   * Debug
   */
  _createDebugFolder() {
    if (!this.#debug) return

    const settingsChangedHandler = () => {
      // this.#splashMesh2.material.uniforms.power.value = this.#settings.power
    }

    const debug = this.#debug.addFolder({ title: 'Boat', expanded: false })

    debug.addInput(this.#settings, 'power', { step: 0.01 }).on('change', settingsChangedHandler)

    const btn = debug.addButton({
      title: 'Copy settings',
      label: 'copy', // optional
    })

    btn.on('click', () => {
      navigator.clipboard.writeText(JSON.stringify(this.#settings))
      console.log('copied to clipboard', this.#settings)
    })

    return debug
  }
}
