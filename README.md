# InfraEye: Infrastructure Monitoring and Risk Assessment System

<div align="center">

![InfraEye](https://img.shields.io/badge/InfraEye-Infrastructure%20Monitoring-blue)
![Python](https://img.shields.io/badge/Python-3.9%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)
![React](https://img.shields.io/badge/React-19.2-61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688)

**A comprehensive infrastructure monitoring platform with machine learning-powered risk prediction and 3D visualization capabilities.**

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Machine Learning Models](#machine-learning-models)
- [3D Visualization](#3d-visualization)
- [AR Capabilities](#ar-capabilities)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

InfraEye is an advanced infrastructure monitoring and risk assessment platform designed to predict structural failures, identify utility networks, and provide real-time analytics for building and infrastructure management. Leveraging machine learning algorithms and interactive 3D visualization, InfraEye enables infrastructure professionals to make data-driven decisions for maintenance and safety.

The system combines a sophisticated backend API with intelligent ML models and an intuitive frontend featuring 3D city visualization and augmented reality capabilities for comprehensive infrastructure monitoring.

## ✨ Key Features

### Risk Assessment & Prediction
- **Intelligent Risk Scoring**: ML-powered prediction of structural risks based on vibration, crack width, energy consumption, load, and building age
- **Risk Stratification**: Four-tier risk classification system (Green, Yellow, Orange, Red)
- **Predictive Analytics**: Forecasting potential failures before they occur
- **Statistical Dashboard**: Real-time building health metrics and analytics

### Utility Network Mapping
- **Underground Infrastructure Detection**: ML-based identification of underground utility networks (pipes, cables)
- **Spatial Analysis**: Geo-located utility mapping with probability confidence scores
- **Integration Ready**: Seamless API integration for GIS systems

### 3D Infrastructure Visualization
- **Interactive 3D City View**: Real-time 3D rendering of building structures and urban infrastructure
- **Building Details**: Clickable building information cards with risk metrics
- **Road Networks**: Visual representation of road infrastructure and connections
- **Responsive Design**: Smooth camera controls and zoom capabilities

### Augmented Reality (AR)
- **Mobile AR Scanning**: On-site building inspection using device AR capabilities
- **Real-time Data Overlay**: AR view displaying building data and risk metrics
- **Intuitive Interface**: User-friendly AR controls for field assessment

### Data Analytics
- **Building Analytics**: Comprehensive statistical analysis of building conditions
- **Trend Analysis**: Historical data tracking and visualization
- **Export Capabilities**: Data export for further analysis

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────┬──────────────────┬────────────────────────────┤
│ Web Application │ 3D Visualization │ AR Mobile Application      │
│ (React + TS)    │ (Three.js)        │ (AR.js)                  │
└────────┬────────┴──────────┬───────┴────────────┬───────────────┘
         │                   │                    │
         └───────────────────┴────────────────────┘
                        │ HTTP/REST API
         ┌──────────────▼──────────────┐
         │   API Gateway (FastAPI)     │
         │   - Authentication          │
         │   - Rate Limiting           │
         │   - Request Routing         │
         └──────────────┬──────────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
┌───▼────────┐  ┌──────▼──────┐   ┌────────▼────┐
│   Risk     │  │  Utility    │   │  Building   │
│ Prediction │  │   Mapping   │   │   Analytics │
│   Models   │  │   Models    │   │  Services   │
└────────────┘  └─────────────┘   └─────────────┘
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
         ┌──────────────▼──────────────┐
         │    Data Layer               │
         │  - Buildings Database       │
         │  - Historical Data          │
         │  - Model Artifacts          │
         └─────────────────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + PostCSS
- **3D Graphics**: Three.js
- **AR**: AR.js
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **Routing**: React Router DOM

### Backend
- **Framework**: FastAPI 0.104.1
- **Server**: Uvicorn
- **Machine Learning**: Scikit-learn, Pandas, NumPy
- **API Validation**: Pydantic
- **Data Processing**: Pandas 2.1.1

### Development Tools
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Version Control**: Git

## 📁 Project Structure

```
infraeye/
├── Frontend Application (React + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── GridScan.tsx           # Building scan interface
│   │   │   ├── Layout.tsx             # Main layout wrapper
│   │   │   ├── Navbar.tsx             # Navigation component
│   │   │   └── Sidebar.tsx            # Sidebar navigation
│   │   ├── pages/
│   │   │   ├── HomePage.tsx           # Dashboard & home
│   │   │   ├── LoginPage.tsx          # Authentication
│   │   │   ├── ARScannerPage.tsx      # AR scanning interface
│   │   │   ├── DataAnalysisPage.tsx   # Analytics dashboard
│   │   │   ├── ThreeDViewPage.tsx     # 3D city visualization
│   │   │   └── LaunchPage.tsx         # Application launcher
│   │   ├── utils/
│   │   │   └── buildingUtils.ts       # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── 3D City Visualization (React)
│   ├── 3d_city-main/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Building.jsx       # Building 3D model
│   │   │   │   ├── City.jsx           # City container
│   │   │   │   ├── Roads.jsx          # Road rendering
│   │   │   │   ├── Scene.jsx          # Three.js scene
│   │   │   │   └── UIOverlay.jsx      # UI overlay
│   │   │   ├── utils/
│   │   │   │   ├── cityData.js        # City data
│   │   │   │   ├── textureGenerator.js
│   │   │   │   └── raycast.js         # Raycasting utilities
│   │   │   └── hooks/
│   │   │       └── useAR.js
│   │   └── vite.config.js
│
├── Backend (Python/FastAPI)
│   ├── main.py                        # FastAPI application entry point
│   ├── financial_logic.py             # Financial analysis module
│   ├── chaos_engine.py                # Chaos engineering utilities
│   ├── multi_agent_mode.py            # Multi-agent system
│   ├── production_infrastructure.py   # Infrastructure configuration
│   ├── observability_stack.py         # Monitoring & observability
│   ├── requirements-backend.txt       # Python dependencies
│   └── BACKEND_README.md              # Backend documentation
│
├── Configuration Files
│   ├── package.json                   # Frontend dependencies
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── eslint.config.js               # ESLint configuration
│   ├── postcss.config.js              # PostCSS configuration
│   └── tailwind.config.js             # Tailwind configuration
│
└── Documentation
    ├── README.md                      # This file
    └── BACKEND_README.md              # Backend API documentation
```

## 📦 Installation & Setup

### Prerequisites
- **Node.js**: 18.0 or higher
- **Python**: 3.9 or higher
- **npm** or **yarn**: Package managers for Node.js
- **Git**: Version control

### Clone Repository

```bash
git clone https://github.com/21simranh/Infraeye.git
cd Infraeye
```

## 🔧 Backend Configuration

### 1. Set Up Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements-backend.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Model Configuration
MODEL_PATH=./models
DATA_PATH=./data

# Logging
LOG_LEVEL=INFO
```

### 4. Prepare Data & Models

Ensure the following files are in place:
- `unified_risk_model.pkl` - Risk prediction model
- `utility_mapper.pkl` - Utility mapping model
- `feature_names.pkl` - Feature names
- `buildings_data.csv` - Building dataset

**Note**: If models are not present, the API runs in mock mode with simulated predictions.

## 🎨 Frontend Configuration

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
```

## 🚀 Running the Application

### Backend Server

```bash
# From project root with Python venv activated
python main.py
```

The API server will start on **http://localhost:8000**

**API Documentation**:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Frontend Development Server

```bash
# In a new terminal
npm run dev
```

The frontend will be available at **http://localhost:5173**

### Build for Production

```bash
# Frontend
npm run build

# Backend (create executable or deployment package)
# Refer to FastAPI deployment documentation
```

## 📡 API Documentation

### Core Endpoints

#### Health & Status
- `GET /` - API status check
- `GET /api/status` - Detailed system status
- `GET /api/health` - Health check with model status

#### Risk Prediction
**POST** `/api/predict/risk`

Request:
```json
{
  "vibration": 25.5,
  "crack_width": 3.2,
  "energy_consumption": 650.0,
  "current_load": 75.5,
  "building_age": 45.0
}
```

Response:
```json
{
  "risk_score": 65.3,
  "risk_level": "Yellow",
  "timestamp": "2026-04-18T10:30:00Z"
}
```

#### Utility Network Mapping
**POST** `/api/predict/utility`

Request:
```json
{
  "x": 40.7128,
  "y": -74.0060
}
```

Response:
```json
{
  "pipe_probability": 0.725,
  "confidence": 0.89
}
```

#### Building Data
- `GET /api/buildings` - Retrieve all buildings
- `GET /api/buildings/{building_id}` - Get specific building details
- `GET /api/statistics` - Statistical summary and analytics

For complete API documentation, visit Swagger UI at http://localhost:8000/docs

## 🤖 Machine Learning Models

### Risk Prediction Model

**Inputs** (5 features):
- **Vibration** (Hz): Structural vibration magnitude
- **Crack Width** (mm): Visible crack measurements
- **Energy Consumption** (kWh): Building energy usage
- **Current Load** (%): Structural load percentage
- **Building Age** (years): Age of structure

**Output**:
- Risk Score: 0-100 scale
- Risk Level: Green (0-30), Yellow (31-60), Orange (61-85), Red (86-100)

### Utility Mapping Model

**Inputs** (2 features):
- **X Coordinate**: Latitude or grid X position
- **Y Coordinate**: Longitude or grid Y position

**Output**:
- Pipe Probability: 0-1 confidence score for underground utility presence

**Note**: Models run in mock mode if artifacts are not available, providing realistic simulated predictions.

## 🎮 3D Visualization

### Features
- **Interactive Camera Controls**: Pan, zoom, and rotate the 3D city view
- **Building Selection**: Click buildings to view detailed information
- **Dynamic Rendering**: Real-time rendering of 3D structures
- **Responsive Canvas**: Adapts to different screen sizes

### Controls
- **Mouse Drag**: Rotate view
- **Scroll**: Zoom in/out
- **Click**: Select buildings

## 📱 AR Capabilities

### Features
- **Real-time AR Overlay**: Display building data in augmented reality
- **Mobile Integration**: Works on AR-capable mobile devices
- **Risk Visualization**: Visual indicators of building risk levels
- **On-site Assessment**: Field-based building inspection tool

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature`
3. **Commit** changes: `git commit -m 'Add your feature'`
4. **Push** to branch: `git push origin feature/your-feature`
5. **Submit** a pull request

### Code Standards
- Follow existing code style and conventions
- Ensure TypeScript type safety
- Add comments for complex logic
- Test changes before submitting PR

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support & Contact

For issues, questions, or suggestions:
- **GitHub Issues**: [Report a bug](https://github.com/21simranh/Infraeye/issues)
- **Email**: et23.simran.hati@kccemsr.edu.in

## 🙏 Acknowledgments

- Built with [React](https://react.dev), [Three.js](https://threejs.org), and [FastAPI](https://fastapi.tiangolo.com)
- UI components powered by [Tailwind CSS](https://tailwindcss.com)
- Data visualization with [Recharts](https://recharts.org)
- Machine learning capabilities built on [Scikit-learn](https://scikit-learn.org)

---

<div align="center">

**InfraEye** - Empowering Infrastructure Management Through Technology

© 2026 InfraEye Team. All rights reserved.

</div>
