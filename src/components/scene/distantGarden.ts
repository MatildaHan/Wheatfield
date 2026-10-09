import * as THREE from 'three'

/** Flat painted scenery at distinct world depths, not lit terrain mounds. */
export function distantGarden() {
  const group = new THREE.Group()
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = []
  function silhouette(points: THREE.Vector2[], color: string, z: number, lineColor: string) {
    const shape = new THREE.Shape(points)
    const geometry = new THREE.ShapeGeometry(shape)
    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, fog: false })
    geometries.push(geometry); materials.push(material)
    const mesh = new THREE.Mesh(geometry, material); mesh.position.z = z; group.add(mesh)
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, 0.6)))
    const ink = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.65, fog: false })
    geometries.push(lineGeo); materials.push(ink); mesh.add(new THREE.Line(lineGeo, ink))
    return mesh
  }
  // Clouds are supplied by the original two-dimensional LayerSky component.
  for (let layer = 0; layer < 3; layer++) {
    const points = [new THREE.Vector2(-2300, -120)]
    for (let i = 0; i <= 180; i++) {
      const x = -2300 + i / 180 * 4600
      const y = 95 + layer * 12 + Math.sin(x / 255 + layer * 2) * 32 + Math.sin(x / 92 + layer) * 14
      points.push(new THREE.Vector2(x, y))
    }
    points.push(new THREE.Vector2(2300, -120))
    silhouette(points, ['#cbd8c4', '#b1c9b7', '#9dbeb0'][layer], -1850 + layer * 200, '#7d9b8c')
  }
  // Uneven forest fringe, with the central meadow deliberately left open.
  for (const side of [-1, 1]) {
    const points = [new THREE.Vector2(side * 420, -70)]
    for (let i = 0; i <= 200; i++) {
      const t = i / 200, x = side * (420 + t * 1800)
      const y = 75 + t * 100 + Math.sin(t * 23) * 18 + Math.abs(Math.sin(t * 170)) * 10
      points.push(new THREE.Vector2(x, y))
    }
    points.push(new THREE.Vector2(side * 2220, -70))
    silhouette(points, '#8db7a7', -1160, '#45685d')
  }
  const rock = [new THREE.Vector2(-40,0),new THREE.Vector2(-35,75),new THREE.Vector2(-7,113),new THREE.Vector2(20,95),new THREE.Vector2(40,0)]
  for (const x of [-320, 300]) {
    const mesh = silhouette(rock, '#b7bfc1', -1340, '#6f8990'); mesh.position.x = x
    mesh.position.y = 40; mesh.scale.setScalar(0.8)
  }
  return { group, dispose() { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()) } }
}
