# InfraEye – Urban 3D Simulation

InfraEye is a high-performance 3D urban simulation built with **React**, **Three.js**, and **React-Three-Fiber**. It procedurally generates a city with varied architectural styles, landmarks, active vehicle traffic, and a detailed "X-Ray Vision" mode for exploring building internals.

## 🚀 Features

- **Procedural City Generation**: Randomly generated city grids with distinct blocks, roads, and greenery.
- **Architectural Diversity**: Multiple building styles including Tiered Office Towers, Sleek Modern Skyscrapers, Independent Residential Houses, and Commercial Blocks.
- **Civic Landmarks**: High-detail models for the Heritage Clock Tower, City Museum, and Founders Memorial.
- **Dynamic Traffic**: NPC vehicles (Sedans, SUVs, Trucks) patrolling the streets with correct orientation and lane positioning.
- **Street View & Orbit Navigation**: Seamlessly switch between bird's-eye top view, free-pan orbit exploration, and first-person street mode.
- **X-Ray Building Viewer**: Detailed internal views of buildings showing:
  - Elevator/Service Cores
  - Plumbing & HVAC systems
  - Structural Grids
- **Helipad & Helicopter**: Tactical heliport on the city's tallest tower.

## 🛠️ Installation

Follow these steps to set up and run the project locally.

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (version 16.x or later recommended).

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/imsohail07/3d_city.git
   cd 3d_city
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run the Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 🎮 Controls

### Orbit Mode
- **Left-Click + Drag**: Rotate view.
- **Right-Click + Drag**: Pan / Scroll through city.
- **Scroll**: Zoom In/Out.
- **Left-Click on building**: View details and X-Ray mode.

### Top Mode
- **WASD / Arrows**: Move camera along the grid.
- **Scroll**: Zoom.

### Street Mode
- **WASD / Arrows**: Move forward, backward, and strafe.
- **Mouse Drag**: Look around (Yaw/Pitch).

## 🧰 Tech Stack

- **React 19**
- **Three.js** (3D Engine)
- **@react-three/fiber** & **@react-three/drei** (React bindings)
- **Vite** (Build Tool)
- **React Router 7** (Navigation)

---
Built with ❤️ by InfraEye Team
