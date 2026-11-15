import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  FileText,
  Info,
  Printer,
} from "lucide-react";
import { useAppStore } from "../store/AppStore";
import type { AppView } from "../navigation";
import { formatThaiDateTime } from "../lib/date";
import { formatQty } from "../lib/format";
import { OfficialDocument, SystemDocument } from "./documents";
import { useToast } from "./Toast";
import {
  DepartmentBadge,
  EmptyState,
  SegmentedTabs,
  StatusBadge,
} from "./ui";

type FormTab = "system" | "official";

export function PrintPage({
  id,
  auto = false,
  returnTo,
  onNavigate,
}: {
  id: string;
  auto?: boolean;
  returnTo?: AppView;
  onNavigate: (view: AppView) => void;
}) {
  const { requisitions, settings, markPrinted } = useAppStore();
  const toast = useToast();
  const requisition = requisitions.find((entry) => entry.id === id);
  const [tab, setTab] = useState<FormTab>("system");
  const autoFired = useRef(false);

  const printNow = useCallback(() => {
    if (!requisition) return;
    markPrinted(requisition.id);
    window.print();
    toast.info("เปิดหน้าต่างพิมพ์แล้ว", "เลือกเครื่องพิมพ์ หรือบันทึกเป็น PDF");
  }, [requisition, markPrinted, toast]);

  useEffect(() => {
    if (!auto || !requisition || autoFired.current) return;
    const timer = window.setTimeout(() => {
      autoFired.current = true;
      printNow();
    }, 650);
    return () => window.clearTimeout(timer);
  }, [auto, requisition?.id, printNow]);

  if (!requisition || requisition.status === "draft") {
    return (
      <div className="print-page">
        <div className="page">
          <EmptyState
            icon={<FileText size={30} />}
            title={requisition ? "ฉบับร่างยังพิมพ์ไม่ได้" : "ไม่พบเอกสารสำหรับพิมพ์"}
            description={
              requisition
                ? "กรุณาบันทึกส่งเบิกก่อนจึงจะพิมพ์ใบเบิกได้"
                : "เอกสารอาจถูกลบหรือไม่มีอยู่ในเครื่องนี้"
            }
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
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(requisition.lines.length / 20));
  const back = () =>
    onNavigate(returnTo ?? { name: "history-detail", id: requisition.id });

  return (
    <div className="print-page">
      <div className="print-toolbar screen-only">
        <div className="print-toolbar__left">
          <button
            type="button"
            className="icon-button icon-button--ghost"
            onClick={back}
            aria-label="กลับ"
            title="กลับ"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="print-toolbar__icon">
            <FileText size={19} />
          </span>
          <div className="print-toolbar__title">
            <span>ตัวอย่างก่อนพิมพ์</span>
            <strong>{requisition.number}</strong>
          </div>
        </div>
        <div className="print-toolbar__center">
          <DepartmentBadge departmentId={requisition.departmentId} short subtle />
          <StatusBadge status={requisition.status} />
          <span className="print-toolbar__meta">
            {formatQty(requisition.lines.length)} รายการ · {pageCount} หน้า
          </span>
        </div>
        <div className="print-toolbar__right">
          <span className="print-toolbar__count">
            พิมพ์แล้ว {formatQty(requisition.printCount)} ครั้ง
            {requisition.printedAt
              ? ` · ${formatThaiDateTime(requisition.printedAt)}`
              : ""}
          </span>
          <button
            type="button"
            className="btn btn--primary"
            onClick={printNow}
          >
            <Printer size={17} />
            พิมพ์ 2 ใบ
          </button>
        </div>
      </div>

      <div className="print-notice screen-only">
        <span>
          <Info size={15} />
          ตั้งค่ากระดาษ A4 ขนาด 100% และปิดหัว/ท้ายกระดาษของเบราว์เซอร์
        </span>
        <span>พิมพ์ได้ทั้ง 2 รูปแบบ พร้อมกัน</span>
      </div>

      <div className="print-screen screen-only">
        <div className="print-tabs">
          <SegmentedTabs
            value={tab}
            onChange={setTab}
            options={[
              { value: "system", label: "ใบเบิกของระบบ" },
              { value: "official", label: "ใบเบิกมาตรฐาน" },
            ]}
          />
          <span>เอกสารจะพิมพ์เป็น 2 รูปแบบแยกกัน</span>
        </div>

        <div className="print-preview-stage">
          {tab === "system" ? (
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
      </div>

      <div className="print-area" aria-hidden="true">
        <SystemDocument
          requisition={requisition}
          settings={settings}
          preview={false}
        />
        <OfficialDocument
          requisition={requisition}
          settings={settings}
          preview={false}
        />
      </div>
    </div>
  );
}
