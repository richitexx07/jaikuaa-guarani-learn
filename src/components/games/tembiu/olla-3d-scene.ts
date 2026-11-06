/**
 * La olla de Tembi'u en 3D: olla de barro sobre el fogón, con fuego, vapor y burbujas.
 * Cada ingrediente elegido cae adentro con su forma (choclo, queso, huevo…).
 * Todo se arma con figuras simples de three.js, sin descargar modelos.
 */
import * as THREE from "three";

export type ResultadoOlla = null | "bien" | "mal";
export type Olla3D = {
  setIngredientes: (keys: string[]) => void;
  setResultado: (r: ResultadoOlla) => void;
  dispose: () => void;
};

type M = THREE.MeshPhysicalMaterial;
const mats = new Map<string, M>();
function mat(color: string, o: Partial<THREE.MeshPhysicalMaterialParameters> = {}): M {
  const k = color + JSON.stringify(o);
  let m = mats.get(k);
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, ...o });
    mats.set(k, m);
  }
  return m;
}
function mesh(geo: THREE.BufferGeometry, m: THREE.Material, pos: THREE.Vector3Tuple = [0, 0, 0], scale?: THREE.Vector3Tuple, rot?: THREE.Vector3Tuple) {
  const x = new THREE.Mesh(geo, m);
  x.position.set(...pos);
  if (scale) x.scale.set(...scale);
  if (rot) x.rotation.set(...rot);
  return x;
}

