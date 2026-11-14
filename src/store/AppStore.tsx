import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  CatalogItem,
  DepartmentId,
  Person,
  Requisition,
  RequisitionInput,
  RequisitionLine,
  Settings,
} from "../types";
import { currentBuddhistYear } from "../lib/date";
import { nextDocumentNumber, nextNumberValue } from "../lib/format";
import {
  loadData,
  normalizeAppData,
  saveData,
} from "../lib/storage";
import { seedData } from "../lib/seed";

export interface ItemInput {
  id?: string;
  departmentId: DepartmentId;
  code?: string;
  name: string;
  detail: string;
  unit: string;
  note: string;
}

interface ActionResult {
  ok: boolean;
  message?: string;
  requisition?: Requisition;
}

interface StoreValue {
  data: AppData;
  settings: Settings;
  items: CatalogItem[];
  requisitions: Requisition[];
  updateSettings: (settings: Settings) => void;
  saveItem: (input: ItemInput) => CatalogItem;
  deleteItem: (id: string) => ActionResult;
  replaceItems: (items: CatalogItem[]) => void;
  renumberItems: (departmentId: DepartmentId) => number;
  saveRequisition: (input: RequisitionInput) => Requisition;
  cancelRequisition: (id: string, reason: string) => ActionResult;
  deleteDraft: (id: string) => void;
  deleteRequisition: (id: string) => void;
  markPrinted: (id: string) => void;
  importData: (raw: unknown) => { ok: boolean; message: string };
  resetToSeed: () => void;
  clearAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function nextItemCode(items: CatalogItem[], departmentId: DepartmentId): string {
  const prefix = departmentId === "medical" ? "MED" : "OFF";
  const used = new Set(
    items
      .filter((item) => item.departmentId === departmentId)
      .map((item) => {
        const match = new RegExp(`^${prefix}-(\\d+)$`, "i").exec(item.code);
        return match ? Number(match[1]) : 0;
      })
      .filter((value) => value > 0),
  );
  let next = 1;
  while (used.has(next)) next += 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

function renumberDepartmentItems(
  items: CatalogItem[],
  departmentId: DepartmentId,
): { items: CatalogItem[]; changed: number } {
  const prefix = departmentId === "medical" ? "MED" : "OFF";
  const departmentItems = items
    .filter((item) => item.departmentId === departmentId)
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code, "th"));
  const codeMap = new Map<string, string>();
  departmentItems.forEach((item, index) => {
    codeMap.set(item.id, `${prefix}-${String(index + 1).padStart(4, "0")}`);
  });

  const now = new Date().toISOString();
  let changed = 0;
  const nextItems = items.map((item) => {
    if (item.departmentId !== departmentId) return item;
    const code = codeMap.get(item.id);
    if (!code || code === item.code) return item;
    changed += 1;
    return { ...item, code, updatedAt: now };
  });

  return { items: nextItems, changed };
}

