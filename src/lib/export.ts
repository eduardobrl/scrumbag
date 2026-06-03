import * as XLSX from "xlsx";
import type { ReportColumn, ReportRow } from "@/lib/reports";

type SheetInput = {
  name: string;
  columns: ReportColumn[];
  rows: ReportRow[];
};

function cellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function escapeCsvCell(value: unknown): string {
  const text = cellValue(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function csvFromRows(columns: ReportColumn[], rows: ReportRow[]): string {
  const header = columns.map((column) => escapeCsvCell(column.label)).join(",");
  const body = rows.map((row) => columns.map((column) => escapeCsvCell(row[column.key])).join(","));
  return `\uFEFF${[header, ...body].join("\r\n")}`;
}

export function excelFromSheets(sheets: SheetInput[]): Buffer {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const rows = [
      sheet.columns.map((column) => column.label),
      ...sheet.rows.map((row) => sheet.columns.map((column) => row[column.key] ?? ""))
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  }

  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}
