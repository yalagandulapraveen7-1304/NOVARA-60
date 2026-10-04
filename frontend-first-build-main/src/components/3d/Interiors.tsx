import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import type { BuildingId } from "../../lib/sim/stations";

const WALL = "#cfd6dd";
const FLOOR = "#8d99a5";
const CABINET = "#4e5d6c";

function Room({ size, children }: { size: [number, number, number]; children?: React.ReactNode }) {
  const [w, h, d] = size;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={FLOOR} roughness={0.8} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#b9c2ca" roughness={0.9} />
      </mesh>
      {[
        { p: [0, h / 2, -d / 2], r: 0 },
        { p: [0, h / 2, d / 2], r: Math.PI },
        { p: [-w / 2, h / 2, 0], r: Math.PI / 2 },
        { p: [w / 2, h / 2, 0], r: -Math.PI / 2 },
      ].map((wcfg, i) => (
        <mesh key={i} position={wcfg.p as [number, number, number]} rotation-y={wcfg.r}>
          <planeGeometry args={[i < 2 ? w : d, h]} />
          <meshStandardMaterial color={WALL} roughness={0.85} />
        </mesh>
      ))}
      {/* ceiling lights */}
      {[-w / 4, w / 4].map((x) => (
        <group key={x} position={[x, h - 0.05, 0]}>
          <mesh>
            <boxGeometry args={[2.4, 0.08, 0.4]} />
            <meshStandardMaterial color="#ffffff" emissive="#eef4ff" emissiveIntensity={2.2} />
          </mesh>
          <pointLight intensity={14} distance={18} color="#dfe8ff" position={[0, -0.4, 0]} />
        </group>
      ))}
      {children}
    </group>
  );
}

function GeneratorUnit({ position, failed }: { position: [number, number, number]; failed?: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[3.4, 2, 1.6]} />
        <meshStandardMaterial color={failed ? "#8a3a30" : "#c9562f"} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.8, 10]} />
        <meshStandardMaterial color="#3a4148" metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.4, 0.82]}>
        <boxGeometry args={[1.4, 0.5, 0.04]} />
        <meshStandardMaterial color={failed ? "#ff4030" : "#3fe08a"} emissive={failed ? "#ff4030" : "#3fe08a"} emissiveIntensity={1.4} />
      </mesh>
      {/* radiator grille */}
      <mesh position={[1.72, 1, 0]}>
        <boxGeometry args={[0.05, 1.6, 1.3]} />
        <meshStandardMaterial color="#2c3238" metalness={0.7} />
      </mesh>
    </group>
  );
}

