/**
 * BuildingDetails.jsx
 * ---------------------------------------------------------
 * Detail page for a single building.
 * Reached via /building/:id after clicking a building in the
 * 3D city view.
 *
 * Building data arrives through React Router location.state
 * (passed during navigation). Extra detail (address, tenants,
 * energy rating, etc.) is generated deterministically from the
 * building's ID via generateBuildingDetails().
 * ---------------------------------------------------------
 */

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMemo, useState, useEffect, useRef } from 'react';
import { generateBuildingDetails } from '../utils/cityData';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Building from '../components/Building';
import ARButton from '../components/ARButton';

const BUILDINGS_STORAGE_KEY = 'infraeye_buildings_data';

export default function BuildingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [buildingMetrics, setBuildingMetrics] = useState(null);
  
  // Refs for AR support
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);

  // building data from navigation state
  const building = location.state;

  // Initialize metrics from building data passed from 3D view
  useEffect(() => {
    if (building) {
      console.log('Initializing metrics from building data:', building);
      setBuildingMetrics(building);
    }
  }, [building?.id]);

  // Load and sync metrics from localStorage on mount and listen for changes
  useEffect(() => {
    const loadMetrics = () => {
      try {
        const stored = localStorage.getItem(BUILDINGS_STORAGE_KEY);
        if (stored) {
          const buildings = JSON.parse(stored);
          const metrics = buildings.find(b => b.id === id);
          if (metrics) {
            console.log('Loaded updated metrics from localStorage:', metrics);
            setBuildingMetrics(metrics);
          }
        }
      } catch (error) {
        console.error('Failed to load building metrics:', error);
      }
    };

    // Load on mount
    loadMetrics();

    // Listen for storage changes from other tabs/windows (Data Analysis page)
    const handleStorageChange = (event) => {
      if (event.key === BUILDINGS_STORAGE_KEY) {
        console.log('Storage changed event detected');
        loadMetrics();
      }
    };

    // Also use a custom event for same-window communication
    const handleCustomStorageUpdate = () => {
      console.log('Custom storage update event received');
      loadMetrics();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('infraeyeBuildingsUpdated', handleCustomStorageUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('infraeyeBuildingsUpdated', handleCustomStorageUpdate);
    };
  }, [id]);

  // Generate QR code for AR view
  useEffect(() => {
    const generateQRCode = async () => {
      // Load QR code library dynamically
      if (window.QRCode) {
        // Clear previous QR code
        const container = document.getElementById('qr-code-display');
        if (container) {
          container.innerHTML = '';
          
          // Generate AR view URL
          const arUrl = `${window.location.origin}/ar-view.html?id=${id}`;
          
          // Create QR code
          try {
            new window.QRCode(container, {
              text: arUrl,
              width: 180,
              height: 180,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: window.QRCode.CorrectLevel.H,
            });
            console.log('QR Code generated for AR view:', arUrl);
          } catch (error) {
            console.error('Failed to generate QR code:', error);
            container.innerHTML = '<p style="color: #f87171;">QR Code generation failed</p>';
          }
        }
      }
    };

    // Load QR code library if not already loaded
    if (!window.QRCode) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      script.async = true;
      script.onload = () => {
        console.log('QR Code library loaded');
        generateQRCode();
      };
      script.onerror = () => {
        console.error('Failed to load QR code library');
        const container = document.getElementById('qr-code-display');
        if (container) {
          container.innerHTML = '<p style="color: #f87171;">⚠ QR Library unavailable</p>';
        }
      };
      document.head.appendChild(script);
    } else {
      generateQRCode();
    }
  }, [id]);

  // deterministic extra details
  const details = useMemo(
    () => (building ? generateBuildingDetails(building) : null),
    [building],
  );

  // ---- fallback if user navigates directly to URL ----
  if (!building) {
    return (
      <div className="building-details-page">
        <div className="details-container">
          <button className="back-btn" onClick={() => navigate('/')}>
            <span className="arrow">←</span> Back to City
          </button>
          <div className="detail-section" style={{ textAlign: 'center', padding: '60px 28px' }}>
            <h2 style={{ marginBottom: 16 }}>BUILDING NOT FOUND</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Building <strong style={{ color: 'var(--color-accent)' }}>{id}</strong> was
              not found. Navigate from the 3D city view to see building details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const ratingClass = details?.energyRating?.startsWith('A') ? 'rating-a' : 'rating-b';
  const [xrayMode, setXrayMode] = useState(false);

  // Normalize position to render the building at origin (0,0,0) in the detailed view
  const localBuildingData = useMemo(() => {
    if (!building) return null;
    return { ...building, position: [0, 0, 0] };
  }, [building]);

  return (
    <div className="building-details-page">
      <div className="details-container">
        {/* ---- Back button ---- */}
        <button className="back-btn" onClick={() => navigate('/')}>
          <span className="arrow">←</span> Back to City
        </button>

        {/* ---- Header ---- */}
        <div className="building-header animate-in">
          <span className="building-type-badge">{building.type}</span>
          <h1>{building.name}</h1>
          <p className="building-id">ID: {building.id}</p>
        </div>

        {/* ---- Sensor Metrics from Data Analysis ---- */}
        {(buildingMetrics || building) && (
          <div className="detail-section metric-section animate-in">
            <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-accent)' }}>📊 SENSOR METRICS FROM DATA ANALYSIS</h3>
            
            {buildingMetrics ? (
              <>
                {/* Risk Score Card */}
                <div style={{ backgroundColor: 'rgba(79, 39, 245, 0.2)', border: '1px solid rgba(143, 245, 255, 0.3)', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Overall Risk Score</span>
                    <p style={{ color: buildingMetrics.riskScore > 70 ? '#f87171' : buildingMetrics.riskScore > 40 ? '#fbbf24' : '#34d399', fontWeight: 'bold', fontSize: '1.5rem', margin: '0' }}>
                      {buildingMetrics.riskScore.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Core Metrics (Group 1) */}
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-accent)', marginBottom: '8px', fontWeight: 'bold' }}>▸ CORE INDICATORS</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                    <MetricBox label="Vibration Frequency" value={buildingMetrics.vibrationFrequency?.toFixed(2) || 'N/A'} unit="Hz" />
                    <MetricBox label="Crack Width" value={buildingMetrics.crackWidth?.toFixed(2) || 'N/A'} unit="mm" />
                    <MetricBox label="Building Age" value={buildingMetrics.buildingAge ? Math.floor(buildingMetrics.buildingAge) : 'N/A'} unit="years" />
                    <MetricBox label="Current Load" value={buildingMetrics.currentLoad?.toFixed(1) || 'N/A'} unit="%" />
                    <MetricBox label="Energy Consumption" value={buildingMetrics.energyConsumption?.toFixed(0) || 'N/A'} unit="kWh" />
                  </div>
                </div>

                {/* Disaster Metrics (Group 2) */}
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-accent)', marginBottom: '8px', fontWeight: 'bold' }}>⚠️ DISASTER-SPECIFIC INDICATORS</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                    <MetricBox label="PGA Acceleration" value={buildingMetrics.pgaAcceleration?.toFixed(3) || 'N/A'} unit="g" />
                    <MetricBox label="Water Level / Submersion" value={buildingMetrics.waterLevel?.toFixed(1) || 'N/A'} unit="hours" />
                    <MetricBox label="Fire Temperature" value={buildingMetrics.fireTemperature?.toFixed(0) || 'N/A'} unit="°C" />
                    <MetricBox label="Distance from Epicenter" value={buildingMetrics.epicenterDistance === 999 ? 'N/A' : buildingMetrics.epicenterDistance?.toFixed(1) || 'N/A'} unit={buildingMetrics.epicenterDistance === 999 ? '' : 'km'} />
                    <MetricBox label="Soil Type" value={buildingMetrics.soilType || 'N/A'} unit="" />
                  </div>
                </div>

                {/* Advanced Metrics (Group 3) */}
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-accent)', marginBottom: '8px', fontWeight: 'bold' }}>🔬 ADVANCED PRECISION INDICATORS</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                    <MetricBox label="Crack Growth Rate" value={buildingMetrics.crackGrowthRate?.toFixed(3) || 'N/A'} unit="mm/day" />
                    <MetricBox label="Building Tilt" value={buildingMetrics.buildingTilt?.toFixed(2) || 'N/A'} unit="°" />
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                <p>Loading metrics... or input metrics in Data Analysis page to see them here.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* ---- 3D Viewer Panel ---- */}
      <div className="building-viewer">
        <div className="viewer-header">
          <h3>3D Closeup View</h3>
          <button 
            className={`xray-toggle ${xrayMode ? 'active' : ''}`}
            onClick={() => setXrayMode(!xrayMode)}
          >
            {xrayMode ? 'Standard View' : 'X-Ray Vision'}
          </button>
        </div>
        <div className="canvas-wrapper">
          <Canvas 
            camera={{ position: [building.width * 1.5, building.height, building.depth * 1.5], fov: 45 }}
            onCreated={({ scene, gl }) => {
              sceneRef.current = scene;
              rendererRef.current = gl;
            }}
          >
            <ambientLight intensity={xrayMode ? 0.3 : 1.5} />
            <directionalLight position={[10, 20, 10]} intensity={xrayMode ? 0.5 : 1.5} castShadow />
            {xrayMode ? (
              <XRayBuilding data={localBuildingData} />
            ) : (
              <Building data={localBuildingData} ref={modelRef} />
            )}
            <OrbitControls 
              enableDamping 
              dampingFactor={0.05} 
              autoRotate={!xrayMode} 
              autoRotateSpeed={1}
              minDistance={5}
              maxDistance={200}
              target={[0, 0, 0]}
            />
          </Canvas>
        </div>
      </div>

      {/* <!-- QR CODE SECTION START --> */}
      <div className="qr-code-section">
        <div className="qr-code-container">
          <h4>📱 Scan for AR View</h4>
          <div 
            id="qr-code-display" 
            style={{
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '180px',
              marginBottom: '10px'
            }}
          ></div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
            Open AR experience on mobile device
          </p>
          
          {/* Direct AR View Button */}
          <button
            onClick={() => {
              const arViewUrl = `/ar-view/index.html?id=${id}`;
              window.open(arViewUrl, '_blank');
            }}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '12px',
              backgroundColor: 'linear-gradient(135deg, #00deec, #0099cc)',
              background: 'linear-gradient(135deg, #00deec, #0099cc)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0, 222, 236, 0.3)'
            }}
            onHover={(e) => {
              e.target.style.boxShadow = '0 6px 16px rgba(0, 222, 236, 0.5)';
            }}
          >
            🚀 Open AR Experience
          </button>

          {/* WebXR AR Button (Optional - for devices that support immersive-ar) */}
          <div style={{ marginTop: '12px', borderTop: '1px solid rgba(143, 245, 255, 0.2)', paddingTop: '12px' }}>
            <ARButton 
              scene={sceneRef.current} 
              renderer={rendererRef.current} 
              model={modelRef.current}
            />
          </div>
        </div>
      </div>
      {/* <!-- QR CODE SECTION END --> */}
    </div>
  );
}

