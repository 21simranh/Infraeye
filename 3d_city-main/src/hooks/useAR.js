import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

/**
 * WebXR AR Hook for immersive-ar sessions
 * 
 * IMPORTANT: WebXR requires HTTPS for Android Chrome testing.
 * For local development on mobile, use:
 *   - ngrok: ngrok http 5177 → https://XXXX-XX-XX-XX-XXX.ngrok.io
 *   - Or deploy to a hosting service with HTTPS
 *   - iOS Safari uses native HTTP on localhost via hotspot
 * 
 * Usage:
 *   const { isARSupported, isARActive, initAR, startAR, endAR } = useAR();
 *   useEffect(() => { initAR(scene, renderer); }, [scene, renderer]);
 *   <button onClick={startAR}>Start AR</button>
 */

export function useAR() {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  
  // Persistent refs
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const sessionRef = useRef(null);
  const reticleRef = useRef(null);
  const hitTestSourceRef = useRef(null);
  const referenceSpaceRef = useRef(null);

  // Check AR support on mount
  useEffect(() => {
    async function checkARSupport() {
      if (!navigator.xr) {
        console.warn('WebXR not available on this device');
        setIsARSupported(false);
        return;
      }
      
      try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        setIsARSupported(supported);
      } catch (error) {
        console.warn('WebXR immersive-ar check failed:', error);
        setIsARSupported(false);
      }
    }
    
    checkARSupport();
  }, []);

  /**
   * Initialize AR with existing scene and renderer
   * @param {THREE.Scene} scene - Three.js scene
   * @param {THREE.WebGLRenderer} renderer - Three.js renderer
   */
  const initAR = (scene, renderer) => {
    if (!scene || !renderer) {
      console.error('Scene and renderer required for AR initialization');
      return;
    }
    
    sceneRef.current = scene;
    rendererRef.current = renderer;
    
    // Enable WebXR rendering
    renderer.xr.enabled = true;
  };

  /**
   * Start immersive-ar session
   */
  const startAR = async () => {
    if (!navigator.xr) {
      console.error('WebXR not supported');
      return;
    }

    if (!sceneRef.current || !rendererRef.current) {
      console.error('AR not initialized. Call initAR() first.');
      return;
    }

    try {
      // Request immersive-ar session
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
      });

      sessionRef.current = session;

      // Create reticle (ring mesh for surface detection feedback)
      const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32);
      const reticleMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.8
      });
      const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
      reticle.rotateX(-Math.PI / 2); // Lay flat on detected surface
      reticle.visible = false;
      sceneRef.current.add(reticle);
      reticleRef.current = reticle;

      // Get reference space (viewer-relative positioning)
      const referenceSpace = await session.requestReferenceSpace('viewer');
      referenceSpaceRef.current = referenceSpace;

      // Request hit test source (detects surfaces)
      const hitTestSource = await session.requestHitTestSource({
        space: referenceSpace
      });
      hitTestSourceRef.current = hitTestSource;

      setIsARActive(true);

      // Set up XR animation loop
      rendererRef.current.setAnimationLoop((time, frame) => {
        handleARFrame(frame, referenceSpace);
      });

      // Handle user selection (tap on screen)
      session.addEventListener('select', handleARSelect);

      // Handle session end
      session.addEventListener('end', handleSessionEnd);

    } catch (error) {
      console.error('Failed to start AR session:', error);
      console.error('WebXR requires HTTPS. Use ngrok or deploy to HTTPS server.');
      setIsARActive(false);
    }
  };

  /**
   * Handle AR frame updates (hit test and reticle positioning)
   */
  const handleARFrame = (frame, referenceSpace) => {
    const session = frame.session;
    const hitTestSource = hitTestSourceRef.current;
    const reticle = reticleRef.current;
    const scene = sceneRef.current;

    if (!hitTestSource || !reticle || !scene) return;

    // Get hit test results (surfaces detected by device)
    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(referenceSpace);

      if (pose) {
        // Position reticle at detected surface
        reticle.matrix.fromArray(pose.transform.matrix);
        reticle.visible = true;
      }
    } else {
      reticle.visible = false;
    }

    // Render the scene
    const pose = frame.getViewerPose(referenceSpace);
    if (pose) {
      const view = pose.views[0];
      rendererRef.current.render(scene, view.camera);
    }
  };

  /**
   * Handle user selection event (tap to place model)
   */
  const handleARSelect = () => {
    const scene = sceneRef.current;
    const reticle = reticleRef.current;

    if (!scene || !reticle) return;

    // Find model by name (set by ARButton component)
    const building = scene.getObjectByName('ar-building-model');

    if (building && reticle.visible) {
      // Snap building to reticle position
      building.matrix.copy(reticle.matrix);
      building.matrixAutoUpdate = false;
      building.visible = true;
    }
  };

  /**
   * Handle AR session end
   */
  const handleSessionEnd = () => {
    endAR();
  };

  /**
   * End immersive-ar session and cleanup
   */
  const endAR = () => {
    const session = sessionRef.current;
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const reticle = reticleRef.current;

    // Remove reticle from scene
    if (reticle && scene) {
      scene.remove(reticle);
      reticleRef.current = null;
    }

    // Stop render loop
    if (renderer) {
      renderer.setAnimationLoop(null);
      renderer.xr.enabled = false;
    }

    // End XR session
    if (session) {
      session.removeEventListener('select', handleARSelect);
      session.removeEventListener('end', handleSessionEnd);
      
      if (session.inputSources) {
        session.inputSources.forEach(source => {
          if (source.gamepad) {
            // Cleanup gamepad handling if needed
          }
        });
      }
      
      session.end().catch(() => {
        // Session may already be ended
      });
      sessionRef.current = null;
    }

    // Reset refs
    hitTestSourceRef.current = null;
    referenceSpaceRef.current = null;

    setIsARActive(false);
  };

  return {
    isARSupported,
    isARActive,
    initAR,
    startAR,
    endAR
  };
}

export default useAR;
