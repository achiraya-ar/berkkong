import type {
  AppData,
  CatalogItem,
  DepartmentId,
  DepartmentProfile,
} from "../types";
import { currentBuddhistYear } from "./date";

function item(
  departmentId: DepartmentId,
  code: string,
  name: string,
  detail: string,
  unit: string,
  note = "",
): CatalogItem {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    departmentId,
    code,
    name,
    detail,
    unit,
    note,
    createdAt: now,
    updatedAt: now,
  };
}

function profile(
  workUnit: string,
  requesterName: string,
  systemHeadName: string,
): DepartmentProfile {
  return {
    workUnit,
    requester: {
      name: requesterName,
      position: "เจ้าหน้าที่พัสดุ",
    },
    receiver: { name: "", position: "" },
    orderer: {
      name: "นางสุนันทา กลิ่นเทศ",
      position: "หัวหน้าหน่วยพัสดุ",
    },
    payer: {
      name: "นางสาววันวิสา พุกซื่อ",
      position: "เจ้าหน้าที่พัสดุ",
    },
    systemHead: {
      name: systemHeadName,
      position: "",
    },
  };
}

export function seedItems(): CatalogItem[] {
  return [
    item("office", "OFF-0001", "กระดาษ A4 80 แกรม", "ใช้ในงานธุรการ", "รีม"),
    item("office", "OFF-0002", "ปากกาลูกลื่นสีน้ำเงิน", "12 ด้าม / กล่อง", "กล่อง"),
    item("office", "OFF-0003", "แฟ้มเอกสารตราช้าง", "แพ็ค 10 แฟ้ม", "แพ็ค"),
    item("office", "OFF-0004", "ลวดเย็บกระดาษ No.10", "กล่องเล็ก", "กล่อง"),
    item("office", "OFF-0005", "เทปกาวใส 1 นิ้ว", "ความยาว 30 หลา", "ม้วน"),
    item("office", "OFF-0006", "ซองจดหมายขาว A4", "แพ็ค 20 ซอง", "แพ็ค"),
    item("office", "OFF-0007", "คลิปหนีบกระดาษ 32 มม.", "กล่อง 12 ตัว", "กล่อง"),
    item("office", "OFF-0008", "ปากกาลบคำผิด", "หัวปากกาแบบแปรง", "อัน"),
    item("office", "OFF-0009", "กระดาษการ์ดสีขาว", "100 แผ่น / แพ็ค", "แพ็ค"),
    item("medical", "MED-0001", "ถุงมือยางไม่มีแป้ง Size M", "กล่องละ 100 ชิ้น", "กล่อง"),
    item("medical", "MED-0002", "ถุงมือยางไม่มีแป้ง Size L", "กล่องละ 100 ชิ้น", "กล่อง"),
    item("medical", "MED-0003", "ผ้าก๊อซ 4x4 นิ้ว", "แพ็ค 10 แผ่น", "แพ็ค"),
    item("medical", "MED-0004", "แอลกอฮอล์ 70% 450 มล.", "ขวดพร้อมฝา", "ขวด"),
    item("medical", "MED-0005", "หน้ากากอนามัยทางการแพทย์", "กล่อง 50 ชิ้น", "กล่อง"),
    item("medical", "MED-0006", "สำลีชุบแอลกอฮอล์", "กล่อง 100 แผ่น", "กล่อง"),
    item("medical", "MED-0007", "เทปปิดแผล Micropore 1 นิ้ว", "ม้วน", "ม้วน"),
    item("medical", "MED-0008", "ถุงมือตรวจ Vinyl Size S", "กล่อง 100 ชิ้น", "กล่อง"),
    item("medical", "MED-0009", "สายรัดแขน (Tourniquet)", "แบบใช้ซ้ำ", "เส้น"),
    item("medical", "MED-0010", "สติกเกอร์ปิดแผลกันน้ำ", "แพ็ค 50 แผ่น", "แพ็ค"),
  ];
}

export function seedData(): AppData {
  const defaultName = "นางสาวอชิรญาณ์ รมยศิริไทย";
  return {
    schemaVersion: 4,
    settings: {
      orgName: "โรงพยาบาลสระโบสถ์",
      addressedTo: "หัวหน้าหน่วยงานพัสดุ",
      noteOfficer: "จนท.พัสดุ",
      departments: {
        office: profile("พัสดุ", defaultName, defaultName),
        medical: profile("ผู้ป่วยนอก", defaultName, defaultName),
      },
      numbering: {
        office: {
          prefix: "OFF",
          year: currentBuddhistYear(),
          next: 1,
        },
        medical: {
          prefix: "MED",
          year: currentBuddhistYear(),
          next: 1,
        },
      },
    },
    items: seedItems(),
    requisitions: [],
  };
}
