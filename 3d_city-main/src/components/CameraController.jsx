/**
 * CameraController.jsx
 * ---------------------------------------------------------
 * Manages three camera modes with smooth animated transitions:
 *
 *  • Orbit  – OrbitControls (rotate / zoom / pan around city)
 *  • Top    – Bird's-eye GPS-style view with WASD panning
 *  • Street – First-person walk-through at eye level
 *
 * Movement input comes from two sources:
 *  1. Keyboard (WASD / arrows) – listened here
 *  2. Movement-pad buttons    – via the `moveRef` ref
 * ---------------------------------------------------------
 */

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// simple ease-in-out for transitions
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

export default function CameraController({ viewMode, citySize, moveRef }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef();

  // ---- keyboard state ----
  const keys = useRef(new Set());

  // ---- transition state ----
  const tProgress = useRef(1);            // 0 → 1 (1 = done)
  const fromPos = useRef(new THREE.Vector3());
  const toPos = useRef(new THREE.Vector3());
  const fromTarget = useRef(new THREE.Vector3());
  const toTarget = useRef(new THREE.Vector3());
  const curTarget = useRef(new THREE.Vector3(0, 0, 0));

  // street-view heading (yaw) and pitch angles (radians)
  const heading = useRef(-Math.PI / 2);
  const pitch = useRef(0);

  // mouse-drag look state
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const prevMode = useRef(viewMode);

  // ---- keyboard listeners ----
  useEffect(() => {
    const down = (e) => keys.current.add(e.key.toLowerCase());
    const up = (e) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // ---- mouse-drag look (street mode) ----
  useEffect(() => {
    const canvas = gl.domElement;
    const SENSITIVITY = 0.003;

    const onPointerDown = (e) => {
      if (viewMode !== 'street') return;
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!isDragging.current || viewMode !== 'street') return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      // horizontal drag → yaw (heading)
      heading.current += dx * SENSITIVITY;
      // vertical drag → pitch (clamped to ±70°)
      pitch.current = Math.max(
        -Math.PI / 2.6,
        Math.min(Math.PI / 2.6, pitch.current - dy * SENSITIVITY),
      );
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [viewMode, gl]);

  // ---- react to mode change → start transition ----
  useEffect(() => {
    // skip the very first render (camera starts in orbit pos set by Canvas)
    if (prevMode.current === viewMode && tProgress.current >= 1) return;
    prevMode.current = viewMode;

    fromPos.current.copy(camera.position);
    fromTarget.current.copy(curTarget.current);
    tProgress.current = 0;

    const half = citySize / 2;

    switch (viewMode) {
      case 'orbit':
        toPos.current.set(half * 0.85, half * 0.7, half * 0.85);
        toTarget.current.set(0, 0, 0);
        break;
      case 'top':
        toPos.current.set(0, half * 1.5, half * 0.35);
        toTarget.current.set(0, 0, -15);
        break;
      case 'street': {
        // place camera on a road (center of grid, z axis)
        const roadX = 7;              // roughly first vertical road
        const startZ = half * 0.4;
        toPos.current.set(roadX, 2.2, startZ);
        toTarget.current.set(roadX, 2.2, startZ - 15);
        heading.current = -Math.PI / 2;
        pitch.current = 0; // reset vertical look
        break;
      }
      default:
        break;
    }
  }, [viewMode, citySize, camera]);

  // ============================================================
  //  Per-frame update
  // ============================================================
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const pad = moveRef?.current;  // current pad direction (or null)

    // ---- animated transition ----
    if (tProgress.current < 1) {
      tProgress.current = Math.min(1, tProgress.current + dt * 2.2);
      const t = smoothstep(tProgress.current);

      camera.position.lerpVectors(fromPos.current, toPos.current, t);
      curTarget.current.lerpVectors(fromTarget.current, toTarget.current, t);
      camera.lookAt(curTarget.current);

      // keep orbit controls in sync
      if (controlsRef.current) {
        controlsRef.current.target.copy(curTarget.current);
        controlsRef.current.update();
      }
      return; // skip mode logic during transition
    }

    // ---- mode-specific controls ----
    if (viewMode === 'street') {
      const speed = 24 * dt;
      const turnSpeed = 1.8 * dt;

      // turning (arrows / pad) — fixed direction
      if (k.has('arrowleft') || pad === 'turnLeft') heading.current -= turnSpeed;
      if (k.has('arrowright') || pad === 'turnRight') heading.current += turnSpeed;

      // movement
      let dx = 0, dz = 0;
      const fwd = k.has('w') || k.has('arrowup') || pad === 'forward';
      const bwd = k.has('s') || k.has('arrowdown') || pad === 'backward';
      const sLeft = k.has('a') || pad === 'left';
      const sRight = k.has('d') || pad === 'right';

      if (fwd) {
        dx += Math.sin(heading.current) * speed;
        dz -= Math.cos(heading.current) * speed;
      }
      if (bwd) {
        dx -= Math.sin(heading.current) * speed;
        dz += Math.cos(heading.current) * speed;
      }
      if (sLeft) {
        dx -= Math.cos(heading.current) * speed;
        dz -= Math.sin(heading.current) * speed;
      }
      if (sRight) {
        dx += Math.cos(heading.current) * speed;
        dz += Math.sin(heading.current) * speed;
      }

      camera.position.x += dx;
      camera.position.z += dz;
      camera.position.y = 2.2;

      // look direction with pitch (vertical) and heading (horizontal)
      const hDist = 12 * Math.cos(pitch.current);
      const lookX = camera.position.x + Math.sin(heading.current) * hDist;
      const lookY = camera.position.y + Math.sin(pitch.current) * 12;
      const lookZ = camera.position.z - Math.cos(heading.current) * hDist;
      curTarget.current.set(lookX, lookY, lookZ);
      camera.lookAt(curTarget.current);
    }

    if (viewMode === 'top') {
      const speed = 45 * dt;

      let dx = 0, dz = 0;
      if (k.has('w') || k.has('arrowup') || pad === 'forward') dz -= speed;
      if (k.has('s') || k.has('arrowdown') || pad === 'backward') dz += speed;
      if (k.has('a') || k.has('arrowleft') || pad === 'left') dx -= speed;
      if (k.has('d') || k.has('arrowright') || pad === 'right') dx += speed;

      camera.position.x += dx;
      camera.position.z += dz;

      curTarget.current.set(camera.position.x, 0, camera.position.z - 15);
      camera.lookAt(curTarget.current);
    }

    // keep orbit controls updated when active
    if (viewMode === 'orbit' && controlsRef.current) {
      controlsRef.current.update();
    }
  });

  // ---- render OrbitControls only in orbit mode after transition ----
  if (viewMode === 'orbit' && tProgress.current >= 1) {
    return (
      <OrbitControls
        ref={controlsRef}
        args={[camera, gl.domElement]}
        enableDamping
        dampingFactor={0.06}
        enablePan
        panSpeed={1.2}
        screenSpacePanning={false}
        minDistance={10}
        maxDistance={450}
        maxPolarAngle={Math.PI / 2.08}
        target={curTarget.current}
      />
    );
  }

  return null;
}
