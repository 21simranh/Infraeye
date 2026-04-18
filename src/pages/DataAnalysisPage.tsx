import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { saveBuildingsToStorage } from '../utils/buildingUtils';

interface Building {
  id: string;
  name: string;
  type: string;
  vibrationFrequency: number; // Hz
  crackWidth: number; // mm
  buildingAge: number; // years
  currentLoad: number; // %
  energyConsumption: number; // kWh
  isOnline: boolean;
  riskScore: number;
  // Disaster-Specific (Group 2)
  pgaAcceleration: number; // g
  waterLevel: number; // hours
  fireTemperature: number; // °C
  epicenterDistance: number; // km
  soilType: 'Rock' | 'Dense Soil' | 'Loose Soil' | 'Clay/Soft Soil';
  // Advanced (Group 3)
  crackGrowthRate: number; // mm/day
  buildingTilt: number; // degrees
}

interface Toast {
  id: number;
  message: string;
}

const SAMPLE_BUILDINGS: Building[] = [
  {
    id: '1',
    name: 'Central Tower',
    type: 'Commercial',
    vibrationFrequency: 2.1,
    crackWidth: 0.8,
    buildingAge: 15,
    currentLoad: 65,
    energyConsumption: 4500,
    isOnline: true,
    riskScore: 35,
    pgaAcceleration: 0,
    waterLevel: 0,
    fireTemperature: 0,
    epicenterDistance: 999,
    soilType: 'Rock',
    crackGrowthRate: 0,
    buildingTilt: 0,
  },
  {
    id: '9',
    name: 'Metro Station',
    type: 'Commercial',
    vibrationFrequency: 3.5,
    crackWidth: 1.5,
    buildingAge: 42,
    currentLoad: 85,
    energyConsumption: 7500,
    isOnline: true,
    riskScore: 68,
    pgaAcceleration: 0,
    waterLevel: 0,
    fireTemperature: 0,
    epicenterDistance: 999,
    soilType: 'Dense Soil',
    crackGrowthRate: 0,
    buildingTilt: 0,
  },
  {
    id: '10',
    name: 'Tech Hub',
    type: 'Commercial',
    vibrationFrequency: 2.3,
    crackWidth: 0.7,
    buildingAge: 12,
    currentLoad: 62,
    energyConsumption: 4100,
    isOnline: true,
    riskScore: 32,
    pgaAcceleration: 0,
    waterLevel: 0,
    fireTemperature: 0,
    epicenterDistance: 999,
    soilType: 'Rock',
    crackGrowthRate: 0,
    buildingTilt: 0,
  },
];

const getSoilMultiplier = (soilType: Building['soilType']): number => {
  const multipliers: Record<Building['soilType'], number> = {
    'Rock': 1.0,
    'Dense Soil': 1.5,
    'Loose Soil': 2.5,
    'Clay/Soft Soil': 4.0,
  };
  return multipliers[soilType] || 1.0;
};

const calculateRiskScore = (building: Building): number => {
  // Normalize each metric to 0-1 based on critical threshold
  const vibrationRisk = Math.min(1, building.vibrationFrequency / 4.0);
  const crackRisk = Math.min(1, building.crackWidth / 2.5);
  const ageRisk = Math.min(1, building.buildingAge / 50);
  const loadRisk = Math.min(1, building.currentLoad / 100);
  const energyRisk = Math.min(1, building.energyConsumption / 8000);

  // Disaster metrics
  let pgaRisk = Math.min(1, building.pgaAcceleration / 0.3);
  const soilMultiplier = getSoilMultiplier(building.soilType);
  pgaRisk *= soilMultiplier; // Soil amplifies PGA
  pgaRisk = Math.min(1, pgaRisk); // Clamp to 1

  const waterRisk = building.waterLevel === 0 ? 0 : Math.min(1, building.waterLevel / 6);
  const fireRisk = building.fireTemperature === 0 ? 0 : Math.min(1, building.fireTemperature / 500);

  // Distance is inverted: closer = higher risk
  let distanceRisk = 0;
  if (building.epicenterDistance !== 999) {
    if (building.epicenterDistance < 50) {
      distanceRisk = Math.max(0, 1 - (building.epicenterDistance - 10) / 40);
    }
  }

  // Advanced metrics
  const crackGrowthRisk = Math.min(1, building.crackGrowthRate / 0.1);
  const tiltRisk = Math.min(1, building.buildingTilt / 0.5);

  // Weighted sum (total = 100%)
  const normalized =
    vibrationRisk * 0.25 +
    crackRisk * 0.2 +
    ageRisk * 0.15 +
    loadRisk * 0.15 +
    energyRisk * 0.1 +
    pgaRisk * 0.05 +
    waterRisk * 0.05 +
    fireRisk * 0.04 +
    distanceRisk * 0.03 +
    crackGrowthRisk * 0.01 +
    tiltRisk * 0.01;

  return Math.min(100, Math.max(0, normalized * 100));
};

