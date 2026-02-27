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

const preguntas = rows.slice(1).map(row => {
  const correcta = String(row[11] ?? "").toLowerCase().trim();

  const tema = String(row[1] ?? "").trim();
  const nombreExamen = String(row[4] ?? "").trim();
  const numeroPreguntaExamen = String(row[5] ?? "").trim();

  // ID estable único
  const id = `${tema}_${nombreExamen}_${numeroPreguntaExamen}`
    .toLowerCase()
    .replace(/\s+/g, "_");

  return {
    id,
    categoria: String(row[0] ?? "").toLowerCase(),
    tema,
    descripcionTema: row[2],
    nombreExamen,
    numeroPreguntaExamen,
    texto: row[6],
    respuestas: [
      { texto: row[7], correcta: correcta === "a" },
      { texto: row[8], correcta: correcta === "b" },
      { texto: row[9], correcta: correcta === "c" },
      { texto: row[10], correcta: correcta === "d" }
    ]
  };
});


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
