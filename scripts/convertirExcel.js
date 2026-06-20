//node scripts/convertirExcel.js
//npm run build
//npm run deploy

import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, "Test_tool_app.xlsx");
const outputPath = path.join(__dirname, "../public/preguntas.json");

console.log("📄 Excel:", excelPath);
console.log("📝 JSON:", outputPath);

const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Columnas importantes, índice base 0:
// L  = 11 -> solucion
// M  = 12 -> ID
// AA = 26 -> OposicionesApp
// AB = 27 -> primera oposición marcada con x

const COL_ID = 12;
const COL_OPOSICIONES_APP = 26;
const COL_PRIMERA_OPOSICION = 27;

function limpiarTexto(valor) {
  return String(valor ?? "").trim();
}

function normalizarCodigoOposicion(valor) {
  return limpiarTexto(valor)
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function leerOposicionesDesdeAA(row) {
  const valor = limpiarTexto(row[COL_OPOSICIONES_APP]);

  if (!valor) return [];

  return valor
    .split(",")
    .map(normalizarCodigoOposicion)
    .filter(Boolean);
}

function leerOposicionesDesdeColumnas(row, headers) {
  const oposiciones = [];

  for (let i = COL_PRIMERA_OPOSICION; i < headers.length; i++) {
    const codigo = normalizarCodigoOposicion(headers[i]);
    const marcado = limpiarTexto(row[i]).toLowerCase();

    if (!codigo) continue;

    if (marcado === "x" || marcado === "si" || marcado === "sí" || marcado === "1") {
      oposiciones.push(codigo);
    }
  }

  return oposiciones;
}

const headers = rows[0] || [];

const avisos = {
  sinId: [],
  sinOposicion: [],
  idsDuplicadas: []
};

const idsVistas = new Map();

const preguntas = rows
  .slice(1)
  .map((row, index) => {
    const filaExcel = index + 2;

    const correcta = limpiarTexto(row[11]).toLowerCase();

    const tema = limpiarTexto(row[1]);
    const nombreExamen = limpiarTexto(row[4]);
    const numeroPreguntaExamen = limpiarTexto(row[5]);

    const id = limpiarTexto(row[COL_ID]);

    const oposicionesDesdeAA = leerOposicionesDesdeAA(row);
    const oposicionesDesdeColumnas = leerOposicionesDesdeColumnas(row, headers);

    const oposiciones = oposicionesDesdeAA.length > 0
      ? oposicionesDesdeAA
      : oposicionesDesdeColumnas;

    const oposicionesUnicas = [...new Set(oposiciones)];

    if (!id) {
      avisos.sinId.push(filaExcel);
    }

    if (oposicionesUnicas.length === 0) {
      avisos.sinOposicion.push(filaExcel);
    }

    if (id) {
      if (idsVistas.has(id)) {
        avisos.idsDuplicadas.push({
          id,
          filas: [idsVistas.get(id), filaExcel]
        });
      } else {
        idsVistas.set(id, filaExcel);
      }
    }

    return {
      id,
      oposiciones: oposicionesUnicas,
      categoria: limpiarTexto(row[0]).toLowerCase(),
      tema,
      descripcionTema: row[2],
      nombreExamen,
      numeroPreguntaExamen,
      texto: row[6],
      respuestas: [
        { texto: limpiarTexto(row[7]), correcta: correcta === "a" },
        { texto: limpiarTexto(row[8]), correcta: correcta === "b" },
        { texto: limpiarTexto(row[9]), correcta: correcta === "c" },
        { texto: limpiarTexto(row[10]), correcta: correcta === "d" }
      ].filter(r => r.texto)
    };
  })
  .filter(p => p.id && p.texto);

if (avisos.sinId.length > 0) {
  console.warn("⚠️ Filas sin ID en columna M:", avisos.sinId.join(", "));
}

if (avisos.sinOposicion.length > 0) {
  console.warn("⚠️ Filas sin oposición en AA ni columnas AB+:", avisos.sinOposicion.join(", "));
}

if (avisos.idsDuplicadas.length > 0) {
  console.warn("⚠️ IDs duplicadas detectadas:");
  avisos.idsDuplicadas.forEach(item => {
    console.warn(`   ID ${item.id} en filas ${item.filas.join(" y ")}`);
  });
}


fs.writeFileSync(outputPath, JSON.stringify(preguntas, null, 2), "utf-8");

console.log(`✅ JSON generado con ${preguntas.length} preguntas`);

// ===============================
// 🔁 AUTO-INCREMENTO DE VERSIÓN
// ===============================

// Ruta al package.json
const packageJsonPath = path.join(__dirname, "../package.json");

// Leer package.json
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

// Version actual
const [major, minor, patch] = pkg.version.split(".").map(Number);

// Incrementamos PATCH
const newVersion = `${major}.${minor}.${patch + 1}`;
pkg.version = newVersion;

// Guardamos package.json actualizado
fs.writeFileSync(
  packageJsonPath,
  JSON.stringify(pkg, null, 2),
  "utf-8"
);

console.log(`🔁 Versión de la app actualizada a ${newVersion}`);
