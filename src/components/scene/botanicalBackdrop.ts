import * as THREE from 'three'
import { illustrationMaterial } from './illustrationMaterial.ts'

/** Authored silhouettes and structural strokes, placed as actual 3D assets. */
export function botanicalBackdrop(height: (x: number, z: number) => number) {
  const group = new THREE.Group(), geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = []
  const obstacles: THREE.Mesh[] = []
  const keep = <T extends THREE.BufferGeometry>(g: T) => { geometries.push(g); return g }
  const ink = new THREE.LineBasicMaterial({ color: '#354e49', transparent: true, opacity: 0.8 }); materials.push(ink)
  // Flat ink-wash fill deliberately ignores directional shading. Geometry still
  // participates in depth/occlusion and casts shadows onto the real terrain.
  const colors = ['#88b9b9', '#95c1be', '#7fadaa', '#91bbb1'].map(c => {
    const m = new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })
    materials.push(m); return m
  })
  const bushInk = new THREE.LineBasicMaterial({ color: '#304c49', transparent: true, opacity: 0.9 }); materials.push(bushInk)
  let seed = 891
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  // Authored clusters: distant low fringe, right middle-ground groups, then
  // a few cropped edge masses. No repeated rows through the whole valley.
  const placements = [
    [-850,-1120,230,115],[-610,-980,180,100],[-730,-770,190,125],
    [-680,-420,170,110],[-880,-320,210,145],[-850,330,200,125],
    [690,-1180,195,100],[1000,-1220,220,145],[1310,-1190,250,180],
    [1650,-1120,270,210],[1220,-820,240,175],
    [750,-600,200,135],[1020,-550,240,185],[1380,-510,270,230],
    [960,-100,230,170],[1260,-50,270,210],[1560,20,300,235],
    [800,290,190,150],[1090,350,250,205],[1420,390,300,245],
    [1000,710,230,160],[1310,740,280,205],
    // Left-side layers echo the right, with offset clusters rather than rows.
    [-1130,-1230,225,145],[-1430,-1190,255,180],[-1750,-1130,275,205],
    [-1190,-810,220,170],[-1150,-540,235,180],[-1480,-480,275,220],
    [-980,-70,235,170],[-1300,-20,270,205],[-1630,70,300,235],
    [-1160,370,250,195],[-1470,430,290,235],
    [-1040,715,235,160],[-1350,760,280,205],
  ]
  for (let i = 0; i < placements.length; i++) {
    const [x, z, w, h] = placements[i]!
    const side = x! > 0 ? 1 : -1
    const shape = new THREE.Shape(); shape.moveTo(-w, 0)
    // Scalloped canopy: broad lobes with smaller irregular leaf-edge scallops.
    const outline: THREE.Vector3[] = [new THREE.Vector3(-w, 0, 24)]
    for (let j = 0; j <= 192; j++) {
      const t = j / 192, sx = -w + 2 * w * t
      const sy = Math.pow(Math.sin(Math.PI * t), 0.45) * h + Math.abs(Math.sin(t * Math.PI * (34 + i % 5) + i)) * 4 + Math.sin(t * 19 + i) * 7
      shape.lineTo(sx, sy); outline.push(new THREE.Vector3(sx, sy, 1))
    }
    shape.lineTo(w, 0); shape.closePath()
    outline[0].z = 1
    outline.push(new THREE.Vector3(w, 0, 1))
    const geometry = keep(new THREE.ShapeGeometry(shape))
    const bush = new THREE.Mesh(geometry, colors[i % colors.length])
    bush.position.set(x, height(x, z), z); bush.rotation.y = side * -0.12
    bush.castShadow = true
    obstacles.push(bush)
    bush.add(new THREE.Line(keep(new THREE.BufferGeometry().setFromPoints(outline)), bushInk))
    const strokes: THREE.Vector3[] = []
    for (let j = 0; j < 185; j++) {
      const px = (random() * 2 - 1) * w * 0.94, py = 9 + random() * h * 0.85
      if (py > Math.pow(Math.max(0, 1 - (px / w) ** 2), 0.6) * h - 9) continue
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * Math.PI, b = (k + 1) / 3 * Math.PI
        const r = 1.4 + (j % 4) * 0.35
        strokes.push(new THREE.Vector3(px + Math.cos(a) * r, py + Math.sin(a) * r, 1.3), new THREE.Vector3(px + Math.cos(b) * r, py + Math.sin(b) * r, 1.3))
      }
    }
    bush.add(new THREE.LineSegments(keep(new THREE.BufferGeometry().setFromPoints(strokes)), bushInk)); group.add(bush)
  }
  // Broad veined leaves frame the clearing. Curvature is in the mesh, not an image.
  const leafMaterial = illustrationMaterial('#70aa94'); materials.push(leafMaterial)
  for (let i = 0; i < 30; i++) {
    const side = i % 2 ? 1 : -1, n = Math.floor(i / 2)
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.bezierCurveTo(-35, 30, -64, 92, 0, 175)
    shape.bezierCurveTo(56, 106, 51, 44, 0, 0)
    const leafGeo = keep(new THREE.ShapeGeometry(shape, 18))
    const points = leafGeo.getAttribute('position')
    const bend = (y: number) => Math.sin(y / 175 * Math.PI) * 24
    for (let j = 0; j < points.count; j++) points.setZ(j, bend(points.getY(j)))
    leafGeo.computeVertexNormals()
    const leaf = new THREE.Mesh(leafGeo, leafMaterial)
    const x = side * (390 + (n % 9) * 50), z = n < 9 ? 650 + (n % 3) * 65 : -600 + (n - 9) * 125
    leaf.position.set(x, height(x, z), z)
    leaf.rotation.set(-0.12, side * 0.15, side * (0.25 + (n % 5) * 0.16))
    if (n < 9) leaf.scale.set(1.4, 1.25, 1)
    if (n >= 9) {
      const row = n - 9
      const edgeX = side * (1060 + (row % 3) * 110), edgeZ = (row < 3 ? -720 : 80) + (side < 0 ? 60 : 0)
      leaf.position.set(edgeX, height(edgeX, edgeZ), edgeZ)
      leaf.scale.setScalar(1.65 + (row % 3) * 0.25)
      leaf.rotation.z = side * (row % 2 ? -1 : 1) * 0.3
    }
    leaf.castShadow = leaf.receiveShadow = true
    obstacles.push(leaf)
    leaf.add(new THREE.Line(keep(new THREE.BufferGeometry().setFromPoints(shape.getPoints(48).map(p => new THREE.Vector3(p.x, p.y, bend(p.y) + 0.7)))), ink))
    const veins: THREE.Vector3[] = []
    for (let j = 0; j < 10; j++) {
      const y = 8 + j * 15
      veins.push(new THREE.Vector3(0, y, bend(y) + 1), new THREE.Vector3(0, y + 12, bend(y + 12) + 1))
      if (j > 0 && j < 9) for (const direction of [-1, 1]) {
        const endY = y + 13, endX = direction * Math.sin(endY / 175 * Math.PI) * 34
        veins.push(new THREE.Vector3(0, y, bend(y) + 1), new THREE.Vector3(endX, endY, bend(endY) + 1))
      }
    }
    leaf.add(new THREE.LineSegments(keep(new THREE.BufferGeometry().setFromPoints(veins)), ink)); group.add(leaf)
  }
  const vineMaterial = illustrationMaterial('#527e71'); materials.push(vineMaterial)
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 980, 710, 130), new THREE.Vector3(side * 690, 600, 150),
      new THREE.Vector3(side * 470, 610, 80), new THREE.Vector3(side * 290, 760, -20),
    ])
    const vine = new THREE.Mesh(keep(new THREE.TubeGeometry(curve, 64, 15, 8, false)), vineMaterial)
    vine.castShadow = vine.receiveShadow = true; group.add(vine)
    const lines: THREE.Vector3[] = []
    for (let j = 0; j < 85; j++) {
      const p = curve.getPoint(j / 85)
      lines.push(p.clone().add(new THREE.Vector3(-2, -11, 12)), p.clone().add(new THREE.Vector3(2, -6, 14)))
    }
    group.add(new THREE.LineSegments(keep(new THREE.BufferGeometry().setFromPoints(lines)), ink))
  }
  return { group, obstacles, dispose() { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()) } }
}
