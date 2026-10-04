import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Edges } from "@react-three/drei";
import * as THREE from "three";
import type { BuildingDef } from "../../lib/sim/stations";
import { useSim } from "../../lib/sim/store";

const CYAN = "#3fd3ff";
const STEEL = "#7d8a96";

/* ---------------- Building ---------------- */
export function Building({ def, highlighted, dimmed }: { def: BuildingDef; highlighted: boolean; dimmed: boolean }) {
  const selected = useSim((s) => s.selectedBuilding === def.id);
  const selectBuilding = useSim((s) => s.selectBuilding);
  const gen1 = useSim((s) => s.telemetry.gen1);
  const batteryOnline = useSim((s) => s.telemetry.batteryOnline);
  const fault = def.id === "power" && (gen1 === "failed" || !batteryOnline);
  const [w, h, d] = def.size;
  const stiltH = def.id === "main" ? 2.2 : 0.4;
  const panels = Math.floor(w / 2.2);

  return (
    <group
      position={def.position}
      onClick={(e) => {
        e.stopPropagation();
        selectBuilding(def.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      {/* stilts (Antarctic buildings elevated against drift) */}
      {def.id === "main" &&
        Array.from({ length: 6 }).map((_, i) =>
          [-1, 1].map((side) => (
            <mesh key={`${i}${side}`} position={[-w / 2 + 1.5 + (i * (w - 3)) / 5, stiltH / 2, (side * d) / 2.6]} castShadow>
              <cylinderGeometry args={[0.28, 0.32, stiltH, 10]} />
              <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.35} />
            </mesh>
          )),
        )}
      {/* main body */}
      <mesh position={[0, stiltH + h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={fault ? "#d68a7a" : def.color}
          roughness={0.55}
          metalness={0.25}
          transparent={dimmed}
          opacity={dimmed ? 0.35 : 1}
        />
        {(selected || highlighted || fault) && (
          <Edges color={fault ? "#ff5a3c" : CYAN} lineWidth={selected ? 2.5 : 1.5} threshold={15} />
        )}
      </mesh>
      {/* insulated panel seams */}
      {Array.from({ length: panels }).map((_, i) => (
        <mesh key={`seam${i}`} position={[-w / 2 + (i + 1) * (w / (panels + 1)), stiltH + h / 2, d / 2 + 0.02]}>
          <boxGeometry args={[0.06, h * 0.98, 0.04]} />
          <meshStandardMaterial color="#8e9ba8" roughness={0.6} />
        </mesh>
      ))}
      {/* windows */}
      {def.id !== "weather" &&
        Array.from({ length: Math.max(2, Math.floor(w / 3.2)) }).map((_, i, arr) => (
          <mesh key={`win${i}`} position={[-w / 2 + (i + 0.5) * (w / arr.length), stiltH + h * 0.62, d / 2 + 0.05]}>
            <boxGeometry args={[1.1, 0.9, 0.05]} />
            <meshStandardMaterial color="#20384d" emissive="#f2c27a" emissiveIntensity={0.35} metalness={0.9} roughness={0.08} />
          </mesh>
        ))}
      {/* roof trim */}
      <mesh position={[0, stiltH + h + 0.12, 0]} castShadow>
        <boxGeometry args={[w + 0.4, 0.24, d + 0.4]} />
        <meshStandardMaterial color="#5f6b77" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* roof snow */}
      <mesh position={[0, stiltH + h + 0.32, 0]}>
        <boxGeometry args={[w, 0.18, d]} />
        <meshStandardMaterial color="#f2f6fa" roughness={1} />
      </mesh>
      {/* rooftop HVAC units */}
      {(def.id === "main" || def.id === "power") &&
        [-w / 4, w / 4].map((x, i) => (
          <mesh key={`hvac${i}`} position={[x, stiltH + h + 0.9, -d / 4]} castShadow>
            <boxGeometry args={[2, 1, 1.6]} />
            <meshStandardMaterial color="#9aa6b2" metalness={0.7} roughness={0.35} />
          </mesh>
        ))}
      {/* exhaust stacks on power house */}
      {def.id === "power" &&
        [-2, 0, 2].map((x) => (
          <mesh key={`stack${x}`} position={[x, stiltH + h + 1.8, d / 4]} castShadow>
            <cylinderGeometry args={[0.25, 0.25, 3.2, 12]} />
            <meshStandardMaterial color="#454d55" metalness={0.8} roughness={0.4} />
          </mesh>
        ))}
      {/* door */}
      <mesh position={[w / 2 - 1.5, stiltH + 1.1, d / 2 + 0.06]}>
        <boxGeometry args={[1.2, 2.2, 0.06]} />
        <meshStandardMaterial color="#c9562f" roughness={0.5} />
      </mesh>
      {/* stair for main */}
      {def.id === "main" && (
        <mesh position={[w / 2 - 1.5, stiltH / 2, d / 2 + 1.4]} rotation-x={-0.6} castShadow>
          <boxGeometry args={[1.4, 0.15, 3]} />
          <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.4} />
        </mesh>
      )}
      <Html position={[0, stiltH + h + 2.6, 0]} center distanceFactor={60} zIndexRange={[10, 0]}>
        <div className={`asset-tag ${selected ? "asset-tag-active" : ""} ${fault ? "asset-tag-fault" : ""}`}>
          {def.short}
        </div>
      </Html>
    </group>
  );
}

/* ---------------- Solar array ---------------- */
export function SolarArray({ position, rotation, highlighted }: { position: [number, number, number]; rotation: number; highlighted: boolean }) {
  return (
    <group position={position} rotation-y={rotation}>
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, 0.7, 0.6]} castShadow>
          <boxGeometry args={[0.12, 1.4, 0.12]} />
          <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 1.3, 0]} rotation-x={-0.9} castShadow>
        <boxGeometry args={[5, 0.08, 3]} />
        <meshStandardMaterial color="#14243a" metalness={0.85} roughness={0.15} emissive={highlighted ? CYAN : "#000"} emissiveIntensity={highlighted ? 0.25 : 0} />
      </mesh>
      <mesh position={[0, 1.34, 0]} rotation-x={-0.9}>
        <boxGeometry args={[5.05, 0.02, 3.05]} />
        <meshStandardMaterial color="#9fb0c0" wireframe />
      </mesh>
    </group>
  );
}

