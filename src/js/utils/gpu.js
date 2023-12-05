const TIER = {
  BAD: 0,
  LOW: 1,
  GOOD: 2,
  HIGH: 3,
}

function iOS() {
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  )
}

export default class GPU {
  constructor(options = {}) {
    this.extensions = null
    this.gpu = null
    this.hasGL = false

    // Assume medium perf by default
    this.tier = GPU.LOW

    this.detect()
  }

  detect(gl) {
    gl = gl || this.getGL()

    if (!gl) {
      // if (DEV) {
      console.warn('[GPU] WebGL not supported!')
      // }
      return
    }

    this.detectPerformance(gl)
  }

  getGL() {
    let canvas = document.createElement('canvas')
    let gl
    try {
      gl = canvas.getContext('experimental-webgl') || canvas.getContext('webgl')
      this.hasGL = true
      return gl
    } catch (t) {
      this.hasGL = false
      return null
    }
  }

  detectPerformance(gl) {
    let infos = gl.getExtension('WEBGL_debug_renderer_info')
    // let params = [
    //     gl.RENDERER,
    //     gl.VENDOR,
    //     gl.VERSION,
    //     gl.SHADING_LANGUAGE_VERSION,
    //     infos.UNMASKED_RENDERER_WEBGL,
    //     infos.UNMASKED_VENDOR_WEBGL
    // ]
    // params.forEach(function(p) {
    //     console.log(gl.getParameter(p).toLowerCase())
    // })
    this.gpu = gl.getParameter(infos.UNMASKED_RENDERER_WEBGL).toLowerCase()
    this.extensions = gl.getSupportedExtensions()
    let quality = TIER.LOW

    // TODO: include blacklist?
    // way to get updated version?
    // https://wiki.mozilla.org/Blocklisting/Blocked_Graphics_Drivers
    // https://www.khronos.org/webgl/wiki/BlacklistsAndWhitelists
    // https://chromium.googlesource.com/chromium/src/gpu/+/master/config/software_rendering_list.json

    if (window.innerWidth > 1024) {
      // i.e. intel hd graphics 4000
      if (this.matchAll(['intel', 'hd'])) {
        quality = TIER.LOW
      }

      // Assuming any dedicated GPU is good
      if (this.matchAll(['amd', 'radeon', 'nvidia', 'geforce'])) {
        quality = TIER.GOOD
      }


      if (this.matchAll(['rtx 30', 'rtx 40', 'rtx 50', 'radeon rx', 'radeon rx', 'radeon 69'])) {
        quality = TIER.HIGH
      }

      // TODO:
      // gtx, gti, vega, quadro... ??
      // determine diff between GOOD and HIGH
    } else {
      if (iOS()) {
        // From past experience, assuming something like
        // > a9 = great, <= a9 good, < a7 bad
        // https://developer.apple.com/library/content/documentation/DeviceInformation/Reference/iOSDeviceCompatibility/HardwareGPUInformation/HardwareGPUInformation.html

        // < A7
        let bad = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']
        // A7 -> A9
        let good = ['a7', 'a8', 'a9']
        // A10+
        let high = ['a10', 'a11', 'a12', 'a13', 'a14', 'a15', 'a16', 'a17', 'a18']
        if (this.matchAll(bad)) {
          quality = TIER.BAD
        }
        if (this.matchAll(good)) {
          quality = TIER.GOOD
        }
        if (this.matchAll(high)) {
          quality = TIER.HIGH
        }

        if (this.matchAll(['apple'])) quality = TIER.GOOD
      } else {
        // adreno (tm) 530 fast - samsung s7, one plus, zuk z2
        // mali g71 like 530
        // samsung s8, s7, one plus, pixel 2 => adreno 530
        // adreno (tm) 430 medium - nexus 6p
        // adreno (tm) 420 medium - nexus 6
        // adreno (tm) 418 medium - nexus 5X
        // mali-t760?? samsung s6, prob like 430
        // adreno (tm) 330 medium - nexus 5

        let isAdreno = this.match('adreno')
        let isMali = this.match('mali-t')

        if (isAdreno) {
          quality = TIER.LOW

          if (this.matchVersion(400)) {
            quality = TIER.GOOD
          }
          if (this.matchVersion(500)) {
            quality = TIER.HIGH
          }
        }

        if (isMali && this.matchVersion(70)) {
          quality = TIER.HIGH
        }

        // TODO:
        // nvidia tegra??? no version info
      }
    }

    this.tier = quality
  }

  match(info) {
    return this.gpu.indexOf(info) > -1
  }

  matchAll(infos) {
    return infos.reduce((reduce, info) => reduce || this.match(info), false)
  }

  // Get digits from a GPU string and return true
  // if gte to {version}
  matchVersion(version) {
    return parseInt(this.gpu.slice().replace(/[\D]/g, ''), 10) >= version
  }
}
