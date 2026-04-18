/**
 * cityData.js
 * ---------------------------------------------------------
 * Generates the complete city layout: building metadata,
 * road segments, and block structure.
 *
 * The city is laid out as a grid of blocks separated by
 * roads. Each block contains 4-9 buildings arranged in a
 * mini-grid with realistic spacing.
 * ---------------------------------------------------------
 */

// ---- constants ----
export const ROAD_WIDTH = 14;
export const BLOCK_SIZE = 44;
export const GRID_COUNT = 5; // 5×5 blocks
export const SIDEWALK_WIDTH = 2.5;

// ---- building name parts ----
const PREFIXES = [
  'Grand', 'Metro', 'City', 'Urban', 'Park', 'Sky', 'Azure', 'Golden',
  'Silver', 'Crown', 'Vista', 'Apex', 'Summit', 'Harbor', 'Crystal',
  'Eclipse', 'Zenith', 'Atlas', 'Nova', 'Stellar', 'Pacific', 'Beacon',
  'Vertex', 'Prime', 'Cobalt', 'Ivory', 'Onyx', 'Pearl', 'Titan', 'Solaris',
];

const SUFFIXES = [
  'Tower', 'Plaza', 'Center', 'Heights', 'Place', 'Point', 'Square',
  'Hub', 'Loft', 'Haven', 'Residency', 'Complex', 'Chambers', 'Pavilion',
  'Spire', 'Pinnacle', 'Terrace', 'Court', 'Exchange', 'Works',
  'Quarter', 'Row', 'Hall', 'Atrium', 'Commons', 'Arch', 'Gate', 'Rise',
];

const TYPES = ['office', 'residential', 'modern', 'commercial'];

const BASE_COLORS = {
  office: ['#9a9a8a', '#8a8a82', '#a09888', '#908878', '#7a7a72', '#949488'],
  residential: ['#b8a88a', '#c8b898', '#a89878', '#d0c0a0', '#c0b090', '#b0a080'],
  modern: ['#607080', '#506070', '#708090', '#405060', '#556575', '#4a5a6a'],
  commercial: ['#a09080', '#908070', '#b0a090', '#887868', '#a89888', '#988878'],
};

// ---- heights by type (min, max) ----
const HEIGHT_RANGES = {
  office: [14, 50],
  residential: [10, 28],
  modern: [28, 72],
  commercial: [8, 22],
};

