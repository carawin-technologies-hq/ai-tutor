"use client";
/**
 * Realistic 3D teacher.
 * Model: Microsoft Rocketbox "Business_Female_01" (MIT licence, see public/avatars/teacher/LICENSE-Rocketbox.md),
 * which ships 15 Oculus-style visemes + ARKit face blendshapes. Lip-sync is driven from the text being spoken,
 * kept in step with the browser speech engine's word-boundary events.
 */
import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { VoiceSignal } from "@/hooks/useTeacherVoice";
import { presenterLayout, type BoardPointer } from "./speech";
import { VISEMES, charViseme, type Viseme } from "./visemes";

export type AvatarMood = "idle" | "listening" | "thinking" | "speaking";

const BASE = "/avatars/teacher/";

// ---------- Viseme mapping ----------
const VISEME_KEYS: Record<Viseme, string> = {
  sil: "AA_VI_00_Sil", PP: "AA_VI_01_PP", FF: "AA_VI_02_FF", TH: "AA_VI_03_TH", DD: "AA_VI_04_DD", kk: "AA_VI_05_KK",
  CH: "AA_VI_06_CH", SS: "AA_VI_07_SS", nn: "AA_VI_08_nn", RR: "AA_VI_09_RR", aa: "AA_VI_10_aa", E: "AA_VI_11_E",
  I: "AA_VI_12_I", O: "AA_VI_13_O", U: "AA_VI_14_U",
};
const FACE_KEYS = [
  "AK_09_EyeBlinkLeft", "AK_10_EyeBlinkRight", "AK_44_MouthSmileLeft", "AK_45_MouthSmileRight",
  "AK_03_BrowInnerUp", "AK_04_BrowOuterUpLeft", "AK_05_BrowOuterUpRight", "AK_01_BrowDownLeft", "AK_02_BrowDownRight",
  "AK_17_EyeLookUpLeft", "AK_18_EyeLookUpRight", "AK_11_EyeLookDownLeft", "AK_12_EyeLookDownRight",
  "AK_13_EyeLookInLeft", "AK_14_EyeLookInRight", "AK_15_EyeLookOutLeft", "AK_16_EyeLookOutRight",
  "AK_07_CheekSquintLeft", "AK_08_CheekSquintRight", "AK_25_JawOpen",
];

// ---------- Bone helpers ----------
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();

/** Local quaternion that points `bone` (towards `child`) along `dirWorld`, given the current pose. */
function aimLocal(bone: THREE.Object3D, child: THREE.Object3D, dirWorld: THREE.Vector3) {
  bone.updateWorldMatrix(true, true);
  const from = child.getWorldPosition(_v1).sub(bone.getWorldPosition(_v2)).normalize();
  const delta = _q1.setFromUnitVectors(from, dirWorld.clone().normalize());
  const boneWorld = bone.getWorldQuaternion(new THREE.Quaternion());
  const parentWorld = bone.parent!.getWorldQuaternion(_q2);
  return parentWorld.invert().multiply(delta).multiply(boneWorld);
}

/** Apply a world-space rotation offset on top of a bone's rest local rotation. */
function applyWorldOffset(bone: THREE.Object3D, rest: THREE.Quaternion, parentRestWorld: THREE.Quaternion, euler: THREE.Euler) {
  const off = _q1.setFromEuler(euler);
  const inv = _q2.copy(parentRestWorld).invert();
  bone.quaternion.copy(inv.multiply(off).multiply(parentRestWorld).multiply(rest));
}

function useTeacherModel() {
  const fbx = useLoader(FBXLoader, BASE + "teacher.fbx", (loader) => {
    // Rocketbox references .tga textures we replace below; stop the loader requesting them.
    loader.manager.setURLModifier((url) => (/\.tga$/i.test(url) ? "data:," : url));
  });
  const [headC, headN, bodyC, bodyN, opac] = useLoader(THREE.TextureLoader, [
    BASE + "head_color.jpg", BASE + "head_normal.jpg", BASE + "body_color.jpg", BASE + "body_normal.jpg", BASE + "opacity_color.png",
  ]);

  return useMemo(() => {
    const source = fbx;
    if (!prepared.has(source)) { prepareSource(source, [headC, headN, bodyC, bodyN, opac]); prepared.add(source); }
    // Each canvas gets its own skeleton (the sidebar and voice-mode bubble can show at once).
    const inst = cloneSkinned(source) as THREE.Group;
    return poseInstance(inst);
  }, [fbx, headC, headN, bodyC, bodyN, opac]);
}

