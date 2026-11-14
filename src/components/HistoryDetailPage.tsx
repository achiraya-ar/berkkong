import { useState } from "react";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  FilePenLine,
  History,
  Printer,
  Trash2,
  UserRound,
} from "lucide-react";
import { useAppStore } from "../store/AppStore";
import type { AppView } from "../navigation";
import { formatThaiDate, formatThaiDateTime } from "../lib/date";
import { formatQty } from "../lib/format";
import { OfficialDocument, SystemDocument } from "./documents";
import { CancelDialog } from "./RequisitionDialogs";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import {
  DepartmentBadge,
  EmptyState,
  PageHeader,
  SegmentedTabs,
  StatusBadge,
} from "./ui";

type PreviewForm = "system" | "official";

export function HistoryDetailPage({
  id,
  onNavigate,
}: {
  id: string;
  onNavigate: (view: AppView) => void;
}) {
  const { requisitions, settings, deleteRequisition } = useAppStore();
  const toast = useToast();
  const requisition = requisitions.find((entry) => entry.id === id);
  const [previewForm, setPreviewForm] = useState<PreviewForm>("system");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!requisition) {
    return (
      <div className="page">
        <EmptyState
          icon={<History size={30} />}
          title="ไม่พบใบเบิก"
          description="เอกสารนี้อาจถูกลบหรือไม่มีอยู่ในเครื่องนี้"
          action={
            <button
              type="button"
              className="btn btn--soft"
              onClick={() => onNavigate({ name: "history" })}
            >
              <ArrowLeft size={16} />
              กลับประวัติการเบิก
            </button>
          }
        />
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(requisition.lines.length / 20));
  const totalQty = requisition.lines.reduce(
    (sum, line) => sum + line.requestQty,
    0,
  );

  const openPrint = () =>
    onNavigate({
      name: "print",
      id: requisition.id,
      returnTo: { name: "history-detail", id: requisition.id },
    });

  return (
    <div className="page history-detail-page">
      <button
        type="button"
        className="back-link"
        onClick={() => onNavigate({ name: "history" })}
      >
        <ArrowLeft size={16} />
        กลับประวัติการเบิก
      </button>

      <PageHeader
        eyebrow={
          <>
            <DepartmentBadge
              departmentId={requisition.departmentId}
              short
              subtle
            />
            <span className="eyebrow__dot" />
            {formatThaiDateTime(requisition.createdAt)}
          </>
        }
        title={
          <>
            {requisition.number}
            <StatusBadge status={requisition.status} />
          </>
        }
        subtitle={`${formatQty(requisition.lines.length)} รายการ · รวม ${formatQty(totalQty)} หน่วย`}
        actions={
          <>
            {requisition.status === "draft" ? (
              <>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() =>
                    onNavigate({
                      name: "requisition",
                      departmentId: requisition.departmentId,
                      draftId: requisition.id,
                    })
                  }
                >
                  <FilePenLine size={16} />
                  แก้ไขฉบับร่าง
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 size={16} />
                  ลบฉบับร่าง
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn--primary" onClick={openPrint}>
                  <Printer size={16} />
                  พิมพ์ซ้ำ 2 ใบ
                </button>
                {requisition.status === "submitted" && (
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() => setCancelOpen(true)}
                  >
                    <Ban size={16} />
                    ยกเลิกใบเบิก
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 size={16} />
                  ลบประวัติ
                </button>
              </>
            )}
          </>
        }
      />

      {requisition.status === "draft" && (
        <div className="detail-banner detail-banner--draft">
          <FilePenLine size={20} />
          <div>
            <strong>ฉบับร่าง</strong>
            <span>ยังไม่ได้ส่งเบิก — เปิดแก้ไขและกด “บันทึกส่งเบิกของ” เมื่อพร้อม</span>
          </div>
        </div>
      )}

      {requisition.status === "cancelled" && (
        <div className="detail-banner detail-banner--danger">
          <Ban size={20} />
          <div>
            <strong>ใบเบิกนี้ถูกยกเลิก</strong>
            <span>
              เมื่อ {formatThaiDateTime(requisition.cancelledAt)} · เหตุผล:{" "}
              {requisition.cancelReason}
            </span>
          </div>
        </div>
      )}

      <section className="card detail-meta">
        <div className="detail-meta__item">
          <span>
            <UserRound size={14} />
            ผู้เบิก
          </span>
          <strong>{requisition.requester.name || "—"}</strong>
          <small>{requisition.requester.position || "—"}</small>
        </div>
        <div className="detail-meta__item">
          <span>งาน / หน่วยงาน</span>
          <strong>{requisition.workUnit || "—"}</strong>
          <small>หน่วยงานผู้ขอเบิก</small>
        </div>
        <div className="detail-meta__item">
          <span>
            <CalendarDays size={14} />
            ต้องการใช้ภายใน
          </span>
          <strong>{formatThaiDate(requisition.neededDate, "full")}</strong>
          <small>
            {formatThaiDate(
              requisition.submittedAt ?? requisition.createdAt,
              "full",
            )}{" "}
            ที่บันทึก
          </small>
        </div>
        <div className="detail-meta__item">
          <span>ผู้รับของ</span>
          <strong>{requisition.receiver.name || "เว้นว่างให้ลงชื่อ"}</strong>
          <small>{requisition.receiver.position || "—"}</small>
        </div>
        <div className="detail-meta__item">
          <span>ผู้สั่งจ่าย</span>
          <strong>{requisition.orderer.name || "—"}</strong>
          <small>{requisition.orderer.position || "—"}</small>
        </div>
        <div className="detail-meta__item">
          <span>ผู้จ่าย</span>
          <strong>{requisition.payer.name || "—"}</strong>
          <small>{requisition.payer.position || "—"}</small>
        </div>
        <div className="detail-meta__item">
          <span>หัวหน้างาน (ใบเบิกของระบบ)</span>
          <strong>{requisition.systemHead.name || "—"}</strong>
          <small>ใช้ในช่องลงชื่อหัวหน้างาน</small>
        </div>
        <div className="detail-meta__item">
          <span>การพิมพ์</span>
          <strong>{formatQty(requisition.printCount)} ครั้ง</strong>
          <small>
            {requisition.printedAt
              ? `ล่าสุด ${formatThaiDateTime(requisition.printedAt)}`
              : "ยังไม่เคยพิมพ์"}
          </small>
        </div>
      </section>

      <section className="preview-panel card detail-preview">
        <header className="preview-panel__head">
          <div className="preview-panel__title">
            <span className="preview-panel__icon">
              <Printer size={19} />
            </span>
            <div>
              <h2>เอกสารใบเบิก</h2>
              <p>
                {requisition.number} · {requisition.lines.length} รายการ
              </p>
            </div>
          </div>
          <div className="preview-panel__meta">
            <StatusBadge status={requisition.status} />
            <span className="paper-chip">A4 · {pageCount} หน้า</span>
          </div>
        </header>
        <div className="preview-panel__bar">
          <SegmentedTabs
            value={previewForm}
            onChange={setPreviewForm}
            options={[
              { value: "system", label: "ใบเบิกของระบบ" },
              { value: "official", label: "ใบเบิกมาตรฐาน" },
            ]}
          />
          <span className="preview-panel__hint">พิมพ์ซ้ำได้ทุกเมื่อ</span>
        </div>
        <div className="preview-stage">
          {previewForm === "system" ? (
            <SystemDocument
              requisition={requisition}
              settings={settings}
              preview
            />
          ) : (
            <OfficialDocument
              requisition={requisition}
              settings={settings}
              preview
            />
          )}
        </div>
      </section>

      <CancelDialog
        requisition={requisition}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
      />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={
          requisition.status === "draft" ? "ลบฉบับร่าง?" : "ลบประวัติการเบิก?"
        }
        subtitle={requisition.number}
        icon={<Trash2 size={21} />}
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setDeleteOpen(false)}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                deleteRequisition(requisition.id);
                toast.success(`ลบ ${requisition.number} แล้ว`);
                onNavigate({ name: "history" });
              }}
            >
              <Trash2 size={16} />
              {requisition.status === "draft" ? "ลบฉบับร่าง" : "ลบประวัติ"}
            </button>
          </>
        }
      >
        <p className="form-note form-note--warn">
          การลบไม่สามารถย้อนกลับได้ และเลขที่ใบเบิกนี้จะไม่ถูกนำกลับมาใช้ใหม่
        </p>
      </Modal>
    </div>
  );
}
