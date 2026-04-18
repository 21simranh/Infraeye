/**
 * Roads.jsx
 * ---------------------------------------------------------
 * Renders all road segments as textured horizontal planes.
 * Each road piece receives a procedural asphalt + lane-marking
 * texture that tiles to match its length.
 * ---------------------------------------------------------
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { createRoadTexture } from '../utils/textureGenerator';

export default function Roads({ roads }) {
  // pre-create base textures (one per orientation)
  const baseH = useMemo(() => createRoadTexture(true), []);
  const baseV = useMemo(() => createRoadTexture(false), []);

  // build a material per road so each can have its own repeat
  const items = useMemo(() => {
    return roads.map((road) => {
      const src = road.isHorizontal ? baseH : baseV;

      // clone texture for unique repeat values
      const tex = src.clone();
      tex.needsUpdate = true;

      // tile the texture proportionally
      const repeatX = road.isHorizontal ? road.size[0] / 14 : 1;
      const repeatY = road.isHorizontal ? 1 : road.size[1] / 14;
      tex.repeat.set(repeatX, repeatY);

      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.92,
        metalness: 0.03,
      });

      return { road, mat };
    });
  }, [roads, baseH, baseV]);

  return (
    <group>
      {items.map(({ road, mat }, i) => (
        <mesh
          key={i}
          position={road.position}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
          material={mat}
        >
          <planeGeometry args={[road.size[0], road.size[1]]} />
        </mesh>
      ))}
    </group>
  );
}
