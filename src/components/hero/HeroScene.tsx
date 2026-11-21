/**
 * Homepage hero "warehouse film": a 36 s looping real-time sequence
 * (Receive → Store → Pick → Pack → Label → Sort → Load → Deliver).
 *
 * - A GSAP master timeline (repeat: -1) is the clock: it drives the fade, dusk grade,
 *   caption callbacks, pause/play and (in capture mode) frame-accurate seeking.
 * - Every object poses itself from the timeline time `S.t` in useFrame, so the film is
 *   deterministic (the same frame for the same t) — that is what lets us render the
 *   video fallback from this exact scene.
 * - frameloop="demand": we only request frames while playing, visible and the tab is shown.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree, advance } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { HERO_LOOP, HERO_SHOTS } from '@/data/hero';
import { COL, Lam, Blob, blobTexture, barcodeTexture, seg, easeOut, easeInOut, sineInOut, lerp, v3, VanModel, CarModel, ParcelMesh, type Vec } from '../three/shared';

/* ───────────── world constants ───────────── */

const TOP = 0.94; // packing table top
const CT = 0.86; // main conveyor top
const LEVELS = [0.12, 1.4, 2.7, 4.0, 5.3];
const BAYS = [-9.6, -7.2, -4.8, -2.4, 0, 2.4, 4.8];
const ROW_Z = [-8, -11];
const PALLET_HOME = v3(-15.6, 0, -1);
const PALLET_SLOT = v3(-7.2, LEVELS[2], -8);
const PICK = { bay: 2.4, level: 1 };
const VB = { w: 0.5, h: 0.38, d: 0.42 }; // vendor carton
const BB = { w: 0.56, h: 0.42, d: 0.46 }; // branded parcel
const STATION_A = v3(2.9, TOP + VB.h / 2, -1.1);
const STATION_B = v3(3.85, TOP + BB.h / 2, -1.1);
const PRINTER = v3(4.95, TOP + 0.22, -1.55);
const LANES = [10.5, 12.5, 14.5];
const CHUTE_END = (x: number) => v3(x, 0.55, 2.6);
const VAN0 = v3(14, 0, 5);
const CAR0 = v3(14, 0, 8.2);
const HOUSE = v3(55, 0, -5.6);

const ROAD = new THREE.CatmullRomCurve3(
  [v3(14, 0, 5), v3(17, 0, 5), v3(20.5, 0, 5), v3(26, 0, 5), v3(32, 0, 3.6), v3(38, 0, 0.6), v3(44, 0, -1.4), v3(49, 0, -2.3), v3(52.4, 0, -2.8)],
  false, 'catmullrom', 0.5,
);
const ROUTE_FROM = 0.12;

/* ───────────── camera shots (pos → target), start pose → end pose ───────────── */

type Pose = { p: Vec; t: Vec };
const SHOT_POSES: [Pose, Pose][] = [
  [{ p: [-10.6, 2.5, 4.4], t: [-18.5, 1.5, -1.2] }, { p: [-12.4, 2.0, 2.7], t: [-17.2, 1.2, -1] }],
  [{ p: [-9.5, 2.3, 1.8], t: [-9.5, 1.4, -5] }, { p: [-10.2, 5.2, -1.6], t: [-7.2, 3.3, -8] }],
  [{ p: [4.6, 2.5, -2.2], t: [2.4, 1.5, -7.4] }, { p: [4.0, 2.0, -3.0], t: [2.4, 1.0, -5.4] }],
  [{ p: [5.8, 2.7, 1.8], t: [3.4, 1.0, -1.2] }, { p: [5.0, 2.2, 0.9], t: [3.5, 1.05, -1.1] }],
  [{ p: [6.0, 1.9, 0.9], t: [4.3, 1.15, -1.15] }, { p: [5.3, 1.6, 0.45], t: [4.1, 1.15, -1.1] }],
  [{ p: [5.4, 6.4, 9.6], t: [9.6, 0.5, -2.2] }, { p: [11.2, 5.0, 8.6], t: [12.4, 0.6, 0.2] }],
  [{ p: [9.4, 2.9, 10.2], t: [13.2, 1.0, 5.6] }, { p: [10.6, 2.5, 11.2], t: [13.6, 1.0, 6.2] }],
];
const TRANSITION = 1.2;

/* ───────────── shared mutable state ───────────── */

function makeState() {
  return { t: 0, fade: 0 };
}
type State = ReturnType<typeof makeState>;

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const dummy = new THREE.Object3D();
const colA = new THREE.Color();
const colB = new THREE.Color();

/* ───────────── environment ───────────── */

function Building() {
  // walls with openings for the dock (left) and the exit (right)
  const wallH = 7.2;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[1, 0, -1]}><planeGeometry args={[38, 26]} /><Lam c={COL.cloud} /></mesh>
      {[-2.6, 2.4].map((z) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[1, 0.004, z]}><planeGeometry args={[36, 0.07]} /><Lam c={COL.teal} /></mesh>
      ))}
      {/* back wall */}
      <mesh position={[1, wallH / 2, -12.6]}><boxGeometry args={[38, wallH, 0.3]} /><Lam c={COL.white} /></mesh>
      <mesh position={[1, 0.3, -12.42]}><boxGeometry args={[38, 0.6, 0.05]} /><Lam c={COL.navy7} /></mesh>
      {/* left (dock) wall: opening z ∈ [-2.5, 0.5], h 3.2 */}
      <mesh position={[-18, wallH / 2, -7.55]}><boxGeometry args={[0.3, wallH, 10.1]} /><Lam c={COL.white} /></mesh>
      <mesh position={[-18, wallH / 2, 6.25]}><boxGeometry args={[0.3, wallH, 11.5]} /><Lam c={COL.white} /></mesh>
      <mesh position={[-18, (wallH + 3.2) / 2, -1]}><boxGeometry args={[0.3, wallH - 3.2, 3]} /><Lam c={COL.white} /></mesh>
      {/* dock door frame + outside apron */}
      {[-2.55, 0.55].map((z) => <mesh key={z} position={[-17.8, 1.65, z]}><boxGeometry args={[0.12, 3.3, 0.12]} /><Lam c={COL.navy} /></mesh>)}
      <mesh position={[-17.8, 3.26, -1]}><boxGeometry args={[0.12, 0.12, 3.2]} /><Lam c={COL.navy} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-30, -0.005, -1]}><planeGeometry args={[24, 26]} /><Lam c={COL.line} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-19.2, 0.003, -1]}><planeGeometry args={[2.4, 3]} /><Lam c={COL.navy7} /></mesh>
      {/* right (exit) wall: opening z ∈ [3, 7], h 3.6 */}
      <mesh position={[20, wallH / 2, -4.8]}><boxGeometry args={[0.3, wallH, 15.6]} /><Lam c={COL.white} /></mesh>
      <mesh position={[20, wallH / 2, 9.5]}><boxGeometry args={[0.3, wallH, 5]} /><Lam c={COL.white} /></mesh>
      <mesh position={[20, (wallH + 3.6) / 2, 5]}><boxGeometry args={[0.3, wallH - 3.6, 4]} /><Lam c={COL.white} /></mesh>
      {/* roof beams */}
      {[-14, -8, -2, 4, 10, 16].map((x) => (
        <mesh key={x} position={[x, wallH, -1]}><boxGeometry args={[0.25, 0.35, 24]} /><Lam c={COL.navy7} /></mesh>
      ))}
    </group>
  );
}

