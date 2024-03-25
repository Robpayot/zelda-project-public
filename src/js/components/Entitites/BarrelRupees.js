import { Object3D } from 'three'
import { REPEAT_OCEAN } from '../Ocean'

// Toon Shaders
import { randInt } from 'three/src/math/MathUtils'
import DATA_RUPEES from '../../data/rupees_score.json'
import { MODE } from '../../utils/constants'
export default class BarrelRupees {
  #material
  #avail = []
  #mesh
  #rupee
  #hitbox = 15
  constructor(scene, rupee, barrel, mode) {
    this.mode = mode
    this.#rupee = rupee
    this.#mesh = this._createMesh(rupee, barrel)

    scene.add(this.#mesh)
  }

  set avail(val) {
    this.#avail = val
  }

  _createMesh(rupee, barrel) {
    const rupeeMesh = rupee.mesh.clone()
    rupeeMesh.visible = true
    if (this.mode === MODE.EXPLORE) {
      rupeeMesh.position.y += 9
    } else {
      rupeeMesh.position.y += 5
    }
    const barrelMesh = barrel.mesh.clone()
    barrelMesh.visible = true

    const mesh = new Object3D()
    mesh.name = 'barrelRupee'
    mesh.add(rupeeMesh)
    mesh.add(barrelMesh)

    mesh.visible = false
    mesh.canVisible = false

    return mesh
  }

  add(rangeX, zIncr) {
    this.rangeX = rangeX
    this.zIncr = zIncr
    const mesh = this.#mesh.clone()
    mesh.children[0].rotation.y = randInt(0, 2 * Math.PI)
    mesh.hitbox = this.#hitbox

    mesh.children[0].geometry.computeVertexNormals() // fix normals bug from model

    mesh.initPos = mesh.position.clone()

    this.#avail.push(mesh)

    return mesh
  }

  getAvail({ i, z, slotX, mat = 0, mode, gridPos }) {
    const mesh = this.#avail[0]

    if (!mesh) return null

    if (mode === MODE.EXPLORE) {
      mesh.position.x = gridPos.x
      mesh.position.z = gridPos.y
    } else {
      const posXChoice = [(-this.rangeX * REPEAT_OCEAN) / 2.5, 0, (this.rangeX * REPEAT_OCEAN) / 2.5]
      mesh.slotX = slotX || randInt(0, 2)

      mesh.position.x = posXChoice[mesh.slotX]
      mesh.position.z = z || -i * this.zIncr - this.zIncr
    }

    // rupee
    mesh.children[0].material = this.#rupee.materials[mat]
    mesh.children[0].rotation.y = randInt(0, 2 * Math.PI)
    mesh.score = DATA_RUPEES[mat]

    mesh.initPos = mesh.position.clone()

    // remove from array
    this.#avail.shift()

    return mesh
  }

  free(mesh) {
    this.#avail.push(mesh)
  }
}
