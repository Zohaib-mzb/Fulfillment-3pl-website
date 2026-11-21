/**
 * The 3D "shelf to doorstep" scene. Everything is built procedurally from primitives
 * (no model files). One GSAP timeline, scrubbed by ScrollTrigger, tweens a plain state
 * object; useFrame reads that state and poses the scene. frameloop="demand" means we
 * only render when scroll (or a short idle animation window) asks for a frame.
 */
import { Component, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const COL = {
  navy: '#0E1B2C', navy7: '#22344C', navy6: '#33465F', teal: '#12B5A6', tealSoft: '#DDF4F1',
  orange: '#FF6A3D', cloud: '#F4F6F8', line: '#D9DEE4', white: '#FFFFFF', glass: '#BFE8E3', fog: '#FFFFFF',
};

/* ───────────── state + choreography ───────────── */

type Vec = [number, number, number];
const KEYS: { p: Vec; t: Vec }[] = [
  { p: [3.6, 2.7, 6.4], t: [0.3, 1.1, 0] }, // store
  { p: [8.6, 2.9, 4.8], t: [6.0, 0.9, 0] }, // pack
  { p: [15.8, 3.1, 5.8], t: [13.8, 0.7, 0] }, // sort
  { p: [30.5, 15.5, 13.5], t: [31.0, 0, -0.5] }, // drive
  { p: [47.2, 3.8, 6.4], t: [42.6, 0.8, -1.5] }, // deliver
  { p: [41, 8.5, 12.5], t: [36, 3.2, -1] }, // return: start, behind the parcel
  { p: [5.2, 4.6, 9.8], t: [0.9, 1.7, 0] }, // return: end, back at the rack
];

function makeState() {
  const [k] = KEYS;
  return {
    px: k.p[0], py: k.p[1], pz: k.p[2], tx: k.t[0], ty: k.t[1], tz: k.t[2],
    drop: 0, toTable: 0, flaps: 0, label: 0, convey: 0, lane: 0, load: 0,
    route: 0, drive: 0, hop: 0, dot: 0, ring: 0, phone: 0, retLine: 0, ret: 0,
  };
}
type State = ReturnType<typeof makeState>;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (v: number) => 1 - Math.pow(1 - v, 3);
const easeInOut = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* ───────────── world layout ───────────── */

const SHELF_Y = [0.12, 1.0, 1.9];
const HERO = { w: 0.56, h: 0.42, d: 0.46 };
const P = {
  shelf: v3(1.3, SHELF_Y[1] + HERO.h / 2 + 0.03, 0.05),
  table: v3(5.6, 0.94 + HERO.h / 2, 0),
  printer: v3(6.95, 0.94 + 0.22, -0.1),
  convStart: v3(9.9, 0.79 + HERO.h / 2, 0),
  convEnd: v3(16.3, 0.79 + HERO.h / 2, 0),
  laneEnd: v3(18.4, HERO.h / 2 + 0.02, 0),
  door: v3(43.4, HERO.h / 2 * 0.8 + 0.02, -1.08),
  restock: v3(1.35, SHELF_Y[2] + HERO.h / 2 + 0.03, 0.05),
};
const HOUSE = v3(43.4, 0, -2.2);

const ROUTE = new THREE.CatmullRomCurve3(
  [v3(20.6, 0, 0), v3(24, 0, -2.6), v3(28, 0, 0.6), v3(31.6, 0, 3), v3(35.2, 0, 0.2), v3(38.6, 0, -2.6), v3(41.3, 0, -0.9)],
  false, 'catmullrom', 0.5,
);
const RETURN = new THREE.CubicBezierCurve3(P.door.clone().add(v3(0, 0.1, 0)), v3(37, 10, 3), v3(8, 10, 3), P.restock);

/* ───────────── shared helpers ───────────── */

let blobTex: THREE.Texture | null = null;
function blobTexture() {
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

/** Soft contact shadow: a radial-gradient decal. Far cheaper than shadow maps. */
function Blob({ w, d, position, opacity = 1 }: { w: number; d: number; position: Vec; opacity?: number }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={position} renderOrder={1}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial map={blobTexture()} transparent depthWrite={false} opacity={opacity} />
    </mesh>
  );
}

const Lam = ({ c, ...rest }: { c: string } & Record<string, unknown>) => <meshLambertMaterial color={c} {...rest} />;

function barcodeTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 88;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 88);
  g.fillStyle = COL.navy;
  let x = 12;
  [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1].forEach((w, i) => { if (i % 2 === 0) g.fillRect(x, 12, w * 2.4, 44); x += w * 2.4 + 2; });
  g.fillStyle = COL.teal; g.fillRect(12, 66, 80, 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ───────────── scenery (static) ───────────── */

function Floor() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[20, -0.01, 0]}>
        <planeGeometry args={[220, 160]} />
        <Lam c={COL.white} />
      </mesh>
      {/* warehouse floor */}
      <mesh rotation-x={-Math.PI / 2} position={[7.6, 0, 0]}>
        <planeGeometry args={[24, 7]} />
        <Lam c={COL.cloud} />
      </mesh>
      {[-2.2, 2.2].map((z) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[7.6, 0.003, z]}>
          <planeGeometry args={[23, 0.06]} />
          <Lam c={COL.teal} />
        </mesh>
      ))}
    </group>
  );
}

