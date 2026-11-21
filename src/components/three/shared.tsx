/**
 * Shared low-poly building blocks for the 3D scenes (hero film + scroll story).
 * Brand palette only. Cheap materials (Lambert/Basic), no shadow maps: soft "contact
 * shadows" are radial-gradient decals.
 */
import { forwardRef, type ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export const COL = {
  navy: '#0E1B2C', navy8: '#16263B', navy7: '#22344C', navy6: '#33465F', teal: '#12B5A6', tealSoft: '#DDF4F1',
  orange: '#FF6A3D', orangeSoft: '#FFE6DD', cloud: '#F4F6F8', line: '#D9DEE4', edge: '#C5CDD6', white: '#FFFFFF', glass: '#BFE8E3', slate: '#5A6675',
};

export type Vec = [number, number, number];
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const easeOut = (v: number) => 1 - Math.pow(1 - v, 3);
export const easeIn = (v: number) => v * v * v;
export const easeInOut = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
export const sineInOut = (v: number) => -(Math.cos(Math.PI * v) - 1) / 2;
export const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const lerp = THREE.MathUtils.lerp;

export const Lam = ({ c, ...rest }: { c: string } & Record<string, unknown>) => <meshLambertMaterial color={c} {...rest} />;

let blobTex: THREE.Texture | null = null;
export function blobTexture() {
  if (blobTex) return blobTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grd.addColorStop(0, 'rgba(14,27,44,0.42)');
  grd.addColorStop(1, 'rgba(14,27,44,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  blobTex = new THREE.CanvasTexture(c);
  return blobTex;
}

/** Soft contact shadow decal. */
export function Blob({ w, d, position, opacity = 1 }: { w: number; d: number; position: Vec; opacity?: number }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={position} renderOrder={1}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial map={blobTexture()} transparent depthWrite={false} opacity={opacity} />
    </mesh>
  );
}

let barTex: THREE.Texture | null = null;
export function barcodeTexture() {
  if (barTex) return barTex;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 88;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 88);
  g.fillStyle = COL.navy;
  let x = 12;
  [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1].forEach((w, i) => { if (i % 2 === 0) g.fillRect(x, 12, w * 2.4, 44); x += w * 2.4 + 2; });
  g.fillStyle = COL.teal; g.fillRect(12, 66, 80, 8);
  barTex = new THREE.CanvasTexture(c);
  barTex.colorSpace = THREE.SRGBColorSpace;
  return barTex;
}

/** Charging-plug decal (white) for vehicle sides. */
export function Plug({ position, scale = 1 }: { position: Vec; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh><boxGeometry args={[0.2, 0.17, 0.012]} /><Lam c={COL.white} /></mesh>
      {[-0.05, 0.05].map((x) => (
        <mesh key={x} position={[x, 0.13, 0]}><boxGeometry args={[0.03, 0.1, 0.012]} /><Lam c={COL.white} /></mesh>
      ))}
      <mesh position={[0, -0.14, 0]}><boxGeometry args={[0.03, 0.12, 0.012]} /><Lam c={COL.white} /></mesh>
    </group>
  );
}

function Wheels({ xs, z, r = 0.27 }: { xs: number[]; z: number; r?: number }) {
  return (
    <>
      {xs.flatMap((x) => [z, -z].map((zz) => (
        <group key={`${x}${zz}`} position={[x, r, zz]} rotation-x={Math.PI / 2}>
          <mesh><cylinderGeometry args={[r, r, 0.18, 16]} /><Lam c={COL.navy} /></mesh>
          <mesh><cylinderGeometry args={[r * 0.45, r * 0.45, 0.2, 12]} /><Lam c={COL.cloud} /></mesh>
        </group>
      )))}
    </>
  );
}

/**
 * Electric cargo van facing +x (rear at x ≈ -1.25). Navy body, teal stripe, plug icon.
 * Pass refs for the rear doors (hinged on the outer edges) to animate them.
 */