/* ---------------- Wind turbine ---------------- */
export function WindTurbine({ position, highlighted }: { position: [number, number, number]; highlighted: boolean }) {
  const rotor = useRef<THREE.Group>(null);
  const windSpeed = useSim((s) => s.telemetry.windSpeed);
  useFrame((_, delta) => {
    if (rotor.current) rotor.current.rotation.z += Math.min(delta, 0.05) * (windSpeed / 12);
  });
  return (
    <group position={position}>
      <mesh position={[0, 9, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.45, 18, 14]} />
        <meshStandardMaterial color="#e6ebf0" metalness={0.3} roughness={0.4} emissive={highlighted ? CYAN : "#000"} emissiveIntensity={highlighted ? 0.2 : 0} />
      </mesh>
      <mesh position={[0, 18.2, 0.3]} castShadow>
        <boxGeometry args={[0.8, 0.8, 2]} />
        <meshStandardMaterial color="#d4dbe2" metalness={0.4} roughness={0.35} />
      </mesh>
      <group ref={rotor} position={[0, 18.2, 1.4]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-z={(i * Math.PI * 2) / 3} position={[0, 0, 0]}>
            <boxGeometry args={[0.35, 7, 0.08]} />
            <meshStandardMaterial color="#f1f4f7" roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ---------------- Fuel tank ---------------- */
export function FuelTank({ position, highlighted }: { position: [number, number, number]; highlighted: boolean }) {
  const fuelPct = useSim((s) => s.telemetry.fuelPct);
  const low = fuelPct < 15;
  return (
    <group position={position}>
      <mesh position={[0, 1.8, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[1.6, 1.6, 6, 24]} />
        <meshStandardMaterial color={low ? "#c98a3a" : "#c9d2da"} metalness={0.7} roughness={0.3} />
        {(highlighted || low) && <Edges color={low ? "#ff9b3c" : CYAN} threshold={30} />}
      </mesh>
      {[-2.2, 2.2].map((x) => (
        <mesh key={x} position={[x, 0.4, 0]}>
          <boxGeometry args={[0.4, 0.8, 2.8]} />
          <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- Battery bank ---------------- */
export function BatteryBank({ position, highlighted }: { position: [number, number, number]; highlighted: boolean }) {
  const online = useSim((s) => s.telemetry.batteryOnline);
  const soc = useSim((s) => s.telemetry.batterySoc);
  return (
    <group position={position}>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[-3 + i * 2, 1.1, 0]} castShadow>
          <boxGeometry args={[1.7, 2.2, 1.4]} />
          <meshStandardMaterial color={online ? "#4e5d6c" : "#7a3a32"} metalness={0.6} roughness={0.35} />
          {(highlighted || !online) && <Edges color={online ? CYAN : "#ff5a3c"} threshold={15} />}
        </mesh>
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`led${i}`} position={[-3 + i * 2, 1.8, 0.72]}>
          <boxGeometry args={[1.2, 0.12, 0.02]} />
          <meshStandardMaterial
            color={online ? (soc > 30 ? "#3fe08a" : "#ffb03c") : "#ff4030"}
            emissive={online ? (soc > 30 ? "#3fe08a" : "#ffb03c") : "#ff4030"}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- Vehicles ---------------- */
export function Vehicle({ position, rotation, kind, highlighted }: { position: [number, number, number]; rotation: number; kind: "tracked" | "snow"; highlighted: boolean }) {
  const body = kind === "tracked" ? "#c9562f" : "#d9a12f";
  return (
    <group position={position} rotation-y={rotation}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0.45, s * 1.1]} castShadow>
          <boxGeometry args={[kind === "tracked" ? 4.4 : 3, 0.9, 0.6]} />
          <meshStandardMaterial color="#25292d" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[kind === "tracked" ? 4 : 2.6, 1.2, 1.8]} />
        <meshStandardMaterial color={body} roughness={0.5} metalness={0.3} />
        {highlighted && <Edges color={CYAN} threshold={15} />}
      </mesh>
      <mesh position={[0.6, 2.4, 0]} castShadow>
        <boxGeometry args={[kind === "tracked" ? 2 : 1.4, 0.9, 1.6]} />
        <meshStandardMaterial color={body} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[1.62, 2.4, 0]}>
        <boxGeometry args={[0.05, 0.6, 1.3]} />
        <meshStandardMaterial color="#1a2a3a" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

/* ---------------- Comm tower ---------------- */
export function CommTower({ position, highlighted }: { position: [number, number, number]; highlighted: boolean }) {
  const dish = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (dish.current) dish.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.1) * 0.4;
  });
  const lattice = useMemo(() => Array.from({ length: 10 }), []);
  return (
    <group position={position}>
      {[-0.6, 0.6].map((x) =>
        [-0.6, 0.6].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 8, z]} castShadow>
            <boxGeometry args={[0.1, 16, 0.1]} />
            <meshStandardMaterial color="#c43d2c" metalness={0.6} roughness={0.4} emissive={highlighted ? CYAN : "#000"} emissiveIntensity={highlighted ? 0.3 : 0} />
          </mesh>
        )),
      )}
      {lattice.map((_, i) => (
        <mesh key={i} position={[0, 1 + i * 1.6, 0]}>
          <boxGeometry args={[1.3, 0.06, 1.3]} />
          <meshStandardMaterial color={i % 2 ? "#e8ecef" : "#c43d2c"} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 16.4, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#ff3a2a" emissive="#ff3a2a" emissiveIntensity={2} />
      </mesh>
      <group ref={dish} position={[3.4, 1.6, 2]}>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 1.6, 8]} />
          <meshStandardMaterial color={STEEL} metalness={0.7} />
        </mesh>
        <mesh position={[0, 2, 0]} rotation-x={-0.8}>
          <sphereGeometry args={[1.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3.5]} />
          <meshStandardMaterial color="#eef2f5" metalness={0.4} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* radome */}
      <mesh position={[-3, 2, -1]} castShadow>
        <sphereGeometry args={[1.7, 24, 16]} />
        <meshStandardMaterial color="#f4f6f8" roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ---------------- Weather mast ---------------- */
export function WeatherMast({ position, highlighted }: { position: [number, number, number]; highlighted: boolean }) {
  const cups = useRef<THREE.Group>(null);
  const vane = useRef<THREE.Group>(null);
  const windSpeed = useSim((s) => s.telemetry.windSpeed);
  useFrame((s, delta) => {
    if (cups.current) cups.current.rotation.y += Math.min(delta, 0.05) * windSpeed * 0.25;
    if (vane.current) vane.current.rotation.y = -0.8 + Math.sin(s.clock.elapsedTime * 0.7) * 0.15;
  });
  return (
    <group position={[position[0] + 4, 0, position[2] + 3]}>
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 8, 8]} />
        <meshStandardMaterial color="#d8dee3" metalness={0.7} emissive={highlighted ? CYAN : "#000"} emissiveIntensity={highlighted ? 0.4 : 0} />
      </mesh>
      <group ref={cups} position={[0, 8.2, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.cos((i * Math.PI * 2) / 3) * 0.5, 0, Math.sin((i * Math.PI * 2) / 3) * 0.5]}>
            <sphereGeometry args={[0.13, 8, 6]} />
            <meshStandardMaterial color="#2a3036" />
          </mesh>
        ))}
      </group>
      <group ref={vane} position={[0, 7.4, 0]}>
        <mesh position={[0.5, 0, 0]}>
          <boxGeometry args={[1.2, 0.05, 0.05]} />
          <meshStandardMaterial color="#2a3036" />
        </mesh>
        <mesh position={[1.1, 0, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.02]} />
          <meshStandardMaterial color="#c9562f" />
        </mesh>
      </group>
      {/* Stevenson screen */}
      <mesh position={[0, 3, 0.4]} castShadow>
        <boxGeometry args={[0.7, 0.7, 0.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      {/* radiation sensor */}
      <mesh position={[0, 6, -0.4]} rotation-x={-Math.PI / 2}>
        <cylinderGeometry args={[0.2, 0.2, 0.08, 12]} />
        <meshStandardMaterial color="#20303f" metalness={0.8} />
      </mesh>
    </group>
  );
}