// ---- seeded PRNG ----
function prng(seed) {
  let s = Math.abs(Math.floor(seed)) || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ============================================================
//  Special block designations
//  block key "col,row" → landmark type
// ============================================================
const SPECIAL_BLOCKS = {
  '2,2': 'plaza',       // centre of grid → Central Plaza
  '0,4': 'garden',      // south-west → City Garden
  '4,0': 'mall',        // north-east → Metro Grand Mall
  '3,1': 'clocktower',  // Heritage Clock Tower
  '4,3': 'civic',       // City Museum
  '3,4': 'monument',    // Memorial Monument
};

const MAX_BUILDINGS = 50;

// ============================================================
//  generateCityData
// ============================================================

/**
 * Returns a deterministic city layout with ≤50 buildings,
 * three landmark blocks (plaza, garden, mall), and trees.
 *
 * @param {number} [seed=42] - PRNG seed for reproducibility
 * @param {Array} [apiBuildingsData=null] - Optional building data from API
 */
export function generateCityData(seed = 42, apiBuildingsData = null) {
  const rand = prng(seed);
  const buildings = [];
  const roads = [];
  const trees = [];
  const landmarks = [];
  
  // Filter API buildings by type for easier assignment
  let apiLandmarks = [];
  let apiRegularBuildings = [];
  
  if (apiBuildingsData && apiBuildingsData.length > 0) {
    apiLandmarks = apiBuildingsData.filter(b => b.id.startsWith('landmark-'));
    apiRegularBuildings = apiBuildingsData.filter(b => !b.id.startsWith('landmark-'));
  }
  
  let apiRegularIndex = 0; // Track which API regular building to use

  const totalSize = GRID_COUNT * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH;
  const offset = -totalSize / 2;

  // helper – block origin & centre from grid indices
  const blockOrigin = (bx, bz) => [
    offset + ROAD_WIDTH + bx * (BLOCK_SIZE + ROAD_WIDTH),
    offset + ROAD_WIDTH + bz * (BLOCK_SIZE + ROAD_WIDTH),
  ];
  const blockCenter = (bx, bz) => {
    const [ox, oz] = blockOrigin(bx, bz);
    return [ox + BLOCK_SIZE / 2, oz + BLOCK_SIZE / 2];
  };

  // ------ roads (unchanged) ------
  for (let i = 0; i <= GRID_COUNT; i++) {
    const pos = i * (BLOCK_SIZE + ROAD_WIDTH);
    roads.push({
      position: [offset + totalSize / 2, 0.02, offset + pos + ROAD_WIDTH / 2],
      size: [totalSize, ROAD_WIDTH],
      isHorizontal: true,
    });
    roads.push({
      position: [offset + pos + ROAD_WIDTH / 2, 0.02, offset + totalSize / 2],
      size: [ROAD_WIDTH, totalSize],
      isHorizontal: false,
    });
  }

  // ------ iterate blocks ------
  let bldgId = 0;

  for (let bx = 0; bx < GRID_COUNT; bx++) {
    for (let bz = 0; bz < GRID_COUNT; bz++) {
      const key = `${bx},${bz}`;
      const [blkX, blkZ] = blockOrigin(bx, bz);
      const [cx, cz] = blockCenter(bx, bz);
      const specialType = SPECIAL_BLOCKS[key];

      // ========== CENTRAL PLAZA ==========
      if (specialType === 'plaza') {
        // Try to find matching API landmark
        const apiLandmark = apiLandmarks.find(l => l.name.includes('Central'));
        landmarks.push({
          type: 'plaza',
          name: apiLandmark ? apiLandmark.name : 'Central Plaza',
          position: [cx, 0, cz],
          size: [BLOCK_SIZE - 4, BLOCK_SIZE - 4],
          id: apiLandmark ? apiLandmark.id : 'landmark-plaza',
          ...(apiLandmark && {
            vibrationFrequency: apiLandmark.vibrationFrequency,
            crackWidth: apiLandmark.crackWidth,
            buildingAge: apiLandmark.buildingAge,
            currentLoad: apiLandmark.currentLoad,
            energyConsumption: apiLandmark.energyConsumption,
            pgaAcceleration: apiLandmark.pgaAcceleration,
            waterLevel: apiLandmark.waterLevel,
            fireTemperature: apiLandmark.fireTemperature,
            epicenterDistance: apiLandmark.epicenterDistance,
            soilType: apiLandmark.soilType,
            crackGrowthRate: apiLandmark.crackGrowthRate,
            buildingTilt: apiLandmark.buildingTilt,
            riskScore: apiLandmark.riskScore,
            isOnline: apiLandmark.isOnline,
          })
        });
        // ring of trees
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r = BLOCK_SIZE / 2 - 5;
          trees.push({
            position: [cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r],
            scale: 0.8 + rand() * 0.4,
          });
        }
        continue;
      }

      // ========== CITY GARDEN ==========
      if (specialType === 'garden') {
        const apiLandmark = apiLandmarks.find(l => l.name.includes('Garden'));
        landmarks.push({
          type: 'garden',
          name: apiLandmark ? apiLandmark.name : 'Greenview City Garden',
          position: [cx, 0, cz],
          size: [BLOCK_SIZE - 4, BLOCK_SIZE - 4],
          id: apiLandmark ? apiLandmark.id : 'landmark-garden',
          ...(apiLandmark && {
            vibrationFrequency: apiLandmark.vibrationFrequency,
            crackWidth: apiLandmark.crackWidth,
            buildingAge: apiLandmark.buildingAge,
            currentLoad: apiLandmark.currentLoad,
            energyConsumption: apiLandmark.energyConsumption,
            pgaAcceleration: apiLandmark.pgaAcceleration,
            waterLevel: apiLandmark.waterLevel,
            fireTemperature: apiLandmark.fireTemperature,
            epicenterDistance: apiLandmark.epicenterDistance,
            soilType: apiLandmark.soilType,
            crackGrowthRate: apiLandmark.crackGrowthRate,
            buildingTilt: apiLandmark.buildingTilt,
            riskScore: apiLandmark.riskScore,
            isOnline: apiLandmark.isOnline,
          })
        });
        // dense trees
        for (let i = 0; i < 14; i++) {
          trees.push({
            position: [
              cx + (rand() - 0.5) * (BLOCK_SIZE - 10),
              0,
              cz + (rand() - 0.5) * (BLOCK_SIZE - 10),
            ],
            scale: 0.65 + rand() * 0.6,
          });
        }
        continue;
      }

      // ========== SHOPPING MALL ==========
      if (specialType === 'mall') {
        const apiLandmark = apiLandmarks.find(l => l.name.includes('Mall'));
        const mallId = apiLandmark ? apiLandmark.id : 'mall-0';
        buildings.push({
          id: mallId,
          name: apiLandmark ? apiLandmark.name : 'Metro Grand Mall',
          type: 'commercial',
          color: '#b8a898',
          height: 15,
          width: BLOCK_SIZE - 8,
          depth: BLOCK_SIZE - 8,
          position: [cx, 7.5, cz],
          blockIndex: [bx, bz],
          floors: 4,
          route: `/building/${mallId}`,
          seed: rand(),
          isMall: true,
          ...(apiLandmark && {
            vibrationFrequency: apiLandmark.vibrationFrequency,
            crackWidth: apiLandmark.crackWidth,
            buildingAge: apiLandmark.buildingAge,
            currentLoad: apiLandmark.currentLoad,
            energyConsumption: apiLandmark.energyConsumption,
            pgaAcceleration: apiLandmark.pgaAcceleration,
            waterLevel: apiLandmark.waterLevel,
            fireTemperature: apiLandmark.fireTemperature,
            epicenterDistance: apiLandmark.epicenterDistance,
            soilType: apiLandmark.soilType,
            crackGrowthRate: apiLandmark.crackGrowthRate,
            buildingTilt: apiLandmark.buildingTilt,
            riskScore: apiLandmark.riskScore,
            isOnline: apiLandmark.isOnline,
          })
        });
        // trees at mall corners
        const hs = BLOCK_SIZE / 2 - 2;
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
          trees.push({ position: [cx + sx * hs, 0, cz + sz * hs], scale: 0.85 });
        });
        continue;
      }

      // ========== CLOCK TOWER ==========
      if (specialType === 'clocktower') {
        const apiLandmark = apiLandmarks.find(l => l.name.includes('Clock'));
        landmarks.push({
          type: 'clocktower',
          name: apiLandmark ? apiLandmark.name : 'Heritage Clock Tower',
          position: [cx, 0, cz],
          size: [BLOCK_SIZE - 4, BLOCK_SIZE - 4],
          id: apiLandmark ? apiLandmark.id : 'landmark-clock',
          ...(apiLandmark && {
            vibrationFrequency: apiLandmark.vibrationFrequency,
            crackWidth: apiLandmark.crackWidth,
            buildingAge: apiLandmark.buildingAge,
            currentLoad: apiLandmark.currentLoad,
            energyConsumption: apiLandmark.energyConsumption,
            pgaAcceleration: apiLandmark.pgaAcceleration,
            waterLevel: apiLandmark.waterLevel,
            fireTemperature: apiLandmark.fireTemperature,
            epicenterDistance: apiLandmark.epicenterDistance,
            soilType: apiLandmark.soilType,
            crackGrowthRate: apiLandmark.crackGrowthRate,
            buildingTilt: apiLandmark.buildingTilt,
            riskScore: apiLandmark.riskScore,
            isOnline: apiLandmark.isOnline,
          })
        });
        // surrounding trees
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const r = BLOCK_SIZE / 2 - 6;
          trees.push({ position: [cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r], scale: 0.7 + rand() * 0.3 });
        }
        continue;
      }

      // ========== CIVIC BUILDING ==========
      if (specialType === 'civic') {
        const apiLandmark = apiLandmarks.find(l => l.name.includes('Museum'));
        landmarks.push({
          type: 'civic',
          name: apiLandmark ? apiLandmark.name : 'City Museum',
          position: [cx, 0, cz],
          size: [BLOCK_SIZE - 4, BLOCK_SIZE - 4],
          id: apiLandmark ? apiLandmark.id : 'landmark-museum',
          ...(apiLandmark && {
            vibrationFrequency: apiLandmark.vibrationFrequency,
            crackWidth: apiLandmark.crackWidth,
            buildingAge: apiLandmark.buildingAge,
            currentLoad: apiLandmark.currentLoad,
            energyConsumption: apiLandmark.energyConsumption,
            pgaAcceleration: apiLandmark.pgaAcceleration,
            waterLevel: apiLandmark.waterLevel,
            fireTemperature: apiLandmark.fireTemperature,
            epicenterDistance: apiLandmark.epicenterDistance,
            soilType: apiLandmark.soilType,
            crackGrowthRate: apiLandmark.crackGrowthRate,
            buildingTilt: apiLandmark.buildingTilt,
            riskScore: apiLandmark.riskScore,
            isOnline: apiLandmark.isOnline,
          })
        });
        // trees flanking entrance
        for (const sx of [-1, 1]) {
          for (const sz of [-0.6, 0.6]) {
            trees.push({ position: [cx + sx * (BLOCK_SIZE / 2 - 4), 0, cz + sz * (BLOCK_SIZE / 2 - 6)], scale: 0.8 });
          }
        }
        continue;
      }

      // ========== MONUMENT ==========
      if (specialType === 'monument') {
        const apiLandmark = apiLandmarks.find(l => l.name.includes('Memorial'));
        landmarks.push({
          type: 'monument',
          name: apiLandmark ? apiLandmark.name : 'Founders Memorial',
          position: [cx, 0, cz],
          size: [BLOCK_SIZE - 4, BLOCK_SIZE - 4],
          id: apiLandmark ? apiLandmark.id : 'landmark-memorial',
          ...(apiLandmark && {
            vibrationFrequency: apiLandmark.vibrationFrequency,
            crackWidth: apiLandmark.crackWidth,
            buildingAge: apiLandmark.buildingAge,
            currentLoad: apiLandmark.currentLoad,
            energyConsumption: apiLandmark.energyConsumption,
            pgaAcceleration: apiLandmark.pgaAcceleration,
            waterLevel: apiLandmark.waterLevel,
            fireTemperature: apiLandmark.fireTemperature,
            epicenterDistance: apiLandmark.epicenterDistance,
            soilType: apiLandmark.soilType,
            crackGrowthRate: apiLandmark.crackGrowthRate,
            buildingTilt: apiLandmark.buildingTilt,
            riskScore: apiLandmark.riskScore,
            isOnline: apiLandmark.isOnline,
          })
        });
        // decorative trees
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          trees.push({ position: [cx + Math.cos(a) * 12, 0, cz + Math.sin(a) * 12], scale: 0.9 });
        }
        continue;
      }

      // ========== REGULAR BLOCK ==========
      if (buildings.length >= MAX_BUILDINGS) {
        const gc = 3 + Math.floor(rand() * 2);
        for (let g = 0; g < gc; g++) {
          trees.push({
            position: [blkX + 3 + rand() * (BLOCK_SIZE - 6), 0, blkZ + 3 + rand() * (BLOCK_SIZE - 6)],
            scale: 0.55 + rand() * 0.5,
          });
        }
        continue;
      }

      const avail = BLOCK_SIZE - SIDEWALK_WIDTH * 2;
      const cols = 2; // Back to 2x2 for better distribution
      const rows = 2;
      const gap = 2.0;
      const cellW = (avail - gap * (cols - 1)) / cols;
      const cellD = (avail - gap * (rows - 1)) / rows;

      const dominantType = TYPES[Math.floor(rand() * TYPES.length)];
      
      // Calculate buildings per block for even distribution
      const remainingBlocks = (GRID_COUNT * GRID_COUNT) - (bx * GRID_COUNT + bz); // approx blocks left
      const buildingsPerBlock = Math.max(2, Math.ceil((MAX_BUILDINGS - buildings.length) / remainingBlocks));
      let buildingsInThisBlock = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (buildings.length >= MAX_BUILDINGS) break;
          if (buildingsInThisBlock >= buildingsPerBlock) break; // Limit buildings per block
          
          // Low skip rate only for available slots
          if (rand() < 0.15) continue; // 15% skip

          const type = rand() < 0.7
            ? dominantType
            : TYPES[Math.floor(rand() * TYPES.length)];

          const colors = BASE_COLORS[type];
          const color = colors[Math.floor(rand() * colors.length)];

          // ---- determine shape & dimensions ----
          let shape, height, w, d;

          if (type === 'residential' && rand() < 0.35) {
            // Independent house (low, small, gable roof)
            shape = 'house';
            height = +(5 + rand() * 4).toFixed(1);
            w = +(cellW * (0.45 + rand() * 0.15)).toFixed(1);
            d = +(cellD * (0.45 + rand() * 0.15)).toFixed(1);
          } else {
            const [hMin, hMax] = HEIGHT_RANGES[type];
            height = +(hMin + rand() * (hMax - hMin)).toFixed(1);
            w = +(cellW * (0.70 + rand() * 0.25)).toFixed(1);
            d = +(cellD * (0.70 + rand() * 0.25)).toFixed(1);

            if (type === 'office') shape = 'tiered';
            else if (type === 'modern') shape = 'sleek';
            else shape = 'block';
          }

          const x = blkX + SIDEWALK_WIDTH + c * (cellW + gap) + cellW / 2;
          const z = blkZ + SIDEWALK_WIDTH + r * (cellD + gap) + cellD / 2;

          const thisId = `bldg-${bldgId++}`;
          
          // Get building data from API - MUST exist
          let buildingData = null;
          if (apiRegularBuildings && apiRegularIndex < apiRegularBuildings.length) {
            buildingData = apiRegularBuildings[apiRegularIndex++];
          }
          
          // Use ONLY API data - no local name generation
          if (!buildingData) {
            // Skip this building if no API data available
            continue;
          }

          const buildingObj = {
            id: buildingData.id,
            name: buildingData.name,
            type: buildingData.type,
            color,
            shape,
            height,
            width: w,
            depth: d,
            position: [x, height / 2, z],
            blockIndex: [bx, bz],
            floors: Math.max(1, Math.floor(height / 3.5)),
            route: `/building/${buildingData.id}`,
            seed: rand(),
            vibrationFrequency: buildingData.vibrationFrequency,
            crackWidth: buildingData.crackWidth,
            buildingAge: buildingData.buildingAge,
            currentLoad: buildingData.currentLoad,
            energyConsumption: buildingData.energyConsumption,
            pgaAcceleration: buildingData.pgaAcceleration,
            waterLevel: buildingData.waterLevel,
            fireTemperature: buildingData.fireTemperature,
            epicenterDistance: buildingData.epicenterDistance,
            soilType: buildingData.soilType,
            crackGrowthRate: buildingData.crackGrowthRate,
            buildingTilt: buildingData.buildingTilt,
            riskScore: buildingData.riskScore,
            isOnline: buildingData.isOnline,
          };
          
          buildings.push(buildingObj);
          buildingsInThisBlock++;
        }
        if (buildings.length >= MAX_BUILDINGS) break;
      }

      // 3-5 sidewalk trees per regular block (both sides)
      const nt = 3 + Math.floor(rand() * 3);
      for (let t = 0; t < nt; t++) {
        const side = t % 2 === 0;
        trees.push({
          position: [
            side
              ? blkX + SIDEWALK_WIDTH * 0.5
              : blkX + BLOCK_SIZE - SIDEWALK_WIDTH * 0.5,
            0,
            blkZ + 3 + rand() * (BLOCK_SIZE - 6),
          ],
          scale: 0.45 + rand() * 0.45,
        });
      }
    }
  }

  // ------ roadside trees (ONLY between intersections, never on roads) ------
  for (let i = 0; i <= GRID_COUNT; i++) {
    const roadCenter = offset + i * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH / 2;
    const edgeDist = ROAD_WIDTH / 2 + 2.0; // offset from road centre to grass strip

    // place trees only within each block segment (between cross-roads)
    for (let j = 0; j < GRID_COUNT; j++) {
      // segment start = end of cross-road j, segment end = start of cross-road j+1
      const segStart = offset + j * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH + 4;
      const segEnd = offset + (j + 1) * (BLOCK_SIZE + ROAD_WIDTH) - 4;
      if (segEnd <= segStart) continue;

      const count = 2 + Math.floor(rand() * 2); // 2-3 trees per segment
      for (let t = 0; t < count; t++) {
        const p = segStart + rand() * (segEnd - segStart);
        // both sides of this horizontal road
        trees.push({ position: [p, 0, roadCenter + edgeDist], scale: 0.4 + rand() * 0.35 });
        trees.push({ position: [p, 0, roadCenter - edgeDist], scale: 0.4 + rand() * 0.3 });
        // both sides of this vertical road
        trees.push({ position: [roadCenter + edgeDist, 0, p], scale: 0.4 + rand() * 0.35 });
        trees.push({ position: [roadCenter - edgeDist, 0, p], scale: 0.4 + rand() * 0.3 });
      }
    }
  }

  // ------ NPC vehicles on roads ------
  const vehicles = [];
  const vColors = ['#c0302a', '#2040a0', '#e8e8e8', '#252525', '#f0c020', '#4080a0', '#b04060', '#30a060'];
  const vTypes = ['sedan', 'suv', 'truck'];

  for (let i = 0; i <= GRID_COUNT; i++) {
    const roadCenter = offset + i * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH / 2;
    for (let j = 0; j < GRID_COUNT; j++) {
      const segStart = offset + j * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH + 8;
      const segEnd = offset + (j + 1) * (BLOCK_SIZE + ROAD_WIDTH) - 8;
      if (segEnd <= segStart) continue;

      const vc = Math.floor(rand() * 2); // 0-1 vehicles per segment
      for (let v = 0; v < vc; v++) {
        const p = segStart + rand() * (segEnd - segStart);
        const lane = (rand() < 0.5 ? 1 : -1) * (ROAD_WIDTH * 0.18);
        const col = vColors[Math.floor(rand() * vColors.length)];
        const vt = vTypes[Math.floor(rand() * vTypes.length)];
        // vehicle on horizontal road (faces along X → rotate ±90°)
        vehicles.push({
          position: [p, 0.35, roadCenter + lane],
          rotation: lane > 0 ? Math.PI / 2 : -Math.PI / 2,
          color: col,
          type: vt,
        });
        // vehicle on vertical road (faces along Z → 0 or 180°)
        const col2 = vColors[Math.floor(rand() * vColors.length)];
        const vt2 = vTypes[Math.floor(rand() * vTypes.length)];
        const lane2 = (rand() < 0.5 ? 1 : -1) * (ROAD_WIDTH * 0.18);
        vehicles.push({
          position: [roadCenter + lane2, 0.35, p],
          rotation: lane2 > 0 ? 0 : Math.PI,
          color: col2,
          type: vt2,
        });
      }
    }
  }

  // ------ mark tallest tiered building for helipad ------
  const tieredList = buildings.filter(b => b.shape === 'tiered');
  if (tieredList.length > 0) {
    const tallest = tieredList.reduce((a, b) => a.height > b.height ? a : b);
    tallest.hasHelipad = true;
  }

  return { buildings, roads, trees, landmarks, vehicles, citySize: totalSize, offset };
}

