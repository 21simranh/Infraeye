/**
 * textureGenerator.js
 * ---------------------------------------------------------
 * Procedural texture generation for buildings, roads, roofs,
 * sidewalks, and the ground plane.
 *
 * Every texture is created with Canvas2D, then wrapped in a
 * THREE.CanvasTexture. A simple in-memory cache prevents
 * duplicate textures from being generated.
 * ---------------------------------------------------------
 */

import * as THREE from 'three';

// ---------- cache ----------
const cache = new Map();

function cached(key, factory) {
  if (cache.has(key)) return cache.get(key);
  const tex = factory();
  cache.set(key, tex);
  return tex;
}

// ---------- seeded PRNG ----------
function prng(seed) {
  let s = Math.abs(Math.floor(seed * 2147483647)) || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------- color helpers ----------
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function darken([r, g, b], amt = 0.15) {
  return [
    Math.max(0, Math.floor(r * (1 - amt))),
    Math.max(0, Math.floor(g * (1 - amt))),
    Math.max(0, Math.floor(b * (1 - amt))),
  ];
}

// ============================================================
//  Building Facade
// ============================================================

/**
 * Creates a procedural building facade texture.
 *
 * @param {object} opts
 * @param {'office'|'residential'|'modern'|'commercial'} opts.type
 * @param {string}  opts.baseColor   - hex base wall color
 * @param {number}  opts.windowRows  - rows of windows
 * @param {number}  opts.windowCols  - columns of windows
 * @param {number}  opts.litProbability - 0-1 chance window is lit
 * @param {number}  opts.seed        - PRNG seed
 * @returns {THREE.CanvasTexture}
 */
export function createBuildingTexture(opts = {}) {
  const {
    type = 'office',
    baseColor = '#8a8a8a',
    windowRows = 10,
    windowCols = 5,
    litProbability = 0.3,
    seed = 0.5,
  } = opts;

  const W = 256;
  const H = 512;
  const key = `bld-${type}-${baseColor}-${windowRows}-${windowCols}-${seed.toFixed(4)}`;

  return cached(key, () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    const rand = prng(seed * 1000 + windowRows);

    // ---- base wall ----
    const base = hexToRgb(baseColor);
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, W, H);

    // subtle wall noise
    for (let i = 0; i < 600; i++) {
      const nx = rand() * W;
      const ny = rand() * H;
      const v = (rand() - 0.5) * 30;
      const rgb = base.map((ch) => Math.min(255, Math.max(0, ch + v)));
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.35)`;
      ctx.fillRect(nx, ny, 2 + rand() * 2, 2 + rand() * 2);
    }

    if (type === 'modern') {
      drawModernFacade(ctx, W, H, rand, windowRows + 4, windowCols + 2);
    } else if (type === 'commercial') {
      drawCommercialFacade(ctx, W, H, rand, windowRows, windowCols, litProbability);
    } else {
      // office / residential
      drawStandardFacade(ctx, W, H, rand, windowRows, windowCols, litProbability, type);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  });
}

/* ---- standard office / residential facade ---- */
function drawStandardFacade(ctx, W, H, rand, rows, cols, litP, type) {
  const cellW = W / cols;
  const cellH = H / rows;
  const winW = cellW * (type === 'residential' ? 0.45 : 0.55);
  const winH = cellH * (type === 'residential' ? 0.5 : 0.6);

  // floor separators
  for (let r = 1; r < rows; r++) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, r * cellH - 1, W, 2);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isGroundFloor = r === rows - 1;
      const x = c * cellW + (cellW - winW) / 2;
      const y = r * cellH + (cellH - winH) / 2;

      // frame
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(x - 1.5, y - 1.5, winW + 3, winH + 3);

      if (isGroundFloor) {
        // storefront / entrance
        ctx.fillStyle = '#1a120a';
        ctx.fillRect(x, y, winW, winH);
        ctx.fillStyle = 'rgba(240, 200, 120, 0.12)';
        ctx.fillRect(x + 2, y + 2, winW - 4, winH - 4);
      } else {
        const lit = rand() < litP;
        if (lit) {
          const warm = rand();
          ctx.fillStyle = warm > 0.4 ? '#ffe4b5' : '#ffd580';
          ctx.globalAlpha = 0.65 + rand() * 0.35;
        } else {
          ctx.fillStyle = '#162030';
          ctx.globalAlpha = 0.8 + rand() * 0.2;
        }
        ctx.fillRect(x, y, winW, winH);
        ctx.globalAlpha = 1;

        // reflection highlight on dark windows
        if (!lit) {
          ctx.fillStyle = 'rgba(120,170,220,0.12)';
          ctx.fillRect(x + 1, y + 1, winW * 0.35, winH * 0.25);
        }

        // window cross bar for residential
        if (type === 'residential' && rand() > 0.3) {
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(x + winW / 2 - 0.5, y, 1, winH);
        }
      }
    }
  }

  // ground floor band
  const gy = (rows - 1) * cellH;
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, gy - 3, W, 3);
}

/* ---- modern glass facade ---- */
function drawModernFacade(ctx, W, H, rand, rows, cols) {
  const cellW = W / cols;
  const cellH = H / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW;
      const y = r * cellH;

      // mullion (metal frame)
      ctx.fillStyle = '#2a2e36';
      ctx.fillRect(x, y, cellW, 2);
      ctx.fillRect(x, y, 2, cellH);

      // glass pane
      const tint = 0.4 + rand() * 0.35;
      ctx.fillStyle = `rgba(65, 130, 195, ${tint})`;
      ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

      // sky reflection
      ctx.fillStyle = `rgba(180, 220, 255, ${rand() * 0.18})`;
      ctx.fillRect(x + 2, y + 2, (cellW - 4) * 0.55, (cellH - 4) * 0.35);
    }
  }
}

/* ---- commercial mixed facade ---- */
function drawCommercialFacade(ctx, W, H, rand, rows, cols, litP) {
  const cellW = W / cols;
  const cellH = H / rows;

  for (let r = 0; r < rows; r++) {
    const isSignage = r === rows - 2;
    for (let c = 0; c < cols; c++) {
      const x = c * cellW + 5;
      const y = r * cellH + 4;
      const w = cellW - 10;
      const h = cellH - 8;

      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

      if (isSignage) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = `rgba(${100 + rand() * 155}, ${100 + rand() * 155}, ${80 + rand() * 100}, 0.15)`;
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
      } else {
        const lit = rand() < litP;
        ctx.fillStyle = lit ? '#ffe4b5' : '#1a2a3f';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = 1;
      }
    }
  }
}

// ============================================================
//  Roof Texture
// ============================================================
export function createRoofTexture() {
  return cached('roof', () => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');

    // flat roof surface
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(0, 0, 128, 128);

    // gravel noise
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const v = 60 + Math.random() * 30;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // AC units
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(20 + i * 50, 30, 28, 20);
      ctx.fillStyle = '#666';
      ctx.fillRect(22 + i * 50, 32, 24, 16);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.strokeRect(20 + i * 50, 30, 28, 20);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

// ============================================================
//  Road Texture
// ============================================================

/**
 * @param {boolean} isHorizontal  controls dashed-line orientation
 */
export function createRoadTexture(isHorizontal = true) {
  const key = `road-${isHorizontal}`;
  return cached(key, () => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d');

    // asphalt base
    ctx.fillStyle = '#262626';
    ctx.fillRect(0, 0, S, S);

    // asphalt grain
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * S;
      const y = Math.random() * S;
      const v = 30 + Math.random() * 18;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // center dashed line (yellow)
    ctx.fillStyle = '#c8a832';
    for (let i = 0; i < S; i += 44) {
      if (isHorizontal) {
        ctx.fillRect(i, S / 2 - 2, 28, 4);
      } else {
        ctx.fillRect(S / 2 - 2, i, 4, 28);
      }
    }

    // edge lines (white, subtle)
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    if (isHorizontal) {
      ctx.fillRect(0, 18, S, 2);
      ctx.fillRect(0, S - 20, S, 2);
    } else {
      ctx.fillRect(18, 0, 2, S);
      ctx.fillRect(S - 20, 0, 2, S);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

// ============================================================
//  Sidewalk Texture
// ============================================================
export function createSidewalkTexture() {
  return cached('sidewalk', () => {
    const S = 128;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#7a7a72';
    ctx.fillRect(0, 0, S, S);

    // tile grid
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= S; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, S);
      ctx.stroke();
    }
    for (let y = 0; y <= S; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(S, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

// ============================================================
//  Ground Plane Texture
// ============================================================
export function createGroundTexture() {
  return cached('ground', () => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#3a4a32';
    ctx.fillRect(0, 0, S, S);

    for (let i = 0; i < 500; i++) {
      const x = Math.random() * S;
      const y = Math.random() * S;
      const v = Math.random() * 20;
      ctx.fillStyle = `rgba(${50 + v},${65 + v},${40 + v},0.4)`;
      ctx.fillRect(x, y, 3, 3);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}
