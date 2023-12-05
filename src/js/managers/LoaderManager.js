import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { RepeatWrapping, TextureLoader } from 'three'

class LoaderManager {
  assets
  constructor() {
    this.assets = {} // Dictionary of assets, can be different type, gltf, texture, img, font, feel free to make a Enum if using TypeScript

    this.textureLoader = new TextureLoader()
    this.GLTFLoader = new GLTFLoader()
    this.OBJLoader = new OBJLoader()
    this.DRACOLoader = new DRACOLoader()
    this.FontLoader = new FontLoader()

    this.DRACOLoader.setDecoderPath('/libs/draco/')
    this.DRACOLoader.setDecoderConfig({ type: 'wasm' })
    this.GLTFLoader.setDRACOLoader(this.DRACOLoader)
  }

  get textures() {
    const arr = []
    const assetsArr = Object.values(this.assets)

    assetsArr.forEach((asset) => {
      if (asset.texture) {
        arr.push(asset.texture)
      }
    })

    return arr
  }

  get(name) {
    return this.assets[name]
  }

  load = (data) =>
    new Promise((resolve) => {
      const promises = []

      for (let i = 0; i < data.length; i++) {
        const { name, type, path, options } = data[i]

        if (!this.assets[name]) {
          this.assets[name] = {}
        }

        if (type === 'gltf') {
          promises.push(this.loadGLTF(path, name))
        } else if (type === 'texture') {
          promises.push(this.loadTexture(path, name, options))
        } else if (type === 'img') {
          promises.push(this.loadImage(path, name))
        } else if (type === 'font') {
          promises.push(this.loadFont(path, name))
        } else if (type === 'obj') {
          promises.push(this.loadObj(path, name))
        }
      }

      // get Progress

      const total = promises.length
      let completed = 0

      Promise.all(
        promises.map((promise) =>
          promise.then((result) => {
            completed++
            const progress = Math.floor((completed / total) * 100)

            return result
          })
        )
      ).then(() => resolve())
    })

  loadGLTF(url, name) {
    return new Promise((resolve) => {
      this.GLTFLoader.load(
        url,
        (result) => {
          this.assets[name].gltf = result
          resolve(result)
        },
        undefined,
        (e) => {
          console.log(e)
        }
      )
    })
  }

  loadTexture(url, name, options) {
    if (!this.assets[name]) {
      this.assets[name] = {}
    }
    return new Promise((resolve) => {
      this.textureLoader.load(url, (result) => {
        this.assets[name].texture = result

        if (options?.wrapS) this.assets[name].texture.wrapS = options?.wrapS
        if (options?.wrapT) this.assets[name].texture.wrapT = options?.wrapT
        if (options?.flipY) this.assets[name].texture.flipY = options?.flipY

        resolve(result)
      })
    })
  }

  loadImage(url, name) {
    return new Promise((resolve) => {
      const image = new Image()

      image.onload = () => {
        this.assets[name].img = image
        resolve(image)
      }

      image.src = url
    })
  }

  loadFont(url, name) {
    // you can convert font to typeface.json using https://gero3.github.io/facetype.js/
    return new Promise((resolve) => {
      this.FontLoader.load(
        url,

        // onLoad callback
        (font) => {
          this.assets[name].font = font
          resolve(font)
        },

        // onProgress callback
        () =>
          // xhr
          {
            // console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
          },

        // onError callback
        (err) => {
          console.log('An error happened', err)
        }
      )
    })
  }

  // https://threejs.org/docs/#examples/en/loaders/OBJLoader
  loadObj(url, name) {
    return new Promise((resolve) => {
      // load a resource
      this.OBJLoader.load(
        // resource URL
        url,
        // called when resource is loaded
        (object) => {
          this.assets[name].obj = object
          resolve(object)
        },
        // onProgress callback
        () =>
          // xhr
          {
            // console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
          },
        // called when loading has errors
        (err) => {
          console.log('An error happened', err)
        }
      )
    })
  }
}

export default new LoaderManager()
