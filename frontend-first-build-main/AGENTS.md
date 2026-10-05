# Development Guidelines for NOVARA

## Project Overview
This repository contains the frontend web application for NOVARA, the Antarctic Digital Twin operations platform for India's Antarctic research stations (Maitri & Bharati).

## Key Guidelines
- **Simulation Fidelity**: Ensure all displayed metrics and simulated scenarios are accurately marked as `SIMULATION DATA`.
- **Component Hierarchy**: The primary views are 3D Station Twin, Real-Time Telemetry Grid, Environmental Sensors, Life Support, Energy Management, and Scenario Simulation Analytics.
- **Type Safety**: Strictly maintain TypeScript interfaces for station data, assets, and telemetry.
- **Performance**: Maintain 60fps in the WebGL/Three.js viewport through optimized geometry instancing, texture reuse, and throttled state updates.