function Exterior() {
  const road = useMemo(() => {
    const pts = ROAD.getSpacedPoints(120);
    const pos: number[] = [];
    const idx: number[] = [];
    pts.forEach((p, i) => {
      const tan = ROAD.getTangentAt(Math.min(0.999, i / 120), tmpA).clone();
      const n = new THREE.Vector3(-tan.z, 0, tan.x).multiplyScalar(1.25);
      pos.push(p.x + n.x, 0.012, p.z + n.z, p.x - n.x, 0.012, p.z - n.z);
      if (i < pts.length - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  const blocks = useMemo(() => {
    const out: { x: number; z: number; w: number; h: number; d: number }[] = [];
    const samples = ROAD.getSpacedPoints(160);
    let k = 0;
    for (let x = 23; x < 64; x += 3.1) {
      for (const z of [-12, -8.5, 9, 12.5, -15]) {
        k++;
        const w = 1.6 + ((k * 7) % 5) * 0.25, d = 1.6 + ((k * 3) % 4) * 0.3, h = 0.8 + ((k * 11) % 9) * 0.35;
        const zz = z + ((k * 5) % 3) - 1;
        if (samples.some((p) => Math.abs(p.x - x) < w / 2 + 1.8 && Math.abs(p.z - zz) < d / 2 + 1.8)) continue;
        if (Math.hypot(x - HOUSE.x, zz - HOUSE.z) < 4) continue;
        out.push({ x, z: zz, w, h, d });
      }
    }
    return out;
  }, []);
  const lights = useMemo(() => [0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88].map((u) => {
    const p = ROAD.getPointAt(u);
    const t = ROAD.getTangentAt(u);
    return { x: p.x - t.z * 1.9, z: p.z + t.x * 1.9 };
  }), []);
  const bRef = useRef<THREE.InstancedMesh>(null!);
  const wRef = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    blocks.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z); dummy.scale.set(b.w, b.h, b.d); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
      bRef.current.setMatrixAt(i, dummy.matrix);
      [0.38, 0.7].forEach((f, j) => {
        dummy.position.set(b.x, b.h * f, b.z + b.d / 2 + 0.01); dummy.scale.set(b.w * 0.72, 0.12, 0.02); dummy.updateMatrix();
        wRef.current.setMatrixAt(i * 2 + j, dummy.matrix);
      });
    });
    bRef.current.instanceMatrix.needsUpdate = true;
    wRef.current.instanceMatrix.needsUpdate = true;
  }, [blocks]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[52, -0.01, 0]}><planeGeometry args={[64, 70]} /><Lam c={COL.navy6} /></mesh>
      <mesh geometry={road}><Lam c={COL.navy} /></mesh>
      <instancedMesh ref={bRef} args={[undefined, undefined, blocks.length]}><boxGeometry /><Lam c={COL.navy7} /></instancedMesh>
      <instancedMesh ref={wRef} args={[undefined, undefined, blocks.length * 2]}><boxGeometry /><meshBasicMaterial color={COL.glass} toneMapped={false} /></instancedMesh>
      {lights.map((l, i) => (
        <group key={i} position={[l.x, 0, l.z]}>
          <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.05, 0.05, 2.2, 6]} /><Lam c={COL.navy} /></mesh>
          <mesh position={[0, 2.25, 0]}><boxGeometry args={[0.32, 0.1, 0.18]} /><meshBasicMaterial color={COL.glass} toneMapped={false} /></mesh>
        </group>
      ))}
      {/* the customer's house */}
      <group position={[HOUSE.x, 0, HOUSE.z]}>
        <mesh position={[0, 0.7, 0]}><boxGeometry args={[1.8, 1.4, 1.6]} /><Lam c={COL.white} /></mesh>
        <mesh position={[0, 1.75, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[1.45, 0.8, 4]} /><Lam c={COL.navy} /></mesh>
        <mesh position={[0, 0.4, 0.81]}><boxGeometry args={[0.42, 0.78, 0.03]} /><Lam c={COL.navy6} /></mesh>
        {[-0.58, 0.58].map((x) => <mesh key={x} position={[x, 0.86, 0.81]}><boxGeometry args={[0.36, 0.32, 0.02]} /><meshBasicMaterial color={COL.glass} toneMapped={false} /></mesh>)}
      </group>
    </group>
  );
}

/* ───────────── racks (instanced) + blinking rack lights ───────────── */

