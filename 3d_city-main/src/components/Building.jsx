/**
 * Building.jsx
 * ---------------------------------------------------------
 * Four distinct structural shapes with per-building variety:
 *
 *  • tiered  – Stepped tower (seed-varied tier ratios + antenna)
 *  • sleek   – Glass skyscraper (accent strips + spire + crown)
 *  • house   – Gable roof residence (chimney, door, windows)
 *  • block   – Standard mid-rise (rooftop equipment + accent band)
 *
 * Helipad + helicopter rendered on buildings flagged with
 * data.hasHelipad === true.
 * ---------------------------------------------------------
 */

import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { createBuildingTexture, createRoofTexture } from '../utils/textureGenerator';

// ---- helpers ----
function wallTex(type, color, rows, cols, seed, litP = 0.3) {
  return createBuildingTexture({ type, baseColor: color, windowRows: rows, windowCols: cols, seed, litProbability: litP });
}

function faceMats(wallMat, roofMat) {
  const bot = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.95 });
  return [wallMat, wallMat, roofMat, bot, wallMat, wallMat];
}

function faceMats2(frontMat, sideMat, roofMat) {
  const bot = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.95 });
  return [sideMat, sideMat, roofMat, bot, frontMat, frontMat];
}

// ============================================================
//  Main wrapper
// ============================================================
export default function Building({ data, onClick, onHover, onUnhover }) {
  const [hovered, setHovered] = useState(false);
  const handleClick = (e) => { e.stopPropagation(); onClick?.(data); };
  const handleOver = (e) => {
    e.stopPropagation(); setHovered(true);
    document.body.style.cursor = 'pointer';
    onHover?.(data, e);
  };
  const handleOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
    onUnhover?.();
  };
  const Shape = SHAPES[data.shape] || BlockShape;
  const scale = hovered ? [1.012, 1.012, 1.012] : [1, 1, 1];
  return (
    <group position={data.position} scale={scale}
      onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut} userData={data}>
      <Shape data={data} />
      {data.hasHelipad && <Helipad data={data} />}
    </group>
  );
}

const SHAPES = { tiered: TieredTower, sleek: SleekTower, house: HouseShape, block: BlockShape };

// ============================================================
//  1. TIERED TOWER  (office)
//     Seed-varied tier proportions, consistent facade style
// ============================================================
function TieredTower({ data }) {
  const { width: w, depth: d, height: h, color, type, seed } = data;

  // Seed-varied ratios so each tower has a unique profile
  const r0 = 0.30 + (seed * 7 % 0.15);          // base 30-45%
  const r2 = 0.15 + (seed * 13 % 0.12);          // cap  15-27%
  const r1 = 1 - r0 - r2;                        // main = rest
  const stepDown = 0.70 + (seed * 11 % 0.12);    // width ratio per tier

  const bH = h * r0, mH = h * r1, cH = h * r2;
  const bW = w, mW = w * stepDown, cW = w * stepDown * stepDown;
  const bD = d, mD = d * stepDown, cD = d * stepDown * stepDown;

  const bY = -h / 2 + bH / 2;
  const mY = -h / 2 + bH + mH / 2;
  const cY = -h / 2 + bH + mH + cH / 2;

  const mats = useMemo(() => {
    const roof = new THREE.MeshStandardMaterial({ map: createRoofTexture(), roughness: 0.85 });
    const mk = (tw, th, s, rg = 0.72) => {
      const rows = Math.max(2, Math.floor(th / 3.5));
      const cols = Math.max(2, Math.floor(tw / 3));
      return new THREE.MeshStandardMaterial({ map: wallTex(type, color, rows, cols, s), roughness: rg, metalness: 0.06 });
    };
    return {
      base: faceMats(mk(bW, bH, seed), roof),
      main: faceMats(mk(mW, mH, seed + 0.1, 0.65), roof),
      cap: faceMats(mk(cW, cH, seed + 0.2, 0.60), roof),
    };
  }, [type, color, bW, mW, cW, bH, mH, cH, seed]);

  return (
    <>
      <mesh position={[0, bY, 0]} material={mats.base} castShadow receiveShadow>
        <boxGeometry args={[bW, bH, bD]} />
      </mesh>
      <mesh position={[0, mY, 0]} material={mats.main} castShadow receiveShadow>
        <boxGeometry args={[mW, mH, mD]} />
      </mesh>
      <mesh position={[0, cY, 0]} material={mats.cap} castShadow receiveShadow>
        <boxGeometry args={[cW, cH, cD]} />
      </mesh>
      {/* Antenna mast */}
      <mesh position={[0, h / 2 + 3, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.18, 6, 4]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Red light */}
      <mesh position={[0, h / 2 + 6.2, 0]}>
        <sphereGeometry args={[0.2, 6, 4]} />
        <meshStandardMaterial color="#ff4040" emissive="#ff0000" emissiveIntensity={0.6} />
      </mesh>
    </>
  );
}