// ============================================================
//  Deterministic building detail generator (for details page)
// ============================================================

const ADDRESSES = [
  '101 Financial District', '250 Market Street', '480 Innovation Drive',
  '720 Commerce Avenue', '315 Tech Boulevard', '88 Central Plaza',
  '1200 Harbor View', '55 Meridian Way', '940 Skyline Road',
  '330 Liberty Walk', '670 Quantum Lane', '415 Summit Circle',
];

const DISTRICTS = [
  'Financial District', 'Downtown Core', 'Tech Quarter', 'Innovation Hub',
  'Commerce Park', 'Arts District', 'Harbor Front', 'Midtown',
  'University Quarter', 'Green Zone', 'Civic Center',
];

const COMPANIES = [
  'NexGen Solutions', 'Vertex Analytics', 'Cobalt Labs', 'Pinnacle Finance',
  'Azure Dynamics', 'Summit Legal Group', 'Stellar Design Co.',
  'Quantum Computing Inc.', 'TerraCore Energy', 'Orbit Technologies',
  'Meridian Consulting', 'Apex Ventures', 'Vanguard Capital',
  'CloudPeak Systems', 'Prism Marketing', 'Horizon Biotech',
  'Polaris Logistics', 'Zenith Architecture', 'Beacon Health',
  'Catalyst Partners', 'Irongate Security', 'Nova Robotics',
];

