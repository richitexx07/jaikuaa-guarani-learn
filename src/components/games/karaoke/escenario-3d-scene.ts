/**
 * El escenario de Purahéi en 3D: tablado de madera con luces LED, telón de terciopelo,
 * un ñandutí gigante que brilla con la música, el arpa paraguaya con sus cuerdas,
 * reflectores que barren el escenario, el público que salta y papel picado en los festejos.
 * Todo se arma con figuras simples de three.js, sin descargar modelos. El Jai es su dibujo de siempre.
 */
import * as THREE from "three";

export type PoseJai3D = "espera" | "canta" | "festeja";
/** El plano de la cámara, como en una película. */
export type Plano = "general" | "apertura" | "jai" | "arpa" | "mano";
export type EstadoEscenario = {
  beat: number; playing: boolean; animo: number; fiesta: boolean; pose: PoseJai3D;
  plano?: Plano;
  /** 0 = telón cerrado, 1 = abierto. */
  telon?: number;
  /** Pantalla completa: la letra y los botones tapan la parte de abajo, el escenario se encuadra arriba. */
  cine?: boolean;
};
export type Escenario3D = {
  setEstado: (e: EstadoEscenario) => void;
  festejo: () => void;
  /** Cámara lenta de un segundo (el verso dorado perfecto). */
  momento: () => void;
  /** Telón cerrado y cámara en el fondo de la sala, al instante (antes de la apertura). */
  reiniciar: () => void;
  /** Una foto del escenario tal como se ve ahora (para el póster). */
  foto: () => Promise<Blob | null>;
  dispose: () => void;
};

const ORO = "#F6C445", MAGENTA = "#E0457B", VIOLETA = "#7B4BD6", BLANCO = "#FFF6E0";

function textura(dibujar: (g: CanvasRenderingContext2D, n: number) => void, n = 64): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = n;
  dibujar(c.getContext("2d")!, n);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** El ñandutí: rayos, círculos y pétalos, como el encaje de Itauguá. */
