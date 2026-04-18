"""
InfraEye: FastAPI Backend
Serves both Risk Prediction and Utility Mapper models
Endpoints:
- POST /predict/risk: Predict infrastructure risk score
- POST /predict/utility: Predict underground pipe probability
- GET /buildings: Get all building data with risk scores
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pickle
import pandas as pd
import numpy as np
from pathlib import Path
import uvicorn
import threading
import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠ Warning: OpenAI library not installed. Install with: pip install openai")

# Initialize FastAPI app
app = FastAPI(
    title="InfraEye API",
    description="AI-Powered Infrastructure Risk Detection",
    version="1.0.0"
)

# Add CORS middleware to allow requests from all origins (needed for frontend apps)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (monoline template)
static_dir = Path(__file__).parent / "monoline"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# ============= GLOBAL VARIABLES =============
risk_model = None
utility_model = None
feature_names = None
buildings_data = None
_cached_buildings = None  # Cache buildings for consistency

# ============= PYDANTIC MODELS =============
class RiskPredictionInput(BaseModel):
    """Input model for risk prediction"""
    vibration: float
    crack_width: float
    energy_consumption: float
    current_load: float
    building_age: float

class UtilityPredictionInput(BaseModel):
    """Input model for utility prediction"""
    x: float
    y: float

class RiskPredictionOutput(BaseModel):
    """Output model for risk prediction"""
    risk_score: float
    risk_level: str  # "Green", "Yellow", "Red"

class UtilityPredictionOutput(BaseModel):
    """Output model for utility prediction"""
    pipe_probability: float

class BuildingAnalysisRequest(BaseModel):
    """Input for AI-powered building analysis"""
    building_name: str
    building_type: str
    vibration_frequency: float
    crack_width: float
    building_age: float
    current_load: float
    energy_consumption: float
    pga_acceleration: float = 0
    water_level: float = 0
    fire_temperature: float = 0
    epicenter_distance: float = 999
    soil_type: str = "Rock"
    crack_growth_rate: float = 0
    building_tilt: float = 0
    risk_score: float = 0

class AIAnalysisResponse(BaseModel):
    """AI-generated analysis response"""
    overview: str
    recommendations: list[str]
    severity_level: str  # "Low", "Medium", "High", "Critical"
    confidence: float  # 0-1

# ============= HELPER FUNCTIONS =============
def load_models():
    """Load trained models from pickle files."""
    global risk_model, utility_model, feature_names, buildings_data
    
    print("Loading models...")
    
    try:
        # Load risk model
        risk_path = Path('unified_risk_model.pkl')
        if risk_path.exists():
            print(f"  Loading risk model ({risk_path.stat().st_size / 1024 / 1024:.2f}MB)...")
            with open(risk_path, 'rb') as f:
                risk_model = pickle.load(f)
            print("  ✓ Risk model loaded")
        else:
            print("  ⚠ Warning: unified_risk_model.pkl not found - using mock mode")
        
        # Load feature names
        feature_path = Path('feature_names.pkl')
        if feature_path.exists():
            print(f"  Loading feature names ({feature_path.stat().st_size / 1024:.2f}KB)...")
            with open(feature_path, 'rb') as f:
                feature_names = pickle.load(f)
            print("  ✓ Feature names loaded")
        
        # Load utility model
        utility_path = Path('utility_mapper.pkl')
        if utility_path.exists():
            print(f"  Loading utility model ({utility_path.stat().st_size / 1024 / 1024:.2f}MB)...")
            with open(utility_path, 'rb') as f:
                utility_model = pickle.load(f)
            print("  ✓ Utility mapper model loaded")
        else:
            print("  ⚠ Warning: utility_mapper.pkl not found - using mock mode")
        
        # Load buildings data
        buildings_path = Path('buildings_data.csv')
        if buildings_path.exists():
            print(f"  Loading buildings data ({buildings_path.stat().st_size / 1024:.2f}KB)...")
            buildings_data = pd.read_csv(buildings_path)
            print(f"  ✓ Buildings data loaded ({len(buildings_data)} records)")
        else:
            print("  ⚠ Warning: buildings_data.csv not found - generating mock data")
            # Generate mock data
            buildings_data = generate_mock_buildings(50)
            
    except Exception as e:
        print(f"  ✗ Error loading models: {e}")
        import traceback
        traceback.print_exc()

def generate_mock_buildings(count: int = 50):
    """Generate mock building data for demo purposes."""
    np.random.seed(42)
    data = {
        'building_id': range(1, count + 1),
        'risk_score': np.random.uniform(0, 100, count),
        'vibration': np.random.uniform(0, 50, count),
        'crack_width': np.random.uniform(0, 10, count),
        'energy_consumption': np.random.uniform(100, 1000, count),
        'current_load': np.random.uniform(20, 100, count),
        'building_age': np.random.uniform(5, 100, count),
    }
    return pd.DataFrame(data)

def calculate_risk_level(score):
    """Determine risk level based on score."""
    if score < 40:
        return "Green"  # Low risk
    elif score < 70:
        return "Yellow"  # Medium risk
    else:
        return "Red"  # High risk

def generate_3d_city_buildings():
    """Generate buildings mimicking the 3D city layout"""
    global _cached_buildings
    
    # Return cached buildings if they exist
    if _cached_buildings:
        return _cached_buildings
    
    np.random.seed(42)
    
    # Building names from 3D city
    PREFIXES = [
        'Grand', 'Metro', 'City', 'Urban', 'Park', 'Sky', 'Azure', 'Golden',
        'Silver', 'Crown', 'Vista', 'Apex', 'Summit', 'Harbor', 'Crystal',
        'Eclipse', 'Zenith', 'Atlas', 'Nova', 'Stellar', 'Pacific', 'Beacon',
        'Vertex', 'Prime', 'Cobalt', 'Ivory', 'Onyx', 'Pearl', 'Titan', 'Solaris',
    ]
    
    SUFFIXES = [
        'Tower', 'Plaza', 'Center', 'Heights', 'Place', 'Point', 'Square',
        'Hub', 'Loft', 'Haven', 'Residency', 'Complex', 'Chambers', 'Pavilion',
        'Spire', 'Pinnacle', 'Terrace', 'Court', 'Exchange', 'Works',
        'Quarter', 'Row', 'Hall', 'Atrium', 'Commons', 'Arch', 'Gate', 'Rise',
    ]
    
    TYPES = ['office', 'residential', 'modern', 'commercial']
    
    buildings = []
    
    # Add landmarks
    landmarks = [
        {'id': 'landmark-plaza', 'name': 'Central Plaza', 'type': 'plaza'},
        {'id': 'landmark-garden', 'name': 'City Garden', 'type': 'garden'},
        {'id': 'landmark-mall', 'name': 'Metro Grand Mall', 'type': 'mall'},
        {'id': 'landmark-clock', 'name': 'Heritage Clock Tower', 'type': 'clocktower'},
        {'id': 'landmark-museum', 'name': 'City Museum', 'type': 'civic'},
        {'id': 'landmark-memorial', 'name': 'Founders Memorial', 'type': 'monument'},
    ]
    buildings.extend(landmarks)
    
    # Generate regular buildings (about 44 buildings)
    for i in range(44):
        prefix = PREFIXES[i % len(PREFIXES)]
        suffix = SUFFIXES[(i // len(PREFIXES)) % len(SUFFIXES)]
        building_type = TYPES[i % len(TYPES)]
        
        buildings.append({
            'id': f'bldg-{i}',
            'name': f'{prefix} {suffix}',
            'type': building_type,
            'vibrationFrequency': float(np.random.uniform(1.5, 4.5)),
            'crackWidth': float(np.random.uniform(0, 3)),
            'buildingAge': float(np.random.uniform(5, 100)),
            'currentLoad': float(np.random.uniform(40, 95)),
            'energyConsumption': float(np.random.uniform(3000, 8000)),
            'pgaAcceleration': float(np.random.uniform(0, 0.5)),
            'waterLevel': float(np.random.uniform(0, 8)),
            'fireTemperature': float(np.random.uniform(0, 800)),
            'epicenterDistance': float(np.random.uniform(10, 100)),
            'soilType': TYPES[i % len(TYPES)],
            'crackGrowthRate': float(np.random.uniform(0, 0.15)),
            'buildingTilt': float(np.random.uniform(0, 1)),
            'riskScore': float(np.random.uniform(20, 90)),
            'isOnline': True,
        })
    
    # Cache the buildings
    _cached_buildings = buildings
    return buildings

# ============= ENDPOINTS =============

@app.get("/")
async def root():
    """Root endpoint - serves status"""
    return {
        "message": "InfraEye API",
        "status": "running",
        "version": "1.0.0",
        "docs": "http://localhost:8000/docs"
    }

@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    return {
        "message": "InfraEye API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "predict_risk": "/api/predict/risk",
            "predict_utility": "/api/predict/utility",
            "buildings": "/api/buildings",
            "health": "/api/health"
        }
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    status = {
        "risk_model": "loaded" if risk_model is not None else "missing",
        "utility_model": "loaded" if utility_model is not None else "missing",
        "buildings_data": "loaded" if buildings_data is not None else "missing"
    }
    return {"status": "healthy", "models": status}

@app.post("/api/predict/risk", response_model=RiskPredictionOutput)
async def predict_risk(input_data: RiskPredictionInput):
    """
    Predict infrastructure risk score from 5 features.
    
    Returns:
    - risk_score: 0-100 prediction
    - risk_level: "Green" (low), "Yellow" (medium), or "Red" (high)
    """
    try:
        if risk_model is not None:
            # Use actual model if available
            features = [
                input_data.vibration,
                input_data.crack_width,
                input_data.energy_consumption,
                input_data.current_load,
                input_data.building_age
            ]
            
            # Make prediction
            risk_score = float(risk_model.predict([features])[0])
            risk_score = np.clip(risk_score, 0, 100)  # Ensure within bounds
        else:
            # Use mock prediction based on features
            risk_score = (
                input_data.crack_width * 3 +
                input_data.vibration * 0.5 +
                input_data.building_age * 0.3 +
                input_data.current_load * 0.2 -
                input_data.energy_consumption * 0.01
            )
            risk_score = np.clip(risk_score, 0, 100)
        
        # Determine risk level
        risk_level = calculate_risk_level(risk_score)
        
        return RiskPredictionOutput(
            risk_score=round(risk_score, 2),
            risk_level=risk_level
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/api/predict/utility", response_model=UtilityPredictionOutput)
async def predict_utility(input_data: UtilityPredictionInput):
    """
    Predict underground pipe probability from GPS coordinates.
    
    Returns:
    - pipe_probability: 0-1 probability
    """
    try:
        if utility_model is not None:
            # Use actual model if available
            pipe_prob = float(utility_model.predict([[input_data.x, input_data.y]])[0])
            pipe_prob = np.clip(pipe_prob, 0, 1)  # Ensure within bounds
        else:
            # Use mock prediction based on coordinates
            # Simulating higher probability in certain zones
            pipe_prob = 0.5 + 0.3 * np.sin(input_data.x / 10) * np.cos(input_data.y / 10)
            pipe_prob = np.clip(pipe_prob, 0, 1)
        
        return UtilityPredictionOutput(pipe_probability=round(pipe_prob, 3))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/api/city-buildings")
async def get_city_buildings():
    """
    Get all buildings from the 3D city visualization.
    Returns list of buildings with their metadata and sample metrics.
    """
    try:
        buildings = generate_3d_city_buildings()
        return {
            "total_buildings": len(buildings),
            "buildings": buildings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving city buildings: {str(e)}")

@app.get("/api/buildings")
async def get_buildings():
    """
    Get all building data with risk scores and risk levels.
    Includes predictions for risk scores if not already in data.
    """
    try:
        if buildings_data is None:
            raise HTTPException(status_code=503, detail="Buildings data not loaded")
        
        # Create response with risk levels
        response_data = buildings_data.copy()
        response_data['risk_level'] = response_data['risk_score'].apply(calculate_risk_level)
        
        return {
            "total_buildings": len(response_data),
            "buildings": response_data.to_dict(orient='records')
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving buildings: {str(e)}")

@app.get("/api/buildings/{building_id}")
async def get_building(building_id: int):
    """Get data for a specific building."""
    try:
        if buildings_data is None:
            raise HTTPException(status_code=503, detail="Buildings data not loaded")
        
        building = buildings_data[buildings_data['building_id'] == building_id]
        
        if building.empty:
            raise HTTPException(status_code=404, detail=f"Building {building_id} not found")
        
        building_dict = building.iloc[0].to_dict()
        building_dict['risk_level'] = calculate_risk_level(building_dict['risk_score'])
        
        return building_dict
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving building: {str(e)}")

@app.get("/api/statistics")
async def get_statistics():
    """Get statistics about all buildings."""
    try:
        if buildings_data is None:
            raise HTTPException(status_code=503, detail="Buildings data not loaded")
        
        risk_scores = buildings_data['risk_score']
        
        return {
            "total_buildings": len(buildings_data),
            "average_risk": float(risk_scores.mean()),
            "min_risk": float(risk_scores.min()),
            "max_risk": float(risk_scores.max()),
            "std_dev": float(risk_scores.std()),
            "high_risk_count": int((risk_scores > 70).sum()),
            "medium_risk_count": int(((risk_scores >= 40) & (risk_scores <= 70)).sum()),
            "low_risk_count": int((risk_scores < 40).sum())
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating statistics: {str(e)}")

@app.post("/api/analyze-building", response_model=AIAnalysisResponse)
async def analyze_building(building_data: BuildingAnalysisRequest):
    """
    AI-powered building analysis using GPT-4.
    Generates comprehensive overview and recommendations based on sensor data.
    """
    try:
        if not OPENAI_AVAILABLE:
            # Fallback to rule-based analysis if OpenAI not available
            return generate_fallback_analysis(building_data)
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            # Fallback to rule-based analysis if no API key
            return generate_fallback_analysis(building_data)
        
        client = OpenAI(api_key=api_key)
        
        # Build detailed prompt for GPT
        prompt = f"""You are an expert structural engineer and building safety analyst. Analyze this building's condition data and provide a brief expert assessment.

