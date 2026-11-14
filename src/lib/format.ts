import type { DepartmentId, Requisition } from "../types";

const numberFormatter = new Intl.NumberFormat("th-TH", {
  maximumFractionDigits: 0,
});

export function formatQty(value: number | string | null | undefined): string {
  const number = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(number)) return "0";
  return numberFormatter.format(number);
}

export function parseQty(value: string, fallback = 0): number {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
}

export function buildDocumentNumber(
  prefix: string,
  year: number,
  next: number,
): string {
  const cleanPrefix =
    prefix
      .trim()
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6) || "BK";
  return `${cleanPrefix}-${year}-${String(Math.max(1, next)).padStart(4, "0")}`;
}

export function nextDocumentNumber(
  prefix: string,
  year: number,
  start: number,
  requisitions: Requisition[],
  departmentId?: DepartmentId,
): string {
  const existing = new Set(
    requisitions
      .filter(
        (requisition) =>
          !departmentId || requisition.departmentId === departmentId,
      )
      .map((requisition) => requisition.number),
  );
  let next = Math.max(1, start);
  let candidate = buildDocumentNumber(prefix, year, next);
  while (existing.has(candidate)) {
    next += 1;
    candidate = buildDocumentNumber(prefix, year, next);
  }
  return candidate;
}

export function nextNumberValue(
  prefix: string,
  year: number,
  start: number,
  requisitions: Requisition[],
  departmentId?: DepartmentId,
): number {
  const number = nextDocumentNumber(
    prefix,
    year,
    start,
    requisitions,
    departmentId,
  );
  const parts = number.split("-");
  return Number(parts[parts.length - 1]) || 1;
}

export function initials(name: string): string {
  const clean = name.replace(/^(นางสาว|นาง|นาย|ดร\.|ว่าที่ร้อยตรี|ร้อยตรี)\s*/u, "").trim();
  if (!clean) return "BK";
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`;
}

export function firstName(name: string): string {
  const clean = name.replace(/^(นางสาว|นาง|นาย|ดร\.|ว่าที่ร้อยตรี|ร้อยตรี)\s*/u, "").trim();
  return clean.split(/\s+/)[0] || name;
}

export function displayName(name: string): string {
  return name.trim() || "ไม่ระบุ";
}

export function displayPosition(position: string): string {
  return position.trim() || "—";
}

export function documentCountLabel(count: number): string {
  return `${formatQty(count)} รายการ`;
}

export function pluralUnit(count: number, unit: string): string {
  return `${formatQty(count)} ${unit}`;
}