/* ---------------- Energy flow lines ---------------- */
export function EnergyFlow({ from, to, active, color = CYAN, intensity = 1 }: { from: [number, number, number]; to: [number, number, number]; active: boolean; color?: string; intensity?: number }) {
  const dots = useRef<THREE.InstancedMesh>(null);
  const N = 8;
  const curve = useMemo(() => {
    const a = new THREE.Vector3(from[0], 0.6, from[2]);
    const b = new THREE.Vector3(to[0], 0.6, to[2]);
    const mid = a.clone().lerp(b, 0.5);
    mid.y = 2.5;
    return new THREE.QuadraticBezierCurve3(a, mid, b);
  }, [from, to]);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 32, 0.06, 6, false), [curve]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((s) => {
    if (!dots.current) return;
    for (let i = 0; i < N; i++) {
      const t = ((s.clock.elapsedTime * 0.25 * intensity + i / N) % 1 + 1) % 1;
      const p = curve.getPoint(t);
      tmp.position.copy(p);
      tmp.scale.setScalar(active ? 1 : 0);
      tmp.updateMatrix();
      dots.current.setMatrixAt(i, tmp.matrix);
    }
    dots.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <mesh geometry={tube}>
        <meshBasicMaterial color={active ? color : "#55606b"} transparent opacity={active ? 0.45 : 0.25} />
      </mesh>
      <instancedMesh ref={dots} args={[undefined, undefined, N]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