/**
 * Generate deterministic detail data for a building.
 * @param {object} building - building data from generateCityData
 * @returns {object} enriched details
 */
export function generateBuildingDetails(building) {
  if (!building) return null;

  const hash = building.id
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const rand = prng(hash);

  // tenants
  const tenantCount = Math.min(building.floors, 3 + Math.floor(rand() * 8));
  const tenants = [];
  const usedCompanies = new Set();
  for (let i = 0; i < tenantCount; i++) {
    let company;
    do {
      company = COMPANIES[Math.floor(rand() * COMPANIES.length)];
    } while (usedCompanies.has(company) && usedCompanies.size < COMPANIES.length);
    usedCompanies.add(company);
    tenants.push({
      name: company,
      floor: `Floor ${Math.floor(rand() * building.floors) + 1}`,
    });
  }

  return {
    address: ADDRESSES[hash % ADDRESSES.length],
    district: DISTRICTS[hash % DISTRICTS.length],
    yearBuilt: 1965 + Math.floor(rand() * 60),
    totalArea: `${Math.round(building.width * building.depth * building.floors * 0.82)} m²`,
    status: ['Fully Leased', 'Partially Vacant', 'Occupied', 'Under Renovation'][
      Math.floor(rand() * 4)
    ],
    energyRating: ['A+', 'A', 'B+', 'B'][Math.floor(rand() * 4)],
    occupancy: `${65 + Math.floor(rand() * 35)}%`,
    tenants,
    parkingSpaces: 20 + Math.floor(rand() * 180),
    elevators: Math.max(1, Math.floor(building.floors / 5)),
    lastRenovation: 2010 + Math.floor(rand() * 16),
  };
}
