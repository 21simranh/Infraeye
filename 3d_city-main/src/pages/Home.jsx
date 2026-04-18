/**
 * Home.jsx
 * ---------------------------------------------------------
 * Main page containing the 3D city canvas and the UI overlay.
 *
 * Responsibilities:
 *  • Generates city data once (stored in a ref)
 *  • Manages view-mode state (orbit / top / street)
 *  • Bridges movement-pad input (DOM) ↔ camera controller (R3F)
 *  • Handles building click → navigates to detail page
 *  • Tracks hovered building for tooltip display
 * ---------------------------------------------------------
 */

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import Scene from '../components/Scene';
import UIOverlay from '../components/UIOverlay';
import { generateCityData } from '../utils/cityData';

export default function Home() {
  const navigate = useNavigate();

  // ---- state for API buildings ----
  const [apiBuildingsData, setApiBuildingsData] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);

  // ---- city data (generated once, deterministic) ----
  const cityData = useMemo(() => generateCityData(42, apiBuildingsData), [apiBuildingsData]);

  // ---- fetch buildings from API on component mount ----
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/city-buildings');
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setApiBuildingsData(data.buildings || []);
      } catch (error) {
        console.error('Failed to fetch buildings from API:', error);
        setApiBuildingsData([]); // Use empty array as fallback
      } finally {
        setApiLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  // ---- view mode ----
  const [viewMode, setViewMode] = useState('orbit');

  // ---- movement-pad direction (shared ref, no re-renders) ----
  const moveRef = useRef(null);

  // ---- hovered building tooltip state ----
  const [hoveredBuilding, setHoveredBuilding] = useState(null);
  const [mousePos, setMousePos] = useState(null);

  // ---- handlers ----
  const handleBuildingClick = useCallback(
    (building) => {
      // Save building ID to localStorage for cross-page synchronization
      try {
        localStorage.setItem('selected_building_id', building.id);
      } catch (error) {
        console.error('Failed to save building ID to localStorage:', error);
      }
      navigate(building.route, { state: building });
    },
    [navigate],
  );

  const handleBuildingHover = useCallback((building, event) => {
    setHoveredBuilding(building);
    if (event?.nativeEvent) {
      setMousePos({ x: event.nativeEvent.clientX, y: event.nativeEvent.clientY });
    }
  }, []);

  const handleBuildingUnhover = useCallback(() => {
    setHoveredBuilding(null);
    setMousePos(null);
  }, []);

  // track mouse for tooltip positioning
  const handlePointerMove = useCallback(
    (e) => {
      if (hoveredBuilding) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    },
    [hoveredBuilding],
  );

  return (
    <div className="home-container" onPointerMove={handlePointerMove}>
      {/* ---- Loading indicator ---- */}
      {apiLoading && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#0f0',
          padding: '12px 20px',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: 'monospace',
          zIndex: 10,
        }}>
          Loading buildings from API...
        </div>
      )}
      {/* ---- Three.js Canvas ---- */}
      <Canvas
        shadows
        camera={{
          position: [110, 85, 110],
          fov: 55,
          near: 0.1,
          far: 1200,
        }}
        gl={{ antialias: true }}
        dpr={[1, 1.5]}
      >
        <Scene
          viewMode={viewMode}
          cityData={cityData}
          moveRef={moveRef}
          onBuildingClick={handleBuildingClick}
          onBuildingHover={handleBuildingHover}
          onBuildingUnhover={handleBuildingUnhover}
        />
      </Canvas>

      {/* ---- HUD Overlay ---- */}
      <UIOverlay
        viewMode={viewMode}
        setViewMode={setViewMode}
        moveRef={moveRef}
        buildingCount={cityData.buildings.length}
        hoveredBuilding={hoveredBuilding}
        mousePos={mousePos}
      />
    </div>
  );
}