function Racks({ s }: { s: State }) {
  const up = useRef<THREE.InstancedMesh>(null!);
  const beam = useRef<THREE.InstancedMesh>(null!);
  const box = useRef<THREE.InstancedMesh>(null!);
  const tape = useRef<THREE.InstancedMesh>(null!);
  const lights = useRef<THREE.InstancedMesh>(null!);
  const data = useMemo(() => {
    const ups: Vec[] = [];
    for (const z of ROW_Z) for (let k = 0; k < 8; k++) for (const dz of [-0.55, 0.55]) ups.push([-10.8 + k * 2.4, 3.1, z + dz]);
    const beams: Vec[] = [];
    for (const z of ROW_Z) for (const y of LEVELS) for (const dz of [-0.55, 0.55]) beams.push([-2.4, y - 0.06, z + dz]);
    const boxes: { p: Vec; s: Vec; c: string }[] = [];
    let k = 0;
    const tones = [COL.cloud, COL.white, COL.line, COL.cloud];
    for (const z of ROW_Z) for (const bx of BAYS) LEVELS.forEach((y, li) => {
      if (z === ROW_Z[0] && bx === PALLET_SLOT.x && li === 2) return; // the forklift's slot
      for (const off of [-0.72, 0, 0.72]) {
        k++;
        if (z === ROW_Z[0] && bx === PICK.bay && li === PICK.level && off === 0) continue; // the picked carton
        if ((k * 13) % 11 === 0) continue; // a few gaps so it reads as real stock
        const w = 0.5 + ((k * 7) % 4) * 0.06, h = 0.36 + ((k * 5) % 5) * 0.08, d = 0.5 + ((k * 3) % 3) * 0.08;
        boxes.push({ p: [bx + off, y + h / 2 + 0.02, z], s: [w, h, d], c: tones[k % tones.length] });
      }
    });
    const lts: Vec[] = [];
    for (const bx of BAYS) for (const li of [1, 2, 3]) lts.push([bx - 1.05, LEVELS[li] + 0.25, ROW_Z[0] + 0.62]);
    return { ups, beams, boxes, lts };
  }, []);
  useLayoutEffect(() => {
    data.ups.forEach((p, i) => { dummy.position.set(...p); dummy.scale.set(0.1, 6.2, 0.1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); up.current.setMatrixAt(i, dummy.matrix); });
    data.beams.forEach((p, i) => { dummy.position.set(...p); dummy.scale.set(16.9, 0.1, 0.07); dummy.updateMatrix(); beam.current.setMatrixAt(i, dummy.matrix); });
    data.boxes.forEach((b, i) => {
      dummy.position.set(...b.p); dummy.scale.set(...b.s); dummy.updateMatrix(); box.current.setMatrixAt(i, dummy.matrix);
      box.current.setColorAt(i, colA.set(b.c));
      dummy.position.y = b.p[1] + b.s[1] / 2 + 0.004; dummy.scale.set(b.s[0] * 0.17, 0.01, b.s[2] + 0.004); dummy.updateMatrix(); tape.current.setMatrixAt(i, dummy.matrix);
    });
    [up, beam, box, tape].forEach((r) => (r.current.instanceMatrix.needsUpdate = true));
    if (box.current.instanceColor) box.current.instanceColor.needsUpdate = true;
  }, [data]);
  useFrame(() => {
    // blink pattern: periodic in 1.5 s so the loop stays seamless (36 / 1.5 = 24)
    data.lts.forEach((p, i) => {
      const on = ((s.t * 1.333 + i * 0.37) % 2) < 0.18;
      dummy.position.set(...p); dummy.scale.setScalar(on ? 1 : 0.0001); dummy.updateMatrix();
      lights.current.setMatrixAt(i, dummy.matrix);
    });
    lights.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      {ROW_Z.map((z) => <Blob key={z} w={18} d={2.4} position={[-2.4, 0.006, z]} opacity={0.5} />)}
      <instancedMesh ref={up} args={[undefined, undefined, data.ups.length]}><boxGeometry /><Lam c={COL.navy7} /></instancedMesh>
      <instancedMesh ref={beam} args={[undefined, undefined, data.beams.length]}><boxGeometry /><Lam c={COL.navy} /></instancedMesh>
      <instancedMesh ref={box} args={[undefined, undefined, data.boxes.length]}><boxGeometry /><Lam c={COL.white} /></instancedMesh>
      <instancedMesh ref={tape} args={[undefined, undefined, data.boxes.length]}><boxGeometry /><Lam c={COL.teal} /></instancedMesh>
      <instancedMesh ref={lights} args={[undefined, undefined, data.lts.length]} frustumCulled={false}><boxGeometry args={[0.07, 0.07, 0.04]} /><meshBasicMaterial color={COL.teal} toneMapped={false} /></instancedMesh>
    </group>
  );
}

/* ───────────── shot 1: truck, dock door, pallet with cartons ───────────── */

function Dock({ s, pallet }: { s: State; pallet: React.RefObject<THREE.Group | null> }) {
  const truck = useRef<THREE.Group>(null!);
  const door = useRef<THREE.Mesh>(null!);
  const cartons = useRef<(THREE.Group | null)[]>([]);
  const stack: Vec[] = [[-0.3, 0.27, -0.25], [0.3, 0.27, -0.25], [-0.3, 0.27, 0.25], [0.3, 0.27, 0.25], [0, 0.7, -0.22], [0, 0.7, 0.24]];
  useFrame(() => {
    const t = s.t;
    // the door rolls up first, so the trailer is seen reversing into the dock
    const roll = easeInOut(seg(t, 0.15, 1.0));
    truck.current.position.x = lerp(-29, -22.1, easeOut(seg(t, 0.5, 2.3)));
    truck.current.visible = t < 9;
    door.current.position.y = 1.6 + roll * 1.45;
    door.current.scale.y = 1 - roll * 0.9;
    // cartons slide out of the trailer onto the pallet (pallet-local coordinates)
    const pal = pallet.current;
    if (!pal) return;
    stack.forEach((p, i) => {
      const g = cartons.current[i];
      if (!g) return;
      const k = seg(t, 2.35 + i * 0.27, 3.05 + i * 0.27);
      const settle = t > 8.8 && t < 9.6 ? Math.sin(seg(t, 8.8, 9.6) * Math.PI * 3) * 0.03 * (1 - seg(t, 8.8, 9.6)) : 0;
      if (t < 4.5) {
        // world start inside the trailer → local
        tmpA.set(-19.3, 1.05, -1 + p[2]).sub(PALLET_HOME);
        tmpB.set(...p);
        g.position.lerpVectors(tmpA, tmpB, easeOut(k));
        g.position.y += Math.sin(k * Math.PI) * 0.25;
        g.visible = k > 0;
      } else {
        g.position.set(p[0], p[1] + Math.abs(settle), p[2]);
        g.visible = true;
      }
    });
  });
  return (
    <group>
      <group ref={truck} position={[-31, 0, -1]}>
        <Blob w={9} d={3.4} position={[-1, 0.01, 0]} opacity={0.7} />
        <mesh position={[0, 1.65, 0]}><boxGeometry args={[7, 2.6, 2.4]} /><Lam c={COL.white} /></mesh>
        <mesh position={[0, 0.95, 1.21]}><boxGeometry args={[7, 0.2, 0.02]} /><Lam c={COL.teal} /></mesh>
        <mesh position={[3.505, 1.65, 0]}><boxGeometry args={[0.02, 2.4, 2.2]} /><Lam c={COL.navy8} /></mesh>
        <RoundedBox args={[1.6, 1.9, 2.3]} radius={0.18} smoothness={2} position={[-4.4, 1.3, 0]}><Lam c={COL.navy} /></RoundedBox>
        {[-4.4, -1.6, 2.4].map((x) => [1.15, -1.15].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.42, z]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.42, 0.42, 0.3, 14]} /><Lam c={COL.navy} /></mesh>
        )))}
      </group>
      <mesh position={[-18.2, 3.3, -1]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.22, 0.22, 3.1, 12]} /><Lam c={COL.navy7} /></mesh>
      <mesh ref={door} position={[-17.98, 1.6, -1]}><boxGeometry args={[0.08, 3.2, 3]} /><Lam c={COL.line} /></mesh>
      <group ref={pallet} position={PALLET_HOME.toArray() as Vec}>
        <Blob w={1.9} d={1.7} position={[0, 0.01, 0]} />
        <mesh position={[0, 0.06, 0]}><boxGeometry args={[1.3, 0.12, 1.1]} /><Lam c={COL.navy6} /></mesh>
        {stack.map((_, i) => (
          <group key={i} ref={(el) => { cartons.current[i] = el; }} visible={false}>
            <mesh><boxGeometry args={[0.56, 0.42, 0.48]} /><Lam c={i % 2 ? COL.cloud : COL.white} /></mesh>
            <mesh><boxGeometry args={[0.1, 0.424, 0.484]} /><Lam c={COL.teal} /></mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ───────────── shot 2: forklift putaway ───────────── */

function Forklift({ s, pallet }: { s: State; pallet: React.RefObject<THREE.Group | null> }) {
  const g = useRef<THREE.Group>(null!);
  const carriage = useRef<THREE.Group>(null!);
  const start = useMemo(() => v3(-11.6, 0, -1), []);
  const engage = useMemo(() => PALLET_HOME.clone().add(v3(1.5, 0, 0)), []);
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(engage.clone(), v3(-7.2, 0, -1), v3(-7.2, 0, -5.6)), [engage]);
  useFrame(() => {
    const t = s.t;
    let rot = Math.PI;
    let lift = 0;
    if (t < 5.6) {
      g.current.position.lerpVectors(start, engage, easeInOut(seg(t, 4.5, 5.6)));
    } else if (t < 7.4) {
      const k = easeInOut(seg(t, 6.0, 7.4));
      curve.getPoint(k, g.current.position);
      rot = lerp(Math.PI, Math.PI / 2, easeInOut(seg(t, 6.2, 7.3)));
      lift = 0.25 * seg(t, 5.6, 6.0);
    } else if (t < 8.8) {
      g.current.position.set(-7.2, 0, lerp(-5.6, -6.5, easeInOut(seg(t, 8.25, 8.8))));
      rot = Math.PI / 2;
      lift = lerp(0.25, LEVELS[2] + 0.02, easeInOut(seg(t, 7.4, 8.25)));
    } else {
      g.current.position.set(-7.2, 0, lerp(-6.5, -4.6, easeInOut(seg(t, 9.0, 10.2))));
      rot = Math.PI / 2;
      lift = lerp(LEVELS[2] - 0.05, 0.1, seg(t, 9.0, 10.4));
    }
    g.current.rotation.y = rot;
    carriage.current.position.y = lift;
    const pal = pallet.current;
    if (!pal) return;
    if (t < 5.6) {
      pal.position.copy(PALLET_HOME); pal.rotation.y = 0;
    } else if (t < 8.8) {
      // pallet rides the forks: forklift-local (1.5, lift, 0)
      const dir = tmpA.set(Math.cos(rot), 0, -Math.sin(rot));
      pal.position.copy(g.current.position).addScaledVector(dir, 1.5);
      pal.position.y = lift;
      pal.rotation.y = rot - Math.PI;
    } else {
      pal.position.copy(PALLET_SLOT); pal.position.y = LEVELS[2] - 0.02; pal.rotation.y = -Math.PI / 2;
    }
  });
  return (
    <group ref={g} position={start.toArray() as Vec}>
      <Blob w={2.6} d={1.8} position={[0.2, 0.01, 0]} opacity={0.85} />
      <RoundedBox args={[1.5, 1.0, 1.05]} radius={0.12} smoothness={2} position={[-0.1, 0.75, 0]}><Lam c={COL.navy} /></RoundedBox>
      <mesh position={[-0.35, 1.55, 0]}><boxGeometry args={[0.7, 0.06, 1.0]} /><Lam c={COL.navy7} /></mesh>
      {[[-0.6, 0.45], [-0.6, -0.45], [0.15, 0.45], [0.15, -0.45]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.2, z]}><boxGeometry args={[0.05, 0.75, 0.05]} /><Lam c={COL.navy7} /></mesh>
      ))}
      <mesh position={[-0.2, 0.68, 0.535]}><boxGeometry args={[1.2, 0.08, 0.01]} /><Lam c={COL.teal} /></mesh>
      {/* mast */}
      {[0.4, -0.4].map((z) => <mesh key={z} position={[0.72, 1.6, z]}><boxGeometry args={[0.08, 3.2, 0.08]} /><Lam c={COL.navy7} /></mesh>)}
      <group ref={carriage}>
        <mesh position={[0.82, 0.35, 0]}><boxGeometry args={[0.08, 0.6, 0.9]} /><Lam c={COL.navy6} /></mesh>
        {[0.3, -0.3].map((z) => <mesh key={z} position={[1.45, 0.06, z]}><boxGeometry args={[1.2, 0.05, 0.12]} /><Lam c={COL.line} /></mesh>)}
      </group>
      {[[-0.6, 0.55], [-0.6, -0.55], [0.45, 0.55], [0.45, -0.55]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.24, z]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.24, 0.24, 0.16, 12]} /><Lam c={COL.navy} /></mesh>
      ))}
    </group>
  );
}

