/**
 * City.jsx
 * ---------------------------------------------------------
 * Assembles the complete city: ground, roads, buildings,
 * trees, landmarks, and NPC vehicles.
 * ---------------------------------------------------------
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import Building from './Building';
import Roads from './Roads';
import { createGroundTexture } from '../utils/textureGenerator';

// ============================================================
//  Tree  – low-poly (trunk + canopy)
// ============================================================
function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.28, 3, 6]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.92} />
      </mesh>
      <mesh position={[0, 3.8, 0]} castShadow>
        <sphereGeometry args={[1.7, 8, 6]} />
        <meshStandardMaterial color="#2d6b1e" roughness={0.88} />
      </mesh>
    </group>
  );
}

// ============================================================
//  Bench
// ============================================================
function Bench({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[2, 0.12, 0.6]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.75, -0.25]} castShadow>
        <boxGeometry args={[2, 0.55, 0.08]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.92} />
      </mesh>
      {[-0.8, 0.8].map(lx => (
        <mesh key={lx} position={[lx, 0.2, 0]}>
          <boxGeometry args={[0.08, 0.42, 0.5]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================
//  NPC Vehicle  (sedan / suv / truck)
// ============================================================
function Vehicle({ data }) {
  const { position, rotation, color, type } = data;
  const bodyL = type === 'truck' ? 5.5 : type === 'suv' ? 4 : 3.5;
  const bodyH = type === 'suv' ? 1.0 : 0.7;
  const cabH = type === 'truck' ? 0 : 0.5;
  const cabL = bodyL * 0.45;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Body */}
      <mesh position={[0, bodyH / 2, 0]} castShadow>
        <boxGeometry args={[1.7, bodyH, bodyL]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.18} />
      </mesh>
      {/* Cabin (not for trucks) */}
      {cabH > 0 && (
        <mesh position={[0, bodyH + cabH / 2, -0.2]} castShadow>
          <boxGeometry args={[1.5, cabH, cabL]} />
          <meshStandardMaterial color={color} roughness={0.45} metalness={0.22} />
        </mesh>
      )}
      {/* Truck bed walls */}
      {type === 'truck' && (
        <mesh position={[0, bodyH + 0.35, -1]} castShadow>
          <boxGeometry args={[1.75, 0.7, bodyL * 0.5]} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.15} />
        </mesh>
      )}
      {/* Windshield */}
      <mesh position={[0, bodyH + (cabH > 0 ? cabH * 0.4 : 0.3), bodyL * 0.22]}>
        <boxGeometry args={[1.45, 0.4, 0.05]} />
        <meshStandardMaterial color="#4a8aba" roughness={0.15} metalness={0.35} transparent opacity={0.75} />
      </mesh>
      {/* Headlights */}
      {[-0.6, 0.6].map(s => (
        <mesh key={s} position={[s, bodyH * 0.5, bodyL / 2 + 0.02]}>
          <boxGeometry args={[0.3, 0.18, 0.04]} />
          <meshStandardMaterial color="#ffe8a0" emissive="#ffe0a0" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Taillights */}
      {[-0.6, 0.6].map(s => (
        <mesh key={`t${s}`} position={[s, bodyH * 0.5, -bodyL / 2 - 0.02]}>
          <boxGeometry args={[0.25, 0.15, 0.04]} />
          <meshStandardMaterial color="#c02020" emissive="#c02020" emissiveIntensity={0.2} />
        </mesh>
      ))}
      {/* Wheels */}
      {[[-0.85, 0.3, bodyL * 0.3], [0.85, 0.3, bodyL * 0.3],
        [-0.85, 0.3, -bodyL * 0.3], [0.85, 0.3, -bodyL * 0.3]].map(([wx, wy, wz], i) => (
        <mesh key={i} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.18, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================
//  Garden landmark
// ============================================================
function Garden({ landmark }) {
  const { position: [px,, pz], size } = landmark;
  return (
    <group>
      <mesh position={[px, 0.03, pz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial color="#3e8a32" roughness={0.94} />
      </mesh>
      <mesh position={[px, 0.04, pz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0], 2.5]} />
        <meshStandardMaterial color="#c0b090" roughness={0.88} />
      </mesh>
      <mesh position={[px, 0.04, pz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, size[1]]} />
        <meshStandardMaterial color="#c0b090" roughness={0.88} />
      </mesh>
      <mesh position={[px + 7, 0.05, pz - 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.5, 24]} />
        <meshStandardMaterial color="#3a80b0" roughness={0.25} metalness={0.2} transparent opacity={0.85} />
      </mesh>
      <Bench position={[px + 3, 0, pz + 2]} />
      <Bench position={[px - 5, 0, pz - 2]} rotation={[0, Math.PI / 2, 0]} />
      <Bench position={[px - 3, 0, pz + 8]} rotation={[0, -Math.PI / 4, 0]} />
    </group>
  );
}

// ============================================================
//  Plaza landmark (fountain + benches)
// ============================================================
function Plaza({ landmark }) {
  const { position: [px,, pz], size } = landmark;
  return (
    <group>
      <mesh position={[px, 0.04, pz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial color="#c5bfad" roughness={0.82} />
      </mesh>
      <mesh position={[px, 0.045, pz]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8, 10, 32]} />
        <meshStandardMaterial color="#b0a898" roughness={0.8} />
      </mesh>
      <mesh position={[px, 0.7, pz]} castShadow>
        <cylinderGeometry args={[4, 4.8, 1.4, 20]} />
        <meshStandardMaterial color="#a0a098" roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh position={[px, 1.15, pz]}>
        <cylinderGeometry args={[3.5, 3.5, 0.3, 20]} />
        <meshStandardMaterial color="#4a90c8" roughness={0.18} metalness={0.3} transparent opacity={0.82} />
      </mesh>
      <mesh position={[px, 2.8, pz]} castShadow>
        <cylinderGeometry args={[0.25, 0.45, 3.5, 8]} />
        <meshStandardMaterial color="#b8b8b0" roughness={0.6} />
      </mesh>
      <mesh position={[px, 4.7, pz]} castShadow>
        <sphereGeometry args={[0.65, 10, 8]} />
        <meshStandardMaterial color="#c0c0b8" roughness={0.5} metalness={0.1} />
      </mesh>
      <Bench position={[px + 8, 0, pz]} />
      <Bench position={[px - 8, 0, pz]} rotation={[0, Math.PI, 0]} />
      <Bench position={[px, 0, pz + 8]} rotation={[0, Math.PI / 2, 0]} />
      <Bench position={[px, 0, pz - 8]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
}

// ============================================================
//  Clock Tower landmark  (brick, tiered, clock faces, pyramid roof)
// ============================================================
function ClockTower({ landmark }) {
  const [px,, pz] = landmark.position;
  return (
    <group>
      {/* Stone platform */}
      <mesh position={[px, 0.35, pz]} receiveShadow>
        <boxGeometry args={[10, 0.7, 10]} />
        <meshStandardMaterial color="#9a8a7a" roughness={0.9} />
      </mesh>
      {/* Base tier */}
      <mesh position={[px, 4.5, pz]} castShadow receiveShadow>
        <boxGeometry args={[6, 8, 6]} />
        <meshStandardMaterial color="#b08a6a" roughness={0.85} />
      </mesh>
      {/* Decorative arches (base) */}
      {[[0,0,3.02],[0,0,-3.02],[3.02,0,0],[-3.02,0,0]].map(([ox,,oz], i) => (
        <mesh key={`arch${i}`} position={[px+ox, 3.5, pz+oz]}
          rotation={oz !== 0 ? [-Math.PI/2, 0, 0] : [-Math.PI/2, 0, Math.PI/2]}>
          <planeGeometry args={[3.5, 0.01]} />
          <meshStandardMaterial color="#8a6a4a" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Windows (base tier) */}
      {[[0,5.5,3.02],[0,5.5,-3.02],[3.02,5.5,0],[-3.02,5.5,0]].map(([ox,oy,oz], i) => (
        <mesh key={`bw${i}`} position={[px+ox, oy, pz+oz]}>
          <boxGeometry args={[oz !== 0 ? 0.04 : 1.6, 2.2, oz !== 0 ? 1.6 : 0.04]} />
          <meshStandardMaterial color="#3a5a6a" roughness={0.3} metalness={0.1} />
        </mesh>
      ))}
      {/* Ledge / cornice */}
      <mesh position={[px, 8.9, pz]} castShadow>
        <boxGeometry args={[7, 0.5, 7]} />
        <meshStandardMaterial color="#8a7060" roughness={0.85} />
      </mesh>
      {/* Clock section */}
      <mesh position={[px, 12, pz]} castShadow>
        <boxGeometry args={[4.5, 5.5, 4.5]} />
        <meshStandardMaterial color="#a88060" roughness={0.82} />
      </mesh>
      {/* Clock faces (4 sides) */}
      {[
        [0, 12, 2.27, [0, 0, 0]],
        [0, 12, -2.27, [0, Math.PI, 0]],
        [2.27, 12, 0, [0, Math.PI/2, 0]],
        [-2.27, 12, 0, [0, -Math.PI/2, 0]],
      ].map(([ox, oy, oz, rot], i) => (
        <group key={`cf${i}`} position={[px + ox, oy, pz + oz]} rotation={rot}>
          {/* White clock face */}
          <mesh>
            <circleGeometry args={[1.8, 24]} />
            <meshStandardMaterial color="#f0e8d8" side={THREE.DoubleSide} roughness={0.75} />
          </mesh>
          {/* Hour hand */}
          <mesh position={[0, 0.3, 0.02]} rotation={[0, 0, -Math.PI / 6]}>
            <boxGeometry args={[0.12, 1.0, 0.02]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          {/* Minute hand */}
          <mesh position={[0, 0.05, 0.03]} rotation={[0, 0, Math.PI / 3]}>
            <boxGeometry args={[0.08, 1.4, 0.02]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          {/* Center dot */}
          <mesh position={[0, 0, 0.04]}>
            <circleGeometry args={[0.12, 8]} />
            <meshStandardMaterial color="#1a1a1a" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      {/* Upper ledge */}
      <mesh position={[px, 15, pz]} castShadow>
        <boxGeometry args={[5.2, 0.4, 5.2]} />
        <meshStandardMaterial color="#8a7060" roughness={0.85} />
      </mesh>
      {/* Pyramid roof */}
      <mesh position={[px, 18, pz]} castShadow>
        <coneGeometry args={[3.5, 5.5, 4]} />
        <meshStandardMaterial color="#6a5a4a" roughness={0.85} />
      </mesh>
    </group>
  );
}

// ============================================================
//  Civic Building (museum / town hall with columns + pediment)
// ============================================================
function CivicBuilding({ landmark }) {
  const [px,, pz] = landmark.position;
  const bw = 30, bd = 22, bh = 10;

  // Pediment (triangular front) geometry
  const pedimentGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-bw / 2 + 1, 0);
    shape.lineTo(0, 5);
    shape.lineTo(bw / 2 - 1, 0);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: false });
    geo.translate(0, 0, -0.3);
    return geo;
  }, [bw]);

  return (
    <group>
      {/* Base platform */}
      <mesh position={[px, 0.6, pz]} receiveShadow>
        <boxGeometry args={[34, 1.2, 26]} />
        <meshStandardMaterial color="#d8d0c0" roughness={0.85} />
      </mesh>
      {/* Steps (front) */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[px, 0.2 + i * 0.4, pz + bd / 2 + 1 + i * 0.5]}>
          <boxGeometry args={[bw - 2, 0.4, 1]} />
          <meshStandardMaterial color="#c8c0b0" roughness={0.85} />
        </mesh>
      ))}
      {/* Main body */}
      <mesh position={[px, 1.2 + bh / 2, pz]} castShadow receiveShadow>
        <boxGeometry args={[bw, bh, bd]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.82} />
      </mesh>
      {/* Windows (front face) */}
      {[-10, -5, 0, 5, 10].map((ox, i) => (
        <mesh key={`fw${i}`} position={[px + ox, 1.2 + bh * 0.55, pz + bd / 2 + 0.02]}>
          <boxGeometry args={[2.2, 3.5, 0.04]} />
          <meshStandardMaterial color="#4a6a7a" roughness={0.3} metalness={0.1} />
        </mesh>
      ))}
      {/* Columns (front porch) */}
      {[-9, -4.5, 0, 4.5, 9].map((ox, i) => (
        <mesh key={`col${i}`} position={[px + ox, 1.2 + bh / 2, pz + bd / 2 + 2]} castShadow>
          <cylinderGeometry args={[0.45, 0.55, bh, 8]} />
          <meshStandardMaterial color="#e0d8c8" roughness={0.7} />
        </mesh>
      ))}
      {/* Column capitals */}
      {[-9, -4.5, 0, 4.5, 9].map((ox, i) => (
        <mesh key={`cap${i}`} position={[px + ox, 1.2 + bh + 0.2, pz + bd / 2 + 2]}>
          <boxGeometry args={[1.2, 0.4, 1.2]} />
          <meshStandardMaterial color="#d0c8b8" roughness={0.75} />
        </mesh>
      ))}
      {/* Porch roof */}
      <mesh position={[px, 1.2 + bh + 0.5, pz + bd / 2 + 2]} castShadow>
        <boxGeometry args={[bw + 2, 0.5, 5]} />
        <meshStandardMaterial color="#c8c0b0" roughness={0.8} />
      </mesh>
      {/* Pediment (triangle) */}
      <mesh position={[px, 1.2 + bh + 0.8, pz + bd / 2 + 2.3]}
        geometry={pedimentGeo} castShadow>
        <meshStandardMaterial color="#d8d0c0" roughness={0.78} />
      </mesh>
      {/* Cupola base */}
      <mesh position={[px, 1.2 + bh + 1.5, pz]} castShadow>
        <boxGeometry args={[4, 2, 4]} />
        <meshStandardMaterial color="#d0c8b8" roughness={0.8} />
      </mesh>
      {/* Cupola dome */}
      <mesh position={[px, 1.2 + bh + 3.8, pz]} castShadow>
        <coneGeometry args={[2.5, 3.5, 8]} />
        <meshStandardMaterial color="#a0988a" roughness={0.75} />
      </mesh>
      {/* Cupola finial */}
      <mesh position={[px, 1.2 + bh + 5.8, pz]}>
        <sphereGeometry args={[0.35, 8, 6]} />
        <meshStandardMaterial color="#c8b898" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Round window (front) */}
      <mesh position={[px, 1.2 + bh * 0.8, pz + bd / 2 + 0.02]}>
        <circleGeometry args={[1.5, 16]} />
        <meshStandardMaterial color="#5a8090" roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ============================================================
//  Monument / Memorial  (pedestal + statue figure)
// ============================================================
function Monument({ landmark }) {
  const [px,, pz] = landmark.position;
  return (
    <group>
      {/* Paved area */}
      <mesh position={[px, 0.03, pz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={landmark.size} />
        <meshStandardMaterial color="#b5ad9a" roughness={0.82} />
      </mesh>
      {/* Decorative path ring */}
      <mesh position={[px, 0.04, pz]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8, 10, 24]} />
        <meshStandardMaterial color="#9a9282" roughness={0.8} />
      </mesh>
      {/* Base platform (wide) */}
      <mesh position={[px, 0.6, pz]} castShadow>
        <boxGeometry args={[8, 1.2, 8]} />
        <meshStandardMaterial color="#8a8078" roughness={0.85} />
      </mesh>
      {/* Pedestal column */}
      <mesh position={[px, 4, pz]} castShadow>
        <boxGeometry args={[4, 6, 4]} />
        <meshStandardMaterial color="#a09888" roughness={0.8} />
      </mesh>
      {/* Inscription slab (front) */}
      <mesh position={[px, 3, pz + 2.02]}>
        <boxGeometry args={[2.5, 1.5, 0.08]} />
        <meshStandardMaterial color="#c0b8a0" roughness={0.75} />
      </mesh>
      {/* Ledge */}
      <mesh position={[px, 7.2, pz]} castShadow>
        <boxGeometry args={[5, 0.4, 5]} />
        <meshStandardMaterial color="#908880" roughness={0.82} />
      </mesh>
      {/* Figure body */}
      <mesh position={[px, 9.5, pz]} castShadow>
        <cylinderGeometry args={[0.7, 0.9, 4, 8]} />
        <meshStandardMaterial color="#706858" roughness={0.78} metalness={0.1} />
      </mesh>
      {/* Figure shoulders / arms hint */}
      <mesh position={[px, 10.5, pz]} castShadow>
        <boxGeometry args={[2.5, 0.6, 0.8]} />
        <meshStandardMaterial color="#706858" roughness={0.78} metalness={0.1} />
      </mesh>
      {/* Head */}
      <mesh position={[px, 12.3, pz]} castShadow>
        <sphereGeometry args={[0.7, 10, 8]} />
        <meshStandardMaterial color="#807868" roughness={0.75} metalness={0.1} />
      </mesh>
      {/* Benches around monument */}
      <Bench position={[px + 10, 0, pz]} />
      <Bench position={[px - 10, 0, pz]} rotation={[0, Math.PI, 0]} />
      <Bench position={[px, 0, pz + 10]} rotation={[0, Math.PI / 2, 0]} />
      <Bench position={[px, 0, pz - 10]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
}

// ============================================================
//  Main City component
// ============================================================
export default function City({ cityData, onBuildingClick, onBuildingHover, onBuildingUnhover }) {
  const { buildings, roads, trees, landmarks, vehicles, citySize } = cityData;

  const groundMat = useMemo(() => {
    const tex = createGroundTexture();
    tex.repeat.set(citySize / 20, citySize / 20);
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0.02, color: '#3a6a32' });
  }, [citySize]);

  const groundSize = citySize * 2.5;

  return (
    <group>
      {/* ---- Ground ---- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow material={groundMat}>
        <planeGeometry args={[groundSize, groundSize]} />
      </mesh>

      {/* ---- Segmented grass strips (gap at intersections) ---- */}
      {(() => {
        const strips = [];
        const RW = 14, BS = 44, GC = 5;
        const tsz = GC * (BS + RW) + RW;
        const off = -tsz / 2;
        const sw = 2.6, ed = RW / 2 + sw / 2;
        for (let i = 0; i <= GC; i++) {
          const rc = off + i * (BS + RW) + RW / 2;
          for (let j = 0; j < GC; j++) {
            const ss = off + j * (BS + RW) + RW;
            const se = off + (j + 1) * (BS + RW);
            const sl = se - ss, sm = (ss + se) / 2;
            for (const s of [-1, 1]) {
              strips.push(
                <mesh key={`hg${i}${j}${s}`} position={[sm, 0.012, rc + s * ed]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[sl, sw]} /><meshStandardMaterial color="#3d7a2e" roughness={0.94} />
                </mesh>
              );
              strips.push(
                <mesh key={`vg${i}${j}${s}`} position={[rc + s * ed, 0.012, sm]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[sw, sl]} /><meshStandardMaterial color="#3d7a2e" roughness={0.94} />
                </mesh>
              );
            }
          }
        }
        return strips;
      })()}

      {/* ---- Roads ---- */}
      <Roads roads={roads} />

      {/* ---- Landmarks ---- */}
      {landmarks.map((lm, i) => {
        if (lm.type === 'garden') return <Garden key={`lm${i}`} landmark={lm} />;
        if (lm.type === 'plaza') return <Plaza key={`lm${i}`} landmark={lm} />;
        if (lm.type === 'clocktower') return <ClockTower key={`lm${i}`} landmark={lm} />;
        if (lm.type === 'civic') return <CivicBuilding key={`lm${i}`} landmark={lm} />;
        if (lm.type === 'monument') return <Monument key={`lm${i}`} landmark={lm} />;
        return null;
      })}

      {/* ---- Trees ---- */}
      {trees.map((t, i) => (
        <Tree key={`t${i}`} position={t.position} scale={t.scale} />
      ))}

      {/* ---- NPC Vehicles ---- */}
      {vehicles.map((v, i) => (
        <Vehicle key={`v${i}`} data={v} />
      ))}

      {/* ---- Buildings ---- */}
      {buildings.map(bld => (
        <Building key={bld.id} data={bld}
          onClick={onBuildingClick} onHover={onBuildingHover} onUnhover={onBuildingUnhover} />
      ))}
    </group>
  );
}