const SHELF_BOXES: { x: number; s: number; y: number }[] = [
  { x: -1.5, s: 0.6, y: 0 }, { x: -0.75, s: 0.55, y: 0 }, { x: 0.1, s: 0.7, y: 0 }, { x: 0.95, s: 0.5, y: 0 }, { x: 1.55, s: 0.45, y: 0 },
  { x: -1.45, s: 0.6, y: 1 }, { x: -0.7, s: 0.55, y: 1 }, { x: 0.2, s: 0.62, y: 1 },
  { x: -1.5, s: 0.5, y: 2 }, { x: -0.85, s: 0.6, y: 2 }, { x: -0.12, s: 0.5, y: 2 }, { x: 0.6, s: 0.62, y: 2 },
];

function Rack({ s }: { s: State }) {
  const boxes = useRef<THREE.InstancedMesh>(null!);
  const tapes = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const last = useRef(-1);

  useFrame(() => {
    if (last.current === s.drop) return;
    last.current = s.drop;
    SHELF_BOXES.forEach((b, i) => {
      const local = clamp01((s.drop - i * 0.05) / 0.4);
      const h = b.s * 0.72;
      const y = SHELF_Y[b.y] + h / 2 + 0.03 + (1 - easeOut(local)) * 3.4;
      const vis = local > 0 ? 1 : 0.0001;
      dummy.position.set(b.x, y, 0.02);
      dummy.rotation.set(0, (i % 3 - 1) * 0.05, 0);
      dummy.scale.set(b.s * vis, h * vis, 0.55 * vis);
      dummy.updateMatrix();
      boxes.current.setMatrixAt(i, dummy.matrix);
      dummy.position.y = y + h / 2 + 0.004;
      dummy.scale.set(b.s * 0.17 * vis, 0.01 * vis, 0.56 * vis);
      dummy.updateMatrix();
      tapes.current.setMatrixAt(i, dummy.matrix);
    });
    boxes.current.instanceMatrix.needsUpdate = true;
    tapes.current.instanceMatrix.needsUpdate = true;
  });

  const uprights: Vec[] = [[-2.05, 1.3, 0.45], [2.05, 1.3, 0.45], [-2.05, 1.3, -0.45], [2.05, 1.3, -0.45]];
  return (
    <group>
      <Blob w={5.6} d={2.2} position={[0, 0.006, 0]} opacity={0.7} />
      {uprights.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.1, 2.6, 0.1]} />
          <Lam c={i < 2 ? COL.navy7 : COL.navy6} />
        </mesh>
      ))}
      {SHELF_Y.map((y) => (
        <group key={y}>
          <mesh position={[0, y - 0.02, 0]}>
            <boxGeometry args={[4.1, 0.04, 0.95]} />
            <Lam c={COL.line} />
          </mesh>
          <mesh position={[0, y - 0.05, 0.48]}>
            <boxGeometry args={[4.2, 0.1, 0.06]} />
            <Lam c={COL.navy} />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={boxes} args={[undefined, undefined, SHELF_BOXES.length]} frustumCulled={false}>
        <boxGeometry />
        <Lam c={COL.cloud} />
      </instancedMesh>
      <instancedMesh ref={tapes} args={[undefined, undefined, SHELF_BOXES.length]} frustumCulled={false}>
        <boxGeometry />
        <Lam c={COL.teal} />
      </instancedMesh>
    </group>
  );
}

function PackStation({ s }: { s: State }) {
  const label = useRef<THREE.Mesh>(null!);
  return (
    <group>
      <Blob w={4} d={2.2} position={[6, 0.006, 0]} opacity={0.6} />
      <mesh position={[6, 0.9, 0]}>
        <boxGeometry args={[3.3, 0.08, 1.4]} />
        <Lam c={COL.navy} />
      </mesh>
      {[[-1.5, -0.6], [1.5, -0.6], [-1.5, 0.6], [1.5, 0.6]].map(([x, z], i) => (
        <mesh key={i} position={[6 + x, 0.43, z]}>
          <boxGeometry args={[0.08, 0.86, 0.08]} />
          <Lam c={COL.navy7} />
        </mesh>
      ))}
      <RoundedBox args={[0.62, 0.44, 0.52]} radius={0.06} smoothness={2} position={[P.printer.x, P.printer.y, P.printer.z]}>
        <Lam c={COL.navy7} />
      </RoundedBox>
      <mesh position={[P.printer.x - 0.12, P.printer.y + 0.225, P.printer.z]}>
        <boxGeometry args={[0.24, 0.01, 0.06]} />
        <Lam c={COL.teal} />
      </mesh>
      <PrintedLabel s={s} refEl={label} />
    </group>
  );
}

/** The label is drawn in the printer, then flies onto the hero parcel. */
function PrintedLabel({ s, refEl }: { s: State; refEl: React.RefObject<THREE.Mesh> }) {
  const tex = useMemo(barcodeTexture, []);
  const from = useMemo(() => P.printer.clone().add(v3(-0.36, 0.0, 0.1)), []);
  const to = useMemo(() => P.table.clone().add(v3(0.04, 0.02, HERO.d / 2 + 0.006)), []);
  useFrame(() => {
    const m = refEl.current;
    if (!m) return;
    const a = clamp01(s.label / 0.4); // printing
    const b = clamp01((s.label - 0.4) / 0.6); // flying to the box
    m.visible = s.label > 0.001 && s.label < 0.999;
    m.position.lerpVectors(from, to, easeInOut(b));
    m.position.y += Math.sin(b * Math.PI) * 0.35;
    m.rotation.set(0, (1 - b) * -Math.PI / 2, 0);
    m.scale.set(1, Math.max(0.05, a), 1);
  });
  return (
    <mesh ref={refEl}>
      <planeGeometry args={[0.32, 0.22]} />
      <meshBasicMaterial map={tex} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Conveyor({ s }: { s: State }) {
  const rollers = useRef<THREE.InstancedMesh>(null!);
  const beam = useRef<THREE.MeshBasicMaterial>(null!);
  const N = 22;
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      d.position.set(9.7 + i * 0.32, 0.72, 0);
      d.rotation.set(Math.PI / 2, 0, 0);
      d.updateMatrix();
      rollers.current.setMatrixAt(i, d.matrix);
    }
    rollers.current.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame(({ clock }) => {
    // Scan beam brightens as the parcel passes through the arch, plus a soft idle pulse.
    const near = 1 - Math.min(1, Math.abs(heroX(s) - 13.4) / 0.9);
    beam.current.opacity = 0.1 + near * 0.32 + Math.sin(clock.elapsedTime * 3) * 0.03;
  });
  return (
    <group>
      <Blob w={8} d={2} position={[13.1, 0.006, 0]} opacity={0.6} />
      <mesh position={[13.1, 0.76, 0]}>
        <boxGeometry args={[7.2, 0.06, 1.0]} />
        <Lam c={COL.navy6} />
      </mesh>
      {[-0.54, 0.54].map((z) => (
        <mesh key={z} position={[13.1, 0.7, z]}>
          <boxGeometry args={[7.3, 0.18, 0.08]} />
          <Lam c={COL.navy7} />
        </mesh>
      ))}
      <instancedMesh ref={rollers} args={[undefined, undefined, N]}>
        <cylinderGeometry args={[0.06, 0.06, 1.02, 8]} />
        <Lam c={COL.line} />
      </instancedMesh>
      {[10, 13.1, 16.2].map((x) =>
        [-0.45, 0.45].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.33, z]}>
            <boxGeometry args={[0.08, 0.66, 0.08]} />
            <Lam c={COL.navy7} />
          </mesh>
        )),
      )}
      {/* scan arch */}
      {[-0.68, 0.68].map((z) => (
        <RoundedBox key={z} args={[0.2, 1.9, 0.16]} radius={0.06} smoothness={2} position={[13.4, 0.95, z]}>
          <Lam c={COL.teal} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.34, 0.2, 1.56]} radius={0.08} smoothness={2} position={[13.4, 1.9, 0]}>
        <Lam c={COL.teal} />
      </RoundedBox>
      <mesh position={[13.4, 1.32, 0]}>
        <boxGeometry args={[0.22, 1.1, 1.2]} />
        <meshBasicMaterial ref={beam} color={COL.teal} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      {/* lanes */}
      {[-1.3, 0, 1.3].map((z) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[18, 0.004, z]}>
          <planeGeometry args={[2.6, 0.9]} />
          <Lam c={z === 0 ? COL.tealSoft : COL.line} />
        </mesh>
      ))}
      {[-1.3, 0, 1.3].map((z) => (
        <mesh key={`e${z}`} rotation-x={-Math.PI / 2} position={[19.33, 0.006, z]}>
          <planeGeometry args={[0.06, 0.9]} />
          <Lam c={z === 0 ? COL.teal : COL.navy6} />
        </mesh>
      ))}
    </group>
  );
}

