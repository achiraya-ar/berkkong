import { invoke, isTauri } from "@tauri-apps/api/core";
import type {
  AppData,
  CatalogItem,
  DepartmentId,
  DepartmentProfile,
  NumberingSettings,
  Person,
  Requisition,
  RequisitionLine,
  Settings,
} from "../types";
import { seedData } from "./seed";

export const DATA_STORAGE_KEY = "berkkong.data.v4";
const LEGACY_DATA_STORAGE_KEYS = ["berkkong.data.v3", "berkkong.data.v2", "berkkong.data.v1"];
const RECOVERY_FLAG_KEY = "berkkong.data.recovered.v1";
const CORRUPT_STORAGE_KEY = "berkkong.data.corrupt";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeDepartment(value: unknown): DepartmentId {
  return value === "medical" ? "medical" : "office";
}

function normalizePerson(value: unknown, fallback: Person): Person {
  const source = asRecord(value);
  return {
    name: asString(source.name, fallback.name),
    position: asString(source.position, fallback.position),
  };
}

function normalizeProfile(
  value: unknown,
  fallback: DepartmentProfile,
  legacy: {
    workUnit: string;
    requester: Person;
    receiver: Person;
    orderer: Person;
    payer: Person;
  },
): DepartmentProfile {
  const source = asRecord(value);
  const systemHeadFallback: Person = {
    name: legacy.orderer.name || legacy.requester.name || fallback.systemHead.name,
    position: "",
  };
  return {
    workUnit: asString(source.workUnit, legacy.workUnit || fallback.workUnit),
    requester: normalizePerson(source.requester, legacy.requester),
    receiver: normalizePerson(source.receiver, legacy.receiver),
    orderer: normalizePerson(source.orderer, legacy.orderer),
    payer: normalizePerson(source.payer, legacy.payer),
    systemHead: normalizePerson(source.systemHead, systemHeadFallback),
  };
}

function normalizeNumbering(
  value: unknown,
  fallback: NumberingSettings,
): NumberingSettings {
  const source = asRecord(value);
  return {
    prefix: asString(source.prefix, fallback.prefix) || fallback.prefix,
    year: Math.round(asNumber(source.year, fallback.year)),
    next: Math.max(1, Math.round(asNumber(source.next, fallback.next))),
  };
}

function normalizeSettings(value: unknown, fallback: Settings): Settings {
  const source = asRecord(value);
  const numbering = asRecord(source.numbering);
  const legacy = {
    workUnit: asString(source.workUnit, fallback.departments.office.workUnit),
    requester: normalizePerson(source.requester, fallback.departments.office.requester),
    receiver: normalizePerson(source.receiver, fallback.departments.office.receiver),
    orderer: normalizePerson(source.orderer, fallback.departments.office.orderer),
    payer: normalizePerson(source.payer, fallback.departments.office.payer),
  };
  const departments = asRecord(source.departments);
  return {
    orgName: asString(source.orgName, fallback.orgName),
    addressedTo: asString(source.addressedTo, fallback.addressedTo),
    noteOfficer: asString(source.noteOfficer, fallback.noteOfficer),
    departments: {
      office: normalizeProfile(departments.office, fallback.departments.office, legacy),
      medical: normalizeProfile(departments.medical, fallback.departments.medical, legacy),
    },
    numbering: {
      office: numbering.office
        ? normalizeNumbering(numbering.office, fallback.numbering.office)
        : normalizeNumbering(numbering, fallback.numbering.office),
      medical: normalizeNumbering(
        numbering.medical,
        fallback.numbering.medical,
      ),
    },
  };
}

function normalizeItem(value: unknown): CatalogItem | null {
  const source = asRecord(value);
  const name = asString(source.name).trim();
  if (!name) return null;
  const now = new Date().toISOString();
  return {
    id: asString(source.id) || crypto.randomUUID(),
    departmentId: normalizeDepartment(source.departmentId),
    code: asString(source.code).trim(),
    name,
    detail: asString(source.detail),
    unit: asString(source.unit, "ชิ้น").trim() || "ชิ้น",
    note: asString(source.note),
    createdAt: asString(source.createdAt, now),
    updatedAt: asString(source.updatedAt, now),
  };
}

