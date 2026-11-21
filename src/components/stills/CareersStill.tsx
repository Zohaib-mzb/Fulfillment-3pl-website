/**
 * Careers hero still: a GTA warehouse exterior with the KINEMATICS sign, dock doors and
 * EV vans in brand colours. Same look as the hero film (palette, lighting, Lambert
 * materials, blob contact shadows, the shared VanModel). This scene is only used to render
 * a still image (scripts/render-careers.mjs); it is never shipped to visitors.
 */
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { COL, Lam, Blob, VanModel, ParcelMesh } from '../three/shared';

const FACADE_Z = 0;
const BUILDING = { x0: -16, x1: 16, h: 7.2, depth: 22 };
const DOORS = [-7.5, -3.5, 0.5];

/** Motion K mark (current geometry) as an SVG string, reversed for the navy sign. */
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#FFFFFF"/>
  <line x1="6" y1="24" x2="15" y2="24" stroke="#12B5A6" stroke-width="3" stroke-linecap="round"/>
  <line x1="3" y1="32" x2="15" y2="32" stroke="#12B5A6" stroke-width="3" stroke-linecap="round"/>
  <line x1="8" y1="40" x2="15" y2="40" stroke="#12B5A6" stroke-width="3" stroke-linecap="round"/>
  <rect x="20" y="13" width="8" height="38" rx="2" fill="#0E1B2C"/>
  <path d="M24 38 L44 18" stroke="#0E1B2C" stroke-width="8"/>
  <path d="M37 14 L50 12 L48 25 Z" fill="#0E1B2C"/>
  <path d="M31 27 L49 51" stroke="#0E1B2C" stroke-width="8"/>
</svg>`;

async function signTexture(): Promise<THREE.CanvasTexture> {
  const W = 2048, H = 400;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = COL.navy;
  g.fillRect(0, 0, W, H);
  await document.fonts.load('700 220px "Space Grotesk"');
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(MARK)}`;
  await img.decode();
  const markSize = 260;
  g.font = '700 210px "Space Grotesk"';
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '6px';
  const text = 'KINEMATICS';
  const tw = g.measureText(text).width;
  const gap = 70;
  const total = markSize + gap + tw;
  const x0 = (W - total) / 2;
  g.drawImage(img, x0, (H - markSize) / 2, markSize, markSize);
  g.fillStyle = COL.white;
  g.textBaseline = 'middle';
  g.fillText(text, x0 + markSize + gap, H / 2 + 12);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function RollerDoor({ x, open = 0 }: { x: number; open?: number }) {
  const w = 3.2, h = 3.6;
  const grooves = useMemo(() => Array.from({ length: 11 }, (_, i) => i), []);
  const panelH = h * (1 - open);
  return (
    <group position={[x, 0, FACADE_Z]}>
      {/* opening (dark interior) and the shutter, rolled up by `open` */}
      <mesh position={[0, h / 2 + 0.05, 0.02]}><boxGeometry args={[w, h, 0.02]} /><Lam c={COL.navy8} /></mesh>
      {open > 0 && (
        <group position={[0, 0.02, 0.06]}>
          {[-0.8, 0.5].map((px, i) => (
            <group key={i} position={[px, 0, 0]}>
              <mesh position={[0, 1.18, 0]}><boxGeometry args={[1.0, 0.1, 0.02]} /><Lam c={COL.navy6} /></mesh>
              <mesh position={[0, 1.62, 0]}><boxGeometry args={[0.8, 0.78, 0.02]} /><Lam c={COL.navy7} /></mesh>
            </group>
          ))}
        </group>
      )}
      <mesh position={[0, h - panelH / 2 + 0.05, 0.05]}><boxGeometry args={[w, panelH, 0.04]} /><Lam c={COL.line} /></mesh>
      {grooves.filter((i) => (i + 0.5) / grooves.length * h > h - panelH).map((i) => (
        <mesh key={i} position={[0, 0.05 + (i + 0.5) * (h / grooves.length), 0.08]}><boxGeometry args={[w - 0.1, 0.025, 0.02]} /><Lam c={COL.edge} /></mesh>
      ))}
      {/* frame, hood and dock bumpers */}
      {[-w / 2 - 0.08, w / 2 + 0.08].map((fx) => <mesh key={fx} position={[fx, h / 2 + 0.05, 0.03]}><boxGeometry args={[0.16, h + 0.1, 0.12]} /><Lam c={COL.navy} /></mesh>)}
      <mesh position={[0, h + 0.25, 0.08]}><boxGeometry args={[w + 0.5, 0.4, 0.28]} /><Lam c={COL.navy7} /></mesh>
      {[-w / 2 + 0.25, w / 2 - 0.25].map((bx) => <mesh key={bx} position={[bx, 1.0, 0.16]}><boxGeometry args={[0.28, 0.42, 0.2]} /><Lam c={COL.navy} /></mesh>)}
      <mesh position={[0, 0.55, 0.45]}><boxGeometry args={[w + 0.3, 1.1, 0.9]} /><Lam c={COL.edge} /></mesh>
      <mesh position={[w / 2 + 0.55, 3.0, 0.1]}><boxGeometry args={[0.14, 0.14, 0.08]} /><meshBasicMaterial color={open > 0 ? COL.teal : COL.line} toneMapped={false} /></mesh>
    </group>
  );
}

