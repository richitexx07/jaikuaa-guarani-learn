import { vallaEn } from '@/lib/valla-led';
/**
 * La cancha de Penales en 3D (three.js, se carga aparte solo al jugar).
 * Lee el mismo estado que el dibujo plano: arco, pelota y Jai se ubican con las
 * coordenadas del juego (800×600), así la flecha y la barra de fuerza siguen alineadas.
 * Pensada para celulares baratos: pocas figuras, sin sombras en tiempo real y resolución limitada.
 */
import * as THREE from 'three';
import { amague, G, H, W, type Scene } from './physics';
import { arqueroDe, imagen } from './sprites';

/** Metros por punto del juego: el arco (500 puntos) mide 7,32 m. */
const S = 7.32 / 500;
const PISO_Y = G.y + G.h; // línea de gol en la pantalla
const FOV = 40;
/** Distancia de la cámara al arco para que el arco ocupe lo mismo que en el dibujo plano. */
const DIST = (G.h * S * H) / (G.h * 2 * Math.tan((FOV / 2) * Math.PI / 180));
const ALTO_CAM = 2.2;
const SPOT_Z = 6.5;

export type Cancha3D = { render: (s: Scene, now: number) => void; resize: (w: number, h: number) => void; dispose: () => void };

const mundoX = (x: number) => (x - 400) * S;
const mundoY = (y: number) => (PISO_Y - y) * S;