/* ───────────── shots 3–5: pick, repack, label ───────────── */

function Flap({ hinge, len, w, axis, angle }: { hinge: Vec; len: number; w: number; axis: 1 | -1; angle: React.RefObject<THREE.Group | null> }) {
  return (
    <group ref={angle} position={hinge}>
      <mesh position={[0, 0.004, -axis * len / 2]}><boxGeometry args={[w, 0.01, len]} /><Lam c={COL.white} /></mesh>
    </group>
  );
}

function PickAndPack({ s }: { s: State }) {
  const light = useRef<THREE.Mesh>(null!);
  const vendor = useRef<THREE.Group>(null!);
  const vFlapA = useRef<THREE.Group>(null);
  const vFlapB = useRef<THREE.Group>(null);
  const item = useRef<THREE.Group>(null!);
  const brand = useRef<THREE.Group>(null!);
  const bFlapA = useRef<THREE.Group>(null);
  const bFlapB = useRef<THREE.Group>(null);
  const tape = useRef<THREE.Mesh>(null!);
  const label = useRef<THREE.Mesh>(null!);
  const flyLabel = useRef<THREE.Mesh>(null!);
  const beam = useRef<THREE.Mesh>(null!);
  const beamMat = useRef<THREE.MeshBasicMaterial>(null!);
  const rollers = useRef<THREE.InstancedMesh>(null!);
  const tex = useMemo(barcodeTexture, []);
  const shelf = useMemo(() => v3(PICK.bay, LEVELS[PICK.level] + VB.h / 2 + 0.02, -7.9), []);
  useLayoutEffect(() => {
    for (let i = 0; i < 14; i++) {
      dummy.position.set(PICK.bay, 0.78, -6.5 + i * 0.33); dummy.rotation.set(0, 0, Math.PI / 2); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      rollers.current.setMatrixAt(i, dummy.matrix);
    }
    rollers.current.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame(() => {
    const t = s.t;
    // shelf light: blinks, then stays on while the carton comes out
    const blink = t > 9.4 && t < 11.2 && (t < 10.2 ? Math.floor(t * 8) % 2 === 0 : true);
    light.current.scale.setScalar(blink ? 1.25 : 0.0001);
    // vendor carton: shelf → out → down onto the pick conveyor → station A
    const v = vendor.current;
    if (t < 10.2 || t > 33) v.position.copy(shelf);
    else if (t < 11.0) { v.position.copy(shelf); v.position.z = lerp(-7.9, -6.75, easeInOut(seg(t, 10.2, 11.0))); }
    else if (t < 11.5) { v.position.set(PICK.bay, lerp(shelf.y, 0.82 + VB.h / 2, easeOut(seg(t, 11.0, 11.5))), -6.75); }
    else if (t < 12.9) { v.position.set(PICK.bay, 0.82 + VB.h / 2, lerp(-6.75, -2.3, easeInOut(seg(t, 11.5, 12.9)))); }
    else if (t < 13.6) { const k = easeInOut(seg(t, 12.9, 13.6)); v.position.lerpVectors(tmpA.set(PICK.bay, 0.82 + VB.h / 2, -2.3), STATION_A, k); v.position.y += Math.sin(k * Math.PI) * 0.3; }
    else if (t < 16) v.position.copy(STATION_A);
    else { v.position.copy(STATION_A); v.position.x = lerp(STATION_A.x, 2.1, easeInOut(seg(t, 16, 17))); }
    const vOpen = easeOut(seg(t, 13.6, 14.3)) * (t < 33 ? 1 : 0);
    if (vFlapA.current) vFlapA.current.rotation.x = -vOpen * 2.2;
    if (vFlapB.current) vFlapB.current.rotation.x = vOpen * 2.2;
    // the item: out of the vendor carton, over, into the branded box
    const it = item.current;
    it.visible = t > 14.1 && t < 16.2;
    if (it.visible) {
      const up = easeOut(seg(t, 14.2, 14.85));
      const over = easeInOut(seg(t, 14.85, 15.5));
      const down = easeIn2(seg(t, 15.5, 15.85));
      it.position.set(lerp(STATION_A.x, STATION_B.x, over), TOP + 0.12 + up * 0.55 - down * 0.5, -1.1);
      it.rotation.z = Math.sin(over * Math.PI) * 0.3;
    }
    // branded box: open → flaps fold → tape → label → scan → onto the main conveyor
    const fold = easeInOut(seg(t, 15.9, 16.5));
    if (bFlapA.current) bFlapA.current.rotation.x = -(1 - fold) * 2.0;
    if (bFlapB.current) bFlapB.current.rotation.x = (1 - fold) * 2.0;
    const tk = easeInOut(seg(t, 16.5, 17.2));
    tape.current.scale.z = Math.max(0.0001, tk);
    tape.current.position.z = -BB.d / 2 + (BB.d * tk) / 2;
    tape.current.visible = tk > 0;
    brandPose(t, brand.current.position);
    brand.current.visible = t > 12.6 && t < 27.35;
    // label: prints out of the printer, flies onto the box front
    const print = easeOut(seg(t, 17.6, 18.5));
    const fly = easeInOut(seg(t, 18.6, 19.3));
    flyLabel.current.visible = print > 0 && fly < 1;
    flyLabel.current.scale.set(1, Math.max(0.05, print), 1);
    flyLabel.current.position.lerpVectors(tmpA.set(PRINTER.x - 0.36, PRINTER.y - 0.05, PRINTER.z + 0.15), tmpB.set(STATION_B.x + 0.05, STATION_B.y, STATION_B.z + BB.d / 2 + 0.006), fly);
    flyLabel.current.position.y += Math.sin(fly * Math.PI) * 0.3;
    flyLabel.current.rotation.y = (1 - fly) * -Math.PI / 2;
    label.current.visible = fly >= 1;
    // scan beam sweeps across the label with a teal glow
    const sweep = seg(t, 19.5, 20.7);
    beam.current.visible = sweep > 0 && sweep < 1;
    beam.current.position.set(STATION_B.x - 0.24 + sweep * 0.5, STATION_B.y + 0.25, STATION_B.z + BB.d / 2 + 0.1);
    beamMat.current.opacity = 0.35 + Math.sin(sweep * Math.PI) * 0.4;
  });
  return (
    <group>
      {/* pick conveyor */}
      <mesh position={[PICK.bay, 0.72, -4.35]}><boxGeometry args={[0.8, 0.06, 4.6]} /><Lam c={COL.navy6} /></mesh>
      <instancedMesh ref={rollers} args={[undefined, undefined, 14]}><cylinderGeometry args={[0.05, 0.05, 0.74, 8]} /><Lam c={COL.line} /></instancedMesh>
      {[-6.2, -2.4].map((z) => [-0.32, 0.32].map((x) => <mesh key={`${z}${x}`} position={[PICK.bay + x, 0.36, z]}><boxGeometry args={[0.06, 0.72, 0.06]} /><Lam c={COL.navy7} /></mesh>))}
      <mesh ref={light} position={[PICK.bay, LEVELS[PICK.level] - 0.03, -7.36]}><boxGeometry args={[0.22, 0.05, 0.03]} /><meshBasicMaterial color={COL.teal} toneMapped={false} /></mesh>
      {/* packing station */}
      <Blob w={4.2} d={2.2} position={[3.7, 0.006, -1.1]} opacity={0.6} />
      <mesh position={[3.7, TOP - 0.04, -1.1]}><boxGeometry args={[3.2, 0.08, 1.3]} /><Lam c={COL.navy} /></mesh>
      {[[-1.5, -0.55], [1.5, -0.55], [-1.5, 0.55], [1.5, 0.55]].map(([x, z], i) => <mesh key={i} position={[3.7 + x, (TOP - 0.08) / 2, -1.1 + z]}><boxGeometry args={[0.07, TOP - 0.08, 0.07]} /><Lam c={COL.navy7} /></mesh>)}
      <RoundedBox args={[0.6, 0.44, 0.5]} radius={0.06} smoothness={2} position={PRINTER.toArray() as Vec}><Lam c={COL.navy7} /></RoundedBox>
      <mesh position={[PRINTER.x - 0.1, PRINTER.y + 0.225, PRINTER.z]}><boxGeometry args={[0.24, 0.01, 0.06]} /><meshBasicMaterial color={COL.teal} toneMapped={false} /></mesh>
      {/* scanner head over the bench */}
      <mesh position={[STATION_B.x, TOP + 1.05, STATION_B.z + 0.5]}><boxGeometry args={[0.7, 0.08, 0.14]} /><Lam c={COL.navy7} /></mesh>
      <mesh position={[STATION_B.x + 0.36, TOP + 0.52, STATION_B.z + 0.5]}><boxGeometry args={[0.05, 1.05, 0.05]} /><Lam c={COL.navy7} /></mesh>
      <mesh ref={beam} visible={false}>
        <planeGeometry args={[0.05, 0.6]} />
        <meshBasicMaterial ref={beamMat} color={COL.teal} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* vendor carton (the picked item) */}
      <group ref={vendor}>
        <mesh><boxGeometry args={[VB.w, VB.h, VB.d]} /><Lam c={COL.line} /></mesh>
        <Flap hinge={[0, VB.h / 2, VB.d / 2]} len={VB.d / 2} w={VB.w - 0.02} axis={1} angle={vFlapA} />
        <Flap hinge={[0, VB.h / 2, -VB.d / 2]} len={VB.d / 2} w={VB.w - 0.02} axis={-1} angle={vFlapB} />
      </group>
      <group ref={item} visible={false}>
        <mesh><cylinderGeometry args={[0.08, 0.08, 0.26, 14]} /><Lam c={COL.navy} /></mesh>
        <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.05, 0.05, 0.06, 12]} /><Lam c={COL.teal} /></mesh>
      </group>
      {/* branded parcel */}
      <group ref={brand} visible={false}>
        <RoundedBox args={[BB.w, BB.h, BB.d]} radius={0.02} smoothness={2}><Lam c={COL.cloud} /></RoundedBox>
        <mesh position={[-0.18, 0.05, BB.d / 2 + 0.004]}><planeGeometry args={[0.1, 0.1]} /><meshBasicMaterial color={COL.navy} /></mesh>
        <Flap hinge={[0, BB.h / 2, BB.d / 2]} len={BB.d / 2} w={BB.w - 0.02} axis={1} angle={bFlapA} />
        <Flap hinge={[0, BB.h / 2, -BB.d / 2]} len={BB.d / 2} w={BB.w - 0.02} axis={-1} angle={bFlapB} />
        <mesh ref={tape} position={[0, BB.h / 2 + 0.012, 0]}><boxGeometry args={[0.1, 0.006, BB.d]} /><Lam c={COL.teal} /></mesh>
        <mesh ref={label} position={[0.05, 0, BB.d / 2 + 0.006]} visible={false}><planeGeometry args={[0.3, 0.2]} /><meshBasicMaterial map={tex} /></mesh>
      </group>
      <mesh ref={flyLabel} visible={false}><planeGeometry args={[0.3, 0.2]} /><meshBasicMaterial map={tex} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}
