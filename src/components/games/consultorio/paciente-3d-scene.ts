/**
 * Paciente 3D del Consultorio (Jai médico).
 * Todo se arma con figuras simples de three.js: no hay modelos descargados, así que pesa poco
 * y se carga solo cuando alguien abre el Consultorio.
 * Cada parte del cuerpo que se puede tocar lleva su región (cabeza, ojo, oreja…).
 */
import * as THREE from "three";
import type { RegionId } from "@/lib/consultorio";

export type Paciente3D = { femenino: boolean; edad: number; piel: number; pelo: number };
export type Marca = { correcta: RegionId | null; elegida: RegionId | null; bloqueado: boolean };
export type Escena = {
  setPaciente: (p: Paciente3D) => void;
  setMarca: (m: Marca) => void;
  setOnElegir: (f: (r: RegionId) => void) => void;
  dispose: () => void;
};

const PIEL = ["#F2C9A0", "#D9A57B", "#B57B52", "#8A5A3B"];
const PELO = ["#2B1D14", "#5A3A22", "#8E8E8E", "#B98F4E"];
const VERDE = new THREE.Color("#3DE0B0");
const ROJO = new THREE.Color("#E5402F");
const AMBO = new THREE.Color("#0F4C55");

/** Orden de preferencia cuando un toque cae sobre dos partes: primero las chicas. */
const PRIORIDAD: RegionId[] = ["ojo", "nariz", "boca", "oreja", "corazon", "mano", "pie", "panza", "cabeza"];

type Pieza = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial>;

function mat(color: string, o: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, metalness: 0, ...o });
}

/** Textura de la bata: celeste con puntitos, como las batas de internación. */
function texturaBata(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#8CC6D6";
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#6FB0C3";
  for (let y = 8; y < 128; y += 22) for (let x = (y / 22) % 2 ? 4 : 15; x < 128; x += 22) {
    g.beginPath();
    g.arc(x, y, 3.2, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Sombra suave en el piso (un degradé redondo, sin cálculo de sombras caro). */
function sombraPiso(): THREE.Mesh {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, "rgba(10,52,57,.45)");
  gr.addColorStop(1, "rgba(10,52,57,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.005;
  return m;
}

/** Corazón plano y gordito para el pecho. */
function geoCorazon(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, -0.1);
  s.bezierCurveTo(-0.02, -0.06, -0.12, -0.03, -0.12, 0.04);
  s.bezierCurveTo(-0.12, 0.11, -0.04, 0.13, 0, 0.07);
  s.bezierCurveTo(0.04, 0.13, 0.12, 0.11, 0.12, 0.04);
  s.bezierCurveTo(0.12, -0.03, 0.02, -0.06, 0, -0.1);
  return new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 });
}