function texturaCesped(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d')!;
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#2f7d3a' : '#378a43'; g.fillRect(0, i * 32, 256, 32); }
  for (let k = 0; k < 1400; k++) { g.fillStyle = `rgba(${k % 2 ? 255 : 0},${k % 2 ? 255 : 40},0,0.05)`; g.fillRect((k * 73) % 256, (k * 131) % 256, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 6); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function texturaTribuna(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#141b2b'; g.fillRect(0, 0, 512, 128);
  const col = ['#D52B1E', '#FFFFFF', '#0038A8', '#F2C14E', '#e8e8e8'];
  for (let k = 0; k < 1800; k++) { g.fillStyle = col[k % 5]; g.globalAlpha = 0.35 + ((k * 37) % 50) / 100; g.fillRect((k * 97) % 512, (k * 53) % 128, 3, 4); }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function texturaRed(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d')!; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2;
  for (let i = 0; i <= 128; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function texturaPelota(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const g = c.getContext('2d')!; g.fillStyle = '#fafafa'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#1b1b1b';
  for (let k = 0; k < 8; k++) { const x = (k * 37) % 128, y = 10 + ((k * 23) % 44); g.beginPath(); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); } g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function crearCancha(canvas: HTMLCanvasElement): Cancha3D {
  const barato = (navigator.hardwareConcurrency ?? 4) <= 4 || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4) <= 2;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !barato, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, barato ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;

  const escena = new THREE.Scene();
  escena.background = new THREE.Color('#0b1426');
  escena.fog = new THREE.Fog('#0b1426', 30, 70);

  const cam = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 120);
  const camBase = new THREE.Vector3(0, ALTO_CAM, DIST);
  cam.position.copy(camBase);
  // El arco cae justo donde lo espera el dibujo de la flecha (corrimiento vertical de la vista).
  cam.setViewOffset(W, H, 0, ALTO_CAM / S - (PISO_Y - H / 2), W, H);

  escena.add(new THREE.HemisphereLight('#cfe0ff', '#1d3b22', 1.4));
  const sol = new THREE.DirectionalLight('#fff3dd', 2.2); sol.position.set(-6, 14, 10); escena.add(sol);
  const contra = new THREE.DirectionalLight('#9fc0ff', 0.8); contra.position.set(8, 10, -12); escena.add(contra);

  const disponer: { dispose: () => void }[] = [];
  const guardar = <T extends { dispose: () => void }>(x: T) => { disponer.push(x); return x; };

  // Césped y líneas
  const cesped = new THREE.Mesh(guardar(new THREE.PlaneGeometry(60, 60)), guardar(new THREE.MeshStandardMaterial({ map: guardar(texturaCesped()), roughness: 0.95 })));
  cesped.rotation.x = -Math.PI / 2; cesped.position.z = 10; escena.add(cesped);
  const blanco = guardar(new THREE.MeshBasicMaterial({ color: '#f4f4f4' }));
  const linea = (w: number, d: number, x: number, z: number) => { const m = new THREE.Mesh(guardar(new THREE.PlaneGeometry(w, d)), blanco); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.012, z); escena.add(m); };
  linea(40, 0.12, 0, 0); linea(16.5 * 2 + 7.32, 0.12, 0, 16.5); linea(0.12, 16.5, -20.16, 8.25); linea(0.12, 16.5, 20.16, 8.25);
  linea(18.32, 0.12, 0, 5.5); linea(0.12, 5.5, -9.16, 2.75); linea(0.12, 5.5, 9.16, 2.75);
  const punto = new THREE.Mesh(guardar(new THREE.CircleGeometry(0.14, 16)), blanco); punto.rotation.x = -Math.PI / 2; punto.position.set(0, 0.013, SPOT_Z); escena.add(punto);

  // Arco: palos, travesaño y red
  const anchoArco = G.w * S, altoArco = G.h * S, r = 0.07;
  const palo = guardar(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, metalness: 0.1, emissive: '#222222' }));
  const arco = new THREE.Group(); escena.add(arco);
  const cil = guardar(new THREE.CylinderGeometry(r, r, altoArco, 12));
  for (const x of [-anchoArco / 2, anchoArco / 2]) { const p = new THREE.Mesh(cil, palo); p.position.set(x, altoArco / 2, 0); arco.add(p); }
  const trav = new THREE.Mesh(guardar(new THREE.CylinderGeometry(r, r, anchoArco + r * 2, 12)), palo); trav.rotation.z = Math.PI / 2; trav.position.set(0, altoArco, 0); arco.add(trav);
  const texRed = guardar(texturaRed());
  const redMat = guardar(new THREE.MeshBasicMaterial({ map: texRed, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  const fondoRed = new THREE.Mesh(guardar(new THREE.PlaneGeometry(anchoArco, altoArco, 12, 6)), redMat);
  texRed.repeat.set(10, 4); fondoRed.position.set(0, altoArco / 2, -2); arco.add(fondoRed);
  const techo = new THREE.Mesh(guardar(new THREE.PlaneGeometry(anchoArco, 2)), redMat); techo.rotation.x = -Math.PI / 2 + 0.0; techo.position.set(0, altoArco, -1); arco.add(techo);
  for (const x of [-anchoArco / 2, anchoArco / 2]) { const lado = new THREE.Mesh(guardar(new THREE.PlaneGeometry(2, altoArco)), redMat); lado.rotation.y = Math.PI / 2; lado.position.set(x, altoArco / 2, -1); arco.add(lado); }
  const redPos = (fondoRed.geometry as THREE.PlaneGeometry).attributes.position as THREE.BufferAttribute;
  const redBase = Float32Array.from(redPos.array as Float32Array);

  // Tribunas con hinchada y carteles
  const texTrib = guardar(texturaTribuna());
  const tribMat = guardar(new THREE.MeshStandardMaterial({ map: texTrib, roughness: 1, emissive: '#ffffff', emissiveMap: texTrib, emissiveIntensity: 0.25 }));
  const trib = new THREE.Mesh(guardar(new THREE.PlaneGeometry(70, 12)), tribMat); trib.position.set(0, 7, -14); trib.rotation.x = -0.35; escena.add(trib);
  for (const s of [-1, 1]) { const t = new THREE.Mesh(trib.geometry, tribMat); t.position.set(s * 26, 7, 2); t.rotation.set(0, -s * Math.PI / 2.4, 0); escena.add(t); }
  const cartel = new THREE.Mesh(guardar(new THREE.BoxGeometry(50, 0.9, 0.2)), guardar(new THREE.MeshStandardMaterial({ color: '#05070c' })));
  cartel.position.set(0, 0.45, -9); escena.add(cartel);
  // Pantalla LED rotativa: varias marcas en tanda, con puntitos de diodo, texto que corre y barrido de luz al cambiar.
  const ledCv = document.createElement('canvas'); ledCv.width = barato ? 1024 : 2048; ledCv.height = barato ? 32 : 64;
  const ledCtx = ledCv.getContext('2d');
  const ledTex = guardar(new THREE.CanvasTexture(ledCv)); ledTex.colorSpace = THREE.SRGBColorSpace;
  const ledMat = guardar(new THREE.MeshBasicMaterial({ map: ledTex, toneMapped: false }));
  const pantalla = new THREE.Mesh(guardar(new THREE.PlaneGeometry(49.6, 0.78)), ledMat); pantalla.position.set(0, 0.45, -8.89); escena.add(pantalla);
  const ledLuz = new THREE.PointLight('#FFB23E', barato ? 0 : 6, 9, 2); ledLuz.position.set(0, 0.8, -8.2); escena.add(ledLuz);
  let ledUlt = 0;
  function dibujarLed(texto: string, now: number) {
    if (!ledCtx || now - ledUlt < (barato ? 60 : 33)) return; ledUlt = now;
    const v = vallaEn(texto, now), W = ledCv.width, H = ledCv.height;
    ledCtx.fillStyle = '#030509'; ledCtx.fillRect(0, 0, W, H);
    ledCtx.font = `800 ${Math.round(H * 0.7)}px sans-serif`; ledCtx.textBaseline = 'middle';
    const frase = v.texto + '   ·   ', ancho = Math.max(W / 3, ledCtx.measureText(frase).width), off = (now / 6) % ancho;
    ledCtx.fillStyle = v.color; ledCtx.shadowColor = v.color; ledCtx.shadowBlur = H * 0.25;
    for (let x = -off; x < W; x += ancho) ledCtx.fillText(frase, x, H * 0.54);
    ledCtx.shadowBlur = 0;
    if (v.cambio > 0) { ledCtx.globalAlpha = v.cambio; ledCtx.fillStyle = '#fff'; ledCtx.fillRect((1 - v.cambio) * W - W * 0.08, 0, W * 0.16, H); ledCtx.globalAlpha = 1; }
    // rejilla de diodos
    ledCtx.fillStyle = 'rgba(0,0,0,.55)'; const paso = Math.max(3, Math.round(H / 12));
    for (let x = 0; x < W; x += paso) ledCtx.fillRect(x, 0, 1, H);
    for (let y = 0; y < H; y += paso) ledCtx.fillRect(0, y, W, 1);
    ledTex.needsUpdate = true; ledLuz.color.set(v.color);
  }

  // Hinchada con vida: hinchas que se mueven (una sola figura repetida, liviana) y flashes de fotos.
  // barato: el mismo celular-barato de arriba
  const FILAS = barato ? 4 : 6, POR_FILA = barato ? 40 : 60, NH = FILAS * POR_FILA;
  const hinchas = new THREE.InstancedMesh(guardar(new THREE.BoxGeometry(0.55, 0.9, 0.3)), guardar(new THREE.MeshBasicMaterial({ color: '#ffffff' })), NH);
  const coloresH = ['#D52B1E', '#FFFFFF', '#0038A8', '#F2C14E', '#D52B1E', '#FFFFFF'];
  const baseH: { x: number; y: number; z: number; ph: number; sp: number }[] = [];
  const colTmp = new THREE.Color();
  for (let f = 0; f < FILAS; f++) for (let i = 0; i < POR_FILA; i++) {
    const ly = -4.5 + f * (9 / FILAS), x = -32 + (i + (f % 2) * 0.5) * (64 / POR_FILA);
    baseH.push({ x, y: 7 + ly * Math.cos(0.35), z: -14 - ly * Math.sin(0.35) + 0.5, ph: (i * 1.7 + f * 2.3) % 6.28, sp: 0.8 + ((i * 37 + f * 11) % 10) / 20 });
    hinchas.setColorAt(f * POR_FILA + i, colTmp.set(coloresH[(i + f * 3) % coloresH.length]!));
  }
  escena.add(hinchas);
  const flashes = new THREE.InstancedMesh(guardar(new THREE.SphereGeometry(0.16, 6, 4)), guardar(new THREE.MeshBasicMaterial({ color: '#fffbe6' })), 10);
  escena.add(flashes);
  // Banderas que flamean en la tribuna
  const banderas: THREE.Mesh[] = [];
  for (let b = 0; b < (barato ? 3 : 6); b++) {
    const c = document.createElement('canvas'); c.width = 48; c.height = 32; const g = c.getContext('2d')!;
    ['#D52B1E', '#FFFFFF', '#0038A8'].forEach((cl, k) => { g.fillStyle = cl; g.fillRect(0, k * 11, 48, 11); });
    const tex = guardar(new THREE.CanvasTexture(c)); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(guardar(new THREE.PlaneGeometry(2.4, 1.5, 8, 1)), guardar(new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })));
    m.position.set(-25 + b * (50 / Math.max(1, (barato ? 3 : 6) - 1)), 10.5, -15.2); escena.add(m); banderas.push(m);
  }
  const banderaBase = banderas.map((m) => Float32Array.from((m.geometry as THREE.PlaneGeometry).attributes.position.array as Float32Array));
  const tmp = new THREE.Object3D();
  function animarHinchada(s: Scene, now: number) {
    const hype = Math.max(0, 1 - (now - s.cheer) / 2200), tension = s.phase === 'power' ? 1 : 0;
    for (let n = 0; n < NH; n++) {
      const h = baseH[n]!, salto = Math.abs(Math.sin(now / (150 / h.sp) + h.ph)) * (0.08 + hype * 0.75) + tension * Math.abs(Math.sin(now / 90 + h.ph)) * 0.12;
      tmp.position.set(h.x, h.y + salto, h.z); tmp.rotation.set(0, 0, Math.sin(now / 400 + h.ph) * 0.12); tmp.scale.set(1, 1 + hype * 0.25, 1); tmp.updateMatrix();
      hinchas.setMatrixAt(n, tmp.matrix);
    }
    hinchas.instanceMatrix.needsUpdate = true;
    for (let k = 0; k < 10; k++) {
      const ciclo = Math.floor(now / 230) + k * 7, on = ((ciclo * 2654435761) >>> 0) % (hype > 0 ? 3 : 9) === 0;
      const hx = baseH[(ciclo * 31) % NH]!;
      tmp.position.set(hx.x, hx.y + 0.5, hx.z + 0.2); tmp.rotation.set(0, 0, 0); tmp.scale.setScalar(on ? 1 : 0.0001); tmp.updateMatrix(); flashes.setMatrixAt(k, tmp.matrix);
    }
    flashes.instanceMatrix.needsUpdate = true;
    banderas.forEach((m, b) => {
      const pos = (m.geometry as THREE.PlaneGeometry).attributes.position as THREE.BufferAttribute, base = banderaBase[b]!;
      for (let v = 0; v < pos.count; v++) { const x = base[v * 3]!; pos.setZ(v, Math.sin(now / 160 + x * 2.2 + b) * 0.18 * (x + 1.2)); }
      pos.needsUpdate = true; m.position.y = 10.5 + hype * Math.abs(Math.sin(now / 120 + b)) * 0.8;
    });
  }

  // Reflectores
  const luzMat = guardar(new THREE.MeshBasicMaterial({ color: '#fffbe6' }));
  for (const s of [-1, 1]) {
    const torre = new THREE.Mesh(guardar(new THREE.BoxGeometry(2.4, 0.9, 0.2)), luzMat); torre.position.set(s * 18, 16, -12); torre.lookAt(0, 0, 4); escena.add(torre);
    const halo = new THREE.Sprite(guardar(new THREE.SpriteMaterial({ color: '#fff6d8', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending })));
    halo.scale.set(9, 9, 1); halo.position.copy(torre.position); escena.add(halo);
  }

  // Pelota con costuras y sombra
  const pelota = new THREE.Mesh(guardar(new THREE.SphereGeometry(0.11, 20, 14)), guardar(new THREE.MeshStandardMaterial({ map: guardar(texturaPelota()), roughness: 0.45 })));
  escena.add(pelota);
  const sombraMat = guardar(new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35, depthWrite: false }));
  const sombraBola = new THREE.Mesh(guardar(new THREE.CircleGeometry(0.13, 16)), sombraMat); sombraBola.rotation.x = -Math.PI / 2; escena.add(sombraBola);

  // Jai: su ilustración oficial, parada en el arco y estirándose en el aire.
  const jaiMat = guardar(new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05, depthWrite: false, side: THREE.DoubleSide }));
  const jai = new THREE.Mesh(guardar(new THREE.PlaneGeometry(1, 1)), jaiMat); jai.position.z = 0.4; escena.add(jai);
  const sombraJai = new THREE.Mesh(guardar(new THREE.CircleGeometry(0.5, 20)), sombraMat); sombraJai.rotation.x = -Math.PI / 2; sombraJai.position.z = 0.4; escena.add(sombraJai);
  // Briznas de pasto (pocas, para celulares baratos)
  const pastoGeo = guardar(new THREE.BoxGeometry(0.05, 0.02, 0.05)), pastoMat = guardar(new THREE.MeshBasicMaterial({ color: '#3f8f3a' }));
  const pasto = Array.from({ length: barato ? 8 : 16 }, () => { const m = new THREE.Mesh(pastoGeo, pastoMat); m.visible = false; escena.add(m); return { m, v: new THREE.Vector3() }; });
  let ultimoAterrizaje = 0, ultimoCuadro = 0, enTv = false;
  const camQuat = cam.quaternion.clone(), tvPos = new THREE.Vector3(7, 1.7, 3.5);
  const texturas = new Map<string, THREE.Texture>();
  function tex(src: string | null): THREE.Texture | null {
    if (!src) return null;
    const ya = texturas.get(src); if (ya) return ya;
    const im = imagen(src); if (!im) return null;
    const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; texturas.set(src, t); return t;
  }

  function render(s: Scene, now: number) {
    try { dibujarLed(s.led ?? 'JAIKUAA · TU MARCA AQUÍ', now); } catch { /* la valla nunca corta el partido */ }
    // Jai según la jugada (las mismas poses que el dibujo plano)
    const k = s.keeper, dx = k.x - 400, res = s.phase === 'result' ? s.outcome : undefined;
    const am = s.phase === 'aim' || s.phase === 'power' ? amague(now, s.knew) : { x: 0, y: 0 }, idle = am.x;
    const ARQUERO = arqueroDe(s.arquera);
    let src: string | null = ARQUERO.listo, alto = 180, volando = false;
    if (res === 'save') { const t = s.banner ? now - s.banner.t : 1e9; if (t < 380 && Math.abs(dx) > 24) { src = ARQUERO.estirada; alto = 200; volando = true; } else { src = ARQUERO.atajada ?? ARQUERO.listo; alto = 190; } }
    else if (res && Math.abs(dx) > 40) { src = ARQUERO.vencido ?? ARQUERO.listo; alto = 160; }
    else if (s.phase === 'shot' && k.stretch > 0.18 && Math.abs(dx) > 24) { src = ARQUERO.estiradaSinPelota ?? ARQUERO.estirada; alto = 200; volando = true; }
    const t = tex(src) ?? tex(ARQUERO.listo);
    if (t) { if (jaiMat.map !== t) { jaiMat.map = t; jaiMat.needsUpdate = true; } jai.visible = true; } else jai.visible = false;
    const im = t?.image as HTMLImageElement | undefined, asp = im?.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : 1;
    const hm = alto * S;
    jai.scale.set(hm * asp * (volando && dx < 0 ? -1 : 1), hm, 1);
    const cy = volando ? Math.max(hm * 0.32, Math.min(altoArco - hm * 0.2, mundoY(k.y))) : hm / 2 + Math.max(0, mundoY(k.y) - mundoY(278)) * 0.6;
    jai.position.x = mundoX(k.x + idle) + (volando ? Math.sign(dx) * 20 * S : 0);
    jai.position.y = cy + Math.max(0, -am.y) * S;
    if (s.tv) jai.quaternion.copy(cam.quaternion);
    else jai.rotation.set(0, 0, volando ? -Math.max(-0.5, Math.min(0.25, (k.y - 278) / -220)) * Math.sign(dx) : 0);
    if (!volando && !res && am.y < -1) jai.scale.y *= 1 + am.y * 0.004; // flexiona las piernas en el amague

    // Pasto que salta cuando Jai cae al césped
    if (s.aterrizo && s.aterrizo !== ultimoAterrizaje) {
      ultimoAterrizaje = s.aterrizo;
      for (const p of pasto) { p.m.visible = true; p.m.position.set(jai.position.x + (Math.random() - 0.5) * 0.9, 0.05, 0.4 + (Math.random() - 0.5) * 0.4); p.v.set((Math.random() - 0.5) * 2.2, 1.5 + Math.random() * 2, (Math.random() - 0.2) * 1.2); }
    }
    const dtP = Math.min(0.05, Math.max(0, (now - ultimoCuadro) / 1000)); ultimoCuadro = now;
    for (const p of pasto) { if (!p.m.visible) continue; p.v.y -= 9.8 * dtP; p.m.position.addScaledVector(p.v, dtP); p.m.rotation.x += 0.3; if (p.m.position.y < 0.01) p.m.visible = false; }
    sombraJai.position.x = jai.position.x; sombraJai.scale.setScalar(volando ? 1.6 : 1);

    // Pelota: del punto penal al arco, con comba, giro y sombra
    const e = Math.max(0, Math.min(1, (16 - s.ball.r) / 6));
    const fin = s.objetivo;
    if ((s.phase === 'shot' || s.phase === 'result') && fin) {
      const zFin = s.outcome === 'over' || s.outcome === 'wide' ? -1.2 : -0.3;
      pelota.position.set(s.outcome === 'post' && s.phase === 'result' ? mundoX(s.ball.x) : mundoX(fin.x) * e + mundoX(s.ball.x) - mundoX(400 + (fin.x - 400) * e), 0.11 + (Math.max(0.11, mundoY(fin.y)) - 0.11) * e + Math.sin(e * Math.PI) * 0.5, SPOT_Z + (zFin - SPOT_Z) * e);
      if (e < 1) { pelota.rotation.x -= 0.35; pelota.rotation.y += 0.12; }
    } else pelota.position.set(0, 0.11, SPOT_Z);
    if (s.phase === 'result' && s.outcome === 'save') pelota.position.set(jai.position.x, Math.max(0.11, jai.position.y), 0.6);
    sombraBola.position.set(pelota.position.x, 0.015, pelota.position.z); sombraBola.scale.setScalar(Math.max(0.4, 1 - pelota.position.y / 4));

    // La red se sacude con el gol
    const kRed = s.net ? Math.max(0, 1 - (now - s.net.t) / 900) : 0;
    const arr = redPos.array as Float32Array, nx = s.net ? mundoX(s.net.x) : 0, ny = s.net ? mundoY(s.net.y) : 0;
    for (let i = 0; i < arr.length; i += 3) { const d = Math.hypot(redBase[i] - nx, redBase[i + 1] + altoArco / 2 - ny); arr[i + 2] = redBase[i + 2] - (kRed ? Math.max(0, 1 - d / 2.8) * kRed * 1.6 * (1 + Math.sin(now / 40) * 0.2) : 0); }
    redPos.needsUpdate = true;

    // Cámara: quieta mientras se apunta; acompaña el remate y vibra con el palo
    // Cámara de TV en la repetición: toma lateral corta desde el costado del arco.
    if (s.tv) {
      if (!enTv) { enTv = true; cam.clearViewOffset(); }
      cam.position.lerp(tvPos, 0.06); cam.lookAt(0, 1, 0.3);
    } else {
      if (enTv) { enTv = false; cam.position.copy(camBase); cam.quaternion.copy(camQuat); cam.setViewOffset(W, H, 0, ALTO_CAM / S - (PISO_Y - H / 2), W, H); }
      const enJugada = s.phase === 'shot' || s.phase === 'result';
      const objetivoZ = enJugada ? DIST - 1.4 : DIST, objetivoX = enJugada ? pelota.position.x * 0.15 : 0;
      cam.position.z += (objetivoZ - cam.position.z) * 0.08; cam.position.x += (objetivoX - cam.position.x) * 0.08;
      const temblor = s.shake ? Math.max(0, 1 - (now - s.shake) / 500) : 0;
      cam.position.y = camBase.y + (temblor ? Math.sin(now / 18) * 0.06 * temblor : 0);
    }
    const hype = Math.max(0, 1 - (now - s.cheer) / 1800);
    tribMat.emissiveIntensity = 0.25 + hype * 0.6 * (0.6 + 0.4 * Math.sin(now / 60));
    animarHinchada(s, now);
    renderer.render(escena, cam);
  }
  function resize(w: number, h: number) { renderer.setSize(w, h, false); }
  return {
    render, resize,
    dispose() { for (const d of disponer) d.dispose(); for (const t of texturas.values()) t.dispose(); renderer.dispose(); },
  };
}

export function soporta3D(): boolean {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
