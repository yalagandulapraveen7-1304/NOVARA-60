import { Suspense, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Sky, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { STATIONS } from "../../lib/sim/stations";
import { useSim, type CameraMode } from "../../lib/sim/store";
import { Terrain } from "./Terrain";
import { Snowfall } from "./Snowfall";
import { Building, SolarArray, WindTurbine, FuelTank, BatteryBank, Vehicle, CommTower, WeatherMast, EnergyFlow } from "./StationAssets";
import { InteriorScene, InteriorControls } from "./Interiors";

const CAMERA_PRESETS: Record<CameraMode, { pos: [number, number, number]; target: [number, number, number] }> = {
  overview: { pos: [52, 38, 52], target: [0, 2, 0] },
  energy: { pos: [-38, 22, 34], target: [-20, 3, 10] },
  infrastructure: { pos: [30, 26, -34], target: [0, 4, 0] },
  environment: { pos: [44, 14, 14], target: [30, 5, 2] },
  logistics: { pos: [26, 18, -30], target: [12, 2, -8] },
  emergency: { pos: [-34, 16, 22], target: [-24, 3, 8] },
};

function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null);
  const cameraMode = useSim((s) => s.cameraMode);
  const focusTarget = useSim((s) => s.focusTarget);
  const focusNonce = useSim((s) => s.focusNonce);
  const stationId = useSim((s) => s.stationId);
  const { camera } = useThree();
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    const st = STATIONS[stationId];
    let preset = CAMERA_PRESETS[cameraMode];
    if (focusTarget) {
      const b = st.buildings.find((x) => x.id === focusTarget);
      if (b) {
        preset = {
          pos: [b.position[0] + 18, 12, b.position[2] + 18],
          target: [b.position[0], 3, b.position[2]],
        };
      } else if (focusTarget === "weather") {
        const wb = st.buildings.find((x) => x.id === "weather")!;
        preset = { pos: [wb.position[0] + 14, 9, wb.position[2] + 14], target: [wb.position[0], 4, wb.position[2]] };
      }
    }
    goal.current = { pos: new THREE.Vector3(...preset.pos), target: new THREE.Vector3(...preset.target) };
  }, [cameraMode, focusTarget, focusNonce, stationId]);

  useEffect(() => {
    let raf: number;
    const step = () => {
      if (goal.current && controls.current) {
        camera.position.lerp(goal.current.pos, 0.06);
        controls.current.target.lerp(goal.current.target, 0.06);
        controls.current.update();
        if (camera.position.distanceTo(goal.current.pos) < 0.3) goal.current = null;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [camera]);

  return <OrbitControls ref={controls} makeDefault maxPolarAngle={Math.PI / 2.05} minDistance={8} maxDistance={160} enableDamping dampingFactor={0.08} />;
}

function Station() {
  const stationId = useSim((s) => s.stationId);
  const cameraMode = useSim((s) => s.cameraMode);
  const telemetry = useSim((s) => s.telemetry);
  const st = STATIONS[stationId];

  const hl = (cat: string) =>
    cameraMode === "energy" ? cat === "energy" : cameraMode === "environment" ? cat === "environment" : cameraMode === "logistics" ? cat === "logistics" : cameraMode === "infrastructure" ? cat === "infrastructure" : false;
  const dim = (cat: string) => cameraMode !== "overview" && cameraMode !== "emergency" && !hl(cat);

  const power = st.buildings.find((b) => b.id === "power")!;
  const main = st.buildings.find((b) => b.id === "main")!;
  const solarMid = st.solarPanels[Math.floor(st.solarPanels.length / 2)]!.position;
  const windMid = st.windTurbines[0]!;
  const showFlow = cameraMode === "energy" || cameraMode === "overview" || cameraMode === "emergency";

  return (
    <group>
      {st.buildings.map((b) => (
        <Building key={b.id} def={b} highlighted={hl(b.category)} dimmed={dim(b.category)} />
      ))}
      {st.solarPanels.map((p, i) => (
        <SolarArray key={`s${i}`} position={p.position} rotation={p.rotation} highlighted={cameraMode === "energy"} />
      ))}
      {st.windTurbines.map((p, i) => (
        <WindTurbine key={`w${i}`} position={p} highlighted={cameraMode === "energy"} />
      ))}
      {st.fuelTanks.map((p, i) => (
        <FuelTank key={`f${i}`} position={p} highlighted={cameraMode === "logistics" || cameraMode === "energy"} />
      ))}
      <BatteryBank position={st.batteryBank} highlighted={cameraMode === "energy" || cameraMode === "emergency"} />
      {st.vehicles.map((v, i) => (
        <Vehicle key={`v${i}`} position={v.position} rotation={v.rotation} kind={v.kind} highlighted={cameraMode === "logistics"} />
      ))}
      <CommTower position={st.commTower} highlighted={cameraMode === "infrastructure"} />
      <WeatherMast position={st.buildings.find((b) => b.id === "weather")!.position} highlighted={cameraMode === "environment"} />

      {/* power cables between buildings */}
      {showFlow && (
        <>
          <EnergyFlow from={solarMid} to={power.position} active={telemetry.solarKw > 20} color="#ffd23c" intensity={telemetry.solarKw / 300} />
          <EnergyFlow from={windMid} to={power.position} active={telemetry.windKw > 20} color="#3fd3ff" intensity={telemetry.windKw / 300} />
          <EnergyFlow from={st.batteryBank} to={power.position} active={telemetry.batteryOnline} color="#3fe08a" intensity={1} />
          <EnergyFlow from={power.position} to={main.position} active color="#3fd3ff" intensity={1.2} />
        </>
      )}
    </group>
  );
}

function SkyAndLight() {
  const weather = useSim((s) => s.weather);
  const simHour = useSim((s) => s.simHour);
  const dayF = Math.max(0.08, Math.sin(((simHour - 4) / 20) * Math.PI));
  const stormy = weather === "blizzard";
  const sunPos: [number, number, number] = [Math.cos((simHour / 24) * Math.PI * 2) * 100, Math.max(6, dayF * 60), 40];
  const fogColor = stormy ? "#5a6470" : weather === "extremeCold" ? "#c8d8e8" : "#aebccb";
  const fogNear = stormy ? 20 : 60;
  const fogFar = stormy ? 120 : 320;
  return (
    <>
      <Sky distance={4000} sunPosition={sunPos} turbidity={stormy ? 20 : 8} rayleigh={stormy ? 4 : 1.6} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      <ambientLight intensity={stormy ? 0.5 : 0.7 * dayF + 0.25} color="#cfe0f0" />
      <directionalLight
        position={sunPos}
        intensity={stormy ? 0.5 : 1.6 * dayF + 0.2}
        color={dayF < 0.25 ? "#ffb27a" : "#fff4e0"}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <Environment resolution={64}>
        <Lightformer intensity={1.4} position={[0, 8, 0]} scale={[20, 20, 1]} color="#dfeaf5" />
        <Lightformer intensity={0.7} color="#9fb8cc" position={[-8, 2, -2]} rotation-y={Math.PI / 2} scale={[24, 2, 1]} />
      </Environment>
    </>
  );
}

export function StationScene({ interior, gen1Failed, onExitInterior }: { interior: string | null; gen1Failed: boolean; onExitInterior: () => void }) {
  const selectBuilding = useSim((s) => s.selectBuilding);
  const mapView = useSim((s) => s.mapView);

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [52, 38, 52], fov: 50, near: 0.5, far: 900 }}
      gl={{ antialias: true }}
      onPointerMissed={() => selectBuilding(null)}
    >
      <Suspense fallback={null}>
        {interior ? (
          <>
            <color attach="background" args={["#141a20"]} />
            <ambientLight intensity={0.5} />
            <InteriorScene building={interior as never} gen1Failed={gen1Failed} />
            <InteriorControls />
          </>
        ) : mapView ? (
          <>
            <color attach="background" args={["#0b1420"]} />
            <ambientLight intensity={1.2} />
            <Station />
            <TopDownCamera />
          </>
        ) : (
          <>
            <SkyAndLight />
            <Terrain />
            <Snowfall />
            <Station />
            <CameraRig />
          </>
        )}
      </Suspense>
      {interior && <ExitInteriorHandler onExit={onExitInterior} />}
    </Canvas>
  );
}

function TopDownCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 120, 0.01);
    camera.lookAt(0, 0, 0);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
  }, [camera]);
  return <OrbitControls makeDefault enableRotate={false} minDistance={40} maxDistance={200} />;
}

function ExitInteriorHandler({ onExit }: { onExit: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Escape") onExit();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onExit]);
  return null;
}
