//Para volver a version 1 (stable):
//git checkout stable
//     *opcional* git branch (comprueba que estamos en gh-pages)
//node scripts/convertirExcel.js
//git add .
//git commit -m "Actualizar preguntas"
//npm run build
//npm run deploy

//Para volver a version 2 (desarrollo) y modificar codigo:
//git checkout v2-evolucion

//Para chequear la version 2 en el movil
//git checkout v2-evolucion
//npm run dev -- --host (Ctrl - C para cerrar el host)
//abrir la IP en el navegador del movil (mismo Wifi)


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

  return {
    categoria: String(row[0] ?? "").toLowerCase(),
    tema: row[1],
    descripcionTema: row[2],
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