function CabinetRow({ position, count }: { position: [number, number, number]; count: number }) {
  return (
    <group position={position}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[i * 1.1, 1.1, 0]} castShadow>
          <boxGeometry args={[1, 2.2, 0.7]} />
          <meshStandardMaterial color={CABINET} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function MonitorWall({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[(i % 3) * 1.4 - 1.4, 2.4 - Math.floor(i / 3) * 0.9, 0]}>
          <boxGeometry args={[1.2, 0.7, 0.06]} />
          <meshStandardMaterial color="#0a1622" emissive={i % 2 ? "#1e6f8f" : "#1e8f5f"} emissiveIntensity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Pipes({ length, position }: { length: number; position: [number, number, number] }) {
  return (
    <group position={position}>
      {[0, 0.25, 0.5].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.07, 0.07, length, 8]} />
          <meshStandardMaterial color={y === 0.25 ? "#c9562f" : "#9aa6b2"} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export function InteriorScene({ building, gen1Failed }: { building: BuildingId; gen1Failed: boolean }) {
  if (building === "power") {
    return (
      <Room size={[22, 5, 14]}>
        <GeneratorUnit position={[-6, 0, -4]} failed={gen1Failed} />
        <GeneratorUnit position={[-6, 0, 0]} />
        <GeneratorUnit position={[-6, 0, 4]} />
        <CabinetRow position={[2, 0, -6.2]} count={8} />
        <CabinetRow position={[2, 0, 6.2]} count={8} />
        <MonitorWall position={[10.9, 0, 0]} />
        <Pipes length={20} position={[0, 4.2, -3]} />
        <Pipes length={20} position={[0, 4.2, 3]} />
        {/* cable trays */}
        <mesh position={[0, 4.6, 0]}>
          <boxGeometry args={[20, 0.08, 0.6]} />
          <meshStandardMaterial color="#6a747e" metalness={0.7} />
        </mesh>
      </Room>
    );
  }
  if (building === "main") {
    return (
      <Room size={[30, 4.5, 16]}>
        {/* corridor spine */}
        <mesh position={[0, 0.01, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[30, 3]} />
          <meshStandardMaterial color="#a8b3bd" roughness={0.7} />
        </mesh>
        {/* lab benches */}
        {[-10, -6].map((x) => (
          <group key={x} position={[x, 0, -5]}>
            <mesh position={[0, 0.9, 0]} castShadow>
              <boxGeometry args={[3, 0.1, 1.2]} />
              <meshStandardMaterial color="#e8ecf0" roughness={0.4} />
            </mesh>
            {[-1.2, 1.2].map((lx) => (
              <mesh key={lx} position={[lx, 0.45, 0]}>
                <boxGeometry args={[0.1, 0.9, 1]} />
                <meshStandardMaterial color={CABINET} />
              </mesh>
            ))}
            <mesh position={[0, 1.3, 0]}>
              <boxGeometry args={[0.8, 0.5, 0.5]} />
              <meshStandardMaterial color="#20303f" emissive="#1e6f8f" emissiveIntensity={0.7} />
            </mesh>
          </group>
        ))}
        {/* control room consoles */}
        {[6, 9, 12].map((x) => (
          <group key={x} position={[x, 0, -5]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <boxGeometry args={[2, 1.2, 0.9]} />
              <meshStandardMaterial color={CABINET} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.5, -0.2]} rotation-x={-0.3}>
              <boxGeometry args={[1.6, 0.9, 0.06]} />
              <meshStandardMaterial color="#0a1622" emissive="#1e8f5f" emissiveIntensity={0.9} />
            </mesh>
          </group>
        ))}
        <MonitorWall position={[14.9, 0, -3]} />
        {/* bunks / accommodation */}
        {[-12, -8, -4].map((x) => (
          <group key={x} position={[x, 0, 5.5]}>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[2.2, 0.25, 1]} />
              <meshStandardMaterial color="#7d8a96" />
            </mesh>
            <mesh position={[0, 1.6, 0]} castShadow>
              <boxGeometry args={[2.2, 0.25, 1]} />
              <meshStandardMaterial color="#7d8a96" />
            </mesh>
          </group>
        ))}
        {/* kitchen */}
        {[6, 9].map((x) => (
          <mesh key={x} position={[x, 0.55, 5.5]} castShadow>
            <boxGeometry args={[2.4, 1.1, 1]} />
            <meshStandardMaterial color="#d8dee3" metalness={0.5} roughness={0.3} />
          </mesh>
        ))}
      </Room>
    );
  }
  // generic interior for other buildings
  return (
    <Room size={[16, 4, 10]}>
      <CabinetRow position={[-6, 0, -4.2]} count={10} />
      {[-4, 0, 4].map((x) => (
        <mesh key={x} position={[x, 0.8, 2]} castShadow>
          <boxGeometry args={[2.4, 1.6, 1.4]} />
          <meshStandardMaterial color="#8d99a5" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      <Pipes length={14} position={[0, 3.4, 0]} />
    </Room>
  );
}

/* WASD + pointer-lock movement inside interiors */
export function InteriorControls() {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    camera.position.set(0, 1.7, 6);
    camera.lookAt(0, 1.5, 0);
    const down = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [camera]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const speed = 6 * dt;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
    if (keys.current["KeyW"]) camera.position.addScaledVector(dir, speed);
    if (keys.current["KeyS"]) camera.position.addScaledVector(dir, -speed);
    if (keys.current["KeyA"]) camera.position.addScaledVector(right, -speed);
    if (keys.current["KeyD"]) camera.position.addScaledVector(right, speed);
    camera.position.y = 1.7;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -14, 14);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -7, 7);
  });
  return <PointerLockControls makeDefault />;
}
