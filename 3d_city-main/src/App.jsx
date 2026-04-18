/**
 * App.jsx
 * ---------------------------------------------------------
 * Root component defining the application routes.
 *
 *  /              → Home (3D city view)
 *  /building/:id  → BuildingDetails (info panel)
 * ---------------------------------------------------------
 */

import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BuildingDetails from './pages/BuildingDetails';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/building/:id" element={<BuildingDetails />} />
    </Routes>
  );
}
