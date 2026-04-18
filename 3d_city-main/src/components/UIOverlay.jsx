/**
 * UIOverlay.jsx
 * ---------------------------------------------------------
 * Heads-up display overlaying the 3D canvas.
 *
 *  • Title / branding (top-left)
 *  • Stats chips (top-right)
 *  • View-mode buttons (bottom-center)
 *  • Movement D-pad (bottom-right, shown in Top / Street)
 *  • Contextual hint (bottom-left)
 *  • Building hover tooltip
 * ---------------------------------------------------------
 */

import { useCallback } from 'react';

const MODES = [
  { key: 'orbit',  icon: '🛰️', label: 'Orbit' },
  { key: 'top',    icon: '🗺️', label: 'Top' },
  { key: 'street', icon: '🚶', label: 'Street' },
];

const HINTS = {
  orbit:  'Drag to rotate · Scroll to zoom · Click a building to explore',
  top:    'W A S D or pad to pan · Scroll to zoom · Click a building',
  street: 'W A S D to walk · ← → to turn · Click a building',
};

export default function UIOverlay({
  viewMode,
  setViewMode,
  moveRef,
  buildingCount = 0,
  hoveredBuilding = null,
  mousePos = null,
}) {
  // ---- movement-pad helpers ----
  const startMove = useCallback((dir) => {
    if (moveRef) moveRef.current = dir;
  }, [moveRef]);

  const stopMove = useCallback(() => {
    if (moveRef) moveRef.current = null;
  }, [moveRef]);

  // determine d-pad labels based on mode
  const isStreet = viewMode === 'street';
  const padLabels = {
    up: '▲',
    down: '▼',
    left: isStreet ? '◁' : '◀',
    right: isStreet ? '▷' : '▶',
  };
  const padDirs = {
    up: 'forward',
    down: 'backward',
    left: isStreet ? 'turnLeft' : 'left',
    right: isStreet ? 'turnRight' : 'right',
  };

  const showPad = viewMode === 'top' || viewMode === 'street';

  return (
    <div className="overlay">
      {/* ---- Title ---- */}
      <div className="overlay-title">
        <h1>InfraEye</h1>
        <p className="subtitle">Urban 3D Simulation</p>
      </div>

      {/* ---- Stats chips ---- */}
      <div className="overlay-stats">
        <div className="stat-chip">
          🏢 <span className="value">{buildingCount}</span> Buildings
        </div>
        <div className="stat-chip">
          📷 <span className="value" style={{ textTransform: 'capitalize' }}>{viewMode}</span>
        </div>
      </div>

      {/* ---- Mode buttons ---- */}
      <div className="overlay-controls">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`mode-btn ${viewMode === m.key ? 'active' : ''}`}
            onClick={() => setViewMode(m.key)}
          >
            <span className="icon">{m.icon}</span>
            <span className="label-text">{m.label}</span>
          </button>
        ))}
        
        {/* ---- AR Button ---- */}
        <button
          className="mode-btn ar-btn"
          onClick={() => {
            window.open('/ar-view/index.html', '_blank');
          }}
          title="Enter Augmented Reality view"
        >
          <span className="icon">📱</span>
          <span className="label-text">AR View</span>
        </button>
      </div>

      {/* ---- Movement D-pad ---- */}
      {showPad && (
        <div className="movement-pad">
          <div className="pad-row">
            <PadBtn
              label={padLabels.up}
              dir={padDirs.up}
              onStart={startMove}
              onStop={stopMove}
            />
          </div>
          <div className="pad-row">
            <PadBtn
              label={padLabels.left}
              dir={padDirs.left}
              onStart={startMove}
              onStop={stopMove}
            />
            <div className="pad-center">
              <div className="pad-center-dot" />
            </div>
            <PadBtn
              label={padLabels.right}
              dir={padDirs.right}
              onStart={startMove}
              onStop={stopMove}
            />
          </div>
          <div className="pad-row">
            <PadBtn
              label={padLabels.down}
              dir={padDirs.down}
              onStart={startMove}
              onStop={stopMove}
            />
          </div>
        </div>
      )}

      {/* ---- Hint ---- */}
      <div className="overlay-hint">{HINTS[viewMode]}</div>

      {/* ---- Building Tooltip ---- */}
      {hoveredBuilding && mousePos && (
        <div
          className="building-tooltip"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y - 8,
          }}
        >
          <div className="tooltip-name">{hoveredBuilding.name}</div>
          <div className="tooltip-type">{hoveredBuilding.type}</div>
        </div>
      )}
    </div>
  );
}

/* ---- Pad button sub-component ---- */
function PadBtn({ label, dir, onStart, onStop }) {
  return (
    <button
      className="pad-btn"
      onPointerDown={() => onStart(dir)}
      onPointerUp={onStop}
      onPointerLeave={onStop}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}