const MAP = { x0: 19.6, x1: 46.4, z0: -6.2, z1: 6.2 };

function CityMap() {
  const tiles = useRef<THREE.InstancedMesh>(null!);
  const blocks = useRef<THREE.InstancedMesh>(null!);
  const data = useMemo(() => {
    const samples = ROUTE.getSpacedPoints(80);
    const nearRoute = (x: number, z: number, r: number) =>
      samples.some((p) => Math.hypot(p.x - x, p.z - z) < r) || Math.hypot(HOUSE.x - x, HOUSE.z - z) < 2.4;
    const t: { x: number; z: number; c: string }[] = [];
    const b: { x: number; z: number; h: number; w: number }[] = [];
    let k = 0;
    for (let x = MAP.x0 + 1.2; x < MAP.x1 - 0.8; x += 2.3) {
      for (let z = MAP.z0 + 1.1; z < MAP.z1 - 0.8; z += 2.3) {
        k++;
        t.push({ x, z, c: k % 3 === 0 ? COL.tealSoft : COL.cloud });
        if (!nearRoute(x, z, 1.5) && k % 2 === 0) b.push({ x, z, h: 0.25 + ((k * 37) % 7) / 10, w: 0.7 + ((k * 13) % 4) / 10 });
      }
    }
    return { t, b };
  }, []);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    data.t.forEach((t, i) => {
      d.position.set(t.x, 0.02, t.z);
      d.scale.set(1.9, 0.04, 1.9);
      d.updateMatrix();
      tiles.current.setMatrixAt(i, d.matrix);
      tiles.current.setColorAt(i, col.set(t.c));
    });
    data.b.forEach((b, i) => {
      d.position.set(b.x, 0.04 + b.h / 2, b.z);
      d.scale.set(b.w, b.h, b.w);
      d.updateMatrix();
      blocks.current.setMatrixAt(i, d.matrix);
    });
    tiles.current.instanceMatrix.needsUpdate = true;
    if (tiles.current.instanceColor) tiles.current.instanceColor.needsUpdate = true;
    blocks.current.instanceMatrix.needsUpdate = true;
  }, [data]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[(MAP.x0 + MAP.x1) / 2, 0.002, 0]}>
        <planeGeometry args={[MAP.x1 - MAP.x0, MAP.z1 - MAP.z0]} />
        <Lam c={COL.white} />
      </mesh>
      {/* the lake */}
      <mesh rotation-x={-Math.PI / 2} position={[(MAP.x0 + MAP.x1) / 2, 0.003, MAP.z1 + 3.2]}>
        <planeGeometry args={[MAP.x1 - MAP.x0 + 8, 6]} />
        <Lam c={COL.tealSoft} />
      </mesh>
      <instancedMesh ref={tiles} args={[undefined, undefined, data.t.length]}>
        <boxGeometry />
        <Lam c={COL.white} />
      </instancedMesh>
      <instancedMesh ref={blocks} args={[undefined, undefined, data.b.length]}>
        <boxGeometry />
        <Lam c={COL.white} />
      </instancedMesh>
    </group>
  );
}

