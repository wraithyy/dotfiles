#!/usr/bin/env node
/**
 * parse-input.mjs — parser router pro heterogenní vstupní soubory
 * Podpora: .xlsx/.xls, .docx, .pdf, .md/.txt
 * Výstup: plaintext na stdout
 *
 * Použití:
 *   node parse-input.mjs --file zadani.docx
 *   node parse-input.mjs --file requirements.pdf
 *   node parse-input.mjs --file spec.xlsx
 */

import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    file: { type: "string" },
    mode: { type: "string" }, // přímé zadání: excel | docx | pdf | text
  },
});

if (!args.file) {
  console.error("Použití: node parse-input.mjs --file <cesta>");
  process.exit(1);
}

const filePath = resolve(args.file);
const ext = args.mode ?? extname(filePath).toLowerCase().replace(".", "");

async function parseExcel(path) {
  let ExcelJS;
  try {
    const mod = await import("exceljs");
    ExcelJS = mod.default ?? mod;
  } catch {
    console.error("exceljs není k dispozici. Instaluj: npm install exceljs");
    process.exit(1);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);

  const lines = [];
  wb.eachSheet((ws, id) => {
    lines.push(`=== List: ${ws.name} ===`);
    ws.eachRow((row) => {
      const cells = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        cells.push(cell.text ?? "");
      });
      lines.push(cells.join(" | "));
    });
    lines.push("");
  });

  return lines.join("\n");
}

async function parseDocx(path) {
  let mammoth;
  try {
    const mod = await import("mammoth");
    mammoth = mod.default ?? mod;
  } catch {
    console.error("mammoth není k dispozici. Instaluj: npm install mammoth");
    process.exit(1);
  }

  const result = await mammoth.extractRawText({ path });
  if (result.messages.length > 0) {
    for (const m of result.messages) {
      console.warn(`WARN: ${m.message}`);
    }
  }
  return result.value;
}

async function parsePdf(path) {
  let pdfParse;
  try {
    const mod = await import("pdf-parse/lib/pdf-parse.js");
    pdfParse = mod.default ?? mod;
  } catch {
    try {
      // fallback import
      const mod = await import("pdf-parse");
      pdfParse = mod.default ?? mod;
    } catch {
      console.error("pdf-parse není k dispozici. Instaluj: npm install pdf-parse");
      process.exit(1);
    }
  }

  const buffer = readFileSync(path);
  const data = await pdfParse(buffer);
  return data.text;
}

function parseText(path) {
  return readFileSync(path, "utf-8");
}

// --- Routing ---
let text = "";

switch (ext) {
  case "xlsx":
  case "xls":
    text = await parseExcel(filePath);
    break;
  case "docx":
  case "doc":
    text = await parseDocx(filePath);
    break;
  case "pdf":
    text = await parsePdf(filePath);
    break;
  case "md":
  case "txt":
  case "text":
    text = parseText(filePath);
    break;
  default:
    console.error(`Nepodporovaný formát: ${ext}. Podporováno: xlsx, docx, pdf, md, txt`);
    process.exit(1);
}

process.stdout.write(text);