function Warehouse({ sign }: { sign: THREE.Texture }) {
  const { x0, x1, h, depth } = BUILDING;
  const W = x1 - x0;
  return (
    <group>
      <Blob w={W + 6} d={4} position={[0, 0.006, 0.6]} opacity={0.45} />
      {/* main volume */}
      <mesh position={[0, h / 2, -depth / 2]}><boxGeometry args={[W, h, depth]} /><Lam c={COL.cloud} /></mesh>
      {/* facade bands: navy parapet, teal stripe, base */}
      <mesh position={[0, h - 0.3, FACADE_Z + 0.02]}><boxGeometry args={[W + 0.1, 0.6, 0.06]} /><Lam c={COL.navy} /></mesh>
      <mesh position={[0, 4.55, FACADE_Z + 0.02]}><boxGeometry args={[W, 0.14, 0.05]} /><Lam c={COL.teal} /></mesh>
      <mesh position={[0, 0.25, FACADE_Z + 0.02]}><boxGeometry args={[W, 0.5, 0.05]} /><Lam c={COL.navy7} /></mesh>
      {/* vertical panel joints */}
      {Array.from({ length: 15 }, (_, i) => x0 + (i + 1) * (W / 16)).map((px) => (
        <mesh key={px} position={[px, h / 2, FACADE_Z + 0.01]}><boxGeometry args={[0.03, h - 1.2, 0.02]} /><Lam c={COL.line} /></mesh>
      ))}
      {/* the sign */}
      <group position={[-3.3, 5.75, FACADE_Z + 0.1]}>
        <mesh position={[0, 0, -0.05]}><boxGeometry args={[9.6, 1.98, 0.12]} /><Lam c={COL.navy7} /></mesh>
        <mesh position={[0, 0, 0.03]}><planeGeometry args={[9.4, 1.84]} /><meshBasicMaterial map={sign} toneMapped={false} /></mesh>
      </group>
      {/* dock doors */}
      <RollerDoor x={DOORS[0]} />
      <RollerDoor x={DOORS[1]} open={0.86} />
      <RollerDoor x={DOORS[2]} />
      {/* office corner: glazing + entrance */}
      <group position={[10.2, 0, FACADE_Z + 0.03]}>
        {[0, 1].map((row) => (
          <mesh key={row} position={[0.4, 1.7 + row * 2.2, 0]}><boxGeometry args={[8.2, 1.5, 0.05]} /><Lam c={COL.glass} /></mesh>
        ))}
        {[-3.3, -1.3, 0.7, 2.7, 4.5].map((mx) => <mesh key={mx} position={[mx, 2.8, 0.02]}><boxGeometry args={[0.08, 4.2, 0.05]} /><Lam c={COL.navy} /></mesh>)}
        <mesh position={[-2.3, 1.3, 0.03]}><boxGeometry args={[1.6, 2.6, 0.06]} /><Lam c={COL.navy6} /></mesh>
        <mesh position={[-2.3, 2.75, 0.4]}><boxGeometry args={[2.4, 0.1, 0.9]} /><Lam c={COL.navy} /></mesh>
      </group>
      {/* rooftop units */}
      {[[-10, -6], [-2, -9], [6, -5]].map(([rx, rz], i) => (
        <RoundedBox key={i} args={[2.2, 0.9, 1.6]} radius={0.1} smoothness={2} position={[rx, h + 0.45, rz]}><Lam c={COL.line} /></RoundedBox>
      ))}
    </group>
  );
}