function RouteLine({ s }: { s: State }) {
  const dots = useRef<THREE.InstancedMesh>(null!);
  const pts = useMemo(() => ROUTE.getSpacedPoints(120), []);
  const stops = [0, 0.34, 0.68];
  const stopRefs = useRef<(THREE.Group | null)[]>([]);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    pts.forEach((p, i) => { d.position.set(p.x, 0.07, p.z); d.updateMatrix(); dots.current.setMatrixAt(i, d.matrix); });
    dots.current.instanceMatrix.needsUpdate = true;
    dots.current.count = 0;
  }, [pts]);
  useFrame(() => {
    dots.current.count = Math.floor(clamp01(s.route) * pts.length);
    stops.forEach((u, i) => {
      const g = stopRefs.current[i];
      if (g) g.scale.setScalar(s.route >= u + 0.02 ? 1 : 0.0001);
    });
  });
  return (
    <group>
      <instancedMesh ref={dots} args={[undefined, undefined, pts.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 10]} />
        <Lam c={COL.teal} />
      </instancedMesh>
      {stops.map((u, i) => {
        const p = ROUTE.getPointAt(u);
        return (
          <group key={u} ref={(el) => { stopRefs.current[i] = el; }} position={[p.x, 0.08, p.z]}>
            <mesh>
              <cylinderGeometry args={[0.3, 0.3, 0.06, 20]} />
              <Lam c={COL.teal} />
            </mesh>
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.06, 20]} />
              <Lam c={COL.white} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function House() {
  const roof = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-1.1, 0); sh.lineTo(1.1, 0); sh.lineTo(0, 0.85); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 1.8, bevelEnabled: false });
    g.translate(0, 0, -0.9);
    return g;
  }, []);
  return (
    <group position={[HOUSE.x, 0, HOUSE.z]}>
      <Blob w={3.6} d={3} position={[0, 0.01, 0.2]} opacity={0.7} />
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.8, 1.4, 1.6]} />
        <Lam c={COL.white} />
      </mesh>
      <mesh geometry={roof} position={[0, 1.4, 0]}>
        <Lam c={COL.navy} />
      </mesh>
      <mesh position={[0, 0.4, 0.81]}>
        <boxGeometry args={[0.42, 0.78, 0.03]} />
        <Lam c={COL.navy6} />
      </mesh>
      {[-0.58, 0.58].map((x) => (
        <mesh key={x} position={[x, 0.86, 0.81]}>
          <boxGeometry args={[0.36, 0.32, 0.02]} />
          <Lam c={COL.glass} />
        </mesh>
      ))}
      <mesh position={[0, 0.03, 1.02]}>
        <boxGeometry args={[0.8, 0.06, 0.4]} />
        <Lam c={COL.line} />
      </mesh>
    </group>
  );
}