const prepared = new WeakSet<THREE.Object3D>();

/** One-time: swap in web textures and drop unused blendshapes on the shared geometry. */
function prepareSource(fbx: THREE.Group, [headC, headN, bodyC, bodyN, opac]: THREE.Texture[]) {
  {
    [headC, bodyC, opac].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });
    const mats: Record<string, THREE.Material> = {
      f014_head: new THREE.MeshStandardMaterial({ name: "head", map: headC, normalMap: headN, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.62, metalness: 0 }),
      f014_body: new THREE.MeshStandardMaterial({ name: "body", map: bodyC, normalMap: bodyN, roughness: 0.85, metalness: 0 }),
      f014_opacity: new THREE.MeshStandardMaterial({ name: "hair", map: opac, alphaTest: 0.35, transparent: false, side: THREE.DoubleSide, roughness: 0.7, metalness: 0 }),
    };

    let mesh: THREE.SkinnedMesh | null = null;
    fbx.traverse((o: any) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      o.material = (Array.isArray(o.material) ? o.material : [o.material]).map((m: THREE.Material) => mats[m.name] ?? m);
      if (o.morphTargetDictionary) mesh = o;
    });

    // Keep only the blendshapes we animate (the model ships ~180, far too heavy for the GPU).
    const index: Record<string, number> = {};
    if (mesh) {
      const m = mesh as THREE.SkinnedMesh;
      const dict = m.morphTargetDictionary!;
      const wanted = [...Object.values(VISEME_KEYS), ...FACE_KEYS];
      const keep: number[] = [];
      for (const full of Object.keys(dict)) {
        const short = full.split(".").pop()!;
        if (wanted.includes(short)) { index[short] = keep.length; keep.push(dict[full]); }
      }
      const g = m.geometry;
      for (const attr of Object.keys(g.morphAttributes)) g.morphAttributes[attr] = keep.map((i) => g.morphAttributes[attr][i]);
      m.morphTargetDictionary = Object.fromEntries(Object.entries(index));
      m.morphTargetInfluences = new Array(keep.length).fill(0);
    }
  }
}

/** Per instance: relax the pose and capture rest rotations for animation. */
function poseInstance(fbx: THREE.Group) {
  {
    let mesh: THREE.SkinnedMesh | null = null;
    fbx.traverse((o: any) => { if (o.isMesh && o.morphTargetDictionary) { mesh = o; o.frustumCulled = false; } });
    const index: Record<string, number> = { ...(mesh ? (mesh as THREE.SkinnedMesh).morphTargetDictionary : {}) };
    if (mesh) (mesh as THREE.SkinnedMesh).morphTargetInfluences = new Array(Object.keys(index).length).fill(0);

    // Relax the T/A-pose: arms down by the sides, elbows softly bent.
    const b = (n: string) => fbx.getObjectByName(n)!;
    const rest: Record<string, THREE.Quaternion> = {};
    for (const side of ["L", "R"] as const) {
      const sx = side === "L" ? 1 : -1;
      const up = b(`Bip01_${side}_UpperArm`), fore = b(`Bip01_${side}_Forearm`), hand = b(`Bip01_${side}_Hand`);
      up.quaternion.copy(aimLocal(up, fore, new THREE.Vector3(sx * 0.16, -1, 0.04)));
      fore.quaternion.copy(aimLocal(fore, hand, new THREE.Vector3(sx * 0.08, -1, 0.35)));
      rest[`${side}_up`] = up.quaternion.clone();
      rest[`${side}_fore`] = fore.quaternion.clone();
    }
    fbx.updateMatrixWorld(true);
    const neck = b("Bip01_Neck"), head = b("Bip01_Head"), spine = b("Bip01_Spine2"), spine1 = b("Bip01_Spine1");
    const arm = (S: "L" | "R") => {
      const fingers = [0, 1, 2, 3, 4].map((f) => [`Bip01_${S}_Finger${f}`, `Bip01_${S}_Finger${f}1`, `Bip01_${S}_Finger${f}2`].map((n) => fbx.getObjectByName(n)).filter(Boolean) as THREE.Object3D[]);
      return {
        up: b(`Bip01_${S}_UpperArm`), fore: b(`Bip01_${S}_Forearm`), hand: b(`Bip01_${S}_Hand`),
        restUp: rest[`${S}_up`], restFore: rest[`${S}_fore`], restHand: b(`Bip01_${S}_Hand`).quaternion.clone(),
        fingers, fingerRest: fingers.map((ch) => ch.map((x) => x.quaternion.clone())),
      };
    };
    const bones = {
      neck, head, spine, spine1, R: arm("R"), L: arm("L"),
      rest: {
        neck: neck.quaternion.clone(), head: head.quaternion.clone(), spine: spine.quaternion.clone(), spine1: spine1.quaternion.clone(),
        neckParent: neck.parent!.getWorldQuaternion(new THREE.Quaternion()),
        headParent: head.parent!.getWorldQuaternion(new THREE.Quaternion()),
        spineParent: spine.parent!.getWorldQuaternion(new THREE.Quaternion()),
        spine1Parent: spine1.parent!.getWorldQuaternion(new THREE.Quaternion()),
        spineWorldInv: spine.getWorldQuaternion(new THREE.Quaternion()).invert(),
      },
    };
    return { fbx, mesh: mesh as THREE.SkinnedMesh | null, index, bones };
  }
}