function Yard() {
  const stripes = useMemo(() => [8.4, 11.2, 14.0], []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 10]}><planeGeometry args={[120, 60]} /><Lam c={COL.cloud} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.003, 7]}><planeGeometry args={[40, 13]} /><Lam c={COL.line} /></mesh>
      {/* parking stripes + teal walkway */}
      {stripes.map((sx) => <mesh key={sx} rotation-x={-Math.PI / 2} position={[sx, 0.006, 6.6]}><planeGeometry args={[0.08, 3.6]} /><Lam c={COL.white} /></mesh>)}
      <mesh rotation-x={-Math.PI / 2} position={[7.4, 0.006, 2.2]}><planeGeometry args={[0.14, 3.4]} /><Lam c={COL.teal} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-2, 0.006, 11.5]}><planeGeometry args={[30, 0.1]} /><Lam c={COL.teal} /></mesh>
      {/* bollards */}
      {[-9.6, -5.5, -1.5, 2.5].map((bx) => (
        <mesh key={bx} position={[bx, 0.55, 1.3]}><cylinderGeometry args={[0.11, 0.11, 1.1, 10]} /><Lam c={COL.navy} /></mesh>
      ))}
      {/* EV charger at the parking bays */}
      {[8.4, 11.6].map((cx) => (
        <group key={cx} position={[cx, 0, 4.3]}>
          <RoundedBox args={[0.42, 1.5, 0.3]} radius={0.06} smoothness={2} position={[0, 0.75, 0]}><Lam c={COL.navy} /></RoundedBox>
          <mesh position={[0, 1.25, 0.16]}><boxGeometry args={[0.24, 0.1, 0.02]} /><meshBasicMaterial color={COL.teal} toneMapped={false} /></mesh>
        </group>
      ))}
      {/* stylised shrubs in planters */}
      {[[-14, 2.2], [15.2, 2.2], [-12.4, 2.2]].map(([px, pz], i) => (
        <group key={i} position={[px, 0, pz]}>
          <mesh position={[0, 0.3, 0]}><boxGeometry args={[1.4, 0.6, 1.0]} /><Lam c={COL.navy7} /></mesh>
          {[-0.35, 0.3].map((ox) => <mesh key={ox} position={[ox, 0.85, 0]}><sphereGeometry args={[0.45, 10, 8]} /><Lam c={COL.tealSoft} /></mesh>)}
        </group>
      ))}
      {/* street lamps */}
      {[-17, 18].map((lx) => (
        <group key={lx} position={[lx, 0, 8]}>
          <mesh position={[0, 2.4, 0]}><cylinderGeometry args={[0.07, 0.07, 4.8, 8]} /><Lam c={COL.navy} /></mesh>
          <mesh position={[0.4, 4.8, 0]}><boxGeometry args={[0.9, 0.12, 0.3]} /><Lam c={COL.navy7} /></mesh>
        </group>
      ))}
    </group>
  );
}

function Scene({ sign }: { sign: THREE.Texture }) {
  return (
    <>
      <hemisphereLight args={['#EAF4F7', '#B9C6D0', 1.7]} />
      <directionalLight position={[-10, 16, 14]} intensity={1.75} color="#FFF1EA" />
      <Warehouse sign={sign} />
      <Yard />
      {/* van backed up to the open dock door, rear doors open */}
      <group position={[DOORS[1], 0, 4.9]} rotation-y={-Math.PI / 2} scale={1.65}>
        <VanModel doorL={(g) => { if (g) g.rotation.y = 1.7; }} doorR={(g) => { if (g) g.rotation.y = -1.7; }} />
      </group>
      {/* second van charging at the bays */}
      <group position={[9.9, 0, 7.2]} rotation-y={Math.PI / 2 - 0.25} scale={1.65}>
        <VanModel />
      </group>
      {/* parcels staged on the dock plate */}
      <group position={[DOORS[1] - 0.6, 1.32, 0.6]} scale={0.6}><ParcelMesh /></group>
      <group position={[DOORS[1] + 0.3, 1.32, 0.7]} scale={0.55}><ParcelMesh /></group>
    </>
  );
}

/** Mounts the still and resolves once the frame is fully rendered. */
export default async function mountCareersStill(container: HTMLElement): Promise<void> {
  const sign = await signTexture();
  await new Promise<void>((resolve) => {
    createRoot(container).render(
      <Canvas
        dpr={1}
        flat
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ fov: 34, near: 0.1, far: 200, position: [-13.5, 3.9, 19.5] }}
        onCreated={({ camera, scene }) => {
          scene.background = new THREE.Color('#E3ECF1');
          scene.fog = new THREE.Fog('#E3ECF1', 40, 95);
          camera.lookAt(0.2, 3.0, 2.2);
          setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())), 300);
        }}
      >
        <Scene sign={sign} />
      </Canvas>,
    );
  });
}