/* ───────────── moving actors ───────────── */

/** Where the hero parcel is along its journey (x only — used by the scan beam). */
function heroX(s: State) {
  if (s.convey <= 0) return 0;
  return THREE.MathUtils.lerp(P.convStart.x, P.convEnd.x, clamp01((s.convey - 0.15) / 0.85));
}

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

function heroPose(s: State, out: THREE.Vector3): boolean {
  if (s.ret > 0) {
    RETURN.getPoint(easeInOut(clamp01(s.ret)), out);
    return true;
  }
  if (s.hop > 0) {
    const van = ROUTE.getPointAt(1, tmp);
    tmp2.set(van.x + 0.3, 1.0, van.z + 0.2);
    const k = easeInOut(clamp01(s.hop));
    out.lerpVectors(tmp2, P.door, k);
    out.y += Math.sin(k * Math.PI) * 0.9;
    return true;
  }
  if (s.load >= 1) return false; // inside the van
  if (s.load > 0) {
    const vanBack = ROUTE.getPointAt(0, tmp).add(v3(-1.3, 0.75, 0));
    out.lerpVectors(P.laneEnd, vanBack, easeInOut(s.load));
    out.y += Math.sin(s.load * Math.PI) * 0.5;
    return true;
  }
  if (s.lane > 0) {
    out.lerpVectors(P.convEnd, P.laneEnd, easeInOut(s.lane));
    out.y += Math.sin(s.lane * Math.PI) * 0.25;
    return true;
  }
  if (s.convey > 0) {
    const a = clamp01(s.convey / 0.15);
    if (a < 1) {
      out.lerpVectors(P.table, P.convStart, easeInOut(a));
      out.y += Math.sin(a * Math.PI) * 0.7;
    } else out.set(heroX(s), P.convStart.y, 0);
    return true;
  }
  if (s.toTable > 0) {
    const k = easeInOut(clamp01(s.toTable));
    out.lerpVectors(P.shelf, P.table, k);
    out.y += Math.sin(k * Math.PI) * 0.8;
    return true;
  }
  out.copy(P.shelf);
  out.y += (1 - easeOut(clamp01((s.drop - 0.55) / 0.4))) * 3.4;
  return s.drop > 0.55;
}

function HeroParcel({ s }: { s: State }) {
  const g = useRef<THREE.Group>(null!);
  const flapA = useRef<THREE.Group>(null!);
  const flapB = useRef<THREE.Group>(null!);
  const tape = useRef<THREE.Mesh>(null!);
  const label = useRef<THREE.Mesh>(null!);
  const shadow = useRef<THREE.Mesh>(null!);
  const tex = useMemo(barcodeTexture, []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const vis = heroPose(s, pos);
    g.current.visible = vis;
    shadow.current.visible = vis && pos.y < 2.6;
    if (!vis) return;
    g.current.position.copy(pos);
    // a slight idle float whenever the parcel is at rest
    g.current.position.y += Math.sin(clock.elapsedTime * 2.2) * 0.008;
    g.current.rotation.y = s.ret > 0 ? s.ret * Math.PI * 2 : 0;
    const open = Math.min(1, s.toTable * 1.6) * (1 - easeInOut(clamp01(s.flaps)));
    flapA.current.rotation.x = -open * 2.0;
    flapB.current.rotation.x = open * 2.0;
    tape.current.visible = s.flaps > 0.95;
    label.current.visible = s.label >= 0.999;
    shadow.current.position.set(pos.x, groundUnder(pos) + 0.008, pos.z);
  });
  return (
    <>
      <group ref={g}>
        <RoundedBox args={[HERO.w, HERO.h, HERO.d]} radius={0.03} smoothness={2}>
          <Lam c={COL.cloud} />
        </RoundedBox>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.1, HERO.h + 0.004, HERO.d + 0.004]} />
          <Lam c={COL.teal} />
        </mesh>
        <group ref={flapA} position={[0, HERO.h / 2, HERO.d / 2]}>
          <mesh position={[0, 0.003, -HERO.d / 4]}>
            <boxGeometry args={[HERO.w - 0.02, 0.012, HERO.d / 2]} />
            <Lam c={COL.white} />
          </mesh>
        </group>
        <group ref={flapB} position={[0, HERO.h / 2, -HERO.d / 2]}>
          <mesh position={[0, 0.003, HERO.d / 4]}>
            <boxGeometry args={[HERO.w - 0.02, 0.012, HERO.d / 2]} />
            <Lam c={COL.white} />
          </mesh>
        </group>
        <mesh ref={tape} position={[0, HERO.h / 2 + 0.012, 0]}>
          <boxGeometry args={[0.1, 0.004, HERO.d]} />
          <Lam c={COL.teal} />
        </mesh>
        <mesh ref={label} position={[0.04, 0.02, HERO.d / 2 + 0.006]}>
          <planeGeometry args={[0.32, 0.22]} />
          <meshBasicMaterial map={tex} />
        </mesh>
      </group>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} renderOrder={1}>
        <planeGeometry args={[0.9, 0.75]} />
        <meshBasicMaterial map={blobTexture()} transparent depthWrite={false} />
      </mesh>
    </>
  );
}