const easeIn2 = (v: number) => v * v;

/** Branded parcel path from the bench to the van (world position). */
function brandPose(t: number, out: THREE.Vector3) {
  if (t < 20.8) return out.copy(STATION_B);
  if (t < 21.5) { const k = easeInOut(seg(t, 20.8, 21.5)); out.lerpVectors(STATION_B, tmpB.set(5.7, CT + BB.h / 2, -0.5), k); out.y += Math.sin(k * Math.PI) * 0.25; return out; }
  if (t < 24.2) return out.set(lerp(5.7, LANES[1], easeInOut(seg(t, 21.5, 24.2))), CT + BB.h / 2, -0.5);
  if (t < 24.7) return out.set(LANES[1], CT + BB.h / 2, lerp(-0.5, 0.25, easeOut(seg(t, 24.2, 24.7))));
  if (t < 25.6) { const k = easeIn2(seg(t, 24.7, 25.6)); return out.set(LANES[1], lerp(CT, 0.55, k) + BB.h / 2, lerp(0.25, 2.6, k)); }
  if (t < 26) return out.copy(CHUTE_END(LANES[1])).setY(0.55 + BB.h / 2);
  if (t < 26.8) { const k = easeInOut(seg(t, 26, 26.8)); out.lerpVectors(tmpA.copy(CHUTE_END(LANES[1])).setY(0.55 + BB.h / 2), tmpB.set(12.5, 0.95 + BB.h / 2, VAN0.z), k); out.y += Math.sin(k * Math.PI) * 0.4; return out; }
  return out.set(lerp(12.5, 13.4, easeInOut(seg(t, 26.8, 27.3))), 0.95 + BB.h / 2, VAN0.z);
}

/* ───────────── shot 6: the sorter ───────────── */

/** Ambient parcels on the main conveyor (12 s period → seamless in a 36 s loop). */
function flowPose(t: number, k: number, out: THREE.Vector3) {
  const u = (((t + k * 3 + 1.5) % 12) + 12) % 12 / 12;
  const lane = LANES[(k + 2) % 3];
  if (u < 0.5) return { vis: true, lane, push: 0, p: out.set(lerp(5.7, lane, u / 0.5), CT + 0.2, -0.5) };
  if (u < 0.56) { const k2 = (u - 0.5) / 0.06; return { vis: true, lane, push: k2, p: out.set(lane, CT + 0.2, lerp(-0.5, 0.25, k2)) }; }
  if (u < 0.72) { const k2 = (u - 0.56) / 0.16; return { vis: true, lane, push: 1 - k2, p: out.set(lane, lerp(CT, 0.55, k2) + 0.2, lerp(0.25, 2.6, k2)) }; }
  return { vis: false, lane, push: 0, p: out };
}