// ============================================================
//  2. SLEEK TOWER  (modern)
//     Glass body + structural accents + crown + spire
// ============================================================
function SleekTower({ data }) {
  const { width: w, depth: d, height: h, color, seed } = data;

  // Seed-based variation: some have wider bases, some are uniform
  const hasBase = seed > 0.5;
  const baseH = hasBase ? h * 0.18 : 0;
  const bodyH = h - baseH;

  const mats = useMemo(() => {
    const rows = Math.max(4, Math.floor(bodyH / 2.8));
    const cols = Math.max(3, Math.floor(w / 2.5));
    const roof = new THREE.MeshStandardMaterial({ map: createRoofTexture(), roughness: 0.8 });
    const wall = new THREE.MeshStandardMaterial({
      map: wallTex('modern', color, rows, cols, seed), roughness: 0.28, metalness: 0.35,
    });
    return { body: faceMats(wall, roof) };
  }, [color, bodyH, w, seed]);

  const baseMat = useMemo(() => {
    if (!hasBase) return null;
    const rows = Math.max(2, Math.floor(baseH / 3.5));
    const cols = Math.max(2, Math.floor(w / 3));
    const roof = new THREE.MeshStandardMaterial({ map: createRoofTexture(), roughness: 0.85 });
    const wall = new THREE.MeshStandardMaterial({
      map: wallTex('commercial', color, rows, cols, seed + 0.3), roughness: 0.6,
    });
    return faceMats(wall, roof);
  }, [color, baseH, w, seed, hasBase]);

  return (
    <>
      {/* Optional wider base */}
      {hasBase && (
        <mesh position={[0, -h / 2 + baseH / 2, 0]} material={baseMat} castShadow receiveShadow>
          <boxGeometry args={[w * 1.2, baseH, d * 1.2]} />
        </mesh>
      )}
      {/* Main glass body */}
      <mesh position={[0, -h / 2 + baseH + bodyH / 2, 0]} material={mats.body} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, d]} />
      </mesh>
      {/* Structural accent strip — left */}
      <mesh position={[-w / 2 - 0.15, -h / 2 + baseH + bodyH / 2, 0]} castShadow>
        <boxGeometry args={[0.3, bodyH * 0.88, d * 0.08]} />
        <meshStandardMaterial color="#1e2e3e" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Structural accent strip — right */}
      <mesh position={[w / 2 + 0.15, -h / 2 + baseH + bodyH / 2, 0]} castShadow>
        <boxGeometry args={[0.3, bodyH * 0.88, d * 0.08]} />
        <meshStandardMaterial color="#1e2e3e" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Crown ledge */}
      <mesh position={[0, h / 2 - 0.6, 0]} castShadow>
        <boxGeometry args={[w * 1.06, 1.2, d * 1.06]} />
        <meshStandardMaterial color="#3a5878" metalness={0.35} roughness={0.5} />
      </mesh>
      {/* Spire */}
      <mesh position={[0, h / 2 + 5, 0]} castShadow>
        <coneGeometry args={[0.22, 10, 4]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.8} roughness={0.2} />
      </mesh>
    </>
  );
}

