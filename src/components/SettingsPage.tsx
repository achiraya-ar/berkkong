import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  Boxes,
  Building2,
  Database,
  Download,
  FileText,
  PenLine,
  RotateCcw,
  Save,
  ShieldCheck,
  Stethoscope,
  Upload,
  UserRound,
} from "lucide-react";
import { useAppStore } from "../store/AppStore";
import type {
  DepartmentId,
  DepartmentProfile,
  NumberingSettings,
  Person,
  Settings,
} from "../types";
import { DEPARTMENTS } from "../types";
import { formatQty, nextDocumentNumber } from "../lib/format";
import {
  exportSettingsBackup,
  parseSettingsBackup,
  downloadTextFile,
  readTextFile,
  isTauriApp,
  pickImportFile,
  type SettingsSection,
} from "../lib/storage";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import {
  DepartmentBadge,
  Field,
  PageHeader,
} from "./ui";
import { ItemCatalogPanel } from "./ItemCatalogPanel";

type SettingsTab =
  | "organization"
  | "items"
  | "office"
  | "medical"
  | "backup";

const TABS: {
  id: SettingsTab;
  label: string;
  icon: typeof Building2;
}[] = [
  { id: "organization", label: "ข้อมูลโรงพยาบาล", icon: Building2 },
  { id: "items", label: "รายการของเบิก", icon: Boxes },
  { id: "office", label: "ใบเบิกพัสดุ", icon: FileText },
  { id: "medical", label: "ใบเบิกเวชภัณฑ์", icon: Stethoscope },
  { id: "backup", label: "สำรองข้อมูล", icon: Database },
];

const SETTINGS_SECTION_OPTIONS: {
  id: SettingsSection;
  label: string;
  description: string;
}[] = [
  {
    id: "organization",
    label: "ข้อมูลโรงพยาบาล",
    description: "ชื่อโรงพยาบาล, เรียนถึง, ชื่อเจ้าหน้าที่",
  },
  {
    id: "office",
    label: "ใบเบิกพัสดุ",
    description: "ผู้ลงนาม, งาน/หน่วยงาน, เลขที่ใบเบิก",
  },
  {
    id: "medical",
    label: "ใบเบิกเวชภัณฑ์",
    description: "ผู้ลงนาม, งาน/หน่วยงาน, เลขที่ใบเบิก",
  },
  {
    id: "items",
    label: "รายการของเบิก",
    description: "รายการพัสดุและเวชภัณฑ์ทั้งหมด",
  },
];

function clonePerson(person: Person): Person {
  return { ...person };
}

function cloneProfile(profile: DepartmentProfile): DepartmentProfile {
  return {
    ...profile,
    requester: clonePerson(profile.requester),
    receiver: clonePerson(profile.receiver),
    orderer: clonePerson(profile.orderer),
    payer: clonePerson(profile.payer),
    systemHead: clonePerson(profile.systemHead),
  };
}

function cloneSettings(settings: Settings): Settings {
  return {
    ...settings,
    departments: {
      office: cloneProfile(settings.departments.office),
      medical: cloneProfile(settings.departments.medical),
    },
    numbering: {
      office: { ...settings.numbering.office },
      medical: { ...settings.numbering.medical },
    },
  };
}

function cleanPrefix(value: string): string {
  return (
    value
      .trim()
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6) || "BK"
  );
}

