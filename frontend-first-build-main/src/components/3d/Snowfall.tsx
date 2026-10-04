import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSim } from "../../lib/sim/store";

const COUNT = 2500;

export function Snowfall() {
  const ref = useRef<THREE.Points>(null);
  const weather = useSim((s) => s.weather);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 220;
      positions[i * 3 + 1] = Math.random() * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 220;
      speeds[i] = 0.5 + Math.random();
    }
    return { positions, speeds };
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);
    const pos = ref.current.geometry.attributes["position"] as THREE.BufferAttribute;
    const wind = weather === "blizzard" ? 22 : weather === "snow" ? 6 : 2;
    const fall = weather === "blizzard" ? 14 : weather === "snow" ? 5 : 1.6;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const sp = speeds[i] ?? 1;
      let y = pos.getY(i) - fall * sp * dt;
      let x = pos.getX(i) + (wind * sp * dt + Math.sin(t + i) * dt * 0.6);
      if (y < 0) y = 60;
      if (x > 110) x = -110;
      pos.setY(i, y);
      pos.setX(i, x);
    }
    pos.needsUpdate = true;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = weather === "clear" ? 0.15 : weather === "blizzard" ? 0.95 : weather === "snow" ? 0.8 : 0.35;
    mat.size = weather === "blizzard" ? 0.32 : 0.22;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#eef4fa" size={0.22} transparent opacity={0.8} sizeAttenuation depthWrite={false} />
    </points>
  );
}