const _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2(), _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -12);
const DOWN = new THREE.Vector3(0, -1, 0);

// ---------- Teaching gestures ----------
// Directions are in her body space for the RIGHT arm (her right = -x, up = +y, towards the students = +z);
// the left arm uses the mirror image. "up" = shoulder->elbow, "fore" = elbow->wrist, curl = finger bend 0..1.
type GestureName = "rest" | "clasp" | "open" | "present" | "beat" | "chest" | "count" | "chin" | "wide";
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).normalize();
const GESTURES: Record<GestureName, { up: THREE.Vector3; fore: THREE.Vector3; curl: number }> = {
  rest:    { up: V(-0.16, -1, 0.06), fore: V(-0.08, -1, 0.4), curl: 0.35 },
  clasp:   { up: V(-0.14, -1, 0.26), fore: V(0.62, -0.3, 0.75), curl: 0.5 },     // hands loosely together at the waist
  open:    { up: V(-0.42, -0.85, 0.32), fore: V(-0.5, 0.12, 0.88), curl: 0.12 },  // open palms, "you see…"
  present: { up: V(-0.32, -0.8, 0.5), fore: V(-0.35, 0.32, 0.9), curl: 0.06 },   // offering an idea to the class
  beat:    { up: V(-0.22, -0.9, 0.38), fore: V(-0.08, 0.02, 1), curl: 0.3 },      // rhythmic emphasis on words
  chest:   { up: V(-0.16, -0.9, 0.42), fore: V(0.62, 0.38, 0.68), curl: 0.25 },   // hand to chest
  count:   { up: V(-0.26, -0.82, 0.48), fore: V(-0.12, 0.6, 0.8), curl: 0.2 },    // raised hand, counting a point
  chin:    { up: V(-0.15, -0.7, 0.62), fore: V(0.38, 0.86, 0.32), curl: 0.6 },    // thinking, hand to chin
  wide:    { up: V(-0.62, -0.72, 0.3), fore: V(-0.75, 0.2, 0.62), curl: 0.08 },   // big open "all of this"
};
const mirror = (v: THREE.Vector3) => new THREE.Vector3(-v.x, v.y, v.z);
/** [right, left] combinations that read as natural explaining. */
const TALK: [GestureName, GestureName][] = [
  ["open", "open"], ["present", "rest"], ["beat", "rest"], ["rest", "present"], ["chest", "beat"],
  ["count", "rest"], ["beat", "beat"], ["rest", "open"], ["wide", "wide"], ["beat", "clasp"],
];
const AT_BOARD_LEFT: GestureName[] = ["rest", "present", "open", "beat", "rest"];
/** Finger bend axis for the Rocketbox/Biped rig. */
const FINGER_AXIS = new THREE.Vector3(0, 0, 1);

