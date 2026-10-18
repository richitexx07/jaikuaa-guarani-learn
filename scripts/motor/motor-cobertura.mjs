#!/usr/bin/env node
/**
 * Cobertura del motor JAIKUAA sobre el corpus publicado de la plataforma.
 *
 * Manda cada palabra o frase del CSV al endpoint /analyze del motor (el mismo que usa Studio)
 * y mide cuántas reconoce. No escribe ni corrige guaraní: solo pregunta y cuenta.
 *
 * Uso (Node 18 o más nuevo, sin instalar nada):
 *   node motor-cobertura.mjs --url http://localhost:8000 --csv corpus_publicado_jaikuaa_2026-10-17.csv
 *   node motor-cobertura.mjs --url https://motor.ejemplo --key TU_CLAVE
 *
 * Opciones:
 *   --url   Dirección del motor, sin /analyze (por defecto http://localhost:8000)
 *   --key   Valor de X-API-Key (por defecto la variable JAIKUAA_API_KEY o "jaikuaa-development-key")
 *   --csv   Archivo con columnas guarani,castellano (por defecto el del corpus publicado)
 *   --out   Archivo de resultados (por defecto cobertura_motor_<fecha>.csv)
 */
import { readFileSync, writeFileSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, all) => (cur.startsWith("--") ? [...acc, [cur.slice(2), all[i + 1]]] : acc), []),
);
const base = (args.url || "http://localhost:8000").replace(/\/$/, "");
const key = args.key || process.env.JAIKUAA_API_KEY || "jaikuaa-development-key";
const csvPath = args.csv || "corpus_publicado_jaikuaa_2026-10-17.csv";
const today = new Date().toISOString().slice(0, 10);
const outPath = args.out || `cobertura_motor_${today}.csv`;

function parseCsv(text) {
  const rows = [];
  for (const line of text.replace(/^﻿/, "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quoted) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') quoted = false;
        else cur += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { cells.push(cur); cur = ""; }
      else cur += c;
    }
    cells.push(cur);
    rows.push(cells);
  }
  const [header, ...body] = rows;
  const gi = header.indexOf("guarani"), ei = header.indexOf("castellano");
  return body.map((r) => ({ gn: r[gi], es: r[ei] }));
}

const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

async function analyze(text) {
  const started = Date.now();
  const res = await fetch(`${base}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": key },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(8000),
  });
  const ms = Date.now() - started;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const tokens = body?.data?.tokens ?? body?.tokens ?? [];
  return { ms, tokens: Array.isArray(tokens) ? tokens : [] };
}

const items = parseCsv(readFileSync(csvPath, "utf8"));
console.log(`Motor: ${base}/analyze · ${items.length} entradas de ${csvPath}\n`);

const results = [];
for (const item of items) {
  try {
    const { ms, tokens } = await analyze(item.gn);
    const total = tokens.length;
    const known = tokens.filter((t) => t?.analysis_status === "known").length;
    const warnings = tokens.flatMap((t) => (Array.isArray(t?.linguistic_check?.warnings) ? t.linguistic_check.warnings : []));
    const status = total > 0 && known === total ? "reconocida" : known > 0 ? "parcial" : "no reconocida";
    results.push({ ...item, status, known, total, ms, warnings: warnings.join(" | "), error: "" });
    process.stdout.write(status === "reconocida" ? "." : status === "parcial" ? "~" : "x");
  } catch (e) {
    results.push({ ...item, status: "error", known: 0, total: 0, ms: 0, warnings: "", error: String(e.message || e) });
    process.stdout.write("!");
  }
}

const count = (s) => results.filter((r) => r.status === s).length;
const ok = count("reconocida"), partial = count("parcial"), none = count("no reconocida"), errors = count("error");
const answered = results.filter((r) => r.status !== "error");
const avgMs = answered.length ? Math.round(answered.reduce((a, r) => a + r.ms, 0) / answered.length) : 0;
const pct = (n) => (items.length ? ((n / items.length) * 100).toFixed(1) : "0.0");

console.log(`\n\nReconocidas:    ${ok} (${pct(ok)} %)`);
console.log(`Parciales:      ${partial} (${pct(partial)} %)`);
console.log(`No reconocidas: ${none} (${pct(none)} %)`);
console.log(`Errores:        ${errors}`);
console.log(`Tiempo medio:   ${avgMs} ms por consulta`);

writeFileSync(
  outPath,
  "﻿" +
    ["guarani,castellano,estado,tokens_reconocidos,tokens_totales,ms,avisos_del_motor,error"]
      .concat(results.map((r) => [r.gn, r.es, r.status, r.known, r.total, r.ms, r.warnings, r.error].map(esc).join(",")))
      .join("\n"),
);
console.log(`\nDetalle por palabra: ${outPath}`);
