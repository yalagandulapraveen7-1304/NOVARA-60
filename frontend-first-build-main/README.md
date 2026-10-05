# NOVARA — Antarctic Digital Twin Frontend

Interactive 3D Digital Twin and remote operations dashboard for India's Antarctic research stations **Maitri** (Schirmacher Oasis) and **Bharati** (Larsemann Hills), developed for the Ministry of Earth Sciences (MoES) and National Centre for Polar and Ocean Research (NCPOR).

## Features

- **3D Interactive Station Twins**: High-fidelity 3D station models with realistic polar terrain, sunlight rendering, and building telemetry markers.
- **Real-time Telemetry & Energy Grid**: Power generation (Solar PV, Wind Turbines, Diesel Generators), energy storage (BESS), and life support telemetry.
- **What-If Scenario Simulation**: Crisis response simulation engine modeling generator outages, blizzard conditions, extreme polar cold, and automated load-shedding cascades.
- **Cross-Station Switching**: Live telemetry and asset toggling between Maitri (70°46′S, 11°44′E) and Bharati (69°24′S, 76°11′E).
- **Responsive Layout**: Designed for command center multi-monitor setups, desktops, and field tablets.

## Tech Stack

- **Framework**: TanStack Start / React 18 / TypeScript
- **Bundler & Build**: Vite, Vinxi, Nitro
- **3D Graphics**: Three.js & React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
- **Styling**: Tailwind CSS, Radix UI, Lucide React
- **Data & Query**: TanStack Query (`@tanstack/react-query`)

## Local Development

Ensure you have Node.js 18+ and npm installed:

```bash
cd frontend-first-build-main
npm install
npm run dev
```

The application will start at `http://localhost:3000`.

## Production Build

```bash
npm run build
npm run start
```
