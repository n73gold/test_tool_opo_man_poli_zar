import XLSX from "xlsx";
import fs from "fs";

const workbook = XLSX.readFile("Test_tool_app.xlsx"); // nombre exacto del excel
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const preguntas = rows.slice(1).map(row => {
  const correcta = String(row[11]).toLowerCase().trim();

  return {
    categoria: String(row[0]).toLowerCase(),
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

fs.writeFileSync(
  "preguntas.json",
  JSON.stringify(preguntas, null, 2),
  "utf-8"
);

console.log(`✅ JSON generado con ${preguntas.length} preguntas`);