export function crearEscena(canvas: HTMLCanvasElement, reducirMovimiento: boolean): Escena {
  let onElegir: (r: RegionId) => void = () => {};
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 1.95, 7.2);
  camera.lookAt(0, 1.82, 0);

  scene.add(new THREE.HemisphereLight("#FFF6EA", "#2E6F7A", 1.5));
  const key = new THREE.DirectionalLight("#FFFFFF", 2.2);
  key.position.set(2.5, 4.5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight("#9FF2DA", 1.6);
  rim.position.set(-3, 3, -3);
  scene.add(rim);
  const fill = new THREE.PointLight("#FFD9B0", 6, 12, 2);
  fill.position.set(-2, 2, 3);
  scene.add(fill);

  scene.add(sombraPiso());

  const raiz = new THREE.Group();
  scene.add(raiz);
  const cuerpo = new THREE.Group(); // se mueve con la respiración
  raiz.add(cuerpo);

  const regiones = new Map<RegionId, Pieza[]>();
  const tocables: THREE.Object3D[] = [];
  const puntos: { r: RegionId; obj: THREE.Object3D }[] = [];
  const desechables: { dispose: () => void }[] = [];

  function region(r: RegionId, m: Pieza, tocable = true) {
    m.userData.region = r;
    if (!regiones.has(r)) regiones.set(r, []);
    regiones.get(r)!.push(m);
    if (tocable) tocables.push(m);
  }
  /** Zona invisible más grande que la parte, para que sea fácil acertar con el dedo. */
  function zona(r: RegionId, geo: THREE.BufferGeometry, pos: THREE.Vector3Tuple, padre: THREE.Object3D) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ visible: false }));
    m.position.set(...pos);
    m.userData.region = r;
    padre.add(m);
    tocables.push(m);
    desechables.push(geo, m.material as THREE.Material);
    return m;
  }
  function pieza(geo: THREE.BufferGeometry, material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial, padre: THREE.Object3D, pos: THREE.Vector3Tuple = [0, 0, 0]): Pieza {
    const m = new THREE.Mesh(geo, material) as Pieza;
    m.position.set(...pos);
    padre.add(m);
    desechables.push(geo);
    return m;
  }

  const bataTex = texturaBata();
  desechables.push(bataTex);
  const mPiel = mat(PIEL[0]!, { roughness: 0.48, sheen: 0.4, sheenColor: new THREE.Color("#FFD2C0"), clearcoat: 0.05 });
  const mBata = mat("#FFFFFF", { map: bataTex, roughness: 0.75, sheen: 0.8, sheenColor: new THREE.Color("#DFF4FA") });
  const mManga = mat("#7DBACB", { roughness: 0.8, sheen: 0.6 });
  const mPantalon = mat("#2B6476", { roughness: 0.85, sheen: 0.4 });
  const mZapa = mat("#2B3134", { roughness: 0.35, clearcoat: 0.6 });
  const mSuela = mat("#EEF3F2", { roughness: 0.6 });
  const mPelo = mat(PELO[0]!, { roughness: 0.62, sheen: 0.7, sheenColor: new THREE.Color("#7A5A44") });
  const mBlanco = mat("#FFFFFF", { roughness: 0.2, clearcoat: 0.5 });
  const mIris = mat("#5A3A22", { roughness: 0.25, clearcoat: 1 });
  const mNegro = mat("#141414", { roughness: 0.2 });
  const mBoca = mat("#8E3B3B", { roughness: 0.5 });
  const mMejilla = new THREE.MeshStandardMaterial({ color: "#F08C80", transparent: true, opacity: 0.32, depthWrite: false });
  const mCorazon = mat("#E5402F", { roughness: 0.35, clearcoat: 0.8, emissive: new THREE.Color("#7A0E08"), emissiveIntensity: 0.4 });
  const mPulsera = mat("#F7F7F2", { roughness: 0.4 });
  const mLente = mat("#2A2A2A", { roughness: 0.3, metalness: 0.4 });
  const materiales = [mPiel, mBata, mManga, mPantalon, mZapa, mSuela, mPelo, mBlanco, mIris, mNegro, mBoca, mMejilla, mCorazon, mPulsera, mLente];

  /* ---------------- Piernas y zapatillas ---------------- */
  for (const lado of [-1, 1]) {
    pieza(new THREE.CapsuleGeometry(0.17, 0.82, 6, 16), mPantalon, cuerpo, [0.21 * lado, 0.68, 0]);
    const zap = pieza(new THREE.SphereGeometry(0.2, 24, 16), mZapa, cuerpo, [0.22 * lado, 0.12, 0.09]);
    zap.scale.set(0.95, 0.55, 1.55);
    region("pie", zap);
    const suela = pieza(new THREE.CylinderGeometry(0.19, 0.19, 0.035, 24), mSuela, cuerpo, [0.22 * lado, 0.035, 0.09]);
    suela.scale.set(1, 1, 1.55);
    region("pie", suela);
    zona("pie", new THREE.SphereGeometry(0.3, 10, 8), [0.22 * lado, 0.14, 0.12], cuerpo);
  }

  /* ---------------- Torso con bata ---------------- */
  const perfil = [
    [0.02, 1.1], [0.5, 1.1], [0.52, 1.25], [0.47, 1.6], [0.5, 1.95], [0.5, 2.15], [0.42, 2.3], [0.2, 2.38], [0.02, 2.4],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const torso = pieza(new THREE.LatheGeometry(perfil, 40), mBata, cuerpo);
  torso.scale.set(1, 1, 0.72);
  // Escote en V y botones de la bata
  const vGeo = new THREE.TorusGeometry(0.16, 0.022, 8, 24, Math.PI);
  const v = pieza(vGeo, mManga, cuerpo, [0, 2.3, 0.3]);
  v.rotation.set(0.35, 0, Math.PI);
  for (const y of [1.95, 1.72, 1.49]) pieza(new THREE.SphereGeometry(0.025, 10, 8), mBlanco, cuerpo, [0, y, 0.365]);

  // Corazón en el pecho (late suavemente)
  const corazon = pieza(geoCorazon(), mCorazon, cuerpo, [0.2, 2.0, 0.33]);
  corazon.rotation.y = 0.32;
  region("corazon", corazon);
  zona("corazon", new THREE.SphereGeometry(0.2, 10, 8), [0.2, 2.0, 0.3], cuerpo);
  // Panza: zona grande sobre la parte baja de la bata
  zona("panza", new THREE.SphereGeometry(0.34, 12, 10), [0, 1.48, 0.26], cuerpo).scale.set(1.25, 0.85, 0.6);

  /* ---------------- Brazos y manos ---------------- */
  const manos: THREE.Group[] = [];
  for (const lado of [-1, 1]) {
    const hombro = new THREE.Group();
    hombro.position.set(0.52 * lado, 2.2, 0);
    hombro.rotation.z = 0.2 * lado;
    cuerpo.add(hombro);
    pieza(new THREE.SphereGeometry(0.17, 20, 14), mManga, hombro);
    const manga = pieza(new THREE.CylinderGeometry(0.165, 0.15, 0.36, 20), mManga, hombro, [0, -0.2, 0]);
    manga.userData.manga = true;
    pieza(new THREE.CapsuleGeometry(0.115, 0.62, 6, 16), mPiel, hombro, [0, -0.62, 0]);
    const mano = new THREE.Group();
    mano.position.set(0, -1.04, 0.02);
    hombro.add(mano);
    manos.push(mano);
    const palma = pieza(new THREE.SphereGeometry(0.13, 20, 14), mPiel, mano);
    palma.scale.set(0.85, 1.05, 0.6);
    region("mano", palma);
    for (let d = 0; d < 4; d++) {
      const dedo = pieza(new THREE.CapsuleGeometry(0.026, 0.1, 4, 8), mPiel, mano, [(-0.06 + d * 0.04) * -lado, -0.14 - (d === 1 || d === 2 ? 0.015 : 0), 0.01]);
      region("mano", dedo);
    }
    const pulgar = pieza(new THREE.CapsuleGeometry(0.03, 0.08, 4, 8), mPiel, mano, [0.1 * -lado, -0.05, 0.05]);
    pulgar.rotation.z = 0.7 * lado;
    region("mano", pulgar);
    zona("mano", new THREE.SphereGeometry(0.24, 10, 8), [0, -0.06, 0.04], mano);
    if (lado === -1) {
      const pulsera = pieza(new THREE.TorusGeometry(0.12, 0.025, 8, 24), mPulsera, hombro, [0, -0.88, 0]);
      pulsera.rotation.x = Math.PI / 2;
    }
  }

  /* ---------------- Cuello y cabeza ---------------- */
  pieza(new THREE.CylinderGeometry(0.13, 0.15, 0.28, 20), mPiel, cuerpo, [0, 2.46, 0]);
  const cabeza = new THREE.Group();
  cabeza.position.set(0, 2.98, 0);
  cuerpo.add(cabeza);
  const craneo = pieza(new THREE.SphereGeometry(0.5, 40, 32), mPiel, cabeza);
  craneo.scale.set(1, 1.07, 0.98);
  region("cabeza", craneo);

  for (const lado of [-1, 1]) {
    const oreja = pieza(new THREE.SphereGeometry(0.12, 18, 12), mPiel, cabeza, [0.49 * lado, -0.02, -0.02]);
    oreja.scale.set(0.5, 1, 0.8);
    region("oreja", oreja);
    zona("oreja", new THREE.SphereGeometry(0.17, 10, 8), [0.5 * lado, -0.02, 0], cabeza);
  }
  const nariz = pieza(new THREE.SphereGeometry(0.075, 18, 12), mPiel, cabeza, [0, -0.04, 0.5]);
  nariz.scale.set(0.9, 1, 1.15);
  region("nariz", nariz);
  zona("nariz", new THREE.SphereGeometry(0.1, 10, 8), [0, -0.04, 0.52], cabeza);

  const ojos = new THREE.Group();
  ojos.position.set(0, 0.07, 0);
  cabeza.add(ojos);
  for (const lado of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(0.17 * lado, 0, 0.41);
    ojos.add(g);
    const blanco = pieza(new THREE.SphereGeometry(0.095, 20, 14), mBlanco, g);
    blanco.scale.set(1, 1, 0.6);
    region("ojo", blanco);
    region("ojo", pieza(new THREE.SphereGeometry(0.058, 18, 12), mIris, g, [0, -0.005, 0.042]));
    region("ojo", pieza(new THREE.SphereGeometry(0.03, 12, 10), mNegro, g, [0, -0.005, 0.07]));
    pieza(new THREE.SphereGeometry(0.014, 8, 6), mBlanco, g, [0.02, 0.022, 0.085]);
    const ceja = pieza(new THREE.CapsuleGeometry(0.018, 0.12, 4, 8), mPelo, cabeza, [0.17 * lado, 0.22, 0.43]);
    ceja.rotation.set(0.25, 0, Math.PI / 2 + 0.12 * lado);
    zona("ojo", new THREE.SphereGeometry(0.12, 10, 8), [0.17 * lado, 0.07, 0.45], cabeza);
  }
  for (const lado of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), mMejilla);
    m.position.set(0.27 * lado, -0.14, 0.42);
    m.rotation.y = 0.55 * lado;
    cabeza.add(m);
    desechables.push(m.geometry);
  }

  // Boca: un tubo curvo que cambia con el ánimo del paciente
  let boca: Pieza | null = null;
  let animo = -1;
  function ponerBoca(a: number) {
    if (a === animo) return;
    animo = a;
    if (boca) {
      cabeza.remove(boca);
      const lista = regiones.get("boca") ?? [];
      lista.splice(lista.indexOf(boca), 1);
      if (boca.userData.mat) (boca.material as THREE.Material).dispose();
      boca.geometry.dispose();
    }
    const curva = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.11, -0.2, 0.45),
      new THREE.Vector3(0, -0.2 - 0.09 * a, 0.5),
      new THREE.Vector3(0.11, -0.2, 0.45),
    );
    boca = new THREE.Mesh(new THREE.TubeGeometry(curva, 20, a > 0.6 ? 0.03 : 0.022, 8, false), mBoca) as Pieza;
    cabeza.add(boca);
    region("boca", boca, false); // la zona invisible alcanza para tocarla
  }
  ponerBoca(0.35);
  zona("boca", new THREE.SphereGeometry(0.14, 10, 8), [0, -0.21, 0.47], cabeza).scale.set(1.2, 0.7, 0.6);
  zona("cabeza", new THREE.SphereGeometry(0.62, 16, 12), [0, 0.05, 0], cabeza);

  // Pelo (se arma según el paciente)
  const peloGrupo = new THREE.Group();
  cabeza.add(peloGrupo);
  const lentes = new THREE.Group();
  cabeza.add(lentes);
  for (const lado of [-1, 1]) {
    const aro = pieza(new THREE.TorusGeometry(0.12, 0.013, 8, 28), mLente, lentes, [0.17 * lado, 0.07, 0.48]);
    aro.scale.set(1, 0.85, 1);
    const patilla = pieza(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 6), mLente, lentes, [0.3 * lado, 0.08, 0.3]);
    patilla.rotation.x = Math.PI / 2;
  }
  pieza(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6), mLente, lentes, [0, 0.09, 0.5]).rotation.z = Math.PI / 2;

  function armarPelo(p: Paciente3D) {
    for (const h of [...peloGrupo.children]) {
      peloGrupo.remove(h);
      const k = tocables.indexOf(h);
      if (k >= 0) tocables.splice(k, 1);
      (h as THREE.Mesh).geometry?.dispose();
    }
    const add = (geo: THREE.BufferGeometry, pos: THREE.Vector3Tuple, s?: THREE.Vector3Tuple, rot?: THREE.Vector3Tuple) => {
      const m = new THREE.Mesh(geo, mPelo) as Pieza;
      m.position.set(...pos);
      if (s) m.scale.set(...s);
      if (rot) m.rotation.set(...rot);
      peloGrupo.add(m);
      m.userData.region = "cabeza";
      tocables.push(m);
      return m;
    };
    // Casquete arriba (deja la frente libre) y la parte de atrás, que baja hasta la nuca
    add(new THREE.SphereGeometry(0.535, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.3), [0, 0.03, -0.015], [1, 1.08, 1.0]);
    add(new THREE.SphereGeometry(0.535, 40, 20, Math.PI * 0.92, Math.PI * 1.16, Math.PI * 0.25, Math.PI * (p.femenino ? 0.5 : 0.38)), [0, 0.03, -0.015], [1, 1.08, 1.0]);
    // Flequillo
    add(new THREE.SphereGeometry(0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), [0.06, 0.3, 0.3], [1.15, 0.5, 0.7], [0.5, 0, -0.25]);
    if (p.femenino) {
      add(new THREE.CapsuleGeometry(0.36, 0.55, 8, 20), [0, -0.25, -0.2], [1.15, 1, 0.75]);
      for (const lado of [-1, 1]) add(new THREE.CapsuleGeometry(0.1, 0.5, 6, 12), [0.43 * lado, -0.22, 0.08], [1, 1, 0.8], [0, 0, 0.08 * lado]);
    }
  }

  /* ---------------- Puntitos que invitan a tocar ---------------- */
  const puntoGeo = new THREE.RingGeometry(0.05, 0.075, 24);
  const puntoMat = new THREE.MeshBasicMaterial({ color: VERDE, transparent: true, opacity: 0.0, depthTest: false });
  desechables.push(puntoGeo, puntoMat);
  const anclas: [RegionId, THREE.Object3D, THREE.Vector3Tuple][] = [
    ["panza", cuerpo, [0, 1.5, 0.42]],
  ];
  for (const [r, padre, pos] of anclas) {
    const m = new THREE.Mesh(puntoGeo, puntoMat);
    m.position.set(...pos);
    m.renderOrder = 10;
    padre.add(m);
    puntos.push({ r, obj: m });
  }

  /* ---------------- Aros de la respuesta (verde: acá era; rojo: elegiste acá) ---------------- */
  const aroGeo = new THREE.RingGeometry(0.8, 1, 40);
  desechables.push(aroGeo);
  const aros: { r: RegionId; m: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> }[] = [];
  const ANCLA: [RegionId, THREE.Object3D, THREE.Vector3Tuple, number][] = [
    ["cabeza", cabeza, [0, 0.05, 0.1], 0.72],
    ["ojo", ojos, [-0.17, 0, 0.5], 0.15], ["ojo", ojos, [0.17, 0, 0.5], 0.15],
    ["oreja", cabeza, [-0.52, -0.02, 0.05], 0.17], ["oreja", cabeza, [0.52, -0.02, 0.05], 0.17],
    ["nariz", cabeza, [0, -0.04, 0.58], 0.12],
    ["boca", cabeza, [0, -0.2, 0.52], 0.17],
    ["corazon", cuerpo, [0.2, 2.0, 0.4], 0.22],
    ["panza", cuerpo, [0, 1.5, 0.4], 0.36],
    ["mano", manos[0]!, [0, -0.05, 0.12], 0.24], ["mano", manos[1]!, [0, -0.05, 0.12], 0.24],
    ["pie", cuerpo, [-0.22, 0.14, 0.3], 0.26], ["pie", cuerpo, [0.22, 0.14, 0.3], 0.26],
  ];
  for (const [r, padre, pos, tam] of ANCLA) {
    const m = new THREE.Mesh(aroGeo, new THREE.MeshBasicMaterial({ color: VERDE, transparent: true, opacity: 0.9, depthTest: false, side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.scale.setScalar(tam);
    m.visible = false;
    m.renderOrder = 20;
    padre.add(m);
    aros.push({ r, m });
    desechables.push(m.material);
  }

  /* ---------------- Paciente y marcas ---------------- */
  let marca: Marca = { correcta: null, elegida: null, bloqueado: false };
  let entrada = 0; // 0 → 1 al llegar el paciente
  let sacudir = 0;
  let saltar = 0;

  function setPaciente(p: Paciente3D) {
    mPiel.color.set(PIEL[p.piel % PIEL.length]!);
    const viejo = p.edad > 62;
    mPelo.color.set(viejo ? "#BDBDBD" : PELO[p.pelo % PELO.length]!);
    lentes.visible = viejo;
    armarPelo(p);
    entrada = 0;
    ponerBoca(0.35);
  }

  function pintar(r: RegionId, color: THREE.Color | null, fuerza: number) {
    for (const m of regiones.get(r) ?? []) {
      const mt = m.material as THREE.MeshStandardMaterial;
      if (!m.userData.mat) {
        m.userData.mat = mt;
        m.material = mt.clone();
      }
      const propio = m.material as THREE.MeshStandardMaterial;
      if (color) {
        propio.emissive.copy(color);
        propio.emissiveIntensity = fuerza;
      } else {
        propio.emissive.copy((m.userData.mat as THREE.MeshStandardMaterial).emissive);
        propio.emissiveIntensity = (m.userData.mat as THREE.MeshStandardMaterial).emissiveIntensity;
      }
    }
  }
  function limpiarPintura() {
    for (const lista of regiones.values()) for (const m of lista) {
      if (m.userData.mat) {
        (m.material as THREE.Material).dispose();
        m.material = m.userData.mat;
        delete m.userData.mat;
      }
    }
  }

  function setMarca(m: Marca) {
    const antes = marca;
    marca = m;
    if (!m.bloqueado) {
      limpiarPintura();
      for (const a of aros) a.m.visible = false;
      ponerBoca(0.35);
      return;
    }
    for (const a of aros) {
      const esCorrecta = a.r === m.correcta;
      const esMal = a.r === m.elegida && m.elegida !== m.correcta;
      a.m.visible = esCorrecta || esMal;
      a.m.material.color.copy(esCorrecta ? VERDE : ROJO);
    }
    if (!antes.bloqueado) {
      const bien = m.elegida === m.correcta;
      ponerBoca(bien ? 1 : -0.6);
      if (bien) saltar = 1;
      else sacudir = 1;
    }
  }

  /* ---------------- Tocar y girar ---------------- */
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let hover: RegionId | null = null;
  let arrastre: { x: number; giro: number; movio: boolean } | null = null;
  let giro = 0;
  let giroObjetivo = 0;

  function regionEn(ev: PointerEvent): RegionId | null {
    const r = canvas.getBoundingClientRect();
    ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(tocables, false);
    if (!hits.length) return null;
    const cercano = hits[0]!.distance;
    // Entre lo que tocó (a poca distancia del primero), gana la parte más chica.
    const candidatas = hits.filter((h) => h.distance - cercano < 0.35).map((h) => h.object.userData.region as RegionId);
    return PRIORIDAD.find((p) => candidatas.includes(p)) ?? null;
  }
  const onDown = (ev: PointerEvent) => {
    arrastre = { x: ev.clientX, giro: giroObjetivo, movio: false };
  };
  const onMove = (ev: PointerEvent) => {
    if (arrastre) {
      const dx = ev.clientX - arrastre.x;
      if (Math.abs(dx) > 8) arrastre.movio = true;
      if (arrastre.movio) giroObjetivo = Math.max(-0.9, Math.min(0.9, arrastre.giro + dx * 0.008));
      return;
    }
    if (ev.pointerType === "mouse" && !marca.bloqueado) {
      const r = regionEn(ev);
      if (r !== hover) {
        if (hover) pintar(hover, null, 0);
        hover = r;
        if (hover) pintar(hover, AMBO, 0.35);
        canvas.style.cursor = hover ? "pointer" : "grab";
      }
    }
  };
  const onUp = (ev: PointerEvent) => {
    const a = arrastre;
    arrastre = null;
    if (!a || a.movio || marca.bloqueado) return;
    const r = regionEn(ev);
    if (r) {
      if (hover) pintar(hover, null, 0);
      hover = null;
      onElegir(r);
    }
  };
  const onLeave = () => {
    arrastre = null;
    if (hover) pintar(hover, null, 0);
    hover = null;
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.style.touchAction = "pan-y";
  canvas.style.cursor = "grab";

  /* ---------------- Tamaño y animación ---------------- */
  function ajustar() {
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 420;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(ajustar);
  ro.observe(canvas);
  ajustar();

  let visible = true;
  // Si llegan varios avisos juntos (se despegó y se volvió a pegar), vale el último.
  const io = new IntersectionObserver((e) => { visible = e[e.length - 1]?.isIntersecting ?? true; });
  io.observe(canvas);

  let antes = performance.now();
  let t = 0;
  let parpadeo = 2.5;
  let raf = 0;
  function cuadro() {
    raf = requestAnimationFrame(cuadro);
    const ahora = performance.now();
    const dt = Math.min((ahora - antes) / 1000, 0.05);
    antes = ahora;
    if (!visible || document.hidden) return;
    t += dt;

    entrada = Math.min(1, entrada + dt * 2.2);
    const e = 1 - Math.pow(1 - entrada, 3);
    raiz.position.x = (1 - e) * 2.2;
    raiz.rotation.y = (1 - e) * -0.6;

    if (!arrastre) giroObjetivo *= 1 - Math.min(1, dt * 1.6);
    giro += (giroObjetivo - giro) * Math.min(1, dt * 8);
    const balanceo = reducirMovimiento ? 0 : Math.sin(t * 0.6) * 0.07;
    cuerpo.rotation.y = giro + balanceo;

    const resp = reducirMovimiento ? 0 : Math.sin(t * 1.8);
    torso.scale.set(1 + resp * 0.012, 1 + resp * 0.008, 0.72 + resp * 0.012);
    cabeza.position.y = 2.98 + resp * 0.008;
    for (const [k, m] of manos.entries()) m.rotation.z = (reducirMovimiento ? 0 : Math.sin(t * 1.1 + k) * 0.05);

    // Latido del corazón
    const lat = reducirMovimiento ? 0 : Math.max(0, Math.sin(t * 7.5)) ** 8;
    corazon.scale.setScalar(1 + lat * 0.12);

    // Parpadeo
    parpadeo -= dt;
    const cerrado = parpadeo < 0.12 && parpadeo > 0;
    ojos.scale.y = cerrado ? 0.12 : 1;
    if (parpadeo <= 0) parpadeo = 2.2 + Math.random() * 2.8;

    // Festejo o "no, ahí no"
    if (saltar > 0) {
      saltar = Math.max(0, saltar - dt * 1.6);
      raiz.position.y = Math.sin((1 - saltar) * Math.PI * 2) ** 2 * 0.18;
    } else raiz.position.y = 0;
    if (sacudir > 0) {
      sacudir = Math.max(0, sacudir - dt * 1.4);
      cabeza.rotation.y = Math.sin(sacudir * 22) * 0.22 * sacudir;
    } else cabeza.rotation.y = giro * -0.15;

    // Marcas de la respuesta: la correcta titila en verde; la elegida mal, en rojo
    if (marca.bloqueado && marca.correcta) {
      const f = 0.55 + Math.sin(t * 6) * 0.35;
      pintar(marca.correcta, VERDE, f);
      if (marca.elegida && marca.elegida !== marca.correcta) pintar(marca.elegida, ROJO, 0.7);
    }
    puntoMat.opacity = marca.bloqueado || reducirMovimiento ? 0 : 0.25 + Math.sin(t * 2.4) * 0.2;
    for (const p of puntos) p.obj.lookAt(camera.position);
    for (const a of aros) if (a.m.visible) {
      a.m.lookAt(camera.position);
      a.m.material.opacity = a.r === marca.correcta ? 0.55 + Math.sin(t * 6) * 0.4 : 0.85;
    }

    renderer.render(scene, camera);
  }
  cuadro();

  return {
    setPaciente,
    setMarca,
    setOnElegir(f) {
      onElegir = f;
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      limpiarPintura();
      if (boca) boca.geometry.dispose();
      for (const h of peloGrupo.children) (h as THREE.Mesh).geometry?.dispose();
      for (const d of desechables) d.dispose();
      for (const m of materiales) m.dispose();
      scene.traverse((o) => {
        const mm = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
        if (mm?.map) mm.map.dispose();
      });
      renderer.dispose();
    },
  };
}

/** ¿Este celular puede dibujar en 3D? Si no, se usa el dibujo plano de siempre. */
export function hayWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
