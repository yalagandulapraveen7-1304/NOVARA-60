import { useMemo } from "react";
import * as THREE from "three";

function hash(x: number, z: number) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, z: number) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function Terrain() {
  const geometry = useMemo(() => {
    const size = 400;
    const seg = 128;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes["position"] as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.sqrt(x * x + z * z);
      // flat apron around the station, rolling drifts further out
      const flat = THREE.MathUtils.smoothstep(d, 45, 90);
      let h = 0;
      h += noise(x * 0.02, z * 0.02) * 6;
      h += noise(x * 0.08, z * 0.08) * 1.6;
      h += noise(x * 0.3, z * 0.3) * 0.35;
      pos.setY(i, h * flat - 0.15);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const mountains = useMemo(() => {
    const arr: { pos: [number, number, number]; scale: [number, number, number]; rot: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const angle = (i / 26) * Math.PI * 2 + hash(i, 3) * 0.3;
      const r = 170 + hash(i, 7) * 60;
      const h = 22 + hash(i, 11) * 42;
      arr.push({
        pos: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
        scale: [26 + hash(i, 13) * 30, h, 26 + hash(i, 17) * 30],
        rot: hash(i, 19) * Math.PI,
      });
    }
    return arr;
  }, []);

  const rocks = useMemo(() => {
    const arr: { pos: [number, number, number]; s: number; rot: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const angle = hash(i, 23) * Math.PI * 2;
      const r = 55 + hash(i, 29) * 90;
      arr.push({
        pos: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
        s: 0.6 + hash(i, 31) * 2.4,
        rot: hash(i, 37) * Math.PI,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#dfe8f0" roughness={0.95} metalness={0.02} />
      </mesh>
      {/* distant ice formations / mountains */}
      {mountains.map((m, i) => (
        <mesh key={i} position={[m.pos[0], m.scale[1] * 0.32, m.pos[2]]} rotation-y={m.rot} scale={m.scale}>
          <coneGeometry args={[1, 1, 5]} />
          <meshStandardMaterial color={i % 3 === 0 ? "#b9c9d8" : "#cdd9e4"} roughness={0.9} flatShading />
        </mesh>
      ))}
      {/* exposed rock / ice chunks */}
      {rocks.map((r, i) => (
        <mesh key={`r${i}`} position={[r.pos[0], r.s * 0.3, r.pos[2]]} rotation-y={r.rot} castShadow>
          <dodecahedronGeometry args={[r.s, 0]} />
          <meshStandardMaterial color={i % 4 === 0 ? "#7c8894" : "#c3cfda"} roughness={0.85} flatShading />
        </mesh>
      ))}
    </group>
  );
}
