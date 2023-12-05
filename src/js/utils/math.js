export function getDistance(x1, y1, x2, y2) {
  let y = x2 - x1
  let x = y2 - y1

  return Math.sqrt(x * x + y * y)
}

export function isPointOutsideCircle(x, y, centerX, centerY, radius) {
  const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
  return distance > radius
}
