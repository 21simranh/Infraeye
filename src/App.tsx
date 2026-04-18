import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import LaunchPage from './pages/LaunchPage';
import HomePage from './pages/HomePage';
import DataAnalysisPage from './pages/DataAnalysisPage';
import ThreeDViewPage from './pages/ThreeDViewPage';
import ARScannerPage from './pages/ARScannerPage';
import LoginPage from './pages/LoginPage';

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    // On initial page load or refresh, redirect to launch page first
    if (location.pathname !== '/') {
      window.location.href = '/';
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LaunchPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/data-analysis" element={<DataAnalysisPage />} />
      <Route path="/3d-view" element={<ThreeDViewPage />} />
      <Route path="/ar-scanner" element={<ARScannerPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