function defaultEmptyData(base: Settings): AppData {
  return {
    schemaVersion: 4,
    settings: {
      ...base,
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
    items: [],
    requisitions: [],
  };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const latestData = useRef(data);
  latestData.current = data;

  useEffect(() => {
    saveData(data);
  }, [data]);

  const updateSettings = useCallback((settings: Settings) => {
    setData((previous) => ({ ...previous, settings }));
  }, []);

  const saveItem = useCallback((input: ItemInput): CatalogItem => {
    const previous = latestData.current;
    const now = new Date().toISOString();
    const current = previous.items.find((item) => item.id === input.id);
    const code =
      input.code?.trim() ||
      current?.code ||
      nextItemCode(previous.items, input.departmentId);
    const item: CatalogItem = {
      id: current?.id ?? crypto.randomUUID(),
      departmentId: input.departmentId,
      code,
      name: input.name.trim(),
      detail: input.detail.trim(),
      unit: input.unit.trim(),
      note: input.note.trim(),
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    const items = current
      ? previous.items.map((entry) => (entry.id === item.id ? item : entry))
      : [item, ...previous.items];
    setData({ ...previous, items });
    return item;
  }, []);

  const deleteItem = useCallback((id: string): ActionResult => {
    const current = latestData.current;
    const item = current.items.find((entry) => entry.id === id);
    if (!item) return { ok: false, message: "ไม่พบรายการที่ต้องการลบ" };
    const remaining = current.items.filter((entry) => entry.id !== id);
    const renumbered = renumberDepartmentItems(remaining, item.departmentId);
    setData((previous) => ({
      ...previous,
      items: renumbered.items,
    }));
    return { ok: true };
  }, []);

  const replaceItems = useCallback((nextItems: CatalogItem[]) => {
    setData((previous) => ({
      ...previous,
      items: nextItems.map((item) => ({ ...item })),
    }));
  }, []);

  const renumberItems = useCallback((departmentId: DepartmentId): number => {
    const current = latestData.current;
    const renumbered = renumberDepartmentItems(current.items, departmentId);
    if (renumbered.changed > 0) {
      setData((previous) => ({ ...previous, items: renumbered.items }));
    }
    return renumbered.changed;
  }, []);

  const saveRequisition = useCallback((input: RequisitionInput): Requisition => {
    const current = latestData.current;
    const now = new Date().toISOString();
    const existing = input.draftId
      ? current.requisitions.find(
          (entry) => entry.id === input.draftId && entry.status === "draft",
        )
      : undefined;
    let settings = current.settings;
    let number = existing?.number ?? "";

    if (!existing) {
      const numbering = current.settings.numbering[input.departmentId];
      number = nextDocumentNumber(
        numbering.prefix,
        numbering.year,
        numbering.next,
        current.requisitions,
        input.departmentId,
      );
      const next =
        nextNumberValue(
          numbering.prefix,
          numbering.year,
          numbering.next,
          current.requisitions,
          input.departmentId,
        ) + 1;
      settings = {
        ...current.settings,
        numbering: {
          ...current.settings.numbering,
          [input.departmentId]: { ...numbering, next },
        },
      };
    }

    const requisition: Requisition = {
      id: existing?.id ?? crypto.randomUUID(),
      number,
      departmentId: input.departmentId,
      workUnit: input.workUnit.trim(),
      neededDate: input.neededDate,
      note: input.note.trim(),
      status: input.status,
      lines: input.lines.map((line) => ({ ...line })),
      requester: { ...input.requester },
      receiver: { ...input.receiver },
      orderer: { ...input.orderer },
      payer: { ...input.payer },
      systemHead: { ...input.systemHead },
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      submittedAt:
        input.status === "submitted"
          ? (existing?.submittedAt ?? now)
          : null,
      cancelledAt: existing?.cancelledAt ?? null,
      cancelReason: existing?.cancelReason ?? "",
      printCount: existing?.printCount ?? 0,
      printedAt: existing?.printedAt ?? null,
    };

    setData({
      ...current,
      settings,
      requisitions: existing
        ? current.requisitions.map((entry) =>
            entry.id === requisition.id ? requisition : entry,
          )
        : [requisition, ...current.requisitions],
    });
    return requisition;
  }, []);

  const cancelRequisition = useCallback(
    (id: string, reason: string): ActionResult => {
      const current = latestData.current;
      const requisition = current.requisitions.find((entry) => entry.id === id);
      if (!requisition) return { ok: false, message: "ไม่พบใบเบิก" };
      if (requisition.status === "cancelled") {
        return { ok: false, message: "ใบเบิกนี้ถูกยกเลิกแล้ว" };
      }
      if (!reason.trim()) {
        return { ok: false, message: "กรุณาระบุเหตุผลการยกเลิก" };
      }
      const now = new Date().toISOString();
      setData((previous) => ({
        ...previous,
        requisitions: previous.requisitions.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: "cancelled",
                cancelledAt: now,
                cancelReason: reason.trim(),
                updatedAt: now,
              }
            : entry,
        ),
      }));
      return { ok: true };
    },
    [],
  );

  const deleteDraft = useCallback((id: string) => {
    setData((previous) => ({
      ...previous,
      requisitions: previous.requisitions.filter(
        (entry) => !(entry.id === id && entry.status === "draft"),
      ),
    }));
  }, []);

  const deleteRequisition = useCallback((id: string) => {
    setData((previous) => ({
      ...previous,
      requisitions: previous.requisitions.filter((entry) => entry.id !== id),
    }));
  }, []);

  const markPrinted = useCallback((id: string) => {
    const now = new Date().toISOString();
    setData((previous) => ({
      ...previous,
      requisitions: previous.requisitions.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              printCount: entry.printCount + 1,
              printedAt: now,
              updatedAt: now,
            }
          : entry,
      ),
    }));
  }, []);

  const importData = useCallback((raw: unknown) => {
    try {
      const normalized = normalizeAppData(raw);
      const payload = raw as { app?: string } | null;
      if (payload && typeof payload === "object" && payload.app && payload.app !== "BerkKong") {
        return { ok: false, message: "ไฟล์สำรองไม่ใช่ข้อมูลของ BerkKong" };
      }
      setData(normalized);
      return {
        ok: true,
        message: `นำเข้าข้อมูลแล้ว ${normalized.items.length} รายการ และใบเบิก ${normalized.requisitions.length} ฉบับ`,
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "นำเข้าข้อมูลไม่สำเร็จ",
      };
    }
  }, []);

  const resetToSeed = useCallback(() => {
    setData(seedData());
  }, []);

  const clearAll = useCallback(() => {
    const base = seedData();
    setData(defaultEmptyData(base.settings));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      settings: data.settings,
      items: data.items,
      requisitions: data.requisitions,
      updateSettings,
      saveItem,
      deleteItem,
      replaceItems,
      renumberItems,
      saveRequisition,
      cancelRequisition,
      deleteDraft,
      deleteRequisition,
      markPrinted,
      importData,
      resetToSeed,
      clearAll,
    }),
    [
      data,
      updateSettings,
      saveItem,
      deleteItem,
      replaceItems,
      renumberItems,
      saveRequisition,
      cancelRequisition,
      deleteDraft,
      deleteRequisition,
      markPrinted,
      importData,
      resetToSeed,
      clearAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useAppStore must be used inside AppStoreProvider");
  }
  return context;
}