function texturaNanduti(): THREE.CanvasTexture {
  return textura((g, n) => {
    const c = n / 2;
    g.translate(c, c);
    g.strokeStyle = "rgba(255,246,224,.95)";
    g.lineCap = "round";
    const rayos = 32;
    g.lineWidth = 2;
    for (let i = 0; i < rayos; i++) {
      g.rotate((Math.PI * 2) / rayos);
      g.beginPath(); g.moveTo(0, 18); g.lineTo(0, c - 6); g.stroke();
    }
    for (const r of [18, 60, 120, 180, c - 8]) { g.lineWidth = r === c - 8 ? 5 : 3; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
    g.lineWidth = 2.5;
    for (let i = 0; i < 16; i++) {
      g.rotate((Math.PI * 2) / 16);
      g.beginPath(); g.moveTo(0, 60); g.quadraticCurveTo(26, 90, 0, 120); g.quadraticCurveTo(-26, 90, 0, 60); g.stroke();
      g.beginPath(); g.moveTo(0, 124); g.quadraticCurveTo(18, 152, 0, 178); g.quadraticCurveTo(-18, 152, 0, 124); g.stroke();
      g.beginPath(); g.arc(0, 205, 9, 0, Math.PI * 2); g.stroke();
    }
    g.fillStyle = "rgba(246,196,69,.9)";
    g.beginPath(); g.arc(0, 0, 14, 0, Math.PI * 2); g.fill();
  }, 512);
}

export function crearEscenario(canvas: HTMLCanvasElement, poses: Record<PoseJai3D, string>, reducir: boolean): Escenario3D {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#12071F");
  scene.fog = new THREE.Fog("#12071F", 7, 16);
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 40);
  const CAM = new THREE.Vector3(0, 1.75, 7.2);
  camera.position.copy(CAM);
  camera.lookAt(0, 1.35, 0);

  const geos: THREE.BufferGeometry[] = [];
  const texs: THREE.Texture[] = [];
  const track = <T extends THREE.BufferGeometry>(g: T) => (geos.push(g), g);
  const tex = <T extends THREE.Texture>(t: T) => (texs.push(t), t);

  scene.add(new THREE.HemisphereLight("#B9A2FF", "#2A0E1E", 0.9));
  const frente = new THREE.DirectionalLight("#FFE9C9", 1.1);
  frente.position.set(0, 4, 6);
  scene.add(frente);

  // ---------- Tablado ----------
  const madera = tex(textura((g, n) => {
    g.fillStyle = "#6B3E1F"; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#7A4824" : "#633819"; g.fillRect(0, i * (n / 8), n, n / 8 - 2);
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, i * (n / 8) + n / 8 - 2, n, 2);
    }
    for (let k = 0; k < 400; k++) { g.fillStyle = `rgba(255,220,180,${Math.random() * 0.06})`; g.fillRect(Math.random() * n, Math.random() * n, 14, 1); }
  }, 256));
  madera.wrapS = madera.wrapT = THREE.RepeatWrapping;
  madera.repeat.set(4, 2);
  const piso = new THREE.Mesh(track(new THREE.PlaneGeometry(10, 4.4)), new THREE.MeshStandardMaterial({ map: madera, roughness: 0.32, metalness: 0.15 }));
  piso.rotation.x = -Math.PI / 2;
  piso.position.set(0, 0, -0.2);
  scene.add(piso);
  const frenteTablado = new THREE.Mesh(track(new THREE.BoxGeometry(10, 0.5, 0.2)), new THREE.MeshStandardMaterial({ color: "#2A1030", roughness: 0.6 }));
  frenteTablado.position.set(0, -0.25, 2.0);
  scene.add(frenteTablado);

  // Luces LED del tablado: se prenden con el pulso.
  const LED_X = 14, LED_Z = 3;
  const ledGeo = track(new THREE.PlaneGeometry(0.62, 0.36));
  const leds: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  for (let z = 0; z < LED_Z; z++) for (let x = 0; x < LED_X; x++) {
    const m = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: MAGENTA, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(-4.4 + x * 0.68, 0.012, 0.75 + z * 0.42);
    scene.add(m);
    leds.push(m);
  }
  // Foquitos del borde del tablado.
  const foco = track(new THREE.SphereGeometry(0.05, 10, 8));
  const focos: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>[] = [];
  for (let i = 0; i < 30; i++) {
    const m = new THREE.Mesh(foco, new THREE.MeshBasicMaterial({ color: ORO }));
    m.position.set(-4.8 + i * 0.33, 0.02, 2.11);
    scene.add(m);
    focos.push(m);
  }

  // ---------- Telón ----------
  const telonGeo = track(new THREE.PlaneGeometry(11, 5.6, 160, 1));
  const pos = telonGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 7) * 0.12 + Math.sin(pos.getX(i) * 2.3) * 0.05);
  telonGeo.computeVertexNormals();
  const terciopelo = new THREE.MeshStandardMaterial({ color: "#7A1238", roughness: 0.75, metalness: 0.05 });
  const telon = new THREE.Mesh(telonGeo, terciopelo);
  telon.position.set(0, 2.6, -2.3);
  scene.add(telon);
  for (const s of [-1, 1]) {
    const g = track(new THREE.PlaneGeometry(1.7, 5.6, 40, 1));
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 11) * 0.1);
    g.computeVertexNormals();
    const lado = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: "#A11C4A", roughness: 0.7 }));
    lado.position.set(s * 4.3, 2.6, -0.4);
    lado.rotation.y = -s * 0.25;
    scene.add(lado);
  }
  // Telón de boca: se abre en la apertura y se cierra entre capítulos y al final.
  const bocas = [-1, 1].map((s) => {
    const g = track(new THREE.PlaneGeometry(5.8, 5.4, 60, 1));
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 9) * 0.1 + Math.sin(p.getX(i) * 2.1) * 0.05);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: "#8E1640", roughness: 0.7 }));
    m.position.set(s * 2.9, 2.55, 1.85);
    scene.add(m);
    return { m, s };
  });
  let telonAbierto = 1, telonObjetivo = 1;
  const bambalina = new THREE.Mesh(track(new THREE.BoxGeometry(11, 0.7, 0.3)), new THREE.MeshStandardMaterial({ color: "#5E0D2C", roughness: 0.7 }));
  bambalina.position.set(0, 5.05, 2.0);
  scene.add(bambalina);
  const fleco = new THREE.Mesh(track(new THREE.BoxGeometry(11, 0.08, 0.32)), new THREE.MeshStandardMaterial({ color: ORO, metalness: 0.8, roughness: 0.3, emissive: "#5A3A00" }));
  fleco.position.set(0, 4.68, 2.0);
  scene.add(fleco);

  // ---------- Ñandutí gigante ----------
  const ndTex = tex(texturaNanduti());
  const ndMat = new THREE.MeshBasicMaterial({ map: ndTex, transparent: true, opacity: 0.55, color: BLANCO, blending: THREE.AdditiveBlending, depthWrite: false });
  const nanduti = new THREE.Mesh(track(new THREE.CircleGeometry(1.65, 64)), ndMat);
  nanduti.position.set(0.2, 2.55, -2.1);
  scene.add(nanduti);

  // ---------- Arpa paraguaya ----------
  const arpa = new THREE.Group();
  const maderaArpa = new THREE.MeshStandardMaterial({ color: "#C98A3D", roughness: 0.45, metalness: 0.1 });
  const cuello = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 2.6, 0), new THREE.Vector3(0.45, 2.75, 0), new THREE.Vector3(0.95, 2.45, 0), new THREE.Vector3(1.3, 2.0, 0), new THREE.Vector3(1.45, 1.75, 0)]);
  arpa.add(new THREE.Mesh(track(new THREE.TubeGeometry(cuello, 40, 0.07, 10, false)), maderaArpa));
  const columna = new THREE.Mesh(track(new THREE.CylinderGeometry(0.06, 0.08, 2.6, 12)), maderaArpa);
  columna.position.set(0, 1.3, 0);
  arpa.add(columna);
  const caja = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.26, 2.15, 12, 1)), new THREE.MeshStandardMaterial({ color: "#A86B2C", roughness: 0.4 }));
  caja.position.set(0.85, 0.95, 0);
  caja.rotation.z = Math.atan2(1.45 - 0.2, 1.75 - 0.1) - Math.PI / 2 + 0.05;
  arpa.add(caja);
  const N_CUERDAS = 16;
  const cuerdas: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>[] = [];
  for (let i = 0; i < N_CUERDAS; i++) {
    const u = (i + 1) / (N_CUERDAS + 1);
    const arriba = cuello.getPoint(Math.min(0.98, u * 1.05));
    const abajo = new THREE.Vector3(0.18 + u * 1.25, 0.2 + u * 1.45, 0);
    const largo = arriba.distanceTo(abajo);
    const c = new THREE.Mesh(track(new THREE.CylinderGeometry(0.008, 0.008, largo, 4)), new THREE.MeshBasicMaterial({ color: "#F7E6C4" }));
    c.position.copy(arriba.clone().add(abajo).multiplyScalar(0.5));
    c.lookAt(arriba);
    c.rotateX(Math.PI / 2);
    c.userData.vib = 0;
    arpa.add(c);
    cuerdas.push(c);
  }
  arpa.position.set(-3.1, 0, -0.6);
  arpa.rotation.y = 0.55;
  arpa.scale.setScalar(0.95);
  scene.add(arpa);

  // ---------- El Jai ----------
  const loader = new THREE.TextureLoader();
  const jaiTex: Partial<Record<PoseJai3D, THREE.Texture>> = {};
  const jaiMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05, depthWrite: true });
  const jai = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), jaiMat);
  jai.position.set(0.35, 1.3, 0.35);
  jai.visible = false;
  scene.add(jai);
  let poseActual: PoseJai3D | null = null;
  function ponerPose(p: PoseJai3D) {
    if (p === poseActual) return;
    poseActual = p;
    const ya = jaiTex[p];
    const usar = (t: THREE.Texture) => {
      if (poseActual !== p) return;
      jaiMat.map = t; jaiMat.needsUpdate = true;
      const img = t.image as { width: number; height: number };
      const alto = 2.7;
      jai.scale.set(alto * (img.width / img.height), alto, 1);
      jai.userData.sq = 0;
      jai.position.y = alto / 2 - 0.02;
      jai.visible = true;
    };
    if (ya) return usar(ya);
    loader.load(poses[p], (t) => { t.colorSpace = THREE.SRGBColorSpace; jaiTex[p] = tex(t); usar(t); });
  }
  ponerPose("espera");
  // Círculo de luz bajo el Jai
  const halo = tex(textura((g, n) => {
    const gr = g.createRadialGradient(n / 2, n / 2, 1, n / 2, n / 2, n / 2 - 1);
    gr.addColorStop(0, "rgba(255,240,200,.9)"); gr.addColorStop(1, "rgba(255,240,200,0)");
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
  }));
  const haloMat = new THREE.MeshBasicMaterial({ map: halo, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
  const circulo = new THREE.Mesh(track(new THREE.PlaneGeometry(3, 1.6)), haloMat);
  circulo.rotation.x = -Math.PI / 2;
  circulo.position.set(0.35, 0.02, 0.4);
  scene.add(circulo);

  // ---------- Reflectores que barren ----------
  const conoTex = tex(textura((g, n) => {
    const gr = g.createLinearGradient(0, 0, 0, n);
    gr.addColorStop(0, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
  }));
  const COLORES = [MAGENTA, ORO, VIOLETA, BLANCO];
  const reflectores = COLORES.map((col, i) => {
    const pivote = new THREE.Group();
    pivote.position.set(-3 + i * 2, 4.6, 0.6);
    const largo = 5.4;
    const cono = new THREE.Mesh(track(new THREE.ConeGeometry(0.95, largo, 24, 1, true)), new THREE.MeshBasicMaterial({ map: conoTex, color: col, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cono.position.y = -largo / 2;
    pivote.add(cono);
    const cabeza = new THREE.Mesh(track(new THREE.CylinderGeometry(0.16, 0.2, 0.3, 12)), new THREE.MeshStandardMaterial({ color: "#222", metalness: 0.7, roughness: 0.3, emissive: col, emissiveIntensity: 0.5 }));
    pivote.add(cabeza);
    scene.add(pivote);
    return { pivote, cono, fase: i * 1.7 };
  });
  const spot = new THREE.SpotLight("#FFE3B0", 40, 12, 0.45, 0.6, 1.2);
  spot.position.set(0, 6, 3);
  spot.target.position.set(0.35, 0.8, 0.3);
  scene.add(spot, spot.target);
  const color1 = new THREE.PointLight(MAGENTA, 6, 9, 1.5);
  color1.position.set(-3, 2.4, 1);
  const color2 = new THREE.PointLight(VIOLETA, 6, 9, 1.5);
  color2.position.set(3, 2.4, 1);
  scene.add(color1, color2);

  // ---------- Público ----------
  const N_PUB = 34;
  const cuerpoGeo = track(new THREE.CapsuleGeometry(0.26, 0.5, 4, 10));
  const cabezaGeo = track(new THREE.SphereGeometry(0.2, 12, 10));
  const sombraMat = new THREE.MeshStandardMaterial({ color: "#0A0412", roughness: 1 });
  const cuerpos = new THREE.InstancedMesh(cuerpoGeo, sombraMat, N_PUB);
  const cabezas = new THREE.InstancedMesh(cabezaGeo, sombraMat, N_PUB);
  const gente = Array.from({ length: N_PUB }, (_, i) => {
    const fila = i < 15 ? 0 : i < 26 ? 1 : 2;
    const enFila = fila === 0 ? i : fila === 1 ? i - 15 : i - 26;
    const cuantos = fila === 0 ? 15 : fila === 1 ? 11 : 8;
    const ancho = fila === 0 ? 8.4 : fila === 1 ? 7.6 : 6.6;
    return {
      x: -ancho / 2 + (enFila + 0.5) * (ancho / cuantos) + (Math.sin(i * 12.9) * 0.12),
      z: 2.9 + fila * 0.5,
      y: -0.82 - fila * 0.1,
      s: 0.9 + ((i * 7) % 5) * 0.05,
      fase: (i * 0.37) % 1,
    };
  });
  scene.add(cuerpos, cabezas);
  // Luces de celulares en el público (en la fiesta)
  const luzTex = tex(textura((g, n) => {
    const gr = g.createRadialGradient(n / 2, n / 2, 1, n / 2, n / 2, n / 2 - 1);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,245,210,.6)"); gr.addColorStop(1, "rgba(255,245,210,0)");
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
  }));
  const celulares = gente.filter((_, i) => i % 3 === 0).map((p) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: luzTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.setScalar(0.32);
    scene.add(s);
    return { s, p };
  });

  // ---------- Papel picado ----------
  const N_PAPEL = 140;
  const papelMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, vertexColors: false });
  const papel = new THREE.InstancedMesh(track(new THREE.PlaneGeometry(0.09, 0.14)), papelMat, N_PAPEL);
  const coloresPapel = ["#D52B1E", "#FFFFFF", "#0038A8", ORO, MAGENTA].map((c) => new THREE.Color(c));
  const piezas = Array.from({ length: N_PAPEL }, (_, i) => ({ p: new THREE.Vector3(0, -10, 0), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6), vivo: false, col: i % coloresPapel.length }));
  piezas.forEach((pz, i) => papel.setColorAt(i, coloresPapel[pz.col]!));
  scene.add(papel);
  function festejo() {
    if (reducir) return;
    for (const pz of piezas) {
      pz.vivo = true;
      pz.p.set((Math.random() - 0.5) * 7, 4.6 + Math.random() * 1.2, (Math.random() - 0.5) * 2 + 0.6);
      pz.v.set((Math.random() - 0.5) * 1.2, -0.6 - Math.random() * 1.2, (Math.random() - 0.5) * 0.6);
    }
  }

  // ---------- Bruma ----------
  const bruma = Array.from({ length: 6 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: i % 2 ? VIOLETA : MAGENTA, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.set(4, 2, 1);
    s.position.set(-4 + i * 1.6, 1 + (i % 3) * 0.8, -1.2);
    scene.add(s);
    return s;
  });

  // ---------- Estado y animación ----------
  let estado: EstadoEscenario = { beat: -1, playing: false, animo: 0.2, fiesta: false, pose: "espera" };
  let lentoHasta = 0;
  let pulso = 0;
  let ultimoBeat = -1;
  function setEstado(e: EstadoEscenario) {
    if (e.playing && e.beat !== ultimoBeat && e.beat >= 0) {
      pulso = 1;
      ultimoBeat = e.beat;
      const c = cuerdas[e.beat % N_CUERDAS]!;
      c.userData.vib = 1;
      const c2 = cuerdas[(e.beat * 5 + 3) % N_CUERDAS]!;
      c2.userData.vib = 0.7;
    }
    estado = e;
    if (e.telon !== undefined) telonObjetivo = e.telon;
    ponerPose(e.pose);
  }

  // ---------- Planos de cámara ----------
  type Toma = { pos: THREE.Vector3; mira: THREE.Vector3; fov: number };
  const TOMAS: Record<Plano, Toma> = {
    general: { pos: new THREE.Vector3(0, 1.75, 7.2), mira: new THREE.Vector3(0.1, 1.35, 0), fov: 38 },
    apertura: { pos: new THREE.Vector3(0, 3.4, 12.5), mira: new THREE.Vector3(0, 1.8, 0), fov: 34 },
    jai: { pos: new THREE.Vector3(0.9, 1.75, 4.6), mira: new THREE.Vector3(0.35, 1.45, 0), fov: 36 },
    arpa: { pos: new THREE.Vector3(-1.2, 1.5, 3.6), mira: new THREE.Vector3(-3.0, 1.35, -0.6), fov: 40 },
    mano: { pos: new THREE.Vector3(0, 1.9, 6.4), mira: new THREE.Vector3(0.1, 1.4, 0), fov: 42 },
  };
  const camPos = TOMAS.general.pos.clone();
  const camMira = TOMAS.general.mira.clone();
  let camFov = 38;
  function reiniciar() {
    telonAbierto = telonObjetivo = 0;
    camPos.copy(TOMAS.apertura.pos);
    camMira.copy(TOMAS.apertura.mira);
    camFov = TOMAS.apertura.fov;
  }

  function ajustar() {
    const w = canvas.clientWidth || 360;
    const h = canvas.clientHeight || 224;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(ajustar);
  ro.observe(canvas);
  ajustar();
  let visible = true;
  const io = new IntersectionObserver((e) => { visible = e[e.length - 1]?.isIntersecting ?? true; });
  io.observe(canvas);

  const tmp = new THREE.Object3D();
  const colLed = [new THREE.Color(MAGENTA), new THREE.Color(ORO), new THREE.Color(VIOLETA), new THREE.Color("#FFFFFF")];
  let antes = performance.now();
  let t = 0;
  let raf = 0;
  // Calidad que se adapta: si el celular no llega, baja la resolución y dibuja un cuadro sí y otro no,
  // para que el juego (la pelotita, los botones) nunca se trabe por culpa del escenario.
  let promedio = 1 / 60, cuadros = 0, saltear = false, impar = false, calidad = 2;
  function cuadro() {
    raf = requestAnimationFrame(cuadro);
    const ahora = performance.now();
    const real = (ahora - antes) / 1000;
    const dt = Math.min(real, 0.05);
    antes = ahora;
    if (!visible || document.hidden) return;
    promedio = promedio * 0.95 + Math.min(real, 0.2) * 0.05;
    if (++cuadros > 90 && cuadros % 60 === 0) {
      if (promedio > 1 / 40 && calidad === 2) { calidad = 1; renderer.setPixelRatio(1); ajustar(); }
      else if (promedio > 1 / 32 && calidad === 1) { calidad = 0; saltear = true; }
    }
    impar = !impar;
    if (saltear && impar) return;
    const lento = ahora < lentoHasta ? 0.22 : 1;
    const paso = (saltear ? dt * 2 : dt) * lento;
    t += paso;
    const { playing, animo, fiesta, beat } = estado;
    const vivo = reducir ? 0 : 1;
    pulso = Math.max(0, pulso - paso * 3.2);
    const p = pulso * vivo;
    const energia = fiesta ? 1 : playing ? 0.35 + animo * 0.65 : 0.25;

    // Cámara: va hacia el plano pedido como una grúa, respira con la música y en la fiesta va «en mano».
    const plano: Plano = estado.plano ?? (fiesta ? "mano" : "general");
    const toma = TOMAS[plano];
    const suave = reducir ? 1 : 1 - Math.exp(-dt * (plano === "apertura" ? 0.9 : 1.8));
    camPos.lerp(toma.pos, suave);
    camMira.lerp(toma.mira, suave);
    // En el celular parado (pantalla alta) la cámara se aleja y el escenario sube, para que la letra no lo tape.
    const alto = camera.aspect < 1;
    const fovObj = toma.fov * (alto ? (estado.cine ? 1.75 : 1.3) : camera.aspect < 1.4 ? 1.2 : 1) - (lento < 1 ? 6 : 0);
    camFov += (fovObj - camFov) * suave;
    camera.fov = camFov;
    camera.updateProjectionMatrix();
    const mano = plano === "mano" ? 0.06 : 0.015;
    const giro = fiesta ? Math.sin(t * 0.6) * 0.4 : Math.sin(t * 0.25) * 0.12;
    camera.position.set(
      camPos.x + (giro + Math.sin(t * 7.3) * mano) * vivo,
      camPos.y + (Math.sin(t * 0.4) * 0.05 + Math.sin(t * 5.1) * mano * 0.6) * vivo,
      camPos.z - p * 0.18 * vivo,
    );
    camera.lookAt(camMira.x, camMira.y - (alto && estado.cine ? 1.25 : alto ? 0.35 : 0), camMira.z);

    // Telón de boca
    telonAbierto += (telonObjetivo - telonAbierto) * Math.min(1, (reducir ? 10 : 1.6) * dt);
    for (const b of bocas) b.m.position.x = b.s * (2.9 + telonAbierto * 5.4);

    // Jai: rebota con el pulso.
    if (jai.visible) {
      const alto = jai.scale.y;
      const ancho = jai.scale.x / (1 + (jai.userData.sq ?? 0));
      const sq = playing ? p * 0.05 : Math.sin(t * 2) * 0.01 * vivo;
      jai.userData.sq = sq;
      jai.scale.set(ancho * (1 + sq), alto, 1);
      jai.position.y = alto / 2 - 0.02 + (playing ? p * 0.08 : Math.sin(t * 2) * 0.03 * vivo);
    }
    haloMat.opacity = 0.45 + p * 0.4;

    // Ñandutí: gira despacio y brilla con cada pulso.
    nanduti.rotation.z += dt * (0.05 + energia * 0.12) * (vivo || 0.2);
    ndMat.opacity = 0.32 + energia * 0.2 + p * 0.35;
    ndMat.color.set(fiesta ? (beat % 2 ? ORO : BLANCO) : BLANCO);

    // Reflectores
    reflectores.forEach((r, i) => {
      const vel = fiesta ? 1.8 : playing ? 0.9 : 0.4;
      r.pivote.rotation.z = Math.sin(t * vel + r.fase) * 0.55 * (vivo || 0.3) + (i < 2 ? -0.15 : 0.15);
      r.pivote.rotation.x = Math.cos(t * vel * 0.7 + r.fase) * 0.25 * vivo;
      (r.cono.material as THREE.MeshBasicMaterial).opacity = 0.07 + energia * 0.09 + p * 0.12 + (fiesta && beat % 4 === i ? 0.12 : 0);
    });
    spot.intensity = 30 + p * 40;
    color1.intensity = 4 + energia * 6 + p * 6;
    color2.intensity = 4 + energia * 6 + (fiesta ? p * 6 : 0);

    // LEDs del tablado: una onda de luz que corre con el pulso.
    leds.forEach((m, i) => {
      const x = i % LED_X, z = Math.floor(i / LED_X);
      const onda = playing ? Math.max(0, 1 - Math.abs(((beat % LED_X) + 0.5) - x) / (fiesta ? 3 : 1.6)) : 0;
      m.material.opacity = (onda * (0.35 + p * 0.5) + (fiesta ? 0.12 : 0)) * (1 - z * 0.2);
      m.material.color.copy(colLed[(((Math.floor(Math.max(0, beat) / 4) + z) % colLed.length) + colLed.length) % colLed.length]!);
    });
    focos.forEach((f, i) => { f.material.color.set(playing && (i + beat) % 3 === 0 ? BLANCO : ORO); });

    // Cuerdas del arpa
    for (const c of cuerdas) {
      const v = c.userData.vib as number;
      c.userData.vib = Math.max(0, v - dt * 2.2);
      c.material.color.set(v > 0.05 ? ORO : "#F7E6C4");
      c.scale.x = c.scale.z = 1 + v * 2.5 * Math.abs(Math.sin(t * 60)) * vivo;
    }

    // Público: salta con el pulso, más cuanto más se anima.
    const salto = (playing ? 0.04 + animo * 0.14 : 0.02) * (fiesta ? 1.6 : 1);
    gente.forEach((g, i) => {
      const fase = Math.max(0, Math.sin((t * (playing ? 60 / 0.6 : 20) / 60 + g.fase) * Math.PI * 2));
      const y = g.y + (playing ? p * salto * (0.6 + g.fase) : fase * 0.01) * vivo;
      tmp.position.set(g.x, y + 0.45 * g.s, g.z); tmp.scale.setScalar(g.s); tmp.rotation.set(0, 0, 0); tmp.updateMatrix();
      cuerpos.setMatrixAt(i, tmp.matrix);
      tmp.position.set(g.x, y + 1.08 * g.s, g.z); tmp.updateMatrix();
      cabezas.setMatrixAt(i, tmp.matrix);
    });
    cuerpos.instanceMatrix.needsUpdate = true;
    cabezas.instanceMatrix.needsUpdate = true;
    celulares.forEach(({ s, p: g }, i) => {
      s.material.opacity += ((fiesta ? 0.95 : 0) - s.material.opacity) * Math.min(1, dt * 3);
      s.position.set(g.x + Math.sin(t * 2 + i) * 0.15 * vivo, g.y + 1.55 * g.s + p * 0.05, g.z - 0.05);
    });

    // Papel picado
    let alguno = false;
    piezas.forEach((pz, i) => {
      if (pz.vivo) {
        alguno = true;
        pz.v.x += Math.sin(t * 3 + i) * dt * 0.4;
        pz.p.addScaledVector(pz.v, dt);
        pz.r.x += pz.w.x * dt; pz.r.y += pz.w.y * dt; pz.r.z += pz.w.z * dt;
        if (pz.p.y < -0.2) pz.vivo = false;
      }
      tmp.position.copy(pz.vivo ? pz.p : new THREE.Vector3(0, -20, 0)); tmp.rotation.copy(pz.r); tmp.scale.setScalar(1); tmp.updateMatrix();
      papel.setMatrixAt(i, tmp.matrix);
    });
    if (alguno || t < 0.1) papel.instanceMatrix.needsUpdate = true;

    bruma.forEach((b, i) => { b.position.x += Math.sin(t * 0.2 + i) * dt * 0.1; b.material.opacity = 0.05 + energia * 0.06; });

    renderer.render(scene, camera);
  }
  cuadro();

  return {
    setEstado,
    festejo,
    momento() { lentoHasta = performance.now() + 1100; },
    reiniciar,
    foto() {
      try {
        renderer.render(scene, camera);
        return new Promise((ok) => canvas.toBlob((b) => ok(b), "image/jpeg", 0.9));
      } catch { return Promise.resolve(null); }
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      for (const g of new Set(geos)) g.dispose();
      for (const x of texs) x.dispose();
      scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(m)) m.forEach((x) => x.dispose()); else m?.dispose();
      });
      renderer.dispose();
    },
  };
}

export function hayWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