/** Height of whatever surface is under the parcel (table / conveyor / floor). */
function groundUnder(p: THREE.Vector3) {
  if (p.x > 4.3 && p.x < 7.7 && Math.abs(p.z) < 0.7) return 0.94;
  if (p.x > 9.5 && p.x < 16.7 && Math.abs(p.z) < 0.5) return 0.79;
  return 0;
}

function Van({ s }: { s: State }) {
  const g = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const p = useMemo(() => new THREE.Vector3(), []);
  const t = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const u = easeInOut(clamp01(s.drive));
    ROUTE.getPointAt(u, p);
    ROUTE.getTangentAt(Math.min(0.999, Math.max(0.001, u)), t);
    g.current.position.copy(p);
    g.current.rotation.y = Math.atan2(-t.z, t.x);
    // idle: a gentle suspension bob
    body.current.position.y = Math.sin(clock.elapsedTime * 5) * 0.012;
  });
  const plug = (z: number) => (
    <group position={[-0.45, 1.0, z]}>
      <RoundedBox args={[0.2, 0.17, 0.012]} radius={0.004} smoothness={1}>
        <Lam c={COL.white} />
      </RoundedBox>
      {[-0.05, 0.05].map((x) => (
        <mesh key={x} position={[x, 0.13, 0]}>
          <boxGeometry args={[0.03, 0.1, 0.012]} />
          <Lam c={COL.white} />
        </mesh>
      ))}
      <mesh position={[0, -0.14, 0]}>
        <boxGeometry args={[0.03, 0.12, 0.012]} />
        <Lam c={COL.white} />
      </mesh>
    </group>
  );
  return (
    <group ref={g}>
      <Blob w={3.4} d={1.8} position={[0, 0.012, 0]} opacity={0.9} />
      <group ref={body}>
        <RoundedBox args={[2.0, 1.15, 1.1]} radius={0.16} smoothness={3} position={[-0.25, 0.86, 0]}>
          <Lam c={COL.navy} />
        </RoundedBox>
        <RoundedBox args={[0.78, 0.8, 1.06]} radius={0.16} smoothness={3} position={[0.95, 0.68, 0]}>
          <Lam c={COL.navy} />
        </RoundedBox>
        <mesh position={[1.12, 0.98, 0]} rotation-z={-0.5}>
          <boxGeometry args={[0.04, 0.42, 0.92]} />
          <Lam c={COL.glass} />
        </mesh>
        <mesh position={[0.86, 0.92, 0]}>
          <boxGeometry args={[0.3, 0.26, 1.075]} />
          <Lam c={COL.glass} />
        </mesh>
        <mesh position={[0.1, 0.6, 0]}>
          <boxGeometry args={[2.66, 0.12, 1.12]} />
          <Lam c={COL.teal} />
        </mesh>
        {plug(0.556)}
        {plug(-0.556)}
        {[[-0.8, 0.5], [0.85, 0.5], [-0.8, -0.5], [0.85, -0.5]].map(([x, z], i) => (
          <group key={i} position={[x, 0.27, z]} rotation-x={Math.PI / 2}>
            <mesh>
              <cylinderGeometry args={[0.27, 0.27, 0.18, 16]} />
              <Lam c={COL.navy} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.12, 0.12, 0.2, 12]} />
              <Lam c={COL.cloud} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function DeliveryFx({ s }: { s: State }) {
  const ring = useRef<THREE.Mesh>(null!);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null!);
  const dot = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const r = clamp01(s.ring);
    // Two pulses during the chapter, then a slow idle "breathing" pulse while it is on screen.
    const local = r < 1 ? (r * 2) % 1 : (clock.elapsedTime * 0.6) % 1;
    ring.current.visible = r > 0 && s.ret < 0.2;
    ring.current.scale.setScalar(0.6 + local * 2.2);
    ringMat.current.opacity = (1 - local) * 0.85;
    dot.current.scale.setScalar(Math.max(0.0001, easeOut(clamp01(s.dot))));
  });
  return (
    <group>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[P.door.x, 0.03, P.door.z]}>
        <ringGeometry args={[0.36, 0.44, 40]} />
        <meshBasicMaterial ref={ringMat} color={COL.teal} transparent depthWrite={false} />
      </mesh>
      <mesh ref={dot} position={[P.door.x + 0.62, 0.04, P.door.z + 0.2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.06, 24]} />
        <Lam c={COL.orange} />
      </mesh>
    </group>
  );
}