/** Cada ingrediente, hecho con figuras simples. Mide más o menos 0,4 de alto. */
function modelo(key: string): THREE.Group {
  const g = new THREE.Group();
  const add = (...a: Parameters<typeof mesh>) => g.add(mesh(...a));
  switch (key) {
    case "avatiKui": { // bolsita de harina de maíz
      add(new THREE.CylinderGeometry(0.15, 0.19, 0.3, 16), mat("#D9C29A", { roughness: 0.95, sheen: 1 }));
      add(new THREE.ConeGeometry(0.12, 0.12, 16), mat("#D9C29A", { roughness: 0.95 }), [0, 0.2, 0]);
      add(new THREE.TorusGeometry(0.07, 0.018, 8, 16), mat("#8A5A2B"), [0, 0.16, 0], undefined, [Math.PI / 2, 0, 0]);
      add(new THREE.SphereGeometry(0.06, 10, 8), mat("#F4D35E"), [0, 0.0, 0.17], [1, 1, 0.3]);
      break;
    }
    case "avatiKy": { // choclo
      add(new THREE.CapsuleGeometry(0.09, 0.3, 6, 16), mat("#F4C430", { roughness: 0.4, clearcoat: 0.4 }), [0, 0, 0], undefined, [0, 0, 0.5]);
      for (const s of [-1, 1]) add(new THREE.ConeGeometry(0.08, 0.42, 8), mat("#6FA34A", { roughness: 0.7 }), [0.06 * s, -0.04, 0.03], [1, 1, 0.35], [0, 0, 0.5 + 0.35 * s]);
      break;
    }
    case "kesu": { // cuña de queso
      add(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 24, 1, false, 0, Math.PI / 3), mat("#F6CF52", { roughness: 0.6 }));
      for (const [x, y, z] of [[0.05, 0.03, 0.1], [0.09, -0.04, 0.05], [0.13, 0.02, 0.14]] as const)
        add(new THREE.SphereGeometry(0.025, 8, 6), mat("#C99A1E"), [x, y, z]);
      break;
    }
    case "sevoi": { // cebolla
      add(new THREE.SphereGeometry(0.16, 20, 16), mat("#E9D7E6", { roughness: 0.35, clearcoat: 0.5 }), [0, 0, 0], [1, 0.92, 1]);
      add(new THREE.ConeGeometry(0.05, 0.12, 10), mat("#C9A8C4"), [0, 0.18, 0]);
      break;
    }
    case "kamby": { // botella de leche
      add(new THREE.CylinderGeometry(0.12, 0.13, 0.3, 20), mat("#FFFFFF", { roughness: 0.2, clearcoat: 1 }));
      add(new THREE.CylinderGeometry(0.06, 0.11, 0.1, 20), mat("#FFFFFF", { roughness: 0.2, clearcoat: 1 }), [0, 0.2, 0]);
      add(new THREE.CylinderGeometry(0.065, 0.065, 0.05, 20), mat("#2F7BD8"), [0, 0.27, 0]);
      add(new THREE.CylinderGeometry(0.132, 0.132, 0.1, 20, 1, true), mat("#2F7BD8", { side: THREE.DoubleSide }), [0, -0.02, 0]);
      break;
    }
    case "rupia": // huevo
      add(new THREE.SphereGeometry(0.13, 20, 16), mat("#F4E7D3", { roughness: 0.4, clearcoat: 0.3 }), [0, 0, 0], [0.85, 1.12, 0.85]);
      break;
    case "aramiro": { // bol con almidón
      add(new THREE.SphereGeometry(0.18, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat("#9B5B34", { side: THREE.DoubleSide }));
      add(new THREE.SphereGeometry(0.16, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat("#FBFBF6", { roughness: 1 }), [0, -0.03, 0], [1, 0.5, 1]);
      break;
    }
    case "nandy": // frasco de grasa
    case "eira": { // frasco de miel
      const miel = key === "eira";
      add(new THREE.CylinderGeometry(0.13, 0.13, 0.24, 20), mat(miel ? "#D98E1B" : "#F3E9C6", { roughness: 0.15, transmission: 0.35, thickness: 0.3, clearcoat: 1 }));
      add(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 20), mat(miel ? "#7A3F12" : "#C23B2A"), [0, 0.15, 0]);
      break;
    }
    case "juky": { // salero
      add(new THREE.CylinderGeometry(0.09, 0.11, 0.24, 16), mat("#FFFFFF", { roughness: 0.15, clearcoat: 1 }));
      add(new THREE.SphereGeometry(0.09, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat("#B8BEC2", { metalness: 0.6, roughness: 0.3 }), [0, 0.12, 0]);
      break;
    }
    case "ryguasu": { // presa de gallina
      add(new THREE.SphereGeometry(0.15, 18, 14), mat("#C9762E", { roughness: 0.45, clearcoat: 0.6 }), [0, 0.04, 0], [1, 1.25, 1]);
      add(new THREE.CapsuleGeometry(0.035, 0.14, 4, 8), mat("#F3EDE2"), [0, -0.18, 0]);
      break;
    }
    case "mandio": { // mandioca
      add(new THREE.CapsuleGeometry(0.07, 0.34, 6, 14), mat("#7B4A2A", { roughness: 0.9 }), [0, 0, 0], [1, 1, 1], [0, 0, 1.2]);
      add(new THREE.CircleGeometry(0.068, 16), mat("#F7F1DF"), [0.24, 0.09, 0], undefined, [0, Math.PI / 2, 1.2 - Math.PI / 2]);
      break;
    }
    case "soo": { // pedazo de carne
      const s = new THREE.Shape();
      s.moveTo(-0.2, -0.05); s.bezierCurveTo(-0.24, 0.12, 0.05, 0.18, 0.2, 0.08); s.bezierCurveTo(0.26, -0.04, 0.1, -0.16, -0.2, -0.05);
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3 });
      add(geo, mat("#B83A33", { roughness: 0.5, clearcoat: 0.3 }), [0, 0, 0], undefined, [-Math.PI / 2, 0, 0]);
      add(new THREE.TorusGeometry(0.11, 0.015, 6, 20, Math.PI), mat("#F5E7DC"), [0.02, 0.05, 0.02], undefined, [-Math.PI / 2, 0, 0.4]);
      break;
    }
    case "andai": { // zapallo
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        add(new THREE.SphereGeometry(0.1, 14, 12), mat("#E8892B", { roughness: 0.5, clearcoat: 0.3 }), [Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08], [0.8, 1.15, 0.8]);
      }
      add(new THREE.CylinderGeometry(0.02, 0.03, 0.1, 8), mat("#5E7D2E"), [0, 0.14, 0], undefined, [0.2, 0, 0.2]);
      break;
    }
    case "asuka": { // terrones de azúcar
      add(new THREE.BoxGeometry(0.13, 0.13, 0.13), mat("#FFFFFF", { roughness: 0.9 }), [-0.07, 0, 0], undefined, [0.2, 0.4, 0]);
      add(new THREE.BoxGeometry(0.13, 0.13, 0.13), mat("#FFFFFF", { roughness: 0.9 }), [0.08, 0.02, 0.04], undefined, [0.5, -0.3, 0.2]);
      break;
    }
    case "pira": { // pescado
      add(new THREE.SphereGeometry(0.14, 20, 14), mat("#8FB3C9", { roughness: 0.25, metalness: 0.3, clearcoat: 1 }), [0, 0, 0], [1.7, 0.75, 0.55]);
      add(new THREE.ConeGeometry(0.1, 0.14, 4), mat("#6E95AE"), [-0.28, 0, 0], [1, 1, 0.3], [0, 0, Math.PI / 2]);
      add(new THREE.SphereGeometry(0.022, 8, 6), mat("#111111"), [0.17, 0.03, 0.06]);
      break;
    }
    case "kumanda": { // porotos
      for (const [x, z, r] of [[0, 0, 0], [0.09, 0.03, 0.8], [-0.08, 0.04, 1.6], [0.03, -0.08, 2.4], [-0.04, -0.06, 0.4]] as const)
        add(new THREE.SphereGeometry(0.05, 12, 10), mat("#8A3B2A", { roughness: 0.3, clearcoat: 0.8 }), [x, 0, z], [1.5, 0.8, 1], [0, r, 0]);
      break;
    }
    case "pakova": { // banana
      const curva = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.2, 0.08, 0), new THREE.Vector3(0, -0.12, 0), new THREE.Vector3(0.2, 0.08, 0));
      add(new THREE.TubeGeometry(curva, 20, 0.06, 10, false), mat("#F2D33C", { roughness: 0.45 }));
      add(new THREE.SphereGeometry(0.03, 8, 6), mat("#5B3A1A"), [0.2, 0.08, 0]);
      break;
    }
    case "y": { // gota de agua
      const m = mat("#59B7F2", { roughness: 0.05, transmission: 0.6, thickness: 0.5, clearcoat: 1 });
      add(new THREE.SphereGeometry(0.12, 20, 16), m);
      add(new THREE.ConeGeometry(0.105, 0.17, 20), m, [0, 0.13, 0]);
      break;
    }
    case "narã": { // naranja
      add(new THREE.SphereGeometry(0.15, 22, 18), mat("#F28A1A", { roughness: 0.6, clearcoat: 0.3 }));
      add(new THREE.SphereGeometry(0.06, 10, 6), mat("#4F8A3A"), [0.05, 0.15, 0], [1.3, 0.25, 0.6], [0, 0, -0.4]);
      break;
    }
    default:
      add(new THREE.SphereGeometry(0.14, 16, 12), mat("#E9B44C"));
  }
  return g;
}