BUILDING INFORMATION:
- Name: {building_data.building_name}
- Type: {building_data.building_type}
- Overall Risk Score: {building_data.risk_score}/100

CORE STRUCTURAL METRICS:
- Vibration Frequency: {building_data.vibration_frequency} Hz (threshold: OK<2.5, Monitor 2.5-4, Critical>4)
- Crack Width: {building_data.crack_width} mm (threshold: OK<1, Monitor 1-2.5, Critical>2.5)
- Building Age: {building_data.building_age} years (threshold: OK<20, Monitor 20-50, Critical>50)
- Current Load: {building_data.current_load}% (threshold: OK<70, Monitor 70-90, Critical>90)
- Energy Consumption: {building_data.energy_consumption} kWh (threshold: OK<5000, Monitor 5000-8000, Critical>8000)

DISASTER-SPECIFIC METRICS:
- PGA Acceleration: {building_data.pga_acceleration} g
- Water Level/Submersion: {building_data.water_level} hours
- Fire Temperature: {building_data.fire_temperature}°C
- Distance from Epicenter: {building_data.epicenter_distance} km
- Soil Type: {building_data.soil_type}

ADVANCED INDICATORS:
- Crack Growth Rate: {building_data.crack_growth_rate} mm/day
- Building Tilt: {building_data.building_tilt} degrees