function normalizeLine(value: unknown): RequisitionLine | null {
  const source = asRecord(value);
  const name = asString(source.name).trim();
  if (!name) return null;
  return {
    id: asString(source.id) || crypto.randomUUID(),
    itemId: asString(source.itemId),
    code: asString(source.code),
    name,
    detail: asString(source.detail),
    unit: asString(source.unit, "ชิ้น").trim() || "ชิ้น",
    requestQty: Math.max(1, Math.round(asNumber(source.requestQty ?? source.qty, 1))),
    note: asString(source.note),
  };
}

function normalizeItems(value: unknown): CatalogItem[] {
  return asArray(value)
    .map(normalizeItem)
    .filter((item): item is CatalogItem => Boolean(item));
}

function normalizeRequisition(value: unknown): Requisition | null {
  const source = asRecord(value);
  const number = asString(source.number).trim();
  const lines = asArray(source.lines)
    .map(normalizeLine)
    .filter((line): line is RequisitionLine => Boolean(line));
  if (!number || lines.length === 0) return null;
  const fallbackPerson: Person = { name: "", position: "" };
  const rawStatus = asString(source.status, "submitted");
  const status =
    rawStatus === "cancelled"
      ? "cancelled"
      : rawStatus === "draft"
        ? "draft"
        : "submitted";
  const now = new Date().toISOString();
  const requester = normalizePerson(source.requester, fallbackPerson);
  const orderer = normalizePerson(source.orderer, fallbackPerson);
  return {
    id: asString(source.id) || crypto.randomUUID(),
    number,
    departmentId: normalizeDepartment(source.departmentId),
    workUnit: asString(source.workUnit),
    neededDate: asString(source.neededDate),
    note: asString(source.note),
    status,
    lines,
    requester,
    receiver: normalizePerson(source.receiver, fallbackPerson),
    orderer,
    payer: normalizePerson(source.payer, fallbackPerson),
    systemHead: normalizePerson(source.systemHead, {
      name: orderer.name || requester.name,
      position: "",
    }),
    createdAt: asString(source.createdAt, now),
    updatedAt: asString(source.updatedAt, now),
    submittedAt:
      status === "draft"
        ? null
        : source.submittedAt
          ? asString(source.submittedAt)
          : now,
    cancelledAt: source.cancelledAt ? asString(source.cancelledAt) : null,
    cancelReason: asString(source.cancelReason),
    printCount: Math.max(0, Math.round(asNumber(source.printCount))),
    printedAt: source.printedAt ? asString(source.printedAt) : null,
  };
}

function replaceDocumentPrefix(number: string, prefix: string): string {
  const match = /^([A-Za-z0-9]+)-(\d{4})-(\d+)$/.exec(number);
  if (!match) return number;
  return `${prefix}-${match[2]}-${match[3]}`;
}

function documentPrefix(number: string): string | null {
  const match = /^([A-Za-z0-9]+)-(\d{4})-(\d+)$/.exec(number);
  return match ? match[1].toUpperCase() : null;
}

function documentSequence(number: string): number | null {
  const match = /^([A-Za-z0-9]+)-(\d{4})-(\d+)$/.exec(number);
  return match ? Number(match[3]) : null;
}