export function SettingsPage() {
  const {
    settings,
    items,
    requisitions,
    updateSettings,
    replaceItems,
  } = useAppStore();
  const toast = useToast();
  const [draft, setDraft] = useState<Settings>(() => cloneSettings(settings));
  const [activeTab, setActiveTab] = useState<SettingsTab>("organization");
  const [exportSections, setExportSections] = useState<SettingsSection[]>([
    "organization",
    "office",
    "medical",
    "items",
  ]);
  const [importSections, setImportSections] = useState<SettingsSection[]>([]);
  const [importPreview, setImportPreview] = useState<{
    fileName: string;
    raw: unknown;
    sections: SettingsSection[];
    itemCount: number;
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const officePreview = useMemo(
    () =>
      nextDocumentNumber(
        draft.numbering.office.prefix,
        draft.numbering.office.year,
        draft.numbering.office.next,
        requisitions,
        "office",
      ),
    [draft.numbering.office, requisitions],
  );
  const medicalPreview = useMemo(
    () =>
      nextDocumentNumber(
        draft.numbering.medical.prefix,
        draft.numbering.medical.year,
        draft.numbering.medical.next,
        requisitions,
        "medical",
      ),
    [draft.numbering.medical, requisitions],
  );

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
  };

  const updateProfile = (
    departmentId: DepartmentId,
    patch: Partial<DepartmentProfile>,
  ) => {
    setDraft((previous) => ({
      ...previous,
      departments: {
        ...previous.departments,
        [departmentId]: {
          ...previous.departments[departmentId],
          ...patch,
        },
      },
    }));
  };

  const updatePerson = (
    departmentId: DepartmentId,
    key: keyof DepartmentProfile,
    field: "name" | "position",
    value: string,
  ) => {
    setDraft((previous) => {
      const profile = previous.departments[departmentId];
      return {
        ...previous,
        departments: {
          ...previous.departments,
          [departmentId]: {
            ...profile,
            [key]: {
              ...(profile[key] as Person),
              [field]: value,
            },
          },
        },
      };
    });
  };

  const updateNumbering = (
    departmentId: DepartmentId,
    patch: Partial<NumberingSettings>,
  ) => {
    setDraft((previous) => ({
      ...previous,
      numbering: {
        ...previous.numbering,
        [departmentId]: {
          ...previous.numbering[departmentId],
          ...patch,
        },
      },
    }));
  };

  const handleSave = () => {
    if (!draft.orgName.trim()) {
      toast.error("กรุณากรอกชื่อโรงพยาบาล / องค์กร");
      return;
    }
    for (const departmentId of ["office", "medical"] as DepartmentId[]) {
      if (!draft.departments[departmentId].requester.name.trim()) {
        toast.error(
          `กรุณากรอกชื่อผู้เบิกของ${DEPARTMENTS[departmentId].pageTitle}`,
        );
        return;
      }
    }

    const numbering = {
      office: { ...draft.numbering.office },
      medical: { ...draft.numbering.medical },
    };
    for (const departmentId of ["office", "medical"] as DepartmentId[]) {
      const prefix = cleanPrefix(numbering[departmentId].prefix);
      const number = nextDocumentNumber(
        prefix,
        numbering[departmentId].year,
        numbering[departmentId].next,
        requisitions,
        departmentId,
      );
      numbering[departmentId] = {
        prefix,
        year: numbering[departmentId].year,
        next: Number(number.split("-").pop()) || 1,
      };
    }

    const saved: Settings = {
      ...cloneSettings(draft),
      orgName: draft.orgName.trim(),
      addressedTo: draft.addressedTo.trim(),
      noteOfficer: draft.noteOfficer.trim(),
      numbering,
    };
    updateSettings(saved);
    setDraft(cloneSettings(saved));
    toast.success("บันทึกการตั้งค่าแล้ว");
  };

  const handleResetDraft = () => {
    setDraft(cloneSettings(settings));
    toast.info("ยกเลิกการแก้ไขแล้ว");
  };

  const handleExportBackup = async () => {
    if (exportSections.length === 0) {
      toast.error("เลือกข้อมูลที่จะส่งออกอย่างน้อย 1 ส่วน");
      return;
    }
    const saved = await downloadTextFile(
      `berkkong-settings-${new Date().toISOString().slice(0, 10)}.json`,
      exportSettingsBackup(settings, exportSections, items),
    );
    if (saved) {
      toast.success("ส่งออกไฟล์การตั้งค่าแล้ว");
    }
  };

  const processImportText = (text: string, fileName: string) => {
    try {
      const raw = JSON.parse(text.replace(/^\uFEFF/, ""));
      const imported = parseSettingsBackup(raw);
      if (!imported) {
        toast.error("ไฟล์นี้ไม่ใช่ไฟล์สำรองการตั้งค่าของ BerkKong");
        return;
      }
      setImportPreview({
        fileName,
        raw,
        sections: imported.sections,
        itemCount: imported.items.length,
      });
      setImportSections(imported.sections);
    } catch {
      toast.error("ไฟล์สำรองไม่ถูกต้องหรืออ่านไม่ได้");
    }
  };

  const handleImportFile = async (file: File | null) => {
    if (!file) return;
    try {
      processImportText(await readTextFile(file), file.name);
    } catch {
      toast.error("ไฟล์สำรองไม่ถูกต้องหรืออ่านไม่ได้");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handlePickImport = async () => {
    if (!isTauriApp()) {
      importInputRef.current?.click();
      return;
    }

    try {
      const picked = await pickImportFile();
      if (picked) processImportText(picked.content, picked.name);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "เปิดไฟล์นำเข้าไม่สำเร็จ",
      );
    }
  };

  const confirmImport = () => {
    if (!importPreview) return;
    const imported = parseSettingsBackup(importPreview.raw);
    if (!imported) {
      toast.error("ไฟล์นี้ไม่ใช่ไฟล์สำรองการตั้งค่าของ BerkKong");
      return;
    }
    const selected = importSections.filter((section) =>
      imported.sections.includes(section),
    );
    if (selected.length === 0) {
      toast.error("เลือกข้อมูลที่จะนำเข้าอย่างน้อย 1 ส่วน");
      return;
    }

    const hasSettingsSelection = selected.some(
      (section) => section !== "items",
    );
    if (hasSettingsSelection) {
      const merged = cloneSettings(settings);
      if (selected.includes("organization")) {
        merged.orgName = imported.settings.orgName;
        merged.addressedTo = imported.settings.addressedTo;
        merged.noteOfficer = imported.settings.noteOfficer;
      }
      if (selected.includes("office")) {
        merged.departments.office = imported.settings.departments.office;
        merged.numbering.office = imported.settings.numbering.office;
      }
      if (selected.includes("medical")) {
        merged.departments.medical = imported.settings.departments.medical;
        merged.numbering.medical = imported.settings.numbering.medical;
      }
      updateSettings(merged);
      setDraft(cloneSettings(merged));
    }
    if (selected.includes("items")) {
      replaceItems(imported.items);
    }

    const importedParts: string[] = [];
    if (hasSettingsSelection) importedParts.push("การตั้งค่า");
    if (selected.includes("items")) {
      importedParts.push(
        `รายการของเบิก ${formatQty(imported.items.length)} รายการ`,
      );
    }
    const firstSelected = SETTINGS_SECTION_OPTIONS.find((section) =>
      selected.includes(section.id),
    );
    if (firstSelected) {
      setActiveTab(firstSelected.id);
    }
    toast.success(`นำเข้า${importedParts.join(" และ")}แล้ว`);
    setImportPreview(null);
  };

  return (
    <div className="page settings-page">
      <PageHeader
        eyebrow="ปรับแต่งระบบ"
        title="ตั้งค่า"
        subtitle="กำหนดข้อมูลโรงพยาบาล ผู้ลงนาม และเลขที่ใบเบิกแยกตามประเภท"
        actions={
          <div className="settings-actions">
            {dirty && <span className="unsaved-chip">ยังไม่บันทึก</span>}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleResetDraft}
              disabled={!dirty}
            >
              <RotateCcw size={16} />
              ยกเลิก
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSave}
              disabled={!dirty}
            >
              <Save size={16} />
              บันทึกการตั้งค่า
            </button>
          </div>
        }
      />

      <div className="settings-layout">
        <nav className="settings-nav card" aria-label="หมวดการตั้งค่า">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`settings-nav__item ${
                  activeTab === tab.id ? "is-active" : ""
                } ${tab.id === "office" ? "settings-nav__item--office" : ""} ${
                  tab.id === "medical" ? "settings-nav__item--medical" : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={17} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <div className="settings-nav__foot">
            <ShieldCheck size={16} />
            <p>ข้อมูลเก็บไว้ในเครื่องนี้ ไม่ส่งออกไปภายนอก</p>
          </div>
        </nav>

        <div className="settings-content">
          {activeTab === "organization" && (
            <section className="settings-panel card">
              <PanelHead
                icon={<Building2 size={20} />}
                title="ข้อมูลโรงพยาบาล"
                description="ข้อมูลทั่วไปที่แสดงบนเอกสาร"
              />
              <div className="settings-panel__body">
                <div className="form-grid form-grid--2">
                  <Field
                    label="ชื่อโรงพยาบาล / องค์กร"
                    required
                    className="form-grid__span2"
                  >
                    <input
                      className="text-input"
                      value={draft.orgName}
                      onChange={(event) => update("orgName", event.target.value)}
                      placeholder="เช่น โรงพยาบาลสระโบสถ์"
                    />
                  </Field>
                  <Field
                    label="เรียนถึง"
                    hint="แสดงในบรรทัด “ถึง ...” ของใบเบิกมาตรฐาน"
                    className="form-grid__span2"
                  >
                    <input
                      className="text-input"
                      value={draft.addressedTo}
                      onChange={(event) =>
                        update("addressedTo", event.target.value)
                      }
                      placeholder="เช่น หัวหน้าหน่วยงานพัสดุ"
                    />
                  </Field>
                  <Field
                    label="ชื่อเจ้าหน้าที่ในหัวตารางหมายเหตุ"
                    hint="เว้นว่างได้หากไม่ต้องการแสดงชื่อ"
                    className="form-grid__span2"
                  >
                    <input
                      className="text-input"
                      value={draft.noteOfficer}
                      onChange={(event) =>
                        update("noteOfficer", event.target.value)
                      }
                      placeholder="จนท.พัสดุ"
                    />
                  </Field>
                </div>
              </div>
            </section>
          )}

          {activeTab === "items" && (
            <section className="settings-panel card">
              <PanelHead
                icon={<Boxes size={20} />}
                title="รายการของเบิก"
                description="สลับหมวดรายการพัสดุ / รายการเวชภัณฑ์ แล้วเพิ่มรายการในหมวดที่เลือก"
              />
              <div className="settings-panel__body settings-panel__body--flush">
                <ItemCatalogPanel />
              </div>
            </section>
          )}

          {(activeTab === "office" || activeTab === "medical") && (
            <DepartmentPanel
              departmentId={activeTab}
              profile={draft.departments[activeTab]}
              numbering={draft.numbering[activeTab]}
              numberPreview={
                activeTab === "office" ? officePreview : medicalPreview
              }
              updateProfile={updateProfile}
              updatePerson={updatePerson}
              updateNumbering={updateNumbering}
            />
          )}

          {activeTab === "backup" && (
            <section className="settings-panel card">
              <PanelHead
                icon={<Database size={20} />}
                title="สำรองข้อมูล"
                description="สำรองและนำเข้าการตั้งค่าและรายการของเบิก"
              />
              <div className="settings-panel__body">
                <div className="backup-sections">
                  <div className="backup-sections__head">
                    <div>
                      <strong>ข้อมูลที่จะส่งออก</strong>
                      <span>เลือกเฉพาะส่วนที่ต้องการสำรอง</span>
                    </div>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() =>
                        setExportSections(
                          exportSections.length === SETTINGS_SECTION_OPTIONS.length
                            ? []
                            : SETTINGS_SECTION_OPTIONS.map((section) => section.id),
                        )
                      }
                    >
                      {exportSections.length === SETTINGS_SECTION_OPTIONS.length
                        ? "ยกเลิกทั้งหมด"
                        : "เลือกทั้งหมด"}
                    </button>
                  </div>
                  <div className="backup-sections__grid">
                    {SETTINGS_SECTION_OPTIONS.map((section) => {
                      const checked = exportSections.includes(section.id);
                      return (
                        <label
                          key={section.id}
                          className={`backup-check ${checked ? "is-checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setExportSections((previous) =>
                                checked
                                  ? previous.filter((id) => id !== section.id)
                                  : [...previous, section.id],
                              )
                            }
                          />
                          <span>
                            <strong>{section.label}</strong>
                            <small>{section.description}</small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="backup-grid">
                  <button
                    type="button"
                    className="backup-action"
                    onClick={handleExportBackup}
                    disabled={exportSections.length === 0}
                  >
                    <span className="backup-action__icon">
                      <Download size={20} />
                    </span>
                    <span>
                      <strong>ส่งออกการตั้งค่า</strong>
                      <small>
                        เลือกแล้ว {exportSections.length} จาก{" "}
                        {SETTINGS_SECTION_OPTIONS.length} ส่วน
                      </small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="backup-action"
                    onClick={() => void handlePickImport()}
                  >
                    <span className="backup-action__icon">
                      <Upload size={20} />
                    </span>
                    <span>
                      <strong>นำเข้าการตั้งค่า</strong>
                      <small>เลือกส่วนข้อมูลได้ในขั้นตอนถัดไป</small>
                    </span>
                  </button>
                </div>

                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="visually-hidden"
                  onChange={(event) =>
                    handleImportFile(event.target.files?.[0] ?? null)
                  }
                />
                <p className="form-note">
                  แนะนำให้ส่งออกการตั้งค่าก่อนนำเข้าไฟล์ใหม่ทุกครั้ง
                </p>
              </div>
            </section>
          )}

        </div>
      </div>

      <Modal
        open={Boolean(importPreview)}
        onClose={() => setImportPreview(null)}
        title="นำเข้าการตั้งค่า?"
        subtitle={importPreview?.fileName ?? ""}
        icon={<Upload size={21} />}
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setImportPreview(null)}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={confirmImport}
              disabled={importSections.length === 0}
            >
              <Upload size={16} />
              นำเข้าการตั้งค่า
            </button>
          </>
        }
      >
        <div className="backup-sections backup-sections--modal">
          <div className="backup-sections__head">
            <div>
              <strong>ข้อมูลที่จะนำเข้า</strong>
              <span>เลือกเฉพาะส่วนที่ต้องการนำไปใช้</span>
            </div>
          </div>
          <div className="backup-sections__grid">
            {SETTINGS_SECTION_OPTIONS.filter((section) =>
              importPreview?.sections.includes(section.id),
            ).map((section) => {
              const checked = importSections.includes(section.id);
              return (
                <label
                  key={section.id}
                  className={`backup-check ${checked ? "is-checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setImportSections((previous) =>
                        checked
                          ? previous.filter((id) => id !== section.id)
                          : [...previous, section.id],
                      )
                    }
                  />
                  <span>
                    <strong>{section.label}</strong>
                    <small>
                      {section.id === "items" && importPreview
                        ? `${formatQty(importPreview.itemCount)} รายการ`
                        : section.description}
                    </small>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
        <p className="form-note form-note--warn">
          การนำเข้าจะเปลี่ยนเฉพาะส่วนที่เลือก
          {importPreview?.sections.includes("items") &&
            " · หากเลือกรายการของเบิก รายการในคลังปัจจุบันจะถูกแทนที่ทั้งหมด"}
          {" "}ประวัติการเบิกจะไม่ถูกแก้ไข
        </p>
      </Modal>

    </div>
  );
}

function PanelHead({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <header className="settings-panel__head">
      <span className="settings-section__icon">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </header>
  );
}

function DepartmentPanel({
  departmentId,
  profile,
  numbering,
  numberPreview,
  updateProfile,
  updatePerson,
  updateNumbering,
}: {
  departmentId: DepartmentId;
  profile: DepartmentProfile;
  numbering: NumberingSettings;
  numberPreview: string;
  updateProfile: (departmentId: DepartmentId, patch: Partial<DepartmentProfile>) => void;
  updatePerson: (
    departmentId: DepartmentId,
    key: keyof DepartmentProfile,
    field: "name" | "position",
    value: string,
  ) => void;
  updateNumbering: (
    departmentId: DepartmentId,
    patch: Partial<NumberingSettings>,
  ) => void;
}) {
  const department = DEPARTMENTS[departmentId];
  const Icon = departmentId === "medical" ? Stethoscope : FileText;
  return (
    <section className={`settings-panel settings-panel--${departmentId} card`}>
      <header className="settings-panel__head">
        <span className="settings-section__icon">
          <Icon size={20} />
        </span>
        <div>
          <h2>{department.pageTitle}</h2>
          <p>ตั้งค่างาน ผู้ลงนาม และเลขที่ใบเบิกแยกจากอีกประเภท</p>
        </div>
        <DepartmentBadge departmentId={departmentId} subtle />
      </header>

      <div className="settings-panel__body">
        <Field
          label="งาน / หน่วยงานเริ่มต้น"
          hint="ใช้เติมในช่อง “งาน” ของใบเบิกใหม่"
        >
          <input
            className="text-input"
            value={profile.workUnit}
            onChange={(event) =>
              updateProfile(departmentId, { workUnit: event.target.value })
            }
            placeholder="เช่น พัสดุ, ผู้ป่วยนอก"
          />
        </Field>

        <div className="settings-block">
          <div className="settings-subhead">
            <span>ผู้ลงนาม</span>
            <small>กำหนดชื่อและตำแหน่งสำหรับประเภทนี้</small>
          </div>
          <div className="signature-cards">
            <SignatureCard
              icon={<UserRound size={17} />}
              title="ผู้เบิก"
              description="ใช้ทั้งใบเบิกของระบบและใบเบิกมาตรฐาน"
              name={profile.requester.name}
              position={profile.requester.position}
              onName={(value) =>
                updatePerson(departmentId, "requester", "name", value)
              }
              onPosition={(value) =>
                updatePerson(departmentId, "requester", "position", value)
              }
            />
            <SignatureCard
              icon={<UserRound size={17} />}
              title="หัวหน้างาน"
              description="ลงชื่อในใบเบิกของระบบ"
              name={profile.systemHead.name}
              showPosition={false}
              onName={(value) =>
                updatePerson(departmentId, "systemHead", "name", value)
              }
              onPosition={() => undefined}
            />
            <SignatureCard
              icon={<UserRound size={17} />}
              title="ผู้รับ"
              description="ลงชื่อในใบเบิกมาตรฐาน"
              name={profile.receiver.name}
              position={profile.receiver.position}
              onName={(value) =>
                updatePerson(departmentId, "receiver", "name", value)
              }
              onPosition={(value) =>
                updatePerson(departmentId, "receiver", "position", value)
              }
            />
            <SignatureCard
              icon={<PenLine size={17} />}
              title="ผู้สั่งจ่าย"
              description="ลงชื่อในใบเบิกมาตรฐาน"
              name={profile.orderer.name}
              position={profile.orderer.position}
              onName={(value) =>
                updatePerson(departmentId, "orderer", "name", value)
              }
              onPosition={(value) =>
                updatePerson(departmentId, "orderer", "position", value)
              }
            />
            <SignatureCard
              icon={<UserRound size={17} />}
              title="ผู้จ่าย"
              description="ลงชื่อในใบเบิกมาตรฐาน"
              name={profile.payer.name}
              position={profile.payer.position}
              onName={(value) =>
                updatePerson(departmentId, "payer", "name", value)
              }
              onPosition={(value) =>
                updatePerson(departmentId, "payer", "position", value)
              }
            />
          </div>
        </div>

        <div className="settings-block">
          <div className="settings-subhead">
            <span>เลขที่ใบเบิก</span>
            <small>รันแยกจากอีกประเภท</small>
          </div>
          <div className="numbering-layout">
            <div className="form-grid form-grid--3">
              <Field label="คำนำหน้า">
                <input
                  className="text-input"
                  value={numbering.prefix}
                  maxLength={6}
                  onChange={(event) =>
                    updateNumbering(departmentId, {
                      prefix: event.target.value.toUpperCase(),
                    })
                  }
                  placeholder={departmentId === "office" ? "OFF" : "MED"}
                />
              </Field>
              <Field label="ปี พ.ศ.">
                <input
                  className="text-input"
                  type="number"
                  min={2500}
                  max={2700}
                  value={numbering.year}
                  onChange={(event) =>
                    updateNumbering(departmentId, {
                      year: Number(event.target.value) || numbering.year,
                    })
                  }
                />
              </Field>
              <Field label="ลำดับถัดไป">
                <input
                  className="text-input"
                  type="number"
                  min={1}
                  value={numbering.next}
                  onChange={(event) =>
                    updateNumbering(departmentId, {
                      next: Math.max(1, Number(event.target.value) || 1),
                    })
                  }
                />
              </Field>
            </div>
            <div className="number-preview">
              <span>ตัวอย่างเลขที่ถัดไป</span>
              <strong>{numberPreview}</strong>
            </div>
          </div>
          <p className="form-note">
            แนะนำให้ใช้คำนำหน้าแตกต่างกัน เช่น OFF สำหรับพัสดุ และ MED
            สำหรับเวชภัณฑ์ เพื่อป้องกันเลขซ้ำกันระหว่างสองประเภท
          </p>
        </div>
      </div>
    </section>
  );
}

function SignatureCard({
  icon,
  title,
  description,
  name,
  position = "",
  showPosition = true,
  onName,
  onPosition,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  name: string;
  position?: string;
  showPosition?: boolean;
  onName: (value: string) => void;
  onPosition: (value: string) => void;
}) {
  return (
    <div className="signature-card">
      <div className="signature-card__head">
        <span className="signature-card__icon">{icon}</span>
        <div>
          <strong>{title}</strong>
          <small>{description}</small>
        </div>
      </div>
      <Field label="ชื่อ-นามสกุล">
        <input
          className="text-input"
          value={name}
          onChange={(event) => onName(event.target.value)}
          placeholder="เว้นว่างได้"
        />
      </Field>
      {showPosition && (
        <Field label="ตำแหน่ง">
          <input
            className="text-input"
            value={position}
            onChange={(event) => onPosition(event.target.value)}
            placeholder="เช่น หัวหน้าหน่วยพัสดุ"
          />
        </Field>
      )}
    </div>
  );
}