export const VanModel = forwardRef<THREE.Group, { doorL?: React.Ref<THREE.Group>; doorR?: React.Ref<THREE.Group>; children?: ReactNode }>(
  function VanModel({ doorL, doorR, children }, ref) {
    return (
      <group ref={ref}>
        <Blob w={3.4} d={1.8} position={[0, 0.012, 0]} opacity={0.9} />
        <RoundedBox args={[2.0, 1.15, 1.1]} radius={0.16} smoothness={3} position={[-0.25, 0.86, 0]}><Lam c={COL.navy} /></RoundedBox>
        <RoundedBox args={[0.78, 0.8, 1.06]} radius={0.16} smoothness={3} position={[0.95, 0.68, 0]}><Lam c={COL.navy} /></RoundedBox>
        <mesh position={[1.12, 0.98, 0]} rotation-z={-0.5}><boxGeometry args={[0.04, 0.42, 0.92]} /><Lam c={COL.glass} /></mesh>
        <mesh position={[0.86, 0.92, 0]}><boxGeometry args={[0.3, 0.26, 1.075]} /><Lam c={COL.glass} /></mesh>
        <mesh position={[0.1, 0.6, 0]}><boxGeometry args={[2.66, 0.12, 1.12]} /><Lam c={COL.teal} /></mesh>
        <Plug position={[-0.45, 1.0, 0.556]} />
        <Plug position={[-0.45, 1.0, -0.556]} />
        {/* cargo interior (visible when doors are open) */}
        <mesh position={[-1.255, 0.86, 0]}><boxGeometry args={[0.01, 0.95, 0.9]} /><Lam c={COL.navy8} /></mesh>
        <group ref={doorL} position={[-1.26, 0.86, 0.5]}>
          <mesh position={[0, 0, -0.245]}><boxGeometry args={[0.04, 0.98, 0.49]} /><Lam c={COL.navy7} /></mesh>
        </group>
        <group ref={doorR} position={[-1.26, 0.86, -0.5]}>
          <mesh position={[0, 0, 0.245]}><boxGeometry args={[0.04, 0.98, 0.49]} /><Lam c={COL.navy7} /></mesh>
        </group>
        <Wheels xs={[-0.8, 0.85]} z={0.5} />
        {children}
      </group>
    );
  },
);

/** Small hatchback, navy with teal stripe and plug, facing +x. */
export const CarModel = forwardRef<THREE.Group, { lid?: React.Ref<THREE.Group> }>(function CarModel({ lid }, ref) {
  return (
    <group ref={ref}>
      <Blob w={2.6} d={1.5} position={[0, 0.012, 0]} opacity={0.85} />
      <RoundedBox args={[2.0, 0.55, 0.95]} radius={0.14} smoothness={3} position={[0, 0.5, 0]}><Lam c={COL.navy} /></RoundedBox>
      <RoundedBox args={[1.1, 0.45, 0.88]} radius={0.14} smoothness={3} position={[-0.15, 0.92, 0]}><Lam c={COL.navy} /></RoundedBox>
      <mesh position={[-0.15, 0.95, 0]}><boxGeometry args={[1.0, 0.28, 0.9]} /><Lam c={COL.glass} /></mesh>
      <mesh position={[0, 0.42, 0]}><boxGeometry args={[2.02, 0.08, 0.97]} /><Lam c={COL.teal} /></mesh>
      <Plug position={[0.45, 0.6, 0.48]} scale={0.7} />
      <group ref={lid} position={[-0.72, 1.12, 0]}>
        <mesh position={[-0.12, -0.12, 0]} rotation-z={0.6}><boxGeometry args={[0.04, 0.38, 0.86]} /><Lam c={COL.navy7} /></mesh>
      </group>
      <Wheels xs={[-0.62, 0.62]} z={0.44} r={0.22} />
    </group>
  );
});

/** Branded Kinematics parcel: Cloud box, teal tape. Origin at the box centre. */
export function ParcelMesh({ w = 0.56, h = 0.42, d = 0.46, tape = true }: { w?: number; h?: number; d?: number; tape?: boolean }) {
  return (
    <group>
      <RoundedBox args={[w, h, d]} radius={0.025} smoothness={2}><Lam c={COL.cloud} /></RoundedBox>
      {tape && <mesh><boxGeometry args={[w * 0.18, h + 0.004, d + 0.004]} /><Lam c={COL.teal} /></mesh>}
    </group>
  );
}