// ============================================================
//  3. HOUSE  (residential, low)
//     Gable roof + chimney + door + windows
// ============================================================
function HouseShape({ data }) {
  const { width: w, depth: d, height: h, seed } = data;
  const bodyH = h * 0.62;
  const roofH = h * 0.48;

  const roofGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const hw = (w * 1.12) / 2;
    shape.moveTo(-hw, 0);
    shape.lineTo(0, roofH);
    shape.lineTo(hw, 0);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: d * 1.12, bevelEnabled: false });
    geo.translate(0, 0, -(d * 1.12) / 2);
    return geo;
  }, [w, d, roofH]);

  const wallColors = ['#f5ede0', '#e8dcc8', '#f0e4d0', '#e0d4c0', '#faf4ea', '#eee4d4'];
  const roofColors = ['#8B6914', '#7a5a10', '#6a4a0a', '#955e1f', '#a06828', '#785020'];
  const wc = wallColors[Math.floor(seed * 100) % wallColors.length];
  const rc = roofColors[Math.floor(seed * 1000) % roofColors.length];

  return (
    <>
      <mesh position={[0, -h / 2 + bodyH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, d]} />
        <meshStandardMaterial color={wc} roughness={0.92} />
      </mesh>
      {/* Front door */}
      <mesh position={[0, -h / 2 + bodyH * 0.32, d / 2 + 0.02]}>
        <boxGeometry args={[w * 0.22, bodyH * 0.48, 0.06]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.88} />
      </mesh>
      {/* Door step */}
      <mesh position={[0, -h / 2 + 0.15, d / 2 + 0.3]}>
        <boxGeometry args={[w * 0.35, 0.3, 0.6]} />
        <meshStandardMaterial color="#8a8a82" roughness={0.9} />
      </mesh>
      {/* Front windows */}
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * w * 0.3, -h / 2 + bodyH * 0.62, d / 2 + 0.02]}>
          <boxGeometry args={[w * 0.16, bodyH * 0.22, 0.04]} />
          <meshStandardMaterial color="#4a7a9a" roughness={0.3} metalness={0.15} />
        </mesh>
      ))}
      {/* Side windows */}
      {[-1, 1].map(s => (
        <mesh key={`sw${s}`} position={[s * (w / 2 + 0.02), -h / 2 + bodyH * 0.55, 0]}>
          <boxGeometry args={[0.04, bodyH * 0.2, d * 0.18]} />
          <meshStandardMaterial color="#4a7a9a" roughness={0.3} metalness={0.15} />
        </mesh>
      ))}
      {/* Gable roof */}
      <mesh position={[0, -h / 2 + bodyH, 0]} geometry={roofGeo} castShadow receiveShadow>
        <meshStandardMaterial color={rc} roughness={0.82} />
      </mesh>
      {/* Chimney */}
      <mesh position={[w * 0.28, -h / 2 + bodyH + roofH * 0.55, d * 0.1]} castShadow>
        <boxGeometry args={[0.7, roofH * 0.55, 0.7]} />
        <meshStandardMaterial color="#8a6a5a" roughness={0.92} />
      </mesh>
    </>
  );
}