export function makeEmptyLine(item: CatalogItem, quantity = 1): RequisitionLine {
  return {
    id: crypto.randomUUID(),
    itemId: item.id,
    code: item.code,
    name: item.name,
    detail: item.detail,
    unit: item.unit,
    requestQty: Math.max(0, Math.round(quantity)),
    note: "",
  };
}

export function makePreviewRequisition(
  departmentId: DepartmentId,
  settings: Settings,
  lines: RequisitionLine[],
  fields: {
    number: string;
    workUnit: string;
    neededDate: string;
    note: string;
    requester: Person;
    receiver: Person;
    orderer: Person;
    payer: Person;
    systemHead: Person;
    status?: Requisition["status"];
  },
): Requisition {
  const now = new Date().toISOString();
  return {
    id: "preview",
    number: fields.number,
    departmentId,
    workUnit: fields.workUnit,
    neededDate: fields.neededDate,
    note: fields.note,
    status: fields.status ?? "submitted",
    lines,
    requester: fields.requester,
    receiver: fields.receiver,
    orderer: fields.orderer,
    payer: fields.payer,
    systemHead: fields.systemHead,
    createdAt: now,
    updatedAt: now,
    submittedAt: fields.status === "draft" ? null : now,
    cancelledAt: null,
    cancelReason: "",
    printCount: 0,
    printedAt: null,
  };
}