function ReturnLine({ s }: { s: State }) {
  const dashes = useRef<THREE.InstancedMesh>(null!);
  const N = 64;
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      RETURN.getPoint(u, d.position);
      RETURN.getPoint(Math.min(1, u + 0.01), tmp);
      d.lookAt(tmp);
      d.updateMatrix();
      dashes.current.setMatrixAt(i, d.matrix);
    }
    dashes.current.instanceMatrix.needsUpdate = true;
    dashes.current.count = 0;
  }, []);
  useFrame(() => { dashes.current.count = Math.floor(clamp01(s.retLine) * N); });
  return (
    <instancedMesh ref={dashes} args={[undefined, undefined, N]} frustumCulled={false}>
      <boxGeometry args={[0.07, 0.07, 0.34]} />
      <Lam c={COL.navy6} />
    </instancedMesh>
  );
}

/* ───────────── director: GSAP + ScrollTrigger + Lenis ───────────── */

function Director({ s, phone, root, onRuntimeFps }: {
  s: State; phone: React.RefObject<HTMLDivElement | null>; root: HTMLElement; onRuntimeFps: (fps: number) => void;
}) {
  const { camera, invalidate, size } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const camPos = useMemo(() => new THREE.Vector3(), []);
  const chase = useMemo(() => new THREE.Vector3(), []);
  const frames = useRef({ n: 0, start: 0, done: false });

  useEffect(() => {
    const body = root.querySelector<HTMLElement>('[data-story-body]')!;
    const lenis = new Lenis({ lerp: 0.12, smoothWheel: true, autoRaf: false });
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    let idleUntil = performance.now() + 1500;
    const kick = () => { idleUntil = performance.now() + 5000; invalidate(); };

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: kick });
    const cam = (i: number, at: number, dur = 0.38) =>
      tl.to(s, { px: KEYS[i].p[0], py: KEYS[i].p[1], pz: KEYS[i].p[2], tx: KEYS[i].t[0], ty: KEYS[i].t[1], tz: KEYS[i].t[2], duration: dur, ease: 'power2.inOut' }, at);
    tl.set(s, { drop: 0 }, 0);
    tl.to(s, { drop: 1, duration: 0.65 }, 0.02);
    cam(1, 0.85);
    tl.to(s, { toTable: 1, duration: 0.35 }, 1.08);
    tl.to(s, { flaps: 1, duration: 0.2 }, 1.42);
    tl.to(s, { label: 1, duration: 0.25 }, 1.6);
    cam(2, 1.86);
    tl.to(s, { convey: 1, duration: 0.55 }, 2.08);
    tl.to(s, { lane: 1, duration: 0.2 }, 2.64);
    cam(3, 2.86, 0.4);
    tl.to(s, { load: 1, duration: 0.14 }, 3.0);
    tl.to(s, { route: 1, duration: 0.72 }, 3.1);
    tl.to(s, { drive: 1, duration: 0.74 }, 3.16);
    cam(4, 3.86);
    tl.to(s, { hop: 1, duration: 0.2 }, 4.2);
    tl.to(s, { dot: 1, duration: 0.1 }, 4.36);
    tl.to(s, { ring: 1, duration: 0.4 }, 4.38);
    tl.to(s, { phone: 1, duration: 0.14 }, 4.3);
    tl.to(s, { phone: 0, duration: 0.12 }, 4.92);
    cam(5, 4.9, 0.36);
    tl.to(s, { retLine: 1, duration: 0.55 }, 5.1);
    tl.to(s, { ret: 1, duration: 0.6 }, 5.25);
    cam(6, 5.27, 0.6);
    tl.to({}, { duration: 0.01 }, 6);

    const st = ScrollTrigger.create({
      trigger: body,
      start: 'top center',
      end: 'bottom center',
      scrub: 0.6,
      animation: tl,
    });
    const chapters = gsap.utils.toArray<HTMLElement>('[data-chapter]', root).map((el) =>
      ScrollTrigger.create({ trigger: el, start: 'top 60%', end: 'bottom 40%', toggleClass: 'is-active' }),
    );

    // phone overlay follows the timeline
    const phoneTick = () => {
      const el = phone.current;
      if (!el) return;
      el.style.opacity = String(s.phone);
      el.style.transform = `translateY(${(1 - s.phone) * 24}px)`;
    };
    tl.eventCallback('onUpdate', () => { kick(); phoneTick(); root.dataset.t = tl.time().toFixed(2); });

    // Idle motion: keep rendering for a few seconds after activity, then go fully idle.
    let rafId = 0;
    let visible = true;
    const loop = () => {
      if (visible && !document.hidden && performance.now() < idleUntil) invalidate();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
    io.observe(root);
    const onPointer = () => kick();
    window.addEventListener('pointermove', onPointer, { passive: true });

    ScrollTrigger.refresh();
    // Sync immediately (e.g. the page was reloaded mid-story) instead of waiting for the next scroll.
    tl.progress(clamp01((window.scrollY - st.start) / Math.max(1, st.end - st.start)));
    phoneTick();
    root.dataset.t = tl.time().toFixed(2);
    kick();
    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      st.kill();
      chapters.forEach((c) => c.kill());
      tl.kill();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [s, invalidate, root, phone]);

  useFrame(({ clock }) => {
    // Portrait screens: pull the camera back so the subject still fits.
    // Keyframes are framed for a ~1.25 aspect stage; narrower stages pull back to keep the subject in frame.
    const aspect = size.width / size.height;
    const pull = Math.max(1, Math.pow(1.25 / aspect, 0.85));
    target.set(s.tx, s.ty, s.tz);
    camPos.set(s.tx + (s.px - s.tx) * pull, s.ty + (s.py - s.ty) * pull, s.tz + (s.pz - s.tz) * pull);
    // Return flight: blend into a chase camera that keeps the parcel in frame mid-arc.
    if (s.ret > 0 && s.ret < 1) {
      const w = Math.pow(Math.sin(clamp01(s.ret) * Math.PI), 0.6);
      RETURN.getPoint(easeInOut(clamp01(s.ret)), chase);
      target.lerp(chase, w);
      chase.add(v3(4.5 * pull, 2.6 * pull, 8 * pull));
      camPos.lerp(chase, w);
    }
    camPos.y += Math.sin(clock.elapsedTime * 0.5) * 0.03;
    camera.position.copy(camPos);
    camera.lookAt(target);

    // Runtime FPS guard for the first ~1.2 s of rendering.
    const f = frames.current;
    if (!f.done) {
      const now = performance.now();
      if (!f.start) f.start = now;
      f.n++;
      if (now - f.start > 1200) {
        f.done = true;
        onRuntimeFps((f.n / (now - f.start)) * 1000);
      } else invalidate();
    }
  });

  return null;
}