/* ---- Sub-components ---- */

function MetricBox({ label, value, unit }) {
  return (
    <div style={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: '1px solid rgba(143, 245, 255, 0.2)', borderRadius: '8px', padding: '8px' }}>
      <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>{label}</span>
      <p style={{ color: '#fff', fontWeight: 'bold', margin: '0', fontSize: '0.9rem' }}>
        {value} <span style={{ color: 'var(--color-secondary)', fontSize: '0.8rem' }}>{unit}</span>
      </p>
    </div>
  );
}

function XRayBuilding({ data }) {
  const { width: w, depth: d, height: h, floors } = data;
  
  const floorHeight = h / floors;
  const coreW = w * 0.2;
  const coreD = d * 0.2;

  // Generate some plumbing/hvac pipes
  const pipes = useMemo(() => {
    const p = [];
    // 4 vertical pipes
    const offsets = [
      [w * 0.3, d * 0.3], [-w * 0.3, d * 0.3],
      [w * 0.3, -d * 0.3], [-w * 0.3, -d * 0.3]
    ];
    
    offsets.forEach(([ox, oz], i) => {
      p.push({ pos: [ox, 0, oz], args: [0.15, 0.15, h, 8], color: '#00ffff' }); // Water
      p.push({ pos: [ox * 0.8, 0, oz * 0.8], args: [0.25, 0.25, h, 8], color: '#ff4400' }); // HVAC
    });
    
    // Horizontal floor connections
    for (let i = 1; i < floors; i++) {
       const fy = -h/2 + i * floorHeight;
       p.push({ pos: [0, fy, 0], args: [w * 0.8, 0.1, d * 0.8], type: 'plane', color: '#00aaff' });
    }
    
    return p;
  }, [w, d, h, floors, floorHeight]);

  return (
    <group>
      {/* Outer Wireframe Shell */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial color="#0044ff" wireframe transparent opacity={0.2} />
      </mesh>
      
      {/* Central Elevator/Service Core */}
      <mesh>
        <boxGeometry args={[coreW, h * 0.98, coreD]} />
        <meshStandardMaterial color="#44ff00" transparent opacity={0.15} emissive="#22aa00" emissiveIntensity={0.5} />
      </mesh>
      <mesh>
        <boxGeometry args={[coreW, h * 0.98, coreD]} />
        <meshBasicMaterial color="#44ff00" wireframe transparent opacity={0.4} />
      </mesh>

      {/* Pipes and Floor Grids */}
      {pipes.map((pipe, idx) => (
        <mesh key={idx} position={pipe.pos} rotation={pipe.type === 'plane' ? [-Math.PI/2, 0, 0] : [0, 0, 0]}>
          {pipe.type === 'plane' ? (
            <planeGeometry args={[pipe.args[0], pipe.args[2]]} />
          ) : (
             <cylinderGeometry args={pipe.args} />
          )}
          {pipe.type === 'plane' ? (
             <meshBasicMaterial color={pipe.color} wireframe transparent opacity={0.3} />
          ) : (
             <meshStandardMaterial color={pipe.color} emissive={pipe.color} emissiveIntensity={0.8} />
          )}
        </mesh>
      ))}
      
      {/* Foundation/Basement Connections */}
      <mesh position={[0, -h/2 - 2, 0]}>
        <boxGeometry args={[w * 0.6, 4, d * 0.6]} />
        <meshBasicMaterial color="#ff00aa" wireframe transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function InfoCard({ label, value, accent, colorClass, className = '' }) {
  let valClass = 'card-value';
  if (accent) valClass += ' accent';
  if (colorClass) valClass += ` ${colorClass}`;

  return (
    <div className={`info-card ${className}`}>
      <div className="card-label">{label}</div>
      <div className={valClass}>{value}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <span className="label">{label}</span>
      <span className="value">{typeof value === 'object' ? value : String(value)}</span>
    </div>
  );
}