function Sorter({ s }: { s: State }) {
  const flows = useRef<(THREE.Group | null)[]>([]);
  const paddles = useRef<(THREE.Group | null)[]>([]);
  const arch = useRef<THREE.MeshBasicMaterial>(null!);
  const rollers = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    for (let i = 0; i < 30; i++) {
      dummy.position.set(5.5 + i * 0.34, CT - 0.05, -0.5); dummy.rotation.set(Math.PI / 2, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      rollers.current.setMatrixAt(i, dummy.matrix);
    }
    rollers.current.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame(() => {
    const t = s.t;
    const push = [0, 0, 0];
    let nearArch = 0;
    for (let k = 0; k < 4; k++) {
      const g = flows.current[k];
      if (!g) continue;
      const f = flowPose(t, k, g.position);
      g.visible = f.vis;
      push[LANES.indexOf(f.lane)] = Math.max(push[LANES.indexOf(f.lane)], f.push);
      if (f.vis) nearArch = Math.max(nearArch, 1 - Math.min(1, Math.abs(g.position.x - 8.6) / 0.8));
    }
    // hero parcel's own paddle push at lane 2
    if (t > 24.1 && t < 25.2) push[1] = Math.max(push[1], Math.sin(seg(t, 24.1, 25.2) * Math.PI));
    if (t > 21.5 && t < 24.2) { const hx = lerp(5.7, LANES[1], easeInOut(seg(t, 21.5, 24.2))); nearArch = Math.max(nearArch, 1 - Math.min(1, Math.abs(hx - 8.6) / 0.8)); }
    paddles.current.forEach((p, i) => { if (p) p.rotation.y = -push[i] * 0.95; });
    arch.current.opacity = 0.12 + nearArch * 0.45 + Math.sin(t * Math.PI * 2 / 1.5) * 0.03;
  });
  return (
    <group>
      <Blob w={11} d={2.2} position={[10.4, 0.006, -0.5]} opacity={0.55} />
      <mesh position={[10.4, CT - 0.04, -0.5]}><boxGeometry args={[10.4, 0.06, 1.0]} /><Lam c={COL.navy6} /></mesh>
      {[-1.04, 0.04].map((z) => <mesh key={z} position={[10.4, CT - 0.1, z]}><boxGeometry args={[10.5, 0.16, 0.07]} /><Lam c={COL.navy7} /></mesh>)}
      <instancedMesh ref={rollers} args={[undefined, undefined, 30]}><cylinderGeometry args={[0.05, 0.05, 1.0, 8]} /><Lam c={COL.line} /></instancedMesh>
      {[5.6, 8.0, 10.4, 12.8, 15.2].map((x) => [-0.95, -0.05].map((z) => <mesh key={`${x}${z}`} position={[x, (CT - 0.1) / 2, z]}><boxGeometry args={[0.07, CT - 0.1, 0.07]} /><Lam c={COL.navy7} /></mesh>))}
      {/* sorter arch */}
      {[-1.25, 0.25].map((z) => <RoundedBox key={z} args={[0.22, 2.0, 0.18]} radius={0.06} smoothness={2} position={[8.6, 1.0, z]}><Lam c={COL.teal} /></RoundedBox>)}
      <RoundedBox args={[0.36, 0.22, 1.7]} radius={0.08} smoothness={2} position={[8.6, 2.0, -0.5]}><Lam c={COL.teal} /></RoundedBox>
      <mesh position={[8.6, 1.38, -0.5]}><boxGeometry args={[0.24, 1.0, 1.3]} /><meshBasicMaterial ref={arch} color={COL.teal} transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
      {/* diverter arms + lane chutes */}
      {LANES.map((x, i) => (
        <group key={x}>
          <group ref={(el) => { paddles.current[i] = el; }} position={[x - 0.45, CT + 0.14, -1.0]}>
            <mesh position={[0.45, 0, 0]}><boxGeometry args={[0.9, 0.18, 0.05]} /><Lam c={COL.navy} /></mesh>
            <mesh><cylinderGeometry args={[0.07, 0.07, 0.3, 10]} /><Lam c={COL.teal} /></mesh>
          </group>
          <mesh position={[x, (CT + 0.5) / 2 - 0.03, 1.35]} rotation-x={Math.atan2(CT - 0.5, 2.5)}><boxGeometry args={[0.85, 0.04, 2.6]} /><Lam c={i === 1 ? COL.tealSoft : COL.line} /></mesh>
          {[-0.44, 0.44].map((dx) => <mesh key={dx} position={[x + dx, (CT + 0.5) / 2 + 0.05, 1.35]} rotation-x={Math.atan2(CT - 0.5, 2.5)}><boxGeometry args={[0.04, 0.12, 2.6]} /><Lam c={COL.navy7} /></mesh>)}
        </group>
      ))}
      {[0, 1, 2, 3].map((k) => (
        <group key={k} ref={(el) => { flows.current[k] = el; }} visible={false} scale={0.75}><ParcelMesh /></group>
      ))}
    </group>
  );
}

/* ───────────── ambient: background conveyor + worker with a cart ───────────── */

function Ambient({ s }: { s: State }) {
  const boxes = useRef<THREE.InstancedMesh>(null!);
  const worker = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const N = 9;
  useFrame(() => {
    const t = s.t;
    for (let i = 0; i < N; i++) {
      // 6 s per pass → seamless in 36 s
      const u = (((t / 6 + i / N) % 1) + 1) % 1;
      dummy.position.set(lerp(-5.4, 1.4, u), 0.92, -3.6); dummy.rotation.set(0, 0, 0); dummy.scale.set(0.42, 0.32, 0.38); dummy.updateMatrix();
      boxes.current.setMatrixAt(i, dummy.matrix);
    }
    boxes.current.instanceMatrix.needsUpdate = true;
    // worker loops an ellipse every 18 s
    const a = (t / 18) * Math.PI * 2;
    worker.current.position.set(-3 + Math.cos(a) * 5.2, 0, 3.4 + Math.sin(a) * 1.3);
    worker.current.rotation.y = Math.atan2(-Math.cos(a) * 1.3, -Math.sin(a) * 5.2);
    body.current.position.y = Math.abs(Math.sin(t * Math.PI * 2)) * 0.04;
  });
  return (
    <group>
      <mesh position={[-2, 0.72, -3.6]}><boxGeometry args={[7.4, 0.06, 0.62]} /><Lam c={COL.navy6} /></mesh>
      {[-5.4, -2, 1.4].map((x) => <mesh key={x} position={[x, 0.36, -3.6]}><boxGeometry args={[0.06, 0.72, 0.5]} /><Lam c={COL.navy7} /></mesh>)}
      <instancedMesh ref={boxes} args={[undefined, undefined, N]} frustumCulled={false}><boxGeometry /><Lam c={COL.white} /></instancedMesh>
      <group ref={worker}>
        <Blob w={1.6} d={1.0} position={[0.4, 0.01, 0]} opacity={0.6} />
        <group ref={body}>
          <mesh position={[0, 0.82, 0]}><capsuleGeometry args={[0.2, 0.75, 4, 10]} /><Lam c={COL.navy} /></mesh>
          <mesh position={[0, 1.5, 0]}><sphereGeometry args={[0.15, 12, 10]} /><Lam c={COL.navy6} /></mesh>
          <mesh position={[0.25, 1.0, 0]} rotation-z={-1.1}><capsuleGeometry args={[0.05, 0.36, 3, 6]} /><Lam c={COL.navy} /></mesh>
        </group>
        <group position={[0.85, 0, 0]}>
          <mesh position={[0, 0.45, 0]}><boxGeometry args={[0.8, 0.06, 0.55]} /><Lam c={COL.navy7} /></mesh>
          <mesh position={[-0.42, 0.75, 0]}><boxGeometry args={[0.04, 0.6, 0.5]} /><Lam c={COL.navy7} /></mesh>
          <mesh position={[0.05, 0.68, 0]}><boxGeometry args={[0.45, 0.4, 0.4]} /><Lam c={COL.cloud} /></mesh>
          <mesh position={[0.05, 0.68, 0]}><boxGeometry args={[0.08, 0.404, 0.404]} /><Lam c={COL.teal} /></mesh>
          {[[-0.3, 0.22], [0.3, 0.22], [-0.3, -0.22], [0.3, -0.22]].map(([x, z], i) => <mesh key={i} position={[x, 0.08, z]}><sphereGeometry args={[0.07, 8, 6]} /><Lam c={COL.navy} /></mesh>)}
        </group>
      </group>
    </group>
  );
}

/* ───────────── shots 7–8: load the van and the car, drive out at dusk ───────────── */

function Fleet({ s }: { s: State }) {
  const van = useRef<THREE.Group>(null!);
  const doorL = useRef<THREE.Group>(null!);
  const doorR = useRef<THREE.Group>(null!);
  const car = useRef<THREE.Group>(null!);
  const lid = useRef<THREE.Group>(null!);
  const extra = useRef<(THREE.Group | null)[]>([]);
  const dots = useRef<THREE.InstancedMesh>(null!);
  const stops = useRef<(THREE.Group | null)[]>([]);
  const dropped = useRef<THREE.Group>(null!);
  const dot = useRef<THREE.Mesh>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null!);
  const pts = useMemo(() => Array.from({ length: 110 }, (_, i) => ROAD.getPointAt(ROUTE_FROM + (1 - ROUTE_FROM) * (i / 109))), []);
  const tan = useMemo(() => new THREE.Vector3(), []);
  useLayoutEffect(() => {
    pts.forEach((p, i) => { dummy.position.set(p.x, 0.05, p.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); dots.current.setMatrixAt(i, dummy.matrix); });
    dots.current.instanceMatrix.needsUpdate = true;
    dots.current.count = 0;
  }, [pts]);
  useFrame(() => {
    const t = s.t;
    const u = easeInOut(seg(t, 30.0, 34.2));
    ROAD.getPointAt(u, van.current.position);
    ROAD.getTangentAt(Math.min(0.999, Math.max(0.001, u)), tan);
    van.current.rotation.y = Math.atan2(-tan.z, tan.x);
    van.current.position.y = Math.sin(t * 9) * 0.008;
    const close = easeInOut(seg(t, 28.0, 28.8));
    doorL.current.rotation.y = (1 - close) * 1.9;
    doorR.current.rotation.y = -(1 - close) * 1.9;
    lid.current.rotation.z = (1 - easeInOut(seg(t, 28.4, 29.1))) * 1.1;
    // two more parcels: one into the van, one into the car
    const targets = [
      { a: 26.3, b: 27.1, end: v3(12.5, 0.95 + 0.21, VAN0.z - 0.25), into: v3(13.4, 0.95 + 0.21, VAN0.z - 0.25) },
      { a: 26.7, b: 27.6, end: v3(12.75, 0.95, CAR0.z), into: v3(13.2, 0.85, CAR0.z) },
    ];
    targets.forEach((tg, i) => {
      const g = extra.current[i];
      if (!g) return;
      g.visible = t > tg.a - 0.4 && t < tg.b + 0.5;
      const k = easeInOut(seg(t, tg.a, tg.b));
      g.position.lerpVectors(tmpA.copy(CHUTE_END(LANES[i === 0 ? 0 : 2])).setY(0.55 + 0.16), tg.end, k);
      g.position.y += Math.sin(k * Math.PI) * 0.45;
      if (t > tg.b) g.position.lerp(tg.into, easeInOut(seg(t, tg.b, tg.b + 0.5)));
    });
    // dotted route draws ahead of the van, stop dots appear as it passes them
    const reveal = t < 30 ? 0 : Math.min(1, (u + 0.3 - ROUTE_FROM) / (1 - ROUTE_FROM)) * easeOut(seg(t, 30, 31.2));
    dots.current.count = Math.floor(Math.max(0, reveal) * pts.length);
    [0.52, 0.78].forEach((su, i) => { const g = stops.current[i]; if (g) g.scale.setScalar(reveal * (1 - ROUTE_FROM) + ROUTE_FROM > su ? 1 : 0.0001); });
    // the delivered moment: parcel at the door + orange dot pulse
    const land = seg(t, 34.25, 34.6);
    dropped.current.visible = land > 0;
    dropped.current.position.set(HOUSE.x + 0.1, 0.16 + (1 - easeOut(land)) * 0.8, HOUSE.z + 1.15);
    dot.current.scale.setScalar(Math.max(0.0001, easeOut(seg(t, 34.5, 34.8))));
    const pulse = ((t - 34.6) % 0.9) / 0.9 * (t > 34.6 ? 1 : 0);
    ring.current.visible = pulse > 0;
    ring.current.scale.setScalar(0.6 + pulse * 2.2);
    ringMat.current.opacity = (1 - pulse) * 0.9;
  });
  return (
    <group>
      {/* load roller from the chutes to the van */}
      <mesh position={[12.6, 0.6, 3.8]} rotation-x={-0.12}><boxGeometry args={[2.6, 0.05, 2.2]} /><Lam c={COL.navy6} /></mesh>
      <VanModel ref={van} doorL={doorL} doorR={doorR} />
      <group position={CAR0.toArray() as Vec}>
        <CarModel ref={car} lid={lid} />
      </group>
      {[0, 1].map((i) => <group key={i} ref={(el) => { extra.current[i] = el; }} visible={false} scale={0.72}><ParcelMesh /></group>)}
      <instancedMesh ref={dots} args={[undefined, undefined, pts.length]} frustumCulled={false}><cylinderGeometry args={[0.11, 0.11, 0.04, 10]} /><meshBasicMaterial color={COL.teal} toneMapped={false} /></instancedMesh>
      {[0.52, 0.78].map((su, i) => {
        const p = ROAD.getPointAt(su);
        return (
          <group key={su} ref={(el) => { stops.current[i] = el; }} position={[p.x, 0.07, p.z]}>
            <mesh><cylinderGeometry args={[0.32, 0.32, 0.06, 20]} /><meshBasicMaterial color={COL.teal} toneMapped={false} /></mesh>
            <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.19, 0.19, 0.06, 20]} /><meshBasicMaterial color={COL.white} toneMapped={false} /></mesh>
          </group>
        );
      })}
      <group ref={dropped} visible={false} scale={0.7}><ParcelMesh /></group>
      <mesh ref={dot} position={[HOUSE.x + 0.75, 0.04, HOUSE.z + 1.25]}><cylinderGeometry args={[0.17, 0.17, 0.06, 24]} /><meshBasicMaterial color={COL.orange} toneMapped={false} /></mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[HOUSE.x + 0.75, 0.05, HOUSE.z + 1.25]} visible={false}>
        <ringGeometry args={[0.24, 0.31, 40]} />
        <meshBasicMaterial ref={ringMat} color={COL.orange} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ───────────── director: master timeline, camera, light grade ───────────── */