function Teacher({ mood, signal, board, pointer }: { mood: AvatarMood; signal: React.MutableRefObject<VoiceSignal>; board?: boolean; pointer?: React.MutableRefObject<BoardPointer> }) {
  const { fbx, mesh, index, bones } = useTeacherModel();
  const st = useRef({
    blinkAt: 1.5, blink: 0, glance: 0, point: 0, target: new THREE.Vector3(-60, 140, 12),
    combo: ["clasp", "clasp"] as [GestureName, GestureName], nextCombo: 0, lean: 0,
    arms: {
      R: { up: GESTURES.rest.up.clone(), fore: GESTURES.rest.fore.clone(), curl: 0.35 },
      L: { up: mirror(GESTURES.rest.up), fore: mirror(GESTURES.rest.fore), curl: 0.35 },
    },
    vis: Object.fromEntries(VISEMES.map((v) => [v, 0])) as Record<Viseme, number>,
    face: {} as Record<string, number>, look: new THREE.Vector2(), lookAt: new THREE.Vector2(), lookNext: 0,
  });

  useFrame((state, dt) => {
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const k0 = (rate: number) => 1 - Math.exp(-dt * rate);

    // ---- Where on the board to point: screen px -> a point in her world, beside her ----
    const ptr = pointer?.current;
    let pointing = false;
    if (ptr && ptr.active) {
      const r = state.gl.domElement.getBoundingClientRect();
      _ndc.set(((ptr.x - r.left) / r.width) * 2 - 1, -((ptr.y - r.top) / r.height) * 2 + 1);
      _ray.setFromCamera(_ndc, state.camera);
      const hit = _ray.ray.intersectPlane(_plane, new THREE.Vector3());
      if (hit) {
        // Keep the target within arm's reach-ish so the pose stays natural.
        hit.y = THREE.MathUtils.clamp(hit.y, 95, 185);
        // Targets right next to her would make the arm fold up; keep them at least an arm's length out to her right.
        hit.x = Math.min(hit.x, -60);
        st.current.target.lerp(hit, k0(7));
        pointing = true;
      }
    }
    st.current.point += ((pointing ? 1 : 0) - st.current.point) * k0(pointing ? 4 : 3);
    const s = st.current, sig = signal.current;
    const speaking = sig.speaking;
    const infl = mesh.morphTargetInfluences!;
    const k = (rate: number) => 1 - Math.exp(-dt * rate);
    const setFace = (key: string, target: number, rate = 10) => {
      const i = index[key]; if (i === undefined) return;
      infl[i] += (target - infl[i]) * k(rate);
    };

    // ---- Lip-sync from spoken text ----
    let cur: Viseme = "sil";
    if (speaking && sig.text) {
      const pos = sig.charIndex + ((performance.now() - sig.syncAt) / 1000) * sig.cps;
      const i = Math.floor(pos);
      if (i < sig.text.length) cur = charViseme(sig.text, i);
    }
    // With real audio, close the mouth in pauses and open it wider on louder syllables.
    const lvl = sig.level ?? 1;
    if (lvl < (sig.audio ? 0.12 : 0.04)) cur = "sil";
    // With real audio, how wide the mouth opens follows the sound itself; letters only choose the shape.
    const loud = sig.audio ? Math.min(1, 0.15 + lvl * 1.1) : 0.55 + 0.45 * Math.min(1, lvl * 1.4);
    for (const v of VISEMES) {
      const target = v === cur && v !== "sil" ? (v === "aa" || v === "O" ? 0.85 : 0.7) * loud : 0;
      s.vis[v] += (target - s.vis[v]) * k(target > s.vis[v] ? 28 : 16);
      const i = index[VISEME_KEYS[v]]; if (i !== undefined) infl[i] = s.vis[v];
    }

    // ---- Blinking ----
    if (t > s.blinkAt) { s.blink = 1; s.blinkAt = t + 2.2 + Math.random() * 3.5; }
    s.blink = Math.max(0, s.blink - dt * 6.5);
    const blink = Math.sin(s.blink * Math.PI);
    const i1 = index.AK_09_EyeBlinkLeft, i2 = index.AK_10_EyeBlinkRight;
    if (i1 !== undefined) infl[i1] = blink; if (i2 !== undefined) infl[i2] = blink;

    // ---- Expression ----
    const smile = mood === "listening" ? 0.35 : mood === "idle" ? 0.22 : speaking ? 0.15 : 0.05;
    setFace("AK_44_MouthSmileLeft", smile, 4); setFace("AK_45_MouthSmileRight", smile, 4);
    setFace("AK_07_CheekSquintLeft", smile * 0.6, 4); setFace("AK_08_CheekSquintRight", smile * 0.6, 4);
    setFace("AK_03_BrowInnerUp", mood === "thinking" ? 0.55 : mood === "listening" ? 0.3 : speaking ? sig.pulse * 0.35 : 0, 6);
    setFace("AK_04_BrowOuterUpLeft", mood === "listening" ? 0.25 : speaking ? sig.pulse * 0.25 : 0, 6);
    setFace("AK_05_BrowOuterUpRight", mood === "thinking" ? 0.5 : mood === "listening" ? 0.25 : speaking ? sig.pulse * 0.25 : 0, 6);
    sig.pulse = Math.max(0, sig.pulse - dt * 3);

    // ---- Eye gaze (micro-saccades, look up when thinking) ----
    if (t > s.lookNext) {
      s.lookNext = t + 0.8 + Math.random() * 2;
      // Mostly keep eye contact with the student; small glances only.
      s.lookAt.set((Math.random() - 0.5) * 0.3, 0.04 + Math.random() * 0.1);
    }
    // While teaching at the whiteboard, glance across at the board (to her right) every few seconds.
    const glanceTarget = board && speaking && (t % 6.5) < 1.8 ? 1 : 0;
    s.glance += (glanceTarget - s.glance) * k(5);
    const headPos = bones.head.getWorldPosition(new THREE.Vector3());
    const toT = s.target.clone().sub(headPos);
    const tYaw = Math.atan2(toT.x, toT.z + 40), tPitch = Math.atan2(toT.y, Math.hypot(toT.x, toT.z + 40));
    const gaze = mood === "thinking" ? new THREE.Vector2(0.45, 0.55)
      : s.point > 0.4 ? new THREE.Vector2(-0.7, THREE.MathUtils.clamp(tPitch * 1.2, -0.4, 0.5))
      : s.glance > 0.3 ? new THREE.Vector2(-0.6, 0) : s.lookAt;
    s.look.lerp(gaze, k(mood === "thinking" ? 4 : 12));
    const gx = s.look.x, gy = s.look.y;
    setFace("AK_17_EyeLookUpLeft", Math.max(0, gy), 30); setFace("AK_18_EyeLookUpRight", Math.max(0, gy), 30);
    setFace("AK_11_EyeLookDownLeft", Math.max(0, -gy) * 0.5, 30); setFace("AK_12_EyeLookDownRight", Math.max(0, -gy) * 0.5, 30);
    // Looking to the avatar's left: left eye looks out, right eye looks in.
    setFace("AK_15_EyeLookOutLeft", Math.max(0, gx), 30); setFace("AK_14_EyeLookInRight", Math.max(0, gx), 30);
    setFace("AK_13_EyeLookInLeft", Math.max(0, -gx), 30); setFace("AK_16_EyeLookOutRight", Math.max(0, -gx), 30);

    // ---- Head, neck and breathing ----
    let hx = Math.sin(t * 0.8) * 0.02, hy = Math.sin(t * 0.45) * 0.05, hz = Math.sin(t * 0.6) * 0.015;
    if (mood === "listening") { hz = 0.09 + Math.sin(t * 1.1) * 0.015; hx = 0.04; }
    if (mood === "thinking") { hx = -0.1; hy = 0.14; hz = -0.04; }
    if (speaking) { hx += Math.sin(t * 4.3) * 0.022 + sig.pulse * 0.025; hy += Math.sin(t * 1.7) * 0.05; }
    hy -= s.glance * 0.45 * (1 - s.point); hx += s.glance * 0.03;
    // Turn head and shoulders towards the spot on the board she is pointing at.
    const bodyYaw = -0.38 * s.point;
    hy = hy * (1 - s.point) + s.point * (THREE.MathUtils.clamp(tYaw * 0.7, -1.1, 0.4) - bodyYaw);
    hx = hx * (1 - s.point) + s.point * THREE.MathUtils.clamp(-tPitch * 0.6, -0.35, 0.3);
    const R = bones.rest;
    applyWorldOffset(bones.neck, R.neck, R.neckParent, new THREE.Euler(hx * 0.4, hy * 0.4, hz * 0.4));
    applyWorldOffset(bones.head, R.head, R.headParent, new THREE.Euler(hx * 0.6, hy * 0.6, hz * 0.6));
    // Body: breathing, slow weight shift, leaning in a little while explaining, turning to the board.
    s.lean += ((speaking ? 1 : 0) - s.lean) * k(1.5);
    const sway = Math.sin(t * 0.42) * 0.03;
    applyWorldOffset(bones.spine1, R.spine1, R.spine1Parent, new THREE.Euler(Math.sin(t * 1.5) * 0.008 + s.lean * 0.035, bodyYaw * 0.4 + Math.sin(t * 0.3) * 0.03, sway * 0.6));
    applyWorldOffset(bones.spine, R.spine, R.spineParent, new THREE.Euler(Math.sin(t * 1.5) * 0.01 + s.lean * 0.03, Math.sin(t * 0.35) * 0.02 + bodyYaw * 0.6, sway * 0.4));

    // ---- Arms & hands: teaching gestures ----
    if (t > s.nextCombo) {
      if (s.point > 0.3) {
        s.combo = ["rest", AT_BOARD_LEFT[Math.floor(Math.random() * AT_BOARD_LEFT.length)]];
        s.nextCombo = t + 1.8 + Math.random() * 1.6;
      } else if (speaking) {
        let next = TALK[Math.floor(Math.random() * TALK.length)];
        if (next[0] === s.combo[0] && next[1] === s.combo[1]) next = TALK[(TALK.indexOf(next) + 1) % TALK.length];
        s.combo = next;
        s.nextCombo = t + 1.2 + Math.random() * 1.5;
      } else {
        s.combo = mood === "thinking" ? ["chest", "chin"] : mood === "listening" ? ["clasp", "clasp"] : Math.random() < 0.7 ? ["clasp", "clasp"] : ["rest", "rest"];
        s.nextCombo = t + (mood === "idle" ? 5 + Math.random() * 4 : 0.5);
      }
    }
    if (mood === "thinking" && !speaking) s.combo = ["chest", "chin"];
    // Torso orientation now vs. rest, so gestures turn with her body.
    const qBody = bones.spine.getWorldQuaternion(new THREE.Quaternion()).multiply(R.spineWorldInv);
    const rate = speaking ? 4.2 : 2.6;
    (["R", "L"] as const).forEach((side, si) => {
      const g = GESTURES[s.combo[si]];
      const tgtUp = side === "R" ? g.up.clone() : mirror(g.up);
      const tgtFore = side === "R" ? g.fore.clone() : mirror(g.fore);
      // Life: words give small beats, plus a gentle drift so poses never freeze.
      if (speaking && s.combo[si] !== "rest" && s.combo[si] !== "clasp") {
        tgtFore.y += sig.pulse * 0.22 + Math.sin(t * 2.6 + si * 1.7) * 0.06;
        tgtFore.x += Math.sin(t * 1.3 + si) * 0.07 * (side === "R" ? 1 : -1);
        tgtFore.normalize();
      }
      const a = s.arms[side];
      a.up.lerp(tgtUp, k(rate)).normalize();
      a.fore.lerp(tgtFore, k(rate * 1.15)).normalize();
      a.curl += (g.curl - a.curl) * k(rate);
      const B = bones[side];
      B.up.quaternion.copy(B.restUp);
      B.up.quaternion.copy(aimLocal(B.up, B.fore, a.up.clone().applyQuaternion(qBody)));
      B.fore.quaternion.copy(B.restFore);
      B.fore.quaternion.copy(aimLocal(B.fore, B.hand, a.fore.clone().applyQuaternion(qBody)));
    });

    // Pointing at the board with the right hand (index finger out), following the marker.
    const RB = bones.R;
    if (s.point > 0.01) {
      const wobble = new THREE.Vector3(Math.sin(t * 9) * 1.2, Math.sin(t * 7.3) * 1.5, 0);
      const tgt = s.target.clone().add(wobble);
      const qUp0 = RB.up.quaternion.clone();
      const shoulder = RB.up.getWorldPosition(new THREE.Vector3());
      const dir = tgt.clone().sub(shoulder).normalize();
      const upDir = DOWN.clone().lerp(dir, 0.72).normalize();
      const qUp = aimLocal(RB.up, RB.fore, upDir).clone();
      RB.up.quaternion.copy(qUp0).slerp(qUp, s.point);
      const qFore0 = RB.fore.quaternion.clone();
      const elbow = RB.fore.getWorldPosition(new THREE.Vector3());
      const qFore = aimLocal(RB.fore, RB.hand, tgt.clone().sub(elbow).normalize()).clone();
      RB.fore.quaternion.copy(qFore0).slerp(qFore, s.point);
    }

    // Fingers: relaxed curl per gesture; index straight when pointing.
    (["R", "L"] as const).forEach((side) => {
      const B = bones[side], curl = s.arms[side].curl;
      B.fingers.forEach((chain, f) => {
        let c = curl;
        if (side === "R" && s.point > 0.01) c = f === 1 ? curl * (1 - s.point) : f === 0 ? curl + (0.55 - curl) * s.point : curl + (0.95 - curl) * s.point;
        const amounts = f === 0 ? [0.15, 0.3, 0.3] : [0.6, 0.85, 0.6];
        chain.forEach((bone, j) => {
          bone.quaternion.copy(B.fingerRest[f][j]).multiply(_q1.setFromAxisAngle(FINGER_AXIS, c * amounts[j]));
        });
      });
    });
  });

  return <primitive object={fbx} />;
}

