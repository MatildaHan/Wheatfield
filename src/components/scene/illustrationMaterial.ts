import * as THREE from 'three'

/** Three restrained ink-wash values, instead of a continuous PBR light ramp. */
export function illustrationMaterial(color: string, vertexColors = false, paperScale = 1) {
  const ramp = new THREE.DataTexture(new Uint8Array([150, 194, 230]), 3, 1, THREE.RedFormat)
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter
  ramp.generateMipmaps = false; ramp.needsUpdate = true
  const material = new THREE.MeshToonMaterial({ color, vertexColors, side: THREE.DoubleSide, gradientMap: ramp })
  material.onBeforeCompile = shader => {
    shader.uniforms.paperScale = { value: paperScale }
    shader.vertexShader = 'varying vec3 vPaperPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaperPosition = position;')
    shader.fragmentShader = 'varying vec3 vPaperPosition;\nuniform float paperScale;\n' + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec3 paper = vPaperPosition * paperScale;
      float grain = fract(sin(dot(floor(paper.xy * 3.2 + paper.z), vec2(12.9898,78.233))) * 43758.5453);
      float wash = sin(paper.x * 0.13 + sin(paper.y * 0.17)) * 0.012;
      diffuseColor.rgb *= 0.965 + grain * 0.035 + wash;
      float hatchPhase = (paper.x + paper.y * 0.65 + paper.z * 0.3) * 0.5;
      float hatch = 1.0 - smoothstep(0.07, 0.07 + fwidth(hatchPhase), abs(fract(hatchPhase) - 0.5));
      float inkPatch = smoothstep(0.5, 0.85, sin(paper.y * 0.13 + paper.x * 0.06));
      diffuseColor.rgb *= 1.0 - hatch * inkPatch * 0.04 * step(10.0, paperScale);
    `)
  }
  material.addEventListener('dispose', () => ramp.dispose())
  return material
}
