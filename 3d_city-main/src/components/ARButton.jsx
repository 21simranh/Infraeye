import { useEffect } from 'react';
import { useAR } from '../hooks/useAR';

/**
 * ARButton Component - WebXR AR viewer for Three.js objects
 * 
 * Usage in BuildingDetails.jsx:
 *   <ARButton scene={sceneRef.current} renderer={rendererRef.current} model={modelRef.current} />
 * 
 * Props:
 *   - scene: THREE.Scene reference
 *   - renderer: THREE.WebGLRenderer reference
 *   - model: THREE.Object3D reference (will be placed at surface on tap)
 */

export default function ARButton({ scene, renderer, model }) {
  const { isARSupported, isARActive, initAR, startAR, endAR } = useAR();

  // Initialize AR on mount and when dependencies change
  useEffect(() => {
    if (scene && renderer) {
      initAR(scene, renderer);
    }
  }, [scene, renderer]);

  // Prepare model for AR
  useEffect(() => {
    if (model) {
      // Mark this object as the AR target
      model.name = 'ar-building-model';
      model.visible = false;

      // Cleanup on unmount
      return () => {
        if (model) {
          model.visible = true; // Restore visibility
        }
      };
    }
  }, [model]);

  // Not supported fallback
  if (!isARSupported) {
    return (
      <div style={{
        padding: '12px',
        fontSize: '12px',
        color: '#888',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        AR not supported on this device
      </div>
    );
  }

  // Button styling
  const buttonStyle = {
    backgroundColor: '#4a90e2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    width: '100%'
  };

  const buttonHoverStyle = {
    ...buttonStyle,
    backgroundColor: '#357abd'
  };

  // Overlay styling
  const overlayStyle = {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 9999,
    pointerEvents: isARActive ? 'auto' : 'none',
    opacity: isARActive ? 1 : 0,
    transition: 'opacity 0.3s'
  };

  const instructionsStyle = {
    position: 'fixed',
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#0f0',
    padding: '16px 24px',
    borderRadius: '4px',
    fontSize: '14px',
    textAlign: 'center',
    fontFamily: 'monospace',
    zIndex: 10000,
    pointerEvents: 'none'
  };

  const exitButtonStyle = {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    zIndex: 10000
  };

  return (
    <>
      {/* AR Button */}
      <button
        onClick={startAR}
        style={buttonStyle}
        onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
        onMouseLeave={(e) => Object.assign(e.target.style, buttonStyle)}
        disabled={!isARSupported}
      >
        📱 View in AR
      </button>

      {/* AR Overlay (visible when AR session is active) */}
      <div id="ar-overlay" style={overlayStyle}>
        {/* Instructions */}
        <div style={instructionsStyle}>
          📍 Point at a flat surface, then tap to place
        </div>

        {/* Exit AR Button */}
        <button
          onClick={endAR}
          style={exitButtonStyle}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#cc0000';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#ff4444';
          }}
        >
          ✕ Exit AR
        </button>
      </div>
    </>
  );
}