function migrateLegacyNumbering(
  sourceSchema: number,
  settings: Settings,
  requisitions: Requisition[],
): { settings: Settings; requisitions: Requisition[] } {
  if (sourceSchema >= 4) return { settings, requisitions };

  let officePrefix = settings.numbering.office.prefix;
  let medicalPrefix = settings.numbering.medical.prefix;
  if (officePrefix.toUpperCase() === "BK") officePrefix = "OFF";
  if (medicalPrefix.toUpperCase() === "BK") medicalPrefix = "MED";

  const used = new Set<string>();
  const migrated = requisitions.map((requisition) => {
    let number = requisition.number;
    if (
      requisition.departmentId === "office" &&
      documentPrefix(number) === "BK"
    ) {
      number = replaceDocumentPrefix(number, officePrefix);
    } else if (
      requisition.departmentId === "medical" &&
      documentPrefix(number) === "BK"
    ) {
      number = replaceDocumentPrefix(number, medicalPrefix);
    }
    if (used.has(number)) {
      const match = /^([A-Za-z0-9]+)-(\d{4})-(\d+)$/.exec(number);
      if (match) {
        let sequence = Number(match[3]) + 1;
        let candidate = `${match[1]}-${match[2]}-${String(sequence).padStart(4, "0")}`;
        while (used.has(candidate)) {
          sequence += 1;
          candidate = `${match[1]}-${match[2]}-${String(sequence).padStart(4, "0")}`;
        }
        number = candidate;
      }
    }
    used.add(number);
    return { ...requisition, number };
  });

  const nextFor = (departmentId: DepartmentId, prefix: string) => {
    const maxSequence = migrated
      .filter(
        (entry) =>
          entry.departmentId === departmentId &&
          documentPrefix(entry.number) === prefix.toUpperCase(),
      )
      .reduce((max, entry) => Math.max(max, documentSequence(entry.number) ?? 0), 0);
    return maxSequence + 1;
  };

  return {
    settings: {
      ...settings,
      numbering: {
        office: {
          ...settings.numbering.office,
          prefix: officePrefix,
          next: nextFor("office", officePrefix),
        },
        medical: {
          ...settings.numbering.medical,
          prefix: medicalPrefix,
          next: nextFor("medical", medicalPrefix),
        },
      },
    },
    requisitions: migrated,
  };
}

export function normalizeAppData(raw: unknown): AppData {
  const fallback = seedData();
  const wrapper = asRecord(raw);
  const source = asRecord(wrapper.data ?? raw);
  const items = normalizeItems(source.items);
  const requisitions = asArray(source.requisitions)
    .map(normalizeRequisition)
    .filter((requisition): requisition is Requisition => Boolean(requisition));
  const sourceSchema = Math.round(asNumber(source.schemaVersion, 1));
  const normalizedSettings = normalizeSettings(source.settings, fallback.settings);
  const migrated = migrateLegacyNumbering(
    sourceSchema,
    normalizedSettings,
    requisitions,
  );

  return {
    schemaVersion: 4,
    settings: migrated.settings,
    items,
    requisitions: migrated.requisitions,
  };
}

function readStoredData(key: string): AppData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return normalizeAppData(JSON.parse(raw));
  } catch (error) {
    console.error(`BerkKong: cannot load data from ${key}`, error);
    try {
      const raw = localStorage.getItem(key);
      if (raw) localStorage.setItem(CORRUPT_STORAGE_KEY, raw);
    } catch {
      // ignore
    }
    return null;
  }
}

function hasUserData(data: AppData | null): boolean {
  if (!data) return false;
  if (data.items.length > 0 || data.requisitions.length > 0) return true;
  const defaults = seedData().settings;
  return JSON.stringify(data.settings) !== JSON.stringify(defaults);
}

export function loadData(): AppData {
  const current = readStoredData(DATA_STORAGE_KEY);
  const recoveryDone = localStorage.getItem(RECOVERY_FLAG_KEY) === "1";

  if (current && (recoveryDone || hasUserData(current))) {
    try {
      localStorage.setItem(RECOVERY_FLAG_KEY, "1");
    } catch {
      // ignore
    }
    return current;
  }

  // One-time recovery from the previous local snapshot if the current data
  // was cleared by accident. After this first recovery, "clear all" remains
  // clear on subsequent launches.
  for (const key of LEGACY_DATA_STORAGE_KEYS) {
    const legacy = readStoredData(key);
    if (hasUserData(legacy)) {
      try {
        localStorage.setItem(RECOVERY_FLAG_KEY, "1");
      } catch {
        // ignore
      }
      return legacy as AppData;
    }
  }

  try {
    localStorage.setItem(RECOVERY_FLAG_KEY, "1");
  } catch {
    // ignore
  }
  return current ?? seedData();
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("BerkKong: cannot save data", error);
  }
}

export type SettingsSection = "organization" | "office" | "medical" | "items";

export const SETTINGS_SECTIONS: SettingsSection[] = [
  "organization",
  "office",
  "medical",
  "items",
];