// ============================================================
//  4. BLOCK  (commercial / default)
//     Box body + rooftop equipment + accent band variation
// ============================================================
function BlockShape({ data }) {
  const { width: w, depth: d, height: h, color, type, seed } = data;

  // Seed-controlled accent band position
  const bandPos = -h / 2 + h * (0.3 + (seed * 3 % 0.4));

  const mats = useMemo(() => {
    const rows = Math.max(3, Math.floor(h / 3.5));
    const fCols = Math.max(2, Math.floor(w / 3));
    const sCols = Math.max(2, Math.floor(d / 3));
    const roof = new THREE.MeshStandardMaterial({ map: createRoofTexture(), roughness: 0.92 });
    const front = new THREE.MeshStandardMaterial({ map: wallTex(type, color, rows, fCols, seed, 0.35), roughness: 0.82, metalness: 0.08 });
    const side = new THREE.MeshStandardMaterial({ map: wallTex(type, color, rows, sCols, seed + 0.12, 0.25), roughness: 0.82, metalness: 0.08 });
    return faceMats2(front, side, roof);
  }, [type, color, h, w, d, seed]);

  const eqX = (seed - 0.5) * w * 0.4;
  const eqZ = ((seed * 7) % 1 - 0.5) * d * 0.4;

  return (
    <>
      <mesh material={mats} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {/* Accent colour band */}
      <mesh position={[0, bandPos, 0]}>
        <boxGeometry args={[w * 1.02, 0.4, d * 1.02]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.85} />
      </mesh>
      {/* AC unit */}
      <mesh position={[eqX, h / 2 + 0.45, eqZ]} castShadow>
        <boxGeometry args={[w * 0.22, 0.9, d * 0.18]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
      </mesh>
      {/* Vent pipe */}
      <mesh position={[-eqX, h / 2 + 0.35, -eqZ]}>
        <cylinderGeometry args={[0.25, 0.25, 0.7, 6]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.85} />
      </mesh>
    </>
  );
}

// ============================================================
//  HELIPAD + HELICOPTER (added to buildings with hasHelipad)
// ============================================================
function Helipad({ data }) {
  const { width: w, depth: d, height: h } = data;
  const padR = Math.min(w, d) * 0.38;
  const topY = h / 2;

  return (
    <group>
      {/* Helipad circle */}
      <mesh position={[0, topY + 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[padR, 24]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.8} />
      </mesh>
      {/* Yellow ring */}
      <mesh position={[0, topY + 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[padR - 0.6, padR, 24]} />
        <meshStandardMaterial color="#e0c020" roughness={0.7} />
      </mesh>
      {/* H letter - two verticals + crossbar */}
      <mesh position={[-0.7, topY + 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 2.8]} />
        <meshStandardMaterial color="#f0f0f0" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.7, topY + 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 2.8]} />
        <meshStandardMaterial color="#f0f0f0" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, topY + 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.9, 0.5]} />
        <meshStandardMaterial color="#f0f0f0" side={THREE.DoubleSide} />
      </mesh>

      {/* ---- Helicopter ---- */}
      <group position={[0.3, topY + 1.3, -0.5]}>
        {/* Fuselage */}
        <mesh castShadow>
          <boxGeometry args={[1.6, 1.3, 4]} />
          <meshStandardMaterial color="#2a4a2a" roughness={0.55} metalness={0.15} />
        </mesh>
        {/* Cockpit windshield */}
        <mesh position={[0, 0.15, 1.8]}>
          <boxGeometry args={[1.4, 0.75, 0.7]} />
          <meshStandardMaterial color="#4a90c0" roughness={0.15} metalness={0.3} transparent opacity={0.7} />
        </mesh>
        {/* Tail boom */}
        <mesh position={[0, 0.15, -3.8]} castShadow>
          <boxGeometry args={[0.45, 0.45, 3.6]} />
          <meshStandardMaterial color="#2a4a2a" roughness={0.6} />
        </mesh>
        {/* Tail fin */}
        <mesh position={[0, 0.75, -5.4]} castShadow>
          <boxGeometry args={[0.08, 1.1, 0.8]} />
          <meshStandardMaterial color="#2a4a2a" roughness={0.6} />
        </mesh>
        {/* Main rotor blades */}
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[9, 0.04, 0.3]} />
          <meshStandardMaterial color="#505050" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.95, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[9, 0.04, 0.3]} />
          <meshStandardMaterial color="#505050" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Rotor hub */}
        <mesh position={[0, 1.05, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.25, 8]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.6} />
        </mesh>
        {/* Tail rotor */}
        <mesh position={[0.22, 0.75, -5.4]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[1.8, 0.04, 0.15]} />
          <meshStandardMaterial color="#505050" metalness={0.5} />
        </mesh>
        {/* Landing skids */}
        {[-0.65, 0.65].map(side => (
          <group key={side}>
            <mesh position={[side, -0.95, 0]}>
              <boxGeometry args={[0.08, 0.06, 3.2]} />
              <meshStandardMaterial color="#3a3a3a" metalness={0.4} />
            </mesh>
            <mesh position={[side, -0.5, 0.8]}>
              <boxGeometry args={[0.06, 0.9, 0.06]} />
              <meshStandardMaterial color="#3a3a3a" metalness={0.4} />
            </mesh>
            <mesh position={[side, -0.5, -0.7]}>
              <boxGeometry args={[0.06, 0.9, 0.06]} />
              <meshStandardMaterial color="#3a3a3a" metalness={0.4} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
