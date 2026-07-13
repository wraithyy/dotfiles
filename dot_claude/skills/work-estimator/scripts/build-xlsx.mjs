#!/usr/bin/env node
/**
 * build-xlsx.mjs — generátor XLSX odhadů
 * Vstup: JSON soubor s daty od fe-estimator agenta
 * Výstup: odhad.xlsx + odhad.md (mirror)
 *
 * Použití:
 *   node build-xlsx.mjs --input /tmp/estimate-data.json --output docs/estimates/[slug]/odhad.xlsx
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

// --- Args ---
const { values: args } = parseArgs({
  options: {
    input: { type: "string" },
    output: { type: "string" },
  },
});

if (!args.input || !args.output) {
  console.error("Použití: node build-xlsx.mjs --input data.json --output odhad.xlsx");
  process.exit(1);
}

const outputPath = resolve(args.output);
const outputDir = dirname(outputPath);
mkdirSync(outputDir, { recursive: true });

// --- Načti data ---
const raw = readFileSync(args.input, "utf-8");
const data = JSON.parse(raw);

// --- Validace MD hodnot ---
function validateMd(value, id) {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0.5) {
    console.warn(`WARN: ${id} má MD=${value} — zaokrouhleno na 0.5`);
    return 0.5;
  }
  const rounded = Math.ceil(n * 2) / 2;
  if (rounded !== n) {
    console.warn(`WARN: ${id} MD=${value} není násobek 0.5 — zaokrouhleno na ${rounded}`);
  }
  return rounded;
}

// --- Pokus o exceljs ---
let ExcelJS;
try {
  const mod = await import("exceljs");
  ExcelJS = mod.default ?? mod;
} catch {
  console.error("exceljs není k dispozici. Instaluj: npm install exceljs");
  console.log("Generuji pouze Markdown výstup...");
  generateMarkdown(data, outputPath.replace(".xlsx", ".md"));
  process.exit(0);
}

const wb = new ExcelJS.Workbook();

// --- Styly ---
const STYLES = {
  header: {
    font: { bold: true, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1565C0" } },
    alignment: { vertical: "middle", horizontal: "center", wrapText: true },
    border: {
      bottom: { style: "medium", color: { argb: "FF0D47A1" } },
    },
  },
  mdCell: {
    alignment: { horizontal: "right" },
    font: { bold: true },
  },
  totalRow: {
    font: { bold: true },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE3F2FD" } },
  },
  pendingCell: {
    font: { color: { argb: "FFFF6F00" }, italic: true },
  },
};

function applyHeader(row) {
  row.eachCell((cell) => {
    Object.assign(cell, { style: STYLES.header });
  });
  row.height = 24;
}

function setColWidths(ws, widths) {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

// --- Souhrn ---
function buildSouhrn(wb, summary) {
  const ws = wb.addWorksheet("Souhrn");
  setColWidths(ws, [35, 10]);

  applyHeader(ws.addRow(["Kategorie", "MD"]));

  const rows = [
    ["Obrazovky (SCR)", summary.scr],
    ["Funkční pož. cross-cutting (FR)", summary.fr],
    ["Nefunkční pož. (NFR)", summary.nfr],
    ["Integrace zákazníka (INT)", summary.int],
    ["Architektura + DevOps (DEV)", summary.dev],
    ["Bugfix / UAT rezerva (15 %)", summary.uat],
    ["Buffer neznámé (10 %)", summary.buffer],
  ];

  for (const [label, md] of rows) {
    const r = ws.addRow([label, md]);
    r.getCell(2).style = STYLES.mdCell;
  }

  const totalRow = ws.addRow(["CELKEM", summary.total]);
  totalRow.eachCell((cell) => Object.assign(cell, { style: STYLES.totalRow }));
  totalRow.getCell(2).style = { ...STYLES.totalRow, alignment: { horizontal: "right" }, font: { bold: true, size: 12 } };
}

// --- Generický list s řádky ---
function buildSheet(wb, name, columns, rows, globalAssumptions) {
  const ws = wb.addWorksheet(name);
  setColWidths(ws, columns.map((c) => c.width ?? 20));

  applyHeader(ws.addRow(columns.map((c) => c.header)));

  for (const row of rows) {
    const r = ws.addRow(columns.map((c) => row[c.key] ?? ""));
    // MD sloupec vpravo + bold
    columns.forEach((c, i) => {
      if (c.isMd) {
        r.getCell(i + 1).style = STYLES.mdCell;
      }
      if (c.isPending && row[c.key]?.includes("PENDING")) {
        r.getCell(i + 1).style = STYLES.pendingCell;
      }
    });
  }

  // Subtotal řádek
  const mdCols = columns.filter((c) => c.isMd);
  if (mdCols.length > 0) {
    const total = rows.reduce((acc, r) => acc + Number(r[mdCols[0].key] ?? 0), 0);
    const totalRow = ws.addRow(
      columns.map((c) => (c.isMd ? total : c === columns[0] ? "Subtotal" : ""))
    );
    totalRow.eachCell((cell) => Object.assign(cell, { style: STYLES.totalRow }));
  }

  // Globální předpoklady pod tabulkou
  if (globalAssumptions?.length) {
    ws.addRow([]); // prázdný řádek
    const headerRow = ws.addRow(["Globální předpoklady (platí pro celý odhad)"]);
    headerRow.getCell(1).style = {
      font: { bold: true, italic: true, color: { argb: "FF1565C0" } },
    };
    ws.mergeCells(headerRow.number, 1, headerRow.number, columns.length);

    for (const a of globalAssumptions) {
      const r = ws.addRow([`${a.id}: ${a.text}`]);
      r.getCell(1).style = { font: { italic: true, color: { argb: "FF555555" } } };
      ws.mergeCells(r.number, 1, r.number, columns.length);
    }
  }
}

// --- Předpoklady ---
function buildPredpoklady(wb, assumptions) {
  const ws = wb.addWorksheet("Předpoklady");
  setColWidths(ws, [10, 60, 20]);

  applyHeader(ws.addRow(["ID", "Předpoklad", "Scope"]));

  for (const a of assumptions) {
    ws.addRow([a.id, a.text, a.scope ?? "globální"]);
  }
}

// --- Sestavení sešitu ---
const { sheets, summary } = data;

buildSouhrn(wb, summary);

const globalAssumptions = sheets.assumptions?.filter((a) => a.scope === "globální") ?? [];

buildSheet(wb, "Obrazovky", [
  { header: "ID", key: "id", width: 10 },
  { header: "Obrazovka", key: "name", width: 25 },
  { header: "Funkčnost", key: "detail", width: 40 },
  { header: "MD", key: "md", width: 8, isMd: true },
  { header: "Předpoklady (unikátní pro řádek)", key: "assumptions", width: 50 },
  { header: "Confidence", key: "confidence", width: 12 },
], sheets.screens ?? [], globalAssumptions);

buildSheet(wb, "Funkční pož.", [
  { header: "ID", key: "id", width: 10 },
  { header: "Požadavek", key: "name", width: 30 },
  { header: "Detail", key: "detail", width: 40 },
  { header: "MD", key: "md", width: 8, isMd: true },
  { header: "Předpoklady (unikátní pro řádek)", key: "assumptions", width: 50 },
], sheets.functionalReqs ?? [], globalAssumptions);

buildSheet(wb, "Nefunkční pož.", [
  { header: "ID", key: "id", width: 10 },
  { header: "Požadavek", key: "name", width: 30 },
  { header: "Detail", key: "detail", width: 40 },
  { header: "MD", key: "md", width: 8, isMd: true },
  { header: "Předpoklady (unikátní pro řádek)", key: "assumptions", width: 50 },
], sheets.nonFunctionalReqs ?? [], globalAssumptions);

buildSheet(wb, "Integrace", [
  { header: "ID", key: "id", width: 10 },
  { header: "Integrace", key: "name", width: 30 },
  { header: "Detail", key: "detail", width: 40 },
  { header: "MD", key: "md", width: 8, isMd: true },
  { header: "Předpoklady (unikátní pro řádek)", key: "assumptions", width: 50 },
], sheets.integrations ?? [], globalAssumptions);

buildSheet(wb, "Architektura+DevOps", [
  { header: "ID", key: "id", width: 10 },
  { header: "Položka", key: "name", width: 30 },
  { header: "Detail", key: "detail", width: 40 },
  { header: "MD", key: "md", width: 8, isMd: true },
], sheets.devops ?? [], globalAssumptions);

buildSheet(wb, "Bugfix/UAT", [
  { header: "ID", key: "id", width: 10 },
  { header: "Položka", key: "name", width: 30 },
  { header: "Výpočet", key: "detail", width: 40 },
  { header: "MD", key: "md", width: 8, isMd: true },
], [sheets.bugfixUAT ?? {}]);

buildPredpoklady(wb, sheets.assumptions ?? []);

await wb.xlsx.writeFile(outputPath);
console.log(`XLSX: ${outputPath}`);

// --- Markdown mirror ---
const mdPath = outputPath.replace(".xlsx", ".md");
generateMarkdown(data, mdPath);

function generateMarkdown(data, outPath) {
  const { projectName, sheets, summary } = data;
  const lines = [];

  lines.push(`# Odhad: ${projectName}`);
  lines.push(`**Datum:** ${new Date().toLocaleDateString("cs-CZ")}`);
  lines.push("");

  // Souhrn
  lines.push("## Souhrn");
  lines.push("");
  lines.push("| Kategorie | MD |");
  lines.push("|-----------|-----|");
  lines.push(`| Obrazovky (SCR) | ${summary.scr} |`);
  lines.push(`| Funkční pož. (FR) | ${summary.fr} |`);
  lines.push(`| Nefunkční pož. (NFR) | ${summary.nfr} |`);
  lines.push(`| Integrace (INT) | ${summary.int} |`);
  lines.push(`| Architektura+DevOps (DEV) | ${summary.dev} |`);
  lines.push(`| Bugfix/UAT (15 %) | ${summary.uat} |`);
  lines.push(`| Buffer (10 %) | ${summary.buffer} |`);
  lines.push(`| **CELKEM** | **${summary.total} MD** |`);
  lines.push("");

  // Obrazovky
  if (sheets.screens?.length) {
    lines.push("## Obrazovky");
    lines.push("");
    lines.push("| ID | Obrazovka | Funkčnost | MD | Předpoklady | Confidence |");
    lines.push("|----|-----------|-----------|----|----|---|");
    for (const s of sheets.screens) {
      lines.push(`| ${s.id} | ${s.name} | ${s.detail} | ${s.md} | ${s.assumptions ?? ""} | ${s.confidence ?? ""} |`);
    }
    lines.push("");
  }

  // FR
  if (sheets.functionalReqs?.length) {
    lines.push("## Funkční pož. (FR)");
    lines.push("");
    lines.push("| ID | Požadavek | Detail | MD | Předpoklady |");
    lines.push("|----|-----------|--------|----|------------|");
    for (const r of sheets.functionalReqs) {
      lines.push(`| ${r.id} | ${r.name} | ${r.detail} | ${r.md} | ${r.assumptions ?? ""} |`);
    }
    lines.push("");
  }

  // Integrace
  if (sheets.integrations?.length) {
    lines.push("## Integrace (INT)");
    lines.push("");
    lines.push("| ID | Integrace | Detail | MD | Předpoklady |");
    lines.push("|----|-----------|--------|----|------------|");
    for (const r of sheets.integrations) {
      lines.push(`| ${r.id} | ${r.name} | ${r.detail} | ${r.md} | ${r.assumptions ?? ""} |`);
    }
    lines.push("");
  }

  // DevOps
  if (sheets.devops?.length) {
    lines.push("## Architektura + DevOps (DEV)");
    lines.push("");
    lines.push("| ID | Položka | Detail | MD |");
    lines.push("|----|---------|--------|----|");
    for (const r of sheets.devops) {
      lines.push(`| ${r.id} | ${r.name} | ${r.detail} | ${r.md} |`);
    }
    lines.push("");
  }

  writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log(`MD: ${outPath}`);
}
