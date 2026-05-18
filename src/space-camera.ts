export type Vec = { x: number; y: number }

export function spaceViewportScale(width: number, height: number) {
  if (height > width && width <= 520) return 0.76
  if (width <= 900) return 0.88
  return 1
}

export function cameraTargetFor(center: Vec, width: number, height: number, scale: number): Vec {
  return {
    x: center.x - width / (2 * scale),
    y: center.y - height / (2 * scale)
  }
}

export function worldToScreen(point: Vec, camera: Vec, scale: number): Vec {
  return {
    x: (point.x - camera.x) * scale,
    y: (point.y - camera.y) * scale
  }
}

export function screenToWorld(point: Vec, camera: Vec, scale: number): Vec {
  return {
    x: point.x / scale + camera.x,
    y: point.y / scale + camera.y
  }
}