export type HeroApi = { play: () => void; pause: () => void; seek: (t: number) => void; dispose: () => void };

function Director({ s, opts, apiRef }: { s: State; opts: MountOptions; apiRef: { current: HeroApi | null } }) {
  const { camera, invalidate, scene } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const dir = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const vanP = useMemo(() => new THREE.Vector3(), []);
  const bgIn = useMemo(() => new THREE.Color('#E8EFF3'), []);
  const bgOut = useMemo(() => new THREE.Color(COL.navy8), []);
  const fps = useRef({ n: 0, start: 0, done: !!opts.capture });

  useEffect(() => {
    scene.background = bgIn.clone();
    scene.fog = new THREE.Fog(bgIn.getHex(), 14, 50);
    hemi.current = scene.getObjectByName('hemi') as THREE.HemisphereLight;
    dir.current = scene.getObjectByName('sun') as THREE.DirectionalLight;
    const tl = gsap.timeline({ repeat: -1, paused: !!opts.capture });
    // the loop opens on a clean shot 1 frame (= the poster); it fades to white at the end and cuts back in
    tl.set(s, { fade: 0 }, 0);
    tl.to(s, { fade: 1, duration: 0.7, ease: 'power1.in' }, HERO_LOOP - 0.7);
    HERO_SHOTS.forEach((shot, i) => tl.call(() => opts.onShot?.(i), undefined, shot.start + 0.001));
    tl.to({}, { duration: 0.001 }, HERO_LOOP - 0.001);
    if (opts.startAt) { tl.seek(opts.startAt, true); s.t = opts.startAt; s.fade = 0; }
    let visible = true;
    let userPaused = false;
    let raf = 0;
    const loop = () => {
      if (!opts.capture && visible && !userPaused && !document.hidden) invalidate();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!userPaused && !opts.capture) (visible ? tl.resume() : tl.pause());
    });
    io.observe(opts.container);
    const onVis = () => { if (!userPaused && !opts.capture) (document.hidden ? tl.pause() : visible && tl.resume()); };
    document.addEventListener('visibilitychange', onVis);
    const tick = () => { s.t = tl.time(); opts.overlay && (opts.overlay.style.opacity = String(s.fade)); };
    gsap.ticker.add(tick);
    apiRef.current = {
      play: () => { userPaused = false; tl.resume(); invalidate(); },
      pause: () => { userPaused = true; tl.pause(); },
      seek: (t: number) => { tl.seek(t, false); s.t = t; tick(); },
      dispose: () => {},
    };
    return () => { cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener('visibilitychange', onVis); gsap.ticker.remove(tick); tl.kill(); };
  }, [s, opts, invalidate, scene, bgIn, apiRef]);

  useFrame(({ size }) => {
    const t = s.t;
    // camera: dolly within each shot, eased cross-move between shots, chase cam on the road
    let i = HERO_SHOTS.findIndex((sh) => t >= sh.start && t < sh.end);
    if (i < 0) i = HERO_SHOTS.length - 1;
    const sh = HERO_SHOTS[i];
    const pose = (k: number, local: number, outP: THREE.Vector3, outT: THREE.Vector3) => {
      if (k === 7) {
        const u = easeInOut(seg(t, 30.0, 34.2));
        ROAD.getPointAt(u, vanP);
        const wide = easeInOut(seg(t, 33.0, 34.8));
        outT.set(vanP.x + 2.4, 0.7, vanP.z);
        outP.set(vanP.x - 5.6, 2.9, vanP.z + 4.4);
        outT.lerp(tmpA.set(HOUSE.x - 0.6, 0.5, HOUSE.z + 1.1), wide);
        outP.lerp(tmpB.set(HOUSE.x + 5.2, 3.9, HOUSE.z + 7.6), wide);
        return;
      }
      const [a, b] = SHOT_POSES[k];
      const e = sineInOut(local);
      outP.set(lerp(a.p[0], b.p[0], e), lerp(a.p[1], b.p[1], e), lerp(a.p[2], b.p[2], e));
      outT.set(lerp(a.t[0], b.t[0], e), lerp(a.t[1], b.t[1], e), lerp(a.t[2], b.t[2], e));
    };
    pose(i, seg(t, sh.start, sh.end), pos, target);
    if (i > 0 && t - sh.start < TRANSITION) {
      const w = easeInOut((t - sh.start) / TRANSITION);
      const prevP = tmpA.clone(), prevT = tmpB.clone();
      pose(i - 1, 1, prevP, prevT);
      pos.lerpVectors(prevP, pos, w);
      target.lerpVectors(prevT, target, w);
    }
    // portrait / narrow canvases pull back a little
    const aspect = size.width / size.height;
    if (aspect < 1.5) pos.sub(target).multiplyScalar(1 + (1.5 - aspect) * 0.5).add(target);
    camera.position.copy(pos);
    camera.lookAt(target);
    // dusk grade: warm key light, cool navy sky as the van heads out
    const dusk = easeInOut(seg(t, 29.4, 31.2));
    (scene.background as THREE.Color).copy(colA.copy(bgIn).lerp(bgOut, dusk));
    (scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color);
    if (hemi.current) hemi.current.intensity = lerp(1.7, 1.0, dusk);
    if (dir.current) { dir.current.color.copy(colB.set('#FFF1EA').lerp(tmpCol.set(COL.orangeSoft), dusk)); dir.current.intensity = lerp(1.7, 1.2, dusk); }
    // runtime FPS guard (first ~2 s of real-time playback)
    const f = fps.current;
    if (!f.done) {
      const now = performance.now();
      if (!f.start) f.start = now;
      f.n++;
      if (now - f.start > 2000) { f.done = true; const rate = (f.n / (now - f.start)) * 1000; if (rate < 28) opts.onFail?.(`runtime-fps-${Math.round(rate)}`); }
    }
  });
  return null;
}
const tmpCol = new THREE.Color();

