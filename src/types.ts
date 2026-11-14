export type DepartmentId = "office" | "medical";

export type RequisitionStatus = "draft" | "submitted" | "cancelled";

export interface Person {
  name: string;
  position: string;
}

export interface DepartmentProfile {
  workUnit: string;
  requester: Person;
  receiver: Person;
  orderer: Person;
  payer: Person;
  systemHead: Person;
}

export interface NumberingSettings {
  prefix: string;
  year: number;
  next: number;
}

export interface Settings {
  orgName: string;
  addressedTo: string;
  noteOfficer: string;
  departments: Record<DepartmentId, DepartmentProfile>;
  numbering: Record<DepartmentId, NumberingSettings>;
}

export interface CatalogItem {
  id: string;
  departmentId: DepartmentId;
  code: string;
  name: string;
  detail: string;
  unit: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequisitionLine {
  id: string;
  itemId: string;
  code: string;
  name: string;
  detail: string;
  unit: string;
  requestQty: number;
  note: string;
}

export interface Requisition {
  id: string;
  number: string;
  departmentId: DepartmentId;
  workUnit: string;
  neededDate: string;
  note: string;
  status: RequisitionStatus;
  lines: RequisitionLine[];
  requester: Person;
  receiver: Person;
  orderer: Person;
  payer: Person;
  systemHead: Person;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string;
  printCount: number;
  printedAt: string | null;
}

export interface AppData {
  schemaVersion: 4;
  settings: Settings;
  items: CatalogItem[];
  requisitions: Requisition[];
}

export interface DepartmentMeta {
  id: DepartmentId;
  pageTitle: string;
  formTitle: string;
  formSubtitle: string;
  shortLabel: string;
  description: string;
  catalogLabel: string;
  codePrefix: string;
  accent: "yellow" | "rose";
}

export const DEPARTMENTS: Record<DepartmentId, DepartmentMeta> = {
  office: {
    id: "office",
    pageTitle: "ใบเบิกพัสดุ",
    formTitle: "ใบเบิกพัสดุ",
    formSubtitle: "ของใช้สำนักงาน",
    shortLabel: "พัสดุสำนักงาน",
    description:
      "กระดาษ เครื่องเขียน ของใช้สำนักงาน และวัสดุสิ้นเปลืองสำหรับงานธุรการ",
    catalogLabel: "รายการของเบิก",
    codePrefix: "OFF",
    accent: "yellow",
  },
  medical: {
    id: "medical",
    pageTitle: "ใบเบิกเวชภัณฑ์ที่มิใช่ยา",
    formTitle: "ใบเบิกพัสดุ",
    formSubtitle: "เวชภัณฑ์ที่มิใช่ยา",
    shortLabel: "เวชภัณฑ์ที่มิใช่ยา",
    description:
      "ถุงมือ ผ้าก๊อซ หน้ากากอนามัย และเวชภัณฑ์ทางการแพทย์ที่มิใช่ยา",
    catalogLabel: "รายการเวชภัณฑ์",
    codePrefix: "MED",
    accent: "rose",
  },
};

export const STATUS_META: Record<
  RequisitionStatus,
  { label: string; tone: "neutral" | "success" | "danger" }
> = {
  draft: { label: "ฉบับร่าง", tone: "neutral" },
  submitted: { label: "ส่งเบิกแล้ว", tone: "success" },
  cancelled: { label: "ยกเลิก", tone: "danger" },
};

export interface RequisitionInput {
  draftId?: string;
  status: "draft" | "submitted";
  departmentId: DepartmentId;
  workUnit: string;
  neededDate: string;
  note: string;
  lines: RequisitionLine[];
  requester: Person;
  receiver: Person;
  orderer: Person;
  payer: Person;
  systemHead: Person;
}