/** Frames head and shoulders for any panel shape, or (presenter) her upper body standing at the board's right end. */
function FitCamera({ framing }: { framing: "bust" | "presenter" }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (framing === "presenter") {
      const L = presenterLayout(size.width, size.height);
      const z = L.halfV / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      cam.position.set(0, L.centerY, z);
      cam.near = 1; cam.far = 3000;
      cam.lookAt(0, L.centerY, 0);
      cam.setViewOffset(size.width, size.height, size.width / 2 - L.avatarX, 0, size.width, size.height);
      cam.updateProjectionMatrix();
      return;
    }
    cam.clearViewOffset();
    const aspect = size.width / Math.max(1, size.height);
    const halfV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const z = Math.max(26 / halfV, 24 / (halfV * aspect));
    cam.position.set(0, 156, z);
    cam.near = 1; cam.far = 2000;
    cam.lookAt(0, 151, 0);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height, framing]);
  return null;
}

export default function TeacherAvatar3D({ mood, signal, board, pointer, framing = "bust", className }: {
  mood: AvatarMood; signal: React.MutableRefObject<VoiceSignal>; board?: boolean;
  pointer?: React.MutableRefObject<BoardPointer>; framing?: "bust" | "presenter"; className?: string;
}) {
  return (
    <div className={className} aria-label={`3D teacher avatar, ${mood}`} role="img">
      <Canvas
        camera={{ fov: 28 }} dpr={[1, 2]} style={framing === "presenter" ? { pointerEvents: "none" } : undefined}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        onCreated={({ gl, scene }) => {
          // Soft, realistic studio light reflected off a virtual room (no image download).
          const pmrem = new THREE.PMREMGenerator(gl);
          scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
          scene.environmentIntensity = 0.75;
        }}
      >
        <FitCamera framing={framing} />
        <hemisphereLight args={["#fff6ee", "#3a4660", 0.35]} />
        <directionalLight position={[60, 220, 240]} intensity={1.7} color="#fff3e6" />
        <directionalLight position={[-180, 160, 120]} intensity={0.45} color="#e3ecff" />
        <directionalLight position={[0, 240, -220]} intensity={1.1} color="#ffe3b8" />
        <Suspense fallback={null}><Teacher mood={mood} signal={signal} board={board} pointer={pointer} /></Suspense>
      </Canvas>
    </div>
  );
}