/* ───────────── root ───────────── */

class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function StoryScene({ onReady, onFail }: { onReady: () => void; onFail: (reason: string) => void }) {
  const s = useMemo(makeState, []);
  const phone = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [frameloop, setFrameloop] = useState<'demand' | 'never'>('demand');
  // no frames until shaders are compiled off the main thread (KHR_parallel_shader_compile) → no long task on mount
  const [warm, setWarm] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRoot(document.getElementById('story'));
    // Pause rendering completely while the story is off-screen.
    const io = new IntersectionObserver(([e]) => setFrameloop(e.isIntersecting ? 'demand' : 'never'), { rootMargin: '200px' });
    if (wrap.current) io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="story-canvas relative h-full w-full">
      <Boundary onError={() => onFail('webgl-error')}>
        <Canvas
          frameloop={warm ? frameloop : 'never'}
          dpr={[1, 1.5]}
          flat
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
          camera={{ fov: 36, near: 0.1, far: 140, position: KEYS[0].p }}
          onCreated={({ scene, gl, camera, invalidate }) => {
            scene.fog = new THREE.Fog(COL.fog, 34, 80);
            gl.domElement.setAttribute('aria-hidden', 'true');
            gl.domElement.addEventListener('webglcontextlost', () => onFail('context-lost'));
            gl.compileAsync(scene, camera).catch(() => {}).finally(() => {
              setWarm(true);
              invalidate();
              requestAnimationFrame(onReady);
            });
          }}
        >
          <hemisphereLight args={[COL.white, '#C8D3DA', 2.1]} />
          <directionalLight position={[10, 14, 8]} intensity={1.5} />
          <Floor />
          <Rack s={s} />
          <PackStation s={s} />
          <Conveyor s={s} />
          <CityMap />
          <RouteLine s={s} />
          <House />
          <DeliveryFx s={s} />
          <ReturnLine s={s} />
          <Van s={s} />
          <HeroParcel s={s} />
          {root && <Director s={s} phone={phone} root={root} onRuntimeFps={(fps) => fps < 24 && onFail(`runtime-fps-${Math.round(fps)}`)} />}
        </Canvas>
      </Boundary>
      {/* "Delivered" SMS mock-up for chapter 5 (decorative; the text panel carries the meaning). */}
      <div ref={phone} className="story-phone" aria-hidden="true" style={{ opacity: 0 }}>
        <div className="story-phone__screen">
          <p className="story-phone__from">Kinematics</p>
          <div className="story-phone__bubble">
            <strong>Delivered.</strong> Your parcel is at the front door. Photo attached.
            <span className="story-phone__photo"><span /></span>
          </div>
        </div>
      </div>
    </div>
  );
}
