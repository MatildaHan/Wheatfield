/** Root-anchored cubic shoot. The last control point unfolds a juvenile crozier. */
export function shootPoint(t: number, height: number, bend: number, maturity: number) {
  const u = Math.max(0, Math.min(1, t)), v = 1 - u
  const curl = Math.min(26, height * 0.28) * (1 - Math.max(0, Math.min(1, maturity)))
  return {
    x: 3 * v * u * u * (bend * 0.55 - curl) + u * u * u * bend,
    y: 3 * v * v * u * height * 0.38 + 3 * v * u * u * (height * 0.78 + curl) + u * u * u * (height - curl * 0.35),
  }
}

/** Fold a petal into an upright bud, preserving the same vertex topology. */
export function foldedPetal(x: number, y: number, z: number, length: number) {
  const t = Math.max(0, Math.min(1, y / length))
  return [x * (0.22 + 0.10 * Math.sin(Math.PI * t)), 8 * Math.sin(Math.PI * t), t * 35 + z * 0.12]
}