function normalizeBackupSections(value: unknown): SettingsSection[] | null {
  if (!Array.isArray(value)) return null;
  const selected = new Set(
    value.filter(
      (entry): entry is SettingsSection =>
        entry === "organization" ||
        entry === "office" ||
        entry === "medical" ||
        entry === "items",
    ),
  );
  const sections = SETTINGS_SECTIONS.filter((section) => selected.has(section));
  return sections.length > 0 ? sections : null;
}

export function exportSettingsBackup(
  settings: Settings,
  sections: SettingsSection[] = SETTINGS_SECTIONS,
  items: CatalogItem[] = [],
): string {
  const selected = new Set(sections);
  const payload: Record<string, unknown> = {};

  if (selected.has("organization")) {
    payload.orgName = settings.orgName;
    payload.addressedTo = settings.addressedTo;
    payload.noteOfficer = settings.noteOfficer;
  }

  const departments: Record<string, unknown> = {};
  if (selected.has("office")) {
    departments.office = settings.departments.office;
  }
  if (selected.has("medical")) {
    departments.medical = settings.departments.medical;
  }
  if (Object.keys(departments).length > 0) {
    payload.departments = departments;
  }

  const numbering: Record<string, unknown> = {};
  if (selected.has("office")) {
    numbering.office = settings.numbering.office;
  }
  if (selected.has("medical")) {
    numbering.medical = settings.numbering.medical;
  }
  if (Object.keys(numbering).length > 0) {
    payload.numbering = numbering;
  }

  return JSON.stringify(
    {
      app: "BerkKong",
      kind: "settings",
      schemaVersion: 4,
      exportedAt: new Date().toISOString(),
      sections: SETTINGS_SECTIONS.filter((section) => selected.has(section)),
      settings: payload,
      ...(selected.has("items") ? { items } : {}),
    },
    null,
    2,
  );
}

export function parseSettingsBackup(
  raw: unknown,
): { settings: Settings; sections: SettingsSection[]; items: CatalogItem[] } | null {
  const wrapper = asRecord(raw);
  const data = asRecord(wrapper.data);
  const candidate =
    wrapper.settings ??
    data.settings ??
    (wrapper.departments || wrapper.numbering || wrapper.orgName ? raw : null);

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const rawItems = wrapper.items ?? data.items;
  const hasItems = Array.isArray(rawItems);
  const rawSections = wrapper.sections ?? data.sections;
  let sections: SettingsSection[] = [
    "organization",
    "office",
    "medical",
  ];
  if (rawSections !== undefined) {
    const parsedSections = normalizeBackupSections(rawSections);
    if (!parsedSections) return null;
    sections = parsedSections;
  } else if (hasItems) {
    sections = [...sections, "items"];
  }
  if (sections.includes("items") && !hasItems) {
    return null;
  }

  return {
    settings: normalizeSettings(candidate, seedData().settings),
    sections,
    items: hasItems ? normalizeItems(rawItems) : [],
  };
}

export function exportBackup(data: AppData): string {
  return JSON.stringify(
    {
      app: "BerkKong",
      schemaVersion: 4,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2,
  );
}

export async function downloadTextFile(
  fileName: string,
  content: string,
  mime = "application/json;charset=utf-8",
): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("save_text_file", { defaultName: fileName, content });
      return;
    } catch (error) {
      console.error("BerkKong: native save failed, falling back to download", error);
    }
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsText(file, "utf-8");
  });
}

export const LAST_USER_STORAGE_KEY = "berkkong.last-user.v1";

export function loadLastUser(): Person | null {
  try {
    const raw = localStorage.getItem(LAST_USER_STORAGE_KEY);
    if (!raw) return null;
    const source = asRecord(JSON.parse(raw));
    const name = asString(source.name).trim();
    if (!name) return null;
    return { name, position: asString(source.position) };
  } catch {
    return null;
  }
}

export function saveLastUser(user: Person | null): void {
  try {
    if (!user) {
      localStorage.removeItem(LAST_USER_STORAGE_KEY);
      return;
    }
    localStorage.setItem(LAST_USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}
