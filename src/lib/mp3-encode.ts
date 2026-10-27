// Convierte cualquier audio que el navegador pueda decodificar a MP3 mono 64 kbps,
// el formato del bucket de grabaciones humanas. Solo se usa en el navegador.

export async function toMp3Base64(blob: Blob): Promise<string> {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const buf = await blob.arrayBuffer();
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  let audio: AudioBuffer;
  try {
    audio = await ctx.decodeAudioData(buf.slice(0));
  } finally {
    void ctx.close();
  }
  // Mezcla a mono
  const len = audio.length;
  const mono = new Float32Array(len);
  for (let c = 0; c < audio.numberOfChannels; c++) {
    const d = audio.getChannelData(c);
    for (let i = 0; i < len; i++) mono[i] += d[i] / audio.numberOfChannels;
  }
  // Volumen parejo desde la grabación: si quedó baja, se sube (con limitador para no saturar).
  const { amplify, gainFor } = await import("./audio-louder");
  const g = gainFor(mono);
  const level = g > 1 ? amplify(mono, g) : mono;
  const samples = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, level[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const enc = new Mp3Encoder(1, audio.sampleRate, 64);
  const parts: Uint8Array[] = [];
  const block = 1152;
  for (let i = 0; i < samples.length; i += block) {
    const out = enc.encodeBuffer(samples.subarray(i, i + block));
    if (out.length) parts.push(new Uint8Array(out));
  }
  const end = enc.flush();
  if (end.length) parts.push(new Uint8Array(end));
  const total = parts.reduce((n, p) => n + p.length, 0);
  const all = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    all.set(p, o);
    o += p.length;
  }
  return bytesToBase64(all);
}

export async function fileToBase64(file: Blob): Promise<string> {
  return bytesToBase64(new Uint8Array(await file.arrayBuffer()));
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}