/* ───────────── mount ───────────── */

export type MountOptions = {
  container: HTMLElement;
  overlay?: HTMLElement | null;
  capture?: boolean;
  onReady?: () => void;
  onFail?: (reason: string) => void;
  onShot?: (index: number) => void;
  /** Start time on the loop (seconds). */
  startAt?: number;
};

function HeroCanvas({ opts, apiRef }: { opts: MountOptions; apiRef: { current: HeroApi | null } }) {
  const s = useMemo(makeState, []);
  const pallet = useRef<THREE.Group>(null);
  // no frames until shaders are compiled in parallel → mounting never blocks input
  const [warm, setWarm] = useState(false);
  return (
    <Canvas
      frameloop={opts.capture || !warm ? 'never' : 'demand'}
      dpr={opts.capture ? 1 : [1, 1.5]}
      flat
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false, preserveDrawingBuffer: !!opts.capture }}
      camera={{ fov: 40, near: 0.1, far: 120, position: [-8, 2.7, 5.6] }}
      onCreated={({ gl, scene, camera, invalidate }) => {
        gl.domElement.setAttribute('aria-hidden', 'true');
        gl.domElement.addEventListener('webglcontextlost', () => opts.onFail?.('context-lost'));
        gl.compileAsync(scene, camera).catch(() => {}).finally(() => {
          setWarm(true);
          invalidate();
          requestAnimationFrame(() => opts.onReady?.());
        });
      }}
    >
      <hemisphereLight name="hemi" args={['#EAF4F7', '#B9C6D0', 1.7]} />
      <directionalLight name="sun" position={[12, 16, 10]} intensity={1.7} color="#FFF1EA" />
      <Building />
      <Exterior />
      <Racks s={s} />
      <Dock s={s} pallet={pallet} />
      <Forklift s={s} pallet={pallet} />
      <PickAndPack s={s} />
      <Sorter s={s} />
      <Ambient s={s} />
      <Fleet s={s} />
      <Director s={s} opts={opts} apiRef={apiRef} />
    </Canvas>
  );
}

/** Mounts the film into `opts.container`. Returns play/pause/seek/dispose. */
export default function mountHero(opts: MountOptions): HeroApi {
  const apiRef: { current: HeroApi | null } = { current: null };
  const root = createRoot(opts.container);
  root.render(<HeroCanvas opts={opts} apiRef={apiRef} />);
  blobTexture();
  return {
    play: () => apiRef.current?.play(),
    pause: () => apiRef.current?.pause(),
    seek: (t) => {
      apiRef.current?.seek(t);
      advance(performance.now());
    },
    dispose: () => root.unmount(),
  };
}
