import { Color, DoubleSide, ShaderMaterial } from 'three'
import ControllerManager from '../../managers/ControllerManager'
import vertexShader from '@glsl/splash/splash.vert'
import fragmentShader from '@glsl/splash/splash.frag'
import { gsap } from 'gsap'
import EnvManager from '../../managers/EnvManager'
import Settings from '../../utils/Settings'
import { BOAT_MODE } from '.'

const SCALE_INCR = 0.1
const SCALE_COEF = 1.4

export default class Splashes {
  #mesh1
  #mesh1Parent
  #mesh2
  #mesh2Parent
  #initY
  jumpP = 0
  offsetZ = 0
  maxPSplash = 1
  constructor(parent) {
    // Custom Material Splash
    this.#mesh1 = parent.getObjectByName('splash-1')
    this.#mesh1Parent = parent.getObjectByName('splash-1-parent')
    this.#mesh2 = parent.getObjectByName('splash-2')
    this.#mesh2Parent = parent.getObjectByName('splash-2-parent')

    // this.#mesh2 = splash2.clone()
    // désolidarise du parent
    // bug Will/Tof ici?
    parent.add(this.#mesh1Parent)
    // this.#mesh1Parent.parent = undefined
    // this.#mesh1Parent.parent.remove(this.#mesh1)

    this.#mesh1Parent.position.x *= 5
    this.#mesh1Parent.position.y *= 5
    this.#mesh1Parent.position.z *= 5
    this.#mesh1Parent.scale.set(5, 5, 5) // 5 is scale of parent

    parent.add(this.#mesh2Parent)
    // this.#mesh2Parent.parent.remove(this.#mesh2)

    this.#mesh2Parent.position.x *= 5
    this.#mesh2Parent.position.y *= 5
    this.#mesh2Parent.position.z *= 5
    this.#mesh2Parent.scale.set(5, 5, 5)
    this.#mesh2.receiveCustomShadow = true

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(EnvManager.settingsOcean.color) },
        power: { value: 0.91 },
        // shadows
        uLightPos: {
          value: EnvManager.sunDir.position,
        },
        uDepthMap: {
          value: null, //EnvManager.sunShadowMap.map.texture,
        },
        uShadowCameraP: {
          value: EnvManager.sunShadowMap.camera.projectionMatrix,
        },
        uShadowCameraV: {
          value: EnvManager.sunShadowMap.camera.matrixWorldInverse,
        },
        alphaTex: { value: EnvManager.settingsOcean.alphaTex },
      },
      side: DoubleSide,
      defines: {
        USE_SHADOWS: Settings.castShadows,
      },
    })

    this.#mesh1.material = this.material
    this.#mesh2.material = this.material

    this.#initY = this.#mesh1.position.y
  }

  update({ time, delta }) {
    // Env
    const { color, foam } = EnvManager.settingsOcean
    this.material.uniforms.uColor.value = new Color(color)
    this.material.uniforms.alphaTex.value = foam
    // Jump
    if (ControllerManager.boat.up > 0) {
      this.#mesh1Parent.position.z -= ControllerManager.boat.velocity * ControllerManager.boat.speedTextureOffset
      this.#mesh2Parent.position.z -= ControllerManager.boat.velocity * ControllerManager.boat.speedTextureOffset
      if (!this.startJump) {
        this.startJump = true
        this.finishJump = false
        this.tlJump?.kill()
        this.tlJumpFinish?.kill()

        this.tlJump = new gsap.timeline()
        this.tlJump.to(
          this,
          {
            jumpP: 1,
            duration: 0.6,
          },
          0
        )

        this.tlJump.to(
          [this.#mesh1.position, this.#mesh2.position],
          {
            y: this.#initY - 1,
            duration: 1,
          },
          0
        )
      }
    } else if (this.startJump) {
      this.startJump = false
      if (!this.finishJump) {
        this.#mesh1Parent.position.z = this.#mesh2Parent.position.z = 5
        this.finishJump = true
        this.tlJumpFinish?.kill()
        this.tlJump?.kill()
        this.tlJumpFinish = gsap.fromTo(
          this,
          {
            jumpP: 1,
          },
          {
            jumpP: 0,
            duration: 0.5,
          }
        )

        this.#mesh1.position.y = this.#mesh2.position.y = this.#initY
      }
    }

    const progress = ControllerManager.boat.velocityP * this.maxPSplash * (1 - this.jumpP)

    this.#mesh1.rotation.y += (delta / 16) * 0.04 * (progress + 0.5)
    this.#mesh1.scale.set(progress * SCALE_COEF + SCALE_INCR, 1, progress * SCALE_COEF + SCALE_INCR)
    this.#mesh1.position.x = (1 - progress) * -1.3
    this.#mesh2.rotation.y += (delta / 16) * 0.04 * (progress + 0.5)
    this.#mesh2.scale.set(progress * SCALE_COEF + SCALE_INCR, -1, progress * SCALE_COEF + SCALE_INCR)
    this.#mesh2.position.x = (1 - progress) * 1.3

    if (progress < 0.2) {
      this.#mesh1.visible = this.#mesh2.visible = false
    } else {
      this.#mesh1.visible = this.#mesh2.visible = true
    }
  }

  transitioningSpeed(mode) {
    if (mode === BOAT_MODE.HOOK) {
      gsap.to(this, { maxPSplash: 0.2, duration: 1.5 })
    } else {
      gsap.to(this, { maxPSplash: 1, duration: 1.5 })
    }
  }
}