/** Color que toma el guiso con cada ingrediente. */
const TONO: Record<string, string> = {
  avatiKui: "#E8C66A", avatiKy: "#F2C94C", kesu: "#F3D36B", sevoi: "#E7D9C5", kamby: "#F4EEDC", rupia: "#F2D27A",
  aramiro: "#F6F1E4", nandy: "#EAD9A2", juky: "#EFE9DF", ryguasu: "#D9A35A", mandio: "#EDE3C8", soo: "#9E4A30",
  andai: "#E8962F", asuka: "#F6EFE3", pira: "#C9C2A8", kumanda: "#7A3B2A", pakova: "#F1DB7A", eira: "#D9952A",
  y: "#B8D9E8", "narã": "#F0A040",
};

function textura(dibujo: (g: CanvasRenderingContext2D) => void, n = 64): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = n;
  dibujo(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function crearOlla(canvas: HTMLCanvasElement, reducir: boolean): Olla3D {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 3.9, 5.5);
  camera.lookAt(0, 1.0, 0);

  scene.add(new THREE.HemisphereLight("#FFE7C7", "#4A1C0E", 1.2));
  const sol = new THREE.DirectionalLight("#FFF1DC", 2.0);
  sol.position.set(-3, 5, 3);
  scene.add(sol);
  const brasa = new THREE.PointLight("#FF7A2F", 14, 6, 1.6);
  brasa.position.set(0, 0.25, 0.6);
  scene.add(brasa);

  const texturas: THREE.Texture[] = [];
  const geos: THREE.BufferGeometry[] = [];
  const track = <T extends THREE.BufferGeometry>(g: T) => (geos.push(g), g);

  // Sombra del fogón
  const somb = textura((g) => {
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, "rgba(0,0,0,.55)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  });
  texturas.push(somb);
  const sombra = mesh(track(new THREE.PlaneGeometry(4.2, 3)), new THREE.MeshBasicMaterial({ map: somb, transparent: true, depthWrite: false }), [0, 0.01, 0], undefined, [-Math.PI / 2, 0, 0]);
  scene.add(sombra);

  // Piedras del fogón
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    const p = mesh(track(new THREE.DodecahedronGeometry(0.22, 1)), mat(k % 2 ? "#6E625A" : "#857770", { roughness: 0.95 }), [Math.cos(a) * 1.15, 0.14, Math.sin(a) * 0.9], [1.2, 0.75, 1], [k, k * 2, 0]);
    scene.add(p);
  }
  // Brasas y llamas
  const brasas = mesh(track(new THREE.CircleGeometry(0.9, 24)), new THREE.MeshBasicMaterial({ color: "#5A1A08" }), [0, 0.05, 0], [1, 0.75, 1], [-Math.PI / 2, 0, 0]);
  scene.add(brasas);
  const fuegoTex = textura((g) => {
    const gr = g.createRadialGradient(32, 40, 2, 32, 36, 30);
    gr.addColorStop(0, "rgba(255,245,200,1)");
    gr.addColorStop(0.35, "rgba(255,170,60,.95)");
    gr.addColorStop(1, "rgba(255,80,20,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  });
  texturas.push(fuegoTex);
  const llamas: THREE.Sprite[] = [];
  for (let k = 0; k < 9; k++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fuegoTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    const a = (k / 9) * Math.PI * 2;
    s.position.set(Math.cos(a) * 0.55, 0.3, Math.sin(a) * 0.4 + 0.15);
    s.scale.set(0.55, 0.8, 1);
    s.userData.f = Math.random() * 10;
    scene.add(s);
    llamas.push(s);
  }

  // La olla de barro (con textura de barro hecha a mano)
  const barroTex = textura((g) => {
    g.fillStyle = "#A9512A";
    g.fillRect(0, 0, 128, 128);
    for (let k = 0; k < 900; k++) {
      g.fillStyle = `rgba(${60 + Math.random() * 60},${20 + Math.random() * 30},10,${Math.random() * 0.18})`;
      g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    g.strokeStyle = "rgba(255,210,170,.25)";
    g.lineWidth = 3;
    for (const y of [38, 46, 54]) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
  }, 128);
  barroTex.wrapS = THREE.RepeatWrapping;
  barroTex.repeat.set(3, 1);
  texturas.push(barroTex);
  const perfil = [
    [0.0, 0.32], [0.55, 0.34], [0.95, 0.5], [1.18, 0.85], [1.2, 1.15], [1.08, 1.45], [1.0, 1.58], [1.12, 1.66], [1.14, 1.72], [1.02, 1.72], [0.94, 1.62],
    [1.0, 1.45], [1.08, 1.15], [1.04, 0.85], [0.85, 0.55], [0.5, 0.45], [0.0, 0.44],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const olla = mesh(track(new THREE.LatheGeometry(perfil, 56)), mat("#FFFFFF", { map: barroTex, roughness: 0.85, sheen: 0.4, sheenColor: new THREE.Color("#FFB98A"), side: THREE.DoubleSide }));
  scene.add(olla);
  for (const s of [-1, 1]) {
    const asa = mesh(track(new THREE.TorusGeometry(0.2, 0.06, 10, 20, Math.PI)), mat("#8F4021", { roughness: 0.8 }), [1.2 * s, 1.35, 0], undefined, [0, Math.PI / 2, (Math.PI / 2) * -s]);
    scene.add(asa);
  }
  // El guiso
  const caldoMat = new THREE.MeshPhysicalMaterial({ color: "#3A1A0A", roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.2 });
  const caldo = mesh(track(new THREE.CircleGeometry(0.99, 48)), caldoMat, [0, 1.48, 0], undefined, [-Math.PI / 2, 0, 0]);
  scene.add(caldo);

  // Vapor
  const vaporTex = textura((g) => {
    const gr = g.createRadialGradient(32, 32, 1, 32, 32, 31);
    gr.addColorStop(0, "rgba(255,255,255,.85)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  });
  texturas.push(vaporTex);
  const vapor: { s: THREE.Sprite; v: number; vida: number }[] = [];
  function soltarVapor(n: number, oscuro = false) {
    for (let k = 0; k < n; k++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: vaporTex, color: oscuro ? "#3A3A3A" : "#FFFFFF", transparent: true, opacity: 0, depthWrite: false }));
      s.position.set((Math.random() - 0.5) * 1.2, 1.55, (Math.random() - 0.5) * 0.8);
      s.scale.setScalar(0.4 + Math.random() * 0.3);
      scene.add(s);
      vapor.push({ s, v: 0.5 + Math.random() * 0.5, vida: 0 });
    }
  }
  // Burbujas
  const burbujaGeo = track(new THREE.SphereGeometry(0.05, 10, 8));
  const burbujaMat = new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", roughness: 0.1, transmission: 0.6, transparent: true, opacity: 0.7 });
  const burbujas: { m: THREE.Mesh; vida: number }[] = [];

  // Chispas de festejo
  const chispaTex = textura((g) => {
    g.fillStyle = "#FFF";
    g.translate(32, 32);
    for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 4); g.fillRect(-2, -28, 4, 56); }
    g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill();
  });
  texturas.push(chispaTex);
  const chispas: { s: THREE.Sprite; v: THREE.Vector3; vida: number }[] = [];
  function festejo() {
    for (let k = 0; k < 40; k++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: chispaTex, color: k % 3 ? "#FFD25A" : "#FFFFFF", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      s.position.set(0, 1.7, 0);
      s.scale.setScalar(0.18);
      scene.add(s);
      const a = Math.random() * Math.PI * 2;
      chispas.push({ s, v: new THREE.Vector3(Math.cos(a) * (0.6 + Math.random()), 2 + Math.random() * 2, Math.sin(a) * (0.6 + Math.random())), vida: 0 });
    }
  }

  // Ingredientes en la olla
  type Item = { key: string; g: THREE.Group; estado: "cae" | "flota" | "sale"; vy: number; y: number; slot: THREE.Vector2; t: number };
  const items: Item[] = [];
  const SLOTS = [[0, 0], [0.5, 0.2], [-0.45, 0.25], [0.3, -0.42], [-0.35, -0.38]].map(([x, z]) => new THREE.Vector2(x, z));
  const ondas: { m: THREE.Mesh; vida: number }[] = [];
  const ondaGeo = track(new THREE.RingGeometry(0.15, 0.2, 32));

  function libreSlot(): THREE.Vector2 {
    return SLOTS.find((s) => !items.some((it) => it.estado !== "sale" && it.slot === s)) ?? SLOTS[0]!;
  }
  let objetivoColor = new THREE.Color("#3A1A0A");
  function recalcularColor() {
    const dentro = items.filter((i) => i.estado !== "sale");
    if (!dentro.length) return void objetivoColor.set("#3A1A0A");
    const c = new THREE.Color(0, 0, 0);
    for (const i of dentro) c.add(new THREE.Color(TONO[i.key] ?? "#E9B44C"));
    c.multiplyScalar(1 / dentro.length);
    objetivoColor = new THREE.Color("#7A4A1E").lerp(c, Math.min(1, 0.35 + dentro.length * 0.13));
  }

  function setIngredientes(keys: string[]) {
    // Los que ya no están, salen saltando
    for (const it of items) if (it.estado !== "sale" && !keys.includes(it.key)) { it.estado = "sale"; it.vy = 2.5; it.t = 0; }
    // Los nuevos caen desde arriba
    for (const k of keys) {
      if (items.some((it) => it.key === k && it.estado !== "sale")) continue;
      const g = modelo(k);
      g.scale.setScalar(1.25);
      const slot = libreSlot();
      g.position.set(slot.x, 3.6, slot.y);
      g.rotation.set(Math.random(), Math.random() * 6, Math.random());
      g.traverse((o) => { if ((o as THREE.Mesh).geometry) geos.push((o as THREE.Mesh).geometry); });
      scene.add(g);
      items.push({ key: k, g, estado: "cae", vy: 0, y: 3.6, slot, t: 0 });
    }
    recalcularColor();
  }

  let resultado: ResultadoOlla = null;
  let brillo = 0;
  function setResultado(r: ResultadoOlla) {
    if (r === resultado) return;
    resultado = r;
    if (r === "bien") { festejo(); soltarVapor(14); brillo = 1; }
    if (r === "mal") soltarVapor(10, true);
  }

  function ajustar() {
    const w = canvas.clientWidth || 320;
    const h = canvas.clientHeight || 260;
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
  let proximoVapor = 0;
  let raf = 0;
  const SUP = 1.5;
  function cuadro() {
    raf = requestAnimationFrame(cuadro);
    const ahora = performance.now();
    const dt = Math.min((ahora - antes) / 1000, 0.05);
    antes = ahora;
    if (!visible || document.hidden) return;
    t += dt;

    // Fuego
    for (const s of llamas) {
      const f = reducir ? 0.5 : 0.5 + 0.5 * Math.sin(t * 9 + s.userData.f) * Math.sin(t * 5.3 + s.userData.f * 2);
      s.scale.set(0.5 + f * 0.15, 0.7 + f * 0.45, 1);
      s.position.y = 0.3 + f * 0.12;
    }
    brasa.intensity = 12 + (reducir ? 0 : Math.sin(t * 13) * 2 + Math.sin(t * 7) * 1.5);

    // Guiso
    caldoMat.color.lerp(objetivoColor, Math.min(1, dt * 2.5));
    brillo = Math.max(0, brillo - dt * 0.5);
    caldoMat.emissive.set("#FFB347").multiplyScalar(brillo * 0.6);
    const dentro = items.filter((i) => i.estado === "flota").length;

    // Ingredientes
    for (const it of [...items]) {
      it.t += dt;
      if (it.estado === "cae") {
        it.vy -= 9.8 * dt;
        it.y += it.vy * dt;
        it.g.rotation.x += dt * 3;
        it.g.rotation.z += dt * 2;
        if (it.y <= SUP + 0.05) {
          it.y = SUP + 0.05;
          it.estado = "flota";
          it.t = 0;
          const o = mesh(ondaGeo, new THREE.MeshBasicMaterial({ color: "#FFF4E0", transparent: true, opacity: 0.8, depthWrite: false }), [it.slot.x, SUP + 0.01, it.slot.y], undefined, [-Math.PI / 2, 0, 0]);
          scene.add(o);
          ondas.push({ m: o, vida: 0 });
          soltarVapor(3);
        }
        it.g.position.set(it.slot.x, it.y, it.slot.y);
      } else if (it.estado === "flota") {
        const b = reducir ? 0 : Math.sin(t * 2.2 + it.slot.x * 4) * 0.03;
        it.g.position.set(it.slot.x, SUP + 0.05 + b, it.slot.y);
        it.g.rotation.x *= 1 - Math.min(1, dt * 4);
        it.g.rotation.z *= 1 - Math.min(1, dt * 4);
        it.g.rotation.y += dt * 0.3;
      } else {
        it.vy -= 9.8 * dt;
        it.g.position.y += it.vy * dt;
        it.g.scale.multiplyScalar(1 - dt * 2.5);
        if (it.t > 0.6) {
          scene.remove(it.g);
          items.splice(items.indexOf(it), 1);
        }
      }
    }

    // Ondas
    for (const o of [...ondas]) {
      o.vida += dt;
      o.m.scale.setScalar(1 + o.vida * 5);
      (o.m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - o.vida * 1.3);
      if (o.vida > 0.65) { scene.remove(o.m); (o.m.material as THREE.Material).dispose(); ondas.splice(ondas.indexOf(o), 1); }
    }

    // Burbujas mientras hay algo en la olla
    if (!reducir && dentro > 0 && Math.random() < dt * (2 + dentro * 1.5)) {
      const m = new THREE.Mesh(burbujaGeo, burbujaMat);
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.8;
      m.position.set(Math.cos(a) * r, SUP, Math.sin(a) * r * 0.9);
      scene.add(m);
      burbujas.push({ m, vida: 0 });
    }
    for (const b of [...burbujas]) {
      b.vida += dt;
      b.m.scale.setScalar(Math.min(1, b.vida * 3) * (1 + b.vida));
      if (b.vida > 0.7) { scene.remove(b.m); burbujas.splice(burbujas.indexOf(b), 1); }
    }

    // Vapor constante con la olla caliente
    proximoVapor -= dt;
    if (!reducir && dentro > 0 && proximoVapor <= 0) { soltarVapor(1); proximoVapor = 0.5; }
    for (const v of [...vapor]) {
      v.vida += dt;
      v.s.position.y += v.v * dt;
      v.s.position.x += Math.sin(t * 2 + v.vida * 3) * dt * 0.15;
      v.s.scale.multiplyScalar(1 + dt * 0.6);
      v.s.material.opacity = Math.min(0.55, v.vida * 1.5) * Math.max(0, 1 - v.vida / 2.4);
      if (v.vida > 2.4) { scene.remove(v.s); v.s.material.dispose(); vapor.splice(vapor.indexOf(v), 1); }
    }
    // Chispas
    for (const c of [...chispas]) {
      c.vida += dt;
      c.v.y -= 4 * dt;
      c.s.position.addScaledVector(c.v, dt);
      c.s.material.rotation += dt * 4;
      c.s.material.opacity = Math.max(0, 1 - c.vida / 1.4);
      if (c.vida > 1.4) { scene.remove(c.s); c.s.material.dispose(); chispas.splice(chispas.indexOf(c), 1); }
    }

    renderer.render(scene, camera);
  }
  cuadro();

  return {
    setIngredientes,
    setResultado,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      for (const g of new Set(geos)) g.dispose();
      for (const t of texturas) t.dispose();
      for (const m of mats.values()) m.dispose();
      mats.clear();
      caldoMat.dispose();
      burbujaMat.dispose();
      scene.traverse((o) => {
        const m = (o as THREE.Mesh | THREE.Sprite).material as THREE.Material | undefined;
        if (m && !(m instanceof THREE.MeshPhysicalMaterial)) m.dispose();
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
