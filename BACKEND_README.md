# InfraEye Backend API

## 📋 Overview

The FastAPI backend serves both risk prediction and utility mapper models for the INFRAEYE infrastructure monitoring system.

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- FastAPI dependencies (see requirements-backend.txt)

### Installation

```bash
# Install dependencies
pip install -r requirements-backend.txt
```

### Running the Backend

```bash
# Start the API server
python main.py
```

The server will start on **http://localhost:8000**

## 📚 API Documentation

### Interactive API Docs
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔌 API Endpoints

### Health & Status
- `GET /` - API status
- `GET /api/status` - Detailed status
- `GET /api/health` - Health check with model status

### Risk Prediction
- **POST** `/api/predict/risk`
  
  **Input:**
  ```json
  {
    "vibration": 25.5,
    "crack_width": 3.2,
    "energy_consumption": 650.0,
    "current_load": 75.5,
    "building_age": 45.0
  }
  ```
  
  **Output:**
  ```json
  {
    "risk_score": 65.3,
    "risk_level": "Yellow"
  }
  ```

### Utility Mapping
- **POST** `/api/predict/utility`
  
  **Input:**
  ```json
  {
    "x": 40.7128,
    "y": -74.0060
  }
  ```
  
  **Output:**
  ```json
  {
    "pipe_probability": 0.725
  }
  ```

### Building Data
- **GET** `/api/buildings` - Get all buildings
- **GET** `/api/buildings/{building_id}` - Get specific building
- **GET** `/api/statistics` - Get statistical summary

## 📊 Key Functions

### `load_models()`
Loads trained ML models from pickle files:
- `unified_risk_model.pkl` - Risk prediction model
- `utility_mapper.pkl` - Underground pipe prediction model
- `feature_names.pkl` - Feature names for the models
- `buildings_data.csv` - Building dataset

If models are not found, the API runs in **mock mode** with simulated predictions.

### `predict_risk(vibration, crack_width, energy_consumption, current_load, building_age)`
Predicts infrastructure risk score (0-100) based on 5 features.

**Risk Levels:**
- 🟢 **Green** (0-40): Low Risk
- 🟡 **Yellow** (40-70): Medium Risk
- 🔴 **Red** (70-100): High Risk

### `predict_utility(x, y)`
Predicts underground pipe probability (0-1) based on GPS coordinates.

### `get_buildings()`
Returns all building data with calculated risk levels.

## 🔧 Configuration

### CORS
The API has CORS enabled for all origins, allowing requests from:
- Frontend (Vite app on localhost:5173)
- Any external clients

### Mock Data
If actual models/data files are not found, the API:
1. Generates 50 mock buildings with random features
2. Uses formula-based predictions instead of ML models
3. Still provides all endpoints with realistic-looking data

## 📁 Required Files (Optional)

For using actual ML models, place these files in the root directory:

```
project-root/
├── main.py
├── unified_risk_model.pkl       # Risk prediction model
├── utility_mapper.pkl           # Utility mapping model
├── feature_names.pkl            # Feature names
├── buildings_data.csv           # Building dataset
└── requirements-backend.txt
```

## 📊 Example Requests

### cURL - Predict Risk
```bash
curl -X POST "http://localhost:8000/api/predict/risk" \
  -H "Content-Type: application/json" \
  -d '{
    "vibration": 30.5,
    "crack_width": 4.2,
    "energy_consumption": 700.0,
    "current_load": 80.0,
    "building_age": 50.0
  }'
```

### Python - Get All Buildings
```python
import requests

response = requests.get("http://localhost:8000/api/buildings")
buildings = response.json()
print(f"Total buildings: {buildings['total_buildings']}")
```

## 🎯 Integration with Frontend

The React frontend connects to the backend via:

**Base URL:** `http://localhost:8000`

**Examples:**
- Fetch buildings: `http://localhost:8000/api/buildings`
- Predict risk: POST to `http://localhost:8000/api/predict/risk`
- Get stats: `http://localhost:8000/api/statistics`

## 📝 Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad request
- `404` - Not found
- `500` - Server error
- `503` - Service unavailable (models not loaded)

## 🔐 Security Notes

- CORS is enabled for all origins (development mode)
- For production, restrict CORS to specific domains
- Add authentication if needed
- Validate input data thoroughly

## 📞 Support

For issues or questions about the API:
1. Check `/docs` endpoint for interactive API documentation
2. Verify all required files are in the project root
3. Check console output for model loading errors

---

**Version:** 1.0.0  
**Framework:** FastAPI + Uvicorn  
**Python:** 3.9+