Provide your response in JSON format with exactly these fields:
{{
  "overview": "A 2-3 sentence expert assessment of the building's current structural condition",
  "recommendations": ["Action 1", "Action 2", "Action 3"],
  "severity_level": "Low/Medium/High/Critical",
  "confidence": 0.85
}}

Be concise, technical, and actionable."""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500
        )
        
        # Parse response
        response_text = response.choices[0].message.content
        
        # Try to extract JSON from response
        try:
            # Find JSON in response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                analysis = json.loads(json_str)
                
                return AIAnalysisResponse(
                    overview=analysis.get("overview", "Analysis generated by AI."),
                    recommendations=analysis.get("recommendations", ["Monitor structure regularly"]),
                    severity_level=analysis.get("severity_level", "Medium"),
                    confidence=analysis.get("confidence", 0.8)
                )
        except:
            pass
        
        # Fallback if JSON parsing fails
        return generate_fallback_analysis(building_data)
        
    except Exception as e:
        print(f"GPT Analysis error: {e}")
        # Fallback to rule-based analysis
        return generate_fallback_analysis(building_data)

def generate_fallback_analysis(building_data: BuildingAnalysisRequest) -> AIAnalysisResponse:
    """Generate rule-based analysis when GPT is unavailable."""
    
    score = building_data.risk_score
    
    if score < 40:
        severity = "Low"
        overview = f"{building_data.building_name} is in good structural condition with minimal risk indicators. Continue routine monitoring and maintenance."
        recommendations = [
            "Schedule annual structural inspections",
            "Monitor vibration levels monthly",
            "Maintain current maintenance schedule"
        ]
        confidence = 0.95
    elif score < 70:
        severity = "Medium"
        overview = f"{building_data.building_name} shows moderate structural stress. Several metrics require attention within the next 30 days to prevent escalation."
        recommendations = [
            "Schedule professional structural inspection within 30 days",
            "Investigate crack growth rate trend",
            "Review load distribution system",
            "Install vibration monitoring sensors"
        ]
        confidence = 0.90
    elif score < 85:
        severity = "High"
        overview = f"{building_data.building_name} exhibits significant structural concerns. Immediate investigation and remediation planning required."
        recommendations = [
            "Conduct urgent structural assessment with licensed engineer",
            "Implement temporary load reduction measures",
            "Accelerate repairs for identified cracks",
            "Consider partial occupancy restrictions",
            "Establish daily monitoring protocol"
        ]
        confidence = 0.85
    else:
        severity = "Critical"
        overview = f"{building_data.building_name} is at critical risk of structural failure. Immediate action required. Consider evacuation and emergency services engagement."
        recommendations = [
            "EVACUATE BUILDING - Contact emergency services immediately",
            "Implement full structural stabilization measures",
            "Engage structural engineering emergency response team",
            "Redirect occupants to alternate facilities",
            "Begin emergency repair prioritization"
        ]
        confidence = 0.92
    
    return AIAnalysisResponse(
        overview=overview,
        recommendations=recommendations,
        severity_level=severity,
        confidence=confidence
    )

# ============= STARTUP EVENT =============

@app.on_event("startup")
async def startup_event():
    """Load models on startup in background thread."""
    print("\n" + "="*50)
    print("InfraEye API Starting...")
    print("="*50)
    print("Loading models in background...\n")
    
    # Load models in a separate thread to avoid blocking the API startup
    def load_models_background():
        try:
            load_models()
            print("✓ All models loaded successfully\n")
        except Exception as e:
            print(f"✗ Error loading models in background: {e}\n")
    
    thread = threading.Thread(target=load_models_background, daemon=True)
    thread.start()
    print("✓ API Ready\n")

# ============= MAIN =============

if __name__ == "__main__":
    print("Starting InfraEye FastAPI Backend")
    print("✓ Listening on http://localhost:8000")
    print("✓ Docs available at http://localhost:8000/docs")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )
