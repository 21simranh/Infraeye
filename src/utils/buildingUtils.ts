/**
 * Building Risk Analysis Utilities
 * Provides functions for risk assessment and data management
 */

export interface Building {
  building_id: number;
  risk_score: number;
  vibration: number;
  crack_width: number;
  energy_consumption: number;
  current_load: number;
  building_age: number;
}

export interface BuildingData {
  id: string;
  name: string;
  type: string;
  vibrationFrequency: number;
  crackWidth: number;
  buildingAge: number;
  currentLoad: number;
  energyConsumption: number;
  pgaAcceleration: number;
  waterLevel: number;
  fireTemperature: number;
  epicenterDistance: number;
  soilType: string;
  crackGrowthRate: number;
  buildingTilt: number;
  riskScore: number;
  isOnline: boolean;
}

const API_BASE_URL = "http://localhost:8000";
const API_KEY = "infraeye-secret-key-2026";
const BUILDINGS_STORAGE_KEY = "infraeye_buildings_data";

/**
 * Save building data to localStorage
 */
export function saveBuildingsToStorage(buildings: BuildingData[]): void {
  try {
    localStorage.setItem(BUILDINGS_STORAGE_KEY, JSON.stringify(buildings));
  } catch (error) {
    console.error("Failed to save buildings to localStorage:", error);
  }
}

/**
 * Load building data from localStorage
 */
export function loadBuildingsFromStorage(): BuildingData[] | null {
  try {
    const data = localStorage.getItem(BUILDINGS_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to load buildings from localStorage:", error);
    return null;
  }
}

/**
 * Get building data by ID from storage
 */
export function getBuildingFromStorage(buildingId: string): BuildingData | null {
  try {
    const buildings = loadBuildingsFromStorage();
    if (buildings) {
      return buildings.find(b => b.id === buildingId) || null;
    }
    return null;
  } catch (error) {
    console.error("Failed to get building from storage:", error);
    return null;
  }
}

/**
 * Fetch building data from API with authentication
 */
export async function load_buildings_data(): Promise<Building[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/buildings`, {
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    } as any);
    if (response.ok) {
      const data = await response.json();
      return data.buildings;
    } else if (response.status === 403) {
      console.error("API Authentication Failed: Invalid API Key");
      return null;
    } else {
      console.error(`API Error: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Failed to connect to API: ${error}`);
    return null;
  }
}

/**
 * Return color based on risk score
 */
export function get_risk_color(score: number): string {
  if (score < 40) {
    return "🟢"; // Green
  } else if (score < 70) {
    return "🟡"; // Yellow
  } else {
    return "🔴"; // Red
  }
}

/**
 * Return risk level name
 */
export function get_risk_level(score: number): string {
  if (score < 40) {
    return "Low Risk";
  } else if (score < 70) {
    return "Medium Risk";
  } else {
    return "High Risk";
  }
}

/**
 * Generate mock building data for demo purposes
 */
export function generate_mock_buildings(count: number = 50): Building[] {
  const buildings: Building[] = [];
  for (let i = 1; i <= count; i++) {
    buildings.push({
      building_id: i,
      risk_score: Math.random() * 100,
      vibration: Math.random() * 50,
      crack_width: Math.random() * 10,
      energy_consumption: Math.random() * 1000,
      current_load: Math.random() * 100,
      building_age: Math.random() * 100,
    });
  }
  return buildings;
}

/**
 * Check API health with authentication
 */
export async function check_api_health(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      headers: {
        "X-API-Key": API_KEY,
      },
      timeout: 5000,
    } as any);
    return response.ok;
  } catch (error) {
    console.error(`API Health Check Failed: ${error}`);
    return false;
  }
}