const getStatusBadge = (metric: string, value: number | string): string => {
  const numValue = typeof value === 'number' ? value : 0;
  const strValue = typeof value === 'string' ? value : '';

  if (metric === 'vibration') {
    if (numValue < 2.5) return 'OK';
    if (numValue <= 4) return 'Monitor';
    return 'Critical';
  }
  if (metric === 'crack') {
    if (numValue < 1) return 'OK';
    if (numValue <= 2.5) return 'Monitor';
    return 'Critical';
  }
  if (metric === 'age') {
    if (numValue < 20) return 'OK';
    if (numValue <= 50) return 'Monitor';
    return 'Critical';
  }
  if (metric === 'load') {
    if (numValue < 70) return 'OK';
    if (numValue <= 90) return 'Monitor';
    return 'Critical';
  }
  if (metric === 'energy') {
    if (numValue < 5000) return 'OK';
    if (numValue <= 8000) return 'Monitor';
    return 'Critical';
  }
  if (metric === 'pga') {
    if (numValue < 0.1) return 'OK';
    if (numValue <= 0.3) return 'Monitor';
    return 'Critical';
  }
  if (metric === 'water') {
    if (numValue === 0) return 'OK';
    if (numValue <= 6) return 'Monitor';
    return 'Critical';
  }
  if (metric === 'fire') {
    if (numValue === 0) return 'OK';
    if (numValue <= 500) return 'Monitor';
    return 'Critical';
  }
  if (metric === 'distance') {
    if (numValue === 999) return 'OK'; // Not applicable
    if (numValue > 50) return 'OK';
    if (numValue >= 10) return 'Monitor';
    return 'Critical';
  }
  if (metric === 'soil') {
    const soilMap: Record<string, string> = {
      'Rock': 'OK',
      'Dense Soil': 'Monitor',
      'Loose Soil': 'Critical',
      'Clay/Soft Soil': 'Critical',
    };
    return soilMap[strValue] || 'OK';
  }
  if (metric === 'crackGrowth') {
    if (numValue === 0) return 'OK';
    if (numValue <= 0.1) return 'Monitor';
    return 'Critical';
  }
  if (metric === 'tilt') {
    if (numValue < 0.1) return 'OK';
    if (numValue <= 0.5) return 'Monitor';
    return 'Critical';
  }
  return 'OK';
};

const getRiskColor = (score: number): string => {
  if (score < 40) return 'text-green-400';
  if (score < 70) return 'text-yellow-400';
  return 'text-red-400';
};

const getRecommendation = (score: number): string => {
  if (score < 40)
    return 'Building is in good health. Continue routine monitoring.';
  if (score < 70)
    return 'Moderate structural stress detected. Schedule inspection within 30 days.';
  if (score < 85)
    return 'High risk detected. Immediate inspection required.';
  return 'Critical failure risk. Evacuate and engage emergency services.';
};

const DataAnalysisPage: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'input' | 'ops'>('overview');
  const [chaosActive, setChaosActive] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastId, setToastId] = useState(0);
  const [mentalFatigue, setMentalFatigue] = useState(0);
  const [editFormData, setEditFormData] = useState<Building | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ overview: string; recommendations: string[]; severity: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const chaosIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch buildings from API on mount
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/city-buildings');
        if (response.ok) {
          const data = await response.json();
          const buildingsList: Building[] = data.buildings.map((b: any) => ({
            id: b.id,
            name: b.name,
            type: b.type || 'office',
            vibrationFrequency: b.vibrationFrequency || 2.0,
            crackWidth: b.crackWidth || 0.5,
            buildingAge: b.buildingAge || 20,
            currentLoad: b.currentLoad || 60,
            energyConsumption: b.energyConsumption || 5000,
            isOnline: b.isOnline !== false,
            riskScore: b.riskScore || 45,
            pgaAcceleration: b.pgaAcceleration || 0,
            waterLevel: b.waterLevel || 0,
            fireTemperature: b.fireTemperature || 0,
            epicenterDistance: b.epicenterDistance || 999,
            soilType: b.soilType || 'Rock',
            crackGrowthRate: b.crackGrowthRate || 0,
            buildingTilt: b.buildingTilt || 0,
          }));
          setBuildings(buildingsList);
          if (buildingsList.length > 0) {
            setEditFormData(buildingsList[0]);
            fetchAiAnalysis(buildingsList[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch buildings:', error);
        // Fallback to sample data
        setBuildings(SAMPLE_BUILDINGS);
        setEditFormData(SAMPLE_BUILDINGS[0]);
        fetchAiAnalysis(SAMPLE_BUILDINGS[0]);
      } finally {
        setLoading(false);
      }
    };
    fetchBuildings();
  }, []);

  // Save buildings to localStorage whenever they change
  useEffect(() => {
    if (buildings.length > 0) {
      saveBuildingsToStorage(buildings);
    }
  }, [buildings]);

  // Listen for building selection from 3D view
  useEffect(() => {
    const handleStorageChange = () => {
      const selectedId = localStorage.getItem('selected_building_id');
      if (selectedId) {
        const index = buildings.findIndex(b => b.id === selectedId);
        if (index >= 0) {
          setSelectedIndex(index);
          fetchAiAnalysis(buildings[index]);
        }
      }
    };

    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on mount
    handleStorageChange();

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [buildings]);

  const selectedBuilding = buildings[selectedIndex];

  useEffect(() => {
    if (buildings.length > 0) {
      setEditFormData(buildings[selectedIndex]);
    }
  }, [selectedIndex, buildings]);

  // Chaos Monkey
  useEffect(() => {
    if (!chaosActive) {
      if (chaosIntervalRef.current) clearInterval(chaosIntervalRef.current);
      return;
    }

    chaosIntervalRef.current = setInterval(() => {
      setBuildings((prev) =>
        prev.map((b) => {
          const mutation = (val: number, range: number) => {
            const change = (Math.random() - 0.5) * 2 * range;
            return Math.max(0, val + change);
          };

          return {
            ...b,
            vibrationFrequency: mutation(b.vibrationFrequency, 0.5),
            crackWidth: mutation(b.crackWidth, 0.3),
            currentLoad: Math.min(100, mutation(b.currentLoad, 15)),
            energyConsumption: mutation(b.energyConsumption, 800),
            riskScore: calculateRiskScore({
              ...b,
              vibrationFrequency: mutation(b.vibrationFrequency, 0.5),
              crackWidth: mutation(b.crackWidth, 0.3),
              currentLoad: Math.min(100, mutation(b.currentLoad, 15)),
              energyConsumption: mutation(b.energyConsumption, 800),
            }),
          };
        })
      );
    }, 2000);

    return () => {
      if (chaosIntervalRef.current) clearInterval(chaosIntervalRef.current);
    };
  }, [chaosActive]);

  const addToast = (message: string) => {
    const id = toastId + 1;
    setToastId(id);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleRunDisasterAnalysis = () => {
    addToast(`Disaster analysis completed for ${buildings[selectedIndex].name}`);
  };

  const handleSaveChanges = () => {
    if (!editFormData) return;
    const newBuildings = [...buildings];
    const newBuild: Building = { 
      ...editFormData, 
      riskScore: calculateRiskScore(editFormData) 
    };
    newBuildings[selectedIndex] = newBuild;
    setBuildings(newBuildings);
    
    // Explicitly save to localStorage
    saveBuildingsToStorage(newBuildings);
    
    // Dispatch custom event to notify other components in same window
    window.dispatchEvent(new CustomEvent('infraeyeBuildingsUpdated', { 
      detail: { buildings: newBuildings, updatedBuilding: newBuild }
    }));
    
    console.log('Changes saved to localStorage:', newBuild);
    addToast('Changes saved successfully');
  };

  const handleIncidentAction = (action: string) => {
    const newFatigue = Math.min(100, mentalFatigue + 10);
    setMentalFatigue(newFatigue);

    if (action === 'investigate') {
      addToast(`Investigation started for ${buildings[selectedIndex].name}`);
    } else if (action === 'logs') {
      addToast('Fetching logs... Done. 142 entries found.');
    } else if (action === 'remediation') {
      const newBuildings = [...buildings];
      newBuildings[selectedIndex].riskScore = Math.max(
        0,
        newBuildings[selectedIndex].riskScore - 5
      );
      setBuildings(newBuildings);
      addToast('Remediation applied. Risk score reduced.');
    } else if (action === 'break') {
      setMentalFatigue(0);
      addToast('Break taken. Fatigue reset.');
    }
  };

  const handleSelectBuilding = (index: number) => {
    setSelectedIndex(index);
    setMentalFatigue(0);
    fetchAiAnalysis(buildings[index]);
  };

  const fetchAiAnalysis = async (building: Building) => {
    setAiLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/analyze-building', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          building_name: building.name,
          building_type: building.type,
          vibration_frequency: building.vibrationFrequency,
          crack_width: building.crackWidth,
          building_age: building.buildingAge,
          current_load: building.currentLoad,
          energy_consumption: building.energyConsumption,
          pga_acceleration: building.pgaAcceleration,
          water_level: building.waterLevel,
          fire_temperature: building.fireTemperature,
          epicenter_distance: building.epicenterDistance,
          soil_type: building.soilType,
          crack_growth_rate: building.crackGrowthRate,
          building_tilt: building.buildingTilt,
          risk_score: building.riskScore,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis({
          overview: data.overview,
          recommendations: data.recommendations || [],
          severity: data.severity_level,
        });
      }
    } catch (error) {
      console.error('Failed to fetch AI analysis:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const getFatigueStatus = () => {
    if (mentalFatigue < 30) return '✓ Alert & focused';
    if (mentalFatigue < 60) return '⚠ Getting tired';
    if (mentalFatigue < 90) return '⚠ Significantly fatigued';
    return '✗ Exhausted — rest required';
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pt-20 bg-infraeye-surface">
          <div className="flex h-[calc(100vh-80px)] items-center justify-center">
            <p className="text-infraeye-secondary">Loading buildings...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!selectedBuilding || buildings.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pt-20 bg-infraeye-surface">
          <div className="flex h-[calc(100vh-80px)] items-center justify-center">
            <p className="text-infraeye-secondary">No buildings available</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-20 bg-infraeye-surface">
        <div className="flex h-[calc(100vh-80px)] bg-infraeye-surface overflow-hidden">
          {/* Sidebar */}
          <div className="w-96 bg-[rgba(13,14,15,0.9)] border-r border-[rgba(255,255,255,0.1)] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[rgba(255,255,255,0.1)]">
              <h2 className="text-2xl font-bold text-infraeye-primary font-space-grotesk mb-1">
                🏢 Building Monitor
              </h2>
              <button className="text-infraeye-primary text-sm hover:underline">
                Change API Key
              </button>
            </div>

            {/* Chaos Monkey Button */}
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)]">
              <button
                onClick={() => setChaosActive(!chaosActive)}
                className={`w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  chaosActive
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-[rgba(31,41,55,0.8)] text-infraeye-secondary hover:bg-[rgba(31,41,55,1)]'
                }`}
              >
                🐒 Chaos Monkey
                {chaosActive && <span className="inline-block w-2 h-2 bg-red-300 rounded-full animate-pulse"></span>}
              </button>
            </div>

            {/* Building List */}
            <div className="flex-1 overflow-y-auto">
              {buildings.map((b, idx) => (
                <div
                  key={b.id}
                  onClick={() => handleSelectBuilding(idx)}
                  className={`px-4 py-3 cursor-pointer border-b border-[rgba(255,255,255,0.05)] transition-colors ${
                    selectedIndex === idx ? 'bg-[rgba(143,245,255,0.1)]' : 'hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-white">{b.name}</p>
                      <p className="text-infraeye-secondary text-sm">{b.type}</p>
                      <div className="mt-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            b.riskScore < 40
                              ? 'bg-green-900 text-green-200'
                              : b.riskScore < 70
                                ? 'bg-yellow-900 text-yellow-200'
                                : 'bg-red-900 text-red-200'
                          }`}
                        >
                          Risk: {b.riskScore.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        b.isOnline ? 'bg-green-500' : 'bg-yellow-500'
                      } mt-1`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedBuilding && (
              <>
                {/* Header */}
                <div className="p-6 border-b border-[rgba(255,255,255,0.1)]">
                  <h1 className="text-4xl font-bold text-infraeye-primary font-space-grotesk">
                    {selectedBuilding.name}
                  </h1>
                  <p className="text-infraeye-secondary">{selectedBuilding.type}</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[rgba(255,255,255,0.1)] px-6">
                  {(['overview', 'input', 'ops'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3 font-semibold transition-colors ${
                        activeTab === tab
                          ? 'text-infraeye-primary border-b-2 border-infraeye-primary'
                          : 'text-infraeye-secondary hover:text-white'
                      }`}
                    >
                      {tab === 'ops' ? '💬 Ops' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Risk Score Card */}
                      <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-indigo-500/30 rounded-2xl p-6">
                        <p className="text-infraeye-secondary text-sm mb-2">RISK SCORE</p>
                        <p className={`text-6xl font-bold mb-3 ${getRiskColor(selectedBuilding.riskScore)}`}>
                          {selectedBuilding.riskScore.toFixed(0)}
                        </p>
                        <div className="w-full bg-[rgba(31,41,55,0.8)] rounded-full h-3 overflow-hidden mb-4">
                          <div
                            className={`h-full transition-all ${
                              selectedBuilding.riskScore < 40
                                ? 'bg-green-500'
                                : selectedBuilding.riskScore < 70
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${selectedBuilding.riskScore}%` }}
                          ></div>
                        </div>
                        
                        {/* AI Analysis */}
                        {aiLoading ? (
                          <div className="text-infraeye-secondary text-sm">
                            🤖 AI Analysis running...
                          </div>
                        ) : aiAnalysis ? (
                          <div className="mt-4">
                            <p className="text-infraeye-primary text-sm font-semibold mb-2">AI Assessment:</p>
                            <p className="text-infraeye-secondary text-sm leading-relaxed mb-3">
                              {aiAnalysis.overview}
                            </p>
                            {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                              <div>
                                <p className="text-infraeye-primary text-sm font-semibold mb-2">Recommendations:</p>
                                <ul className="text-infraeye-secondary text-xs space-y-1">
                                  {aiAnalysis.recommendations.slice(0, 3).map((rec, idx) => (
                                    <li key={idx} className="flex gap-2">
                                      <span className="text-infraeye-primary">▸</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-infraeye-secondary text-sm">
                            {getRecommendation(selectedBuilding.riskScore)}
                          </p>
                        )}
                      </div>

                      {/* Core Indicators */}
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4">Core Indicators (Group 1)</h3>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <IndicatorCard
                            label="1. VIBRATION FREQUENCY"
                            value={`${selectedBuilding.vibrationFrequency.toFixed(2)} Hz`}
                            status={getStatusBadge('vibration', selectedBuilding.vibrationFrequency)}
                          />
                          <IndicatorCard
                            label="2. CRACK WIDTH"
                            value={`${selectedBuilding.crackWidth.toFixed(2)} mm`}
                            status={getStatusBadge('crack', selectedBuilding.crackWidth)}
                          />
                          <IndicatorCard
                            label="3. BUILDING AGE"
                            value={`${selectedBuilding.buildingAge.toFixed(0)} years`}
                            status={getStatusBadge('age', selectedBuilding.buildingAge)}
                          />
                          <IndicatorCard
                            label="4. CURRENT LOAD"
                            value={`${selectedBuilding.currentLoad.toFixed(1)}%`}
                            status={getStatusBadge('load', selectedBuilding.currentLoad)}
                          />
                          <IndicatorCard
                            label="5. ENERGY CONSUMPTION"
                            value={`${selectedBuilding.energyConsumption.toFixed(0)} kWh`}
                            status={getStatusBadge('energy', selectedBuilding.energyConsumption)}
                          />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-4">Disaster-Specific Indicators (Group 2)</h3>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <IndicatorCard
                            label="6. PGA ACCELERATION"
                            value={`${selectedBuilding.pgaAcceleration.toFixed(3)} g`}
                            status={getStatusBadge('pga', selectedBuilding.pgaAcceleration)}
                          />
                          <IndicatorCard
                            label="7. WATER LEVEL"
                            value={`${selectedBuilding.waterLevel.toFixed(1)} hours`}
                            status={getStatusBadge('water', selectedBuilding.waterLevel)}
                          />
                          <IndicatorCard
                            label="8. FIRE TEMPERATURE"
                            value={`${selectedBuilding.fireTemperature.toFixed(0)}°C`}
                            status={getStatusBadge('fire', selectedBuilding.fireTemperature)}
                          />
                          <IndicatorCard
                            label="9. EPICENTER DISTANCE"
                            value={selectedBuilding.epicenterDistance === 999 ? 'N/A' : `${selectedBuilding.epicenterDistance.toFixed(1)} km`}
                            status={getStatusBadge('distance', selectedBuilding.epicenterDistance)}
                          />
                          <IndicatorCard
                            label="10. SOIL TYPE"
                            value={selectedBuilding.soilType}
                            status={getStatusBadge('soil', selectedBuilding.soilType)}
                          />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-4">Advanced Precision Indicators (Group 3)</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <IndicatorCard
                            label="11. CRACK GROWTH RATE"
                            value={`${selectedBuilding.crackGrowthRate.toFixed(3)} mm/day`}
                            status={getStatusBadge('crackGrowth', selectedBuilding.crackGrowthRate)}
                            warning="More important than crack size — rapid growth = imminent collapse"
                          />
                          <IndicatorCard
                            label="12. BUILDING TILT"
                            value={`${selectedBuilding.buildingTilt.toFixed(2)}°`}
                            status={getStatusBadge('tilt', selectedBuilding.buildingTilt)}
                            warning="Indicates foundation movement"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'input' && editFormData && (
                    <div className="space-y-4 max-w-2xl">
                      <p className="text-sm text-infraeye-secondary mb-4">📝 Core Metrics (Group 1)</p>
                      <InputField
                        label="1. Vibration Frequency (Hz)"
                        value={editFormData.vibrationFrequency}
                        onChange={(val) =>
                          setEditFormData({ ...editFormData, vibrationFrequency: val })
                        }
                      />
                      <InputField
                        label="2. Crack Width (mm)"
                        value={editFormData.crackWidth}
                        onChange={(val) => setEditFormData({ ...editFormData, crackWidth: val })}
                      />
                      <InputField
                        label="3. Building Age (years)"
                        value={editFormData.buildingAge}
                        onChange={(val) => setEditFormData({ ...editFormData, buildingAge: val })}
                      />
                      <InputField
                        label="4. Current Load (%)"
                        value={editFormData.currentLoad}
                        onChange={(val) => setEditFormData({ ...editFormData, currentLoad: val })}
                      />
                      <InputField
                        label="5. Energy Consumption (kWh)"
                        value={editFormData.energyConsumption}
                        onChange={(val) =>
                          setEditFormData({ ...editFormData, energyConsumption: val })
                        }
                      />

                      <hr className="my-6 border-[rgba(255,255,255,0.1)]" />
                      <p className="text-sm text-infraeye-secondary mb-4">⚠️ Disaster-Specific Metrics (Group 2)</p>
                      <InputField
                        label="6. PGA Acceleration (g)"
                        value={editFormData.pgaAcceleration}
                        onChange={(val) =>
                          setEditFormData({ ...editFormData, pgaAcceleration: val })
                        }
                      />
                      <InputField
                        label="7. Water Level / Submersion Duration (hours)"
                        value={editFormData.waterLevel}
                        onChange={(val) => setEditFormData({ ...editFormData, waterLevel: val })}
                      />
                      <InputField
                        label="8. Fire Temperature (°C)"
                        value={editFormData.fireTemperature}
                        onChange={(val) =>
                          setEditFormData({ ...editFormData, fireTemperature: val })
                        }
                      />
                      <InputField
                        label="9. Distance from Epicenter/Blast (km)"
                        value={editFormData.epicenterDistance}
                        onChange={(val) =>
                          setEditFormData({ ...editFormData, epicenterDistance: val })
                        }
                      />
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          10. Soil Type
                        </label>
                        <select
                          value={editFormData.soilType}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              soilType: e.target.value as Building['soilType'],
                            })
                          }
                          className="w-full bg-[rgba(31,41,55,0.8)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-infraeye-primary"
                        >
                          <option value="Rock">Rock (1.0x)</option>
                          <option value="Dense Soil">Dense Soil (1.5x)</option>
                          <option value="Loose Soil">Loose Soil (2.5x)</option>
                          <option value="Clay/Soft Soil">Clay/Soft Soil (4.0x)</option>
                        </select>
                      </div>

                      <hr className="my-6 border-[rgba(255,255,255,0.1)]" />
                      <p className="text-sm text-infraeye-secondary mb-4">🔬 Advanced Precision Metrics (Group 3)</p>
                      <InputField
                        label="11. Crack Growth Rate (mm/day)"
                        value={editFormData.crackGrowthRate}
                        onChange={(val) =>
                          setEditFormData({ ...editFormData, crackGrowthRate: val })
                        }
                      />
                      <InputField
                        label="12. Building Tilt (degrees)"
                        value={editFormData.buildingTilt}
                        onChange={(val) => setEditFormData({ ...editFormData, buildingTilt: val })}
                      />

                      <button
                        onClick={handleSaveChanges}
                        className="w-full bg-infraeye-primary text-infraeye-surface px-6 py-3 rounded-lg font-bold hover:bg-[#00deec] transition-colors mt-6"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}

                  {activeTab === 'ops' && (
                    <div className="space-y-6 max-w-2xl">
                      {/* Run Disaster Analysis */}
                      <button
                        onClick={handleRunDisasterAnalysis}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                      >
                        Run Disaster Analysis
                      </button>

                      {/* AI Recommendation */}
                      <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-6">
                        <h4 className="text-lg font-bold text-white mb-3">🤖 AI Recommendation</h4>
                        <p className="text-infraeye-secondary mb-4">
                          {getRecommendation(selectedBuilding.riskScore)}
                        </p>
                        <button
                          onClick={() => addToast('Recommendation regenerated')}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
                        >
                          Regenerate Recommendation
                        </button>
                      </div>

                      {/* Incident Response Actions */}
                      <div className="bg-[rgba(31,41,55,0.8)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6">
                        <h4 className="text-lg font-bold text-white mb-4">
                          🚨 Incident Response Actions
                        </h4>

                        {/* Mental Fatigue */}
                        <div className="mb-6">
                          <div className="flex justify-between mb-2">
                            <p className="text-sm font-semibold text-white">Mental Fatigue</p>
                            <p className="text-sm font-semibold text-infraeye-secondary">
                              {mentalFatigue}%
                            </p>
                          </div>
                          <div className="w-full bg-[rgba(255,255,255,0.1)] rounded-full h-3 overflow-hidden mb-2">
                            <div
                              className={`h-full transition-all ${
                                mentalFatigue < 30
                                  ? 'bg-green-500'
                                  : mentalFatigue < 60
                                    ? 'bg-yellow-500'
                                    : mentalFatigue < 90
                                      ? 'bg-orange-500'
                                      : 'bg-red-500'
                              }`}
                              style={{ width: `${mentalFatigue}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-infraeye-secondary">{getFatigueStatus()}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleIncidentAction('investigate')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                          >
                            🔍 Investigate Service
                          </button>
                          <button
                            onClick={() => handleIncidentAction('logs')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                          >
                            📋 Fetch Logs
                          </button>
                          <button
                            onClick={() => handleIncidentAction('remediation')}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700"
                          >
                            🔧 Apply Remediation
                          </button>
                          <button
                            onClick={() => handleIncidentAction('break')}
                            disabled={mentalFatigue < 30}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                              mentalFatigue < 30
                                ? 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] cursor-not-allowed'
                                : 'bg-amber-600 text-white hover:bg-amber-700'
                            }`}
                          >
                            ☕ Coffee Break
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Toast Notifications */}
          <div className="fixed bottom-6 right-6 space-y-3 pointer-events-none">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in pointer-events-auto"
              >
                {toast.message}
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `}</style>
      </main>
    </div>
  );
};

const IndicatorCard: React.FC<{ 
  label: string
  value: string
  status: string
  warning?: string
}> = ({ label, value, status, warning }) => {
  const statusColor =
    status === 'OK' ? 'bg-green-900 text-green-200' : status === 'Monitor' ? 'bg-yellow-900 text-yellow-200' : 'bg-red-900 text-red-200';

  return (
    <div className="bg-[rgba(31,41,55,0.8)] border border-[rgba(255,255,255,0.1)] rounded-xl p-4">
      <p className="text-xs text-infraeye-secondary font-semibold mb-2">{label}</p>
      <p className="text-2xl font-bold text-white mb-3">{value}</p>
      <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${statusColor}`}>
        {status}
      </span>
      {warning && (
        <p className="text-xs text-orange-300 mt-2 italic">{warning}</p>
      )}
    </div>
  );
};

const InputField: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-semibold text-white mb-2">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full bg-[rgba(31,41,55,0.8)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-infraeye-primary"
    />
  </div>
);

export default DataAnalysisPage;
