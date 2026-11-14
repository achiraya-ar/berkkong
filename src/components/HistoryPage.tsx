import { useMemo, useState } from "react";
import {
  FilePlus2,
  History,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAppStore } from "../store/AppStore";
import type { DepartmentId, Requisition } from "../types";
import { DEPARTMENTS } from "../types";
import { formatThaiDate, formatThaiDateTime } from "../lib/date";
import { formatQty } from "../lib/format";
import type { AppView } from "../navigation";
import {
  DepartmentBadge,
  EmptyState,
  PageHeader,
  SegmentedTabs,
  StatusBadge,
} from "./ui";
import { Modal } from "./Modal";
import { useToast } from "./Toast";

type StatusFilter = "all" | "submitted" | "cancelled";
type DepartmentFilter = "all" | DepartmentId;

export function HistoryPage({
  onNavigate,
  onCreateNew,
}: {
  onNavigate: (view: AppView) => void;
  onCreateNew: () => void;
}) {
  const { requisitions, deleteRequisition } = useAppStore();
  const toast = useToast();
  const [deleting, setDeleting] = useState<Requisition | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      all: requisitions.filter((entry) => entry.status !== "draft").length,
      submitted: requisitions.filter((entry) => entry.status === "submitted").length,
      cancelled: requisitions.filter((entry) => entry.status === "cancelled").length,
    }),
    [requisitions],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...requisitions]
      .filter((requisition) => {
        if (requisition.status === "draft") return false;
        if (statusFilter !== "all" && requisition.status !== statusFilter) return false;
        if (
          departmentFilter !== "all" &&
          requisition.departmentId !== departmentFilter
        ) {
          return false;
        }
        if (!needle) return true;
        return (
          requisition.number.toLowerCase().includes(needle) ||
          requisition.requester.name.toLowerCase().includes(needle) ||
          requisition.workUnit.toLowerCase().includes(needle) ||
          requisition.lines.some((line) => line.name.toLowerCase().includes(needle))
        );
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [requisitions, statusFilter, departmentFilter, query]);

  return (
    <div className="page history-page">
      <PageHeader
        eyebrow="ติดตามเอกสาร"
        title="ประวัติการเบิก"
        subtitle="ค้นหาใบเบิก เปิดดูรายละเอียด และพิมพ์ซ้ำได้"
        actions={
          <button type="button" className="btn btn--primary" onClick={onCreateNew}>
            <FilePlus2 size={17} />
            สร้างใบเบิก
          </button>
        }
      />

      <section className="card history-card">
        <div className="history-toolbar">
          <SegmentedTabs
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "ทั้งหมด", count: counts.all },
              { value: "submitted", label: "ส่งเบิกแล้ว", count: counts.submitted },
              { value: "cancelled", label: "ยกเลิก", count: counts.cancelled },
            ]}
          />
        </div>
        <div className="history-filters">
          <div className="search-box search-box--grow">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาเลขที่ ผู้เบิก หน่วยงาน หรือรายการ..."
            />
            {query && (
              <button type="button" aria-label="ล้างคำค้นหา" onClick={() => setQuery("")}>
                <X size={13} />
              </button>
            )}
          </div>
          <select
            className="select-input"
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(event.target.value as DepartmentFilter)
            }
            aria-label="กรองตามประเภท"
          >
            <option value="all">ทุกประเภท</option>
            <option value="office">{DEPARTMENTS.office.shortLabel}</option>
            <option value="medical">{DEPARTMENTS.medical.shortLabel}</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<History size={28} />}
            title={
              requisitions.length === 0
                ? "ยังไม่มีประวัติการเบิก"
                : "ไม่พบใบเบิกที่ตรงกับตัวกรอง"
            }
            description={
              requisitions.length === 0
                ? "เมื่อบันทึกใบเบิกแล้ว เอกสารจะแสดงที่นี่"
                : "ลองเปลี่ยนตัวกรองหรือคำค้นหาใหม่อีกครั้ง"
            }
            action={
              <button type="button" className="btn btn--soft" onClick={onCreateNew}>
                <FilePlus2 size={16} />
                สร้างใบเบิก
              </button>
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table history-table">
              <thead>
                <tr>
                  <th>เลขที่ / วันที่</th>
                  <th>ประเภท</th>
                  <th>ผู้เบิก</th>
                  <th>ต้องการใช้</th>
                  <th className="num">รายการ</th>
                  <th>สถานะ</th>
                  <th className="actions-col">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((requisition) => {
                  const unitCount = requisition.lines.reduce(
                    (sum, line) => sum + line.requestQty,
                    0,
                  );
                  return (
                    <tr
                      key={requisition.id}
                      className="clickable-row"
                      onClick={() =>
                        onNavigate({
                          name: "history-detail",
                          id: requisition.id,
                        })
                      }
                    >
                      <td>
                        <div className="doc-number-cell">
                          <strong>{requisition.number}</strong>
                          <small>{formatThaiDateTime(requisition.createdAt)}</small>
                        </div>
                      </td>
                      <td>
                        <DepartmentBadge
                          departmentId={requisition.departmentId}
                          short
                          subtle
                        />
                      </td>
                      <td>
                        <div className="person-cell">
                          <strong>{requisition.requester.name || "—"}</strong>
                          <small>
                            {requisition.workUnit ? `งาน${requisition.workUnit}` : ""}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <span>{formatThaiDate(requisition.neededDate, "medium")}</span>
                          {requisition.status === "cancelled" &&
                            requisition.cancelReason && (
                              <small className="text-danger">
                                เหตุผล: {requisition.cancelReason}
                              </small>
                            )}
                        </div>
                      </td>
                      <td className="num">
                        <div className="qty-cell">
                          <strong>{formatQty(requisition.lines.length)}</strong>
                          <small>{formatQty(unitCount)} หน่วย</small>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={requisition.status} />
                      </td>
                      <td>
                        <div
                          className="row-actions"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="icon-button icon-button--tiny"
                            title="พิมพ์ซ้ำ"
                            aria-label={`พิมพ์ ${requisition.number}`}
                            onClick={() =>
                              onNavigate({
                                name: "print",
                                id: requisition.id,
                                returnTo: { name: "history" },
                              })
                            }
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-button icon-button--tiny icon-button--danger"
                            title="ลบประวัติ"
                            aria-label={`ลบ ${requisition.number}`}
                            onClick={() => setDeleting(requisition)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="items-footer">
          <span>
            แสดง {formatQty(filtered.length)} จาก {formatQty(requisitions.length)} ฉบับ
          </span>
        </footer>
      </section>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="ลบประวัติการเบิก?"
        subtitle={deleting?.number ?? ""}
        icon={<Trash2 size={21} />}
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setDeleting(null)}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                if (!deleting) return;
                deleteRequisition(deleting.id);
                toast.success(`ลบ ${deleting.number} แล้ว`);
                setDeleting(null);
              }}
            >
              <Trash2 size={16} />
              ลบประวัติ
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
