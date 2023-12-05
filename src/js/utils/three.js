import { BufferAttribute, Matrix4, Vector3 } from 'three'

export function sortPoints(mesh, camera) {
  const vector = new Vector3()
  const { geometry } = mesh

  // Model View Projection matrix

  const matrix = new Matrix4()
  matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  matrix.multiply(mesh.matrixWorld)

  let index = geometry.getIndex()
  const positions = geometry.getAttribute('position').array
  const length = positions.length / 3

  if (index === null) {
    const array = new Uint16Array(length)

    for (let i = 0; i < length; i++) {
      array[i] = i
    }

    index = new BufferAttribute(array, 1)

    geometry.setIndex(index)
  }

  const sortArray = []

  for (let i = 0; i < length; i++) {
    vector.fromArray(positions, i * 3)
    vector.applyMatrix4(matrix)

    sortArray.push([vector.z, i])
  }

  function numericalSort(a, b) {
    return b[0] - a[0]
  }

  sortArray.sort(numericalSort)

  const indices = index.array

  for (let i = 0; i < length; i++) {
    indices[i] = sortArray[i][1]
  }

  geometry.index.needsUpdate = true
}

// export function hexToRgb(hex) {
//   let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
//   return result
//     ? {
//         r: parseInt(result[1], 16),
//         g: parseInt(result[2], 16),
//         b: parseInt(result[3], 16),
//       }
//     : null
// }

export function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

// convertToRGB = function(){
//   if(this.length != 6){
//       throw "Only six-digit hex colors are allowed.";
//   }

//   var aRgbHex = this.match(/.{1,2}/g);
//   var aRgb = [
//       parseInt(aRgbHex[0], 16),
//       parseInt(aRgbHex[1], 16),
//       parseInt(aRgbHex[2], 16)
//   ];
//   return aRgb;
// }
