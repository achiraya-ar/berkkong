import { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  ListPlus,
  Printer,
  Save,
  Stethoscope,
} from "lucide-react";
import {
  useAppStore,
  makePreviewRequisition,
} from "../store/AppStore";
import type {
  DepartmentId,
  RequisitionInput,
  RequisitionLine,
} from "../types";
import { DEPARTMENTS } from "../types";
import { formatThaiDate } from "../lib/date";
import { nextDocumentNumber } from "../lib/format";
import type { AppView } from "../navigation";
import { ItemPickerModal } from "./ItemPickerModal";
import { OfficialDocument, SystemDocument } from "./documents";
import { useToast } from "./Toast";
import {
  Field,
  SegmentedTabs,
  StatusBadge,
} from "./ui";

type PreviewForm = "system" | "official";

export function RequisitionPage({
  departmentId: initialDepartmentId,
  draftId,
  onNavigate,
}: {
  departmentId: DepartmentId;
  draftId?: string;
  onNavigate: (view: AppView) => void;
}) {
  const { settings, items, requisitions, saveRequisition } = useAppStore();
  const toast = useToast();
  const draft = draftId
    ? requisitions.find(
        (entry) => entry.id === draftId && entry.status === "draft",
      )
    : undefined;
  const departmentId = draft?.departmentId ?? initialDepartmentId;
  const profile = settings.departments[departmentId];

  const [neededDate, setNeededDate] = useState(draft?.neededDate ?? "");
  const [lines, setLines] = useState<RequisitionLine[]>(
    draft ? draft.lines.map((line) => ({ ...line })) : [],
  );
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(
    draft?.id ?? null,
  );
  const departmentNumbering = settings.numbering[departmentId];
  const [currentNumber, setCurrentNumber] = useState(
    draft?.number ??
      nextDocumentNumber(
        departmentNumbering.prefix,
        departmentNumbering.year,
        departmentNumbering.next,
        requisitions,
        departmentId,
      ),
  );
  const [previewForm, setPreviewForm] = useState<PreviewForm>("system");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const departmentItems = useMemo(
    () =>
      items
        .filter((item) => item.departmentId === departmentId)
        .sort((a, b) => a.code.localeCompare(b.code, "th")),
    [items, departmentId],
  );
  const previewRequisition = makePreviewRequisition(
    departmentId,
    settings,
    lines,
    {
      number: currentNumber,
      workUnit: profile.workUnit,
      neededDate,
      note: "",
      requester: profile.requester,
      receiver: profile.receiver,
      orderer: profile.orderer,
      payer: profile.payer,
      systemHead: profile.systemHead,
      status: "draft",
    },
  );

  const buildInput = (status: "draft" | "submitted"): RequisitionInput | null => {
    if (lines.length === 0) {
      toast.error("กรุณาเลือกรายการอย่างน้อย 1 รายการ");
      return null;
    }
    if (!neededDate) {
      toast.error("กรุณาเลือกวันที่ต้องการใช้");
      return null;
    }
    if (
      status === "submitted" &&
      lines.some((line) => line.requestQty <= 0)
    ) {
      toast.error("กรุณาระบุจำนวนให้ครบทุกรายการก่อนส่งเบิก");
      return null;
    }
    return {
      draftId: currentDraftId ?? undefined,
      status,
      departmentId,
      workUnit: profile.workUnit,
      neededDate,
      note: "",
      lines,
      requester: profile.requester,
      receiver: profile.receiver,
      orderer: profile.orderer,
      payer: profile.payer,
      systemHead: profile.systemHead,
    };
  };

  const handleSaveDraft = () => {
    if (busy) return;
    const input = buildInput("draft");
    if (!input) return;
    setBusy(true);
    const saved = saveRequisition(input);
    setCurrentDraftId(saved.id);
    setCurrentNumber(saved.number);
    toast.success(`บันทึกฉบับร่าง ${saved.number} แล้ว`, "กลับมาแก้ไขได้ภายหลัง");
    setBusy(false);
  };

  const handleSubmit = () => {
    if (busy) return;
    const input = buildInput("submitted");
    if (!input) return;
    setBusy(true);
    const saved = saveRequisition(input);
    toast.success(`ส่งเบิก ${saved.number} แล้ว`, "กำลังเปิดหน้าต่างพิมพ์");
    onNavigate({
      name: "print",
      id: saved.id,
      auto: true,
      returnTo: { name: "history-detail", id: saved.id },
    });
    setBusy(false);
  };

  return (
    <div
      className={`page requisition-workspace requisition-workspace--${departmentId}`}
    >
      <section className="workspace-command card">
        <div className="workspace-command__top">
          <span className={`workspace-mode workspace-mode--${departmentId}`}>
            {departmentId === "medical" ? (
              <Stethoscope size={17} />
            ) : (
              <Building2 size={17} />
            )}
            <strong>{DEPARTMENTS[departmentId].pageTitle}</strong>
          </span>

          <div className="workspace-command__actions">
            <button
              type="button"
              className="btn btn--soft"
              onClick={() => setPickerOpen(true)}
            >
              <ListPlus size={16} />
              เลือกรายการ
              {lines.length > 0 && (
                <span className="workspace-command__count">{lines.length}</span>
              )}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleSaveDraft}
              disabled={lines.length === 0 || busy}
            >
              <Save size={16} />
              บันทึกฉบับร่าง
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSubmit}
              disabled={lines.length === 0 || busy}
            >
              <Printer size={17} />
              บันทึกส่งเบิกของ
            </button>
          </div>
        </div>

        <div className="workspace-command__fields">
          <Field
            label="ต้องการใช้ภายในวันที่"
            required
            hint={neededDate ? formatThaiDate(neededDate, "full") : "เลือกวันที่ต้องการใช้"}
          >
            <div className="input-with-icon">
              <CalendarDays size={17} />
              <input
                type="date"
                value={neededDate}
                onChange={(event) => setNeededDate(event.target.value)}
              />
            </div>
          </Field>
        </div>
      </section>

      <section className="workspace-stage card">
        <div className="workspace-stage__bar">
          <SegmentedTabs
            value={previewForm}
            onChange={setPreviewForm}
            options={[
              { value: "system", label: "ใบเบิกของระบบ" },
              { value: "official", label: "ใบเบิกมาตรฐาน" },
            ]}
          />
          {currentDraftId && (
            <div className="workspace-stage__meta">
              <StatusBadge status="draft" />
            </div>
          )}
        </div>

        <div className="workspace-stage__canvas">
          {previewForm === "system" ? (
            <SystemDocument
              requisition={previewRequisition}
              settings={settings}
              preview
            />
          ) : (
            <OfficialDocument
              requisition={previewRequisition}
              settings={settings}
              preview
            />
          )}
        </div>
      </section>

      <ItemPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        departmentId={departmentId}
        items={departmentItems}
        lines={lines}
        onApply={setLines}
      />

    </div>
  );
}
