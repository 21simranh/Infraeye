/**
 * Scene.jsx
 * ---------------------------------------------------------
 * Sets up the Three.js / R3F scene internals:
 *  • Lighting (ambient + directional + hemisphere)
 *  • Fog for atmospheric depth
 *  • Background sky colour
 *  • Tone-mapping configuration
 *  • CameraController
 *  • City
 * ---------------------------------------------------------
 */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import City from './City';
import CameraController from './CameraController';

export default function Scene({
  viewMode,
  cityData,
  moveRef,
  onBuildingClick,
  onBuildingHover,
  onBuildingUnhover,
}) {
  const { gl, scene } = useThree();

  // ---- renderer & scene setup (once) ----
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.15;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;

    scene.background = new THREE.Color('#b8d8e8');
    scene.fog = new THREE.Fog('#b8d8e8', 120, 450);
  }, [gl, scene]);

  return (
    <>
      {/* ---- Ambient / Sky bounce ---- */}
      <ambientLight intensity={0.45} color="#B0C4DE" />

      {/* ---- Hemisphere light (sky ↔ ground) ---- */}
      <hemisphereLight
        skyColor="#87CEEB"
        groundColor="#4a3a22"
        intensity={0.35}
      />

      {/* ---- Main sun ---- */}
      <directionalLight
        position={[130, 110, 70]}
        intensity={1.6}
        color="#FFF5E8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={550}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-bias={-0.0005}
      />

      {/* ---- Fill light (cool, opposite side) ---- */}
      <directionalLight
        position={[-70, 55, -50]}
        intensity={0.3}
        color="#B0C4FF"
      />

      {/* ---- Camera controller ---- */}
      <CameraController
        viewMode={viewMode}
        citySize={cityData.citySize}
        moveRef={moveRef}
      />

      {/* ---- City ---- */}
      <City
        cityData={cityData}
        onBuildingClick={onBuildingClick}
        onBuildingHover={onBuildingHover}
        onBuildingUnhover={onBuildingUnhover}
      />
    </>
  );
}
