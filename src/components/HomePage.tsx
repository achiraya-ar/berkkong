import {
  ArrowRight,
  Bandage,
  Building2,
  FilePenLine,
  FileText,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { useAppStore } from "../store/AppStore";
import type { DepartmentId, Requisition } from "../types";
import { DEPARTMENTS } from "../types";
import { formatQty } from "../lib/format";
import { formatThaiDateTime } from "../lib/date";
import { PageHeader } from "./ui";

function MickeyDoodle({ departmentId }: { departmentId: DepartmentId }) {
  const Icon = departmentId === "medical" ? Bandage : FileText;
  return (
    <span className={`mickey-doodle mickey-doodle--${departmentId}`} aria-hidden="true">
      <span className="mickey-doodle__ear mickey-doodle__ear--left" />
      <span className="mickey-doodle__ear mickey-doodle__ear--right" />
      <span className="mickey-doodle__head">
        <Icon size={46} strokeWidth={1.8} />
      </span>
      <span className="mickey-doodle__tail" />
    </span>
  );
}

export function HomePage({
  onOpenDepartment,
  onOpenDraft,
}: {
  onOpenDepartment: (departmentId: DepartmentId) => void;
  onOpenDraft: (draft: Requisition) => void;
}) {
  const { items, requisitions } = useAppStore();
  const counts = {
    office: items.filter((item) => item.departmentId === "office").length,
    medical: items.filter((item) => item.departmentId === "medical").length,
  };
  const drafts = requisitions
    .filter((requisition) => requisition.status === "draft")
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return (
    <div className="page home-page home-page--choice">
      <PageHeader
        title={
          <>
            เลือกประเภทใบเบิก
            <span className="title-spark">
              <Sparkles size={23} />
            </span>
          </>
        }
        subtitle="เลือกประเภทที่ต้องการเพื่อเริ่มบันทึกการเบิก"
      />

      <div className="choice-grid">
        <article
          className="choice-card choice-card--office"
          role="button"
          tabIndex={0}
          aria-label="เริ่มใบเบิกพัสดุ สำนักงาน"
          onClick={() => onOpenDepartment("office")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpenDepartment("office");
            }
          }}
        >
          <div className="choice-card__pattern" aria-hidden="true" />
          <div className="choice-card__content">
            <span className="choice-card__badge">
              <Building2 size={14} />
              งานพัสดุสำนักงาน
            </span>
            <h2>ใบเบิกพัสดุ</h2>
            <p>{DEPARTMENTS.office.description}</p>
            <div className="choice-card__meta">
              <span>
                <strong>{formatQty(counts.office)}</strong> รายการที่ตั้งค่า
              </span>
            </div>
            <span className="choice-card__cta">
              เริ่มเบิกพัสดุ
              <span>
                <ArrowRight size={17} />
              </span>
            </span>
          </div>
          <MickeyDoodle departmentId="office" />
          <span className="choice-card__number">01</span>
        </article>

        <article
          className="choice-card choice-card--medical"
          role="button"
          tabIndex={0}
          aria-label="เริ่มใบเบิกเวชภัณฑ์ที่มิใช่ยา"
          onClick={() => onOpenDepartment("medical")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpenDepartment("medical");
            }
          }}
        >
          <div className="choice-card__pattern" aria-hidden="true" />
          <div className="choice-card__content">
            <span className="choice-card__badge">
              <Stethoscope size={14} />
              เวชภัณฑ์ทางการแพทย์
            </span>
            <h2>ใบเบิกเวชภัณฑ์ที่มิใช่ยา</h2>
            <p>{DEPARTMENTS.medical.description}</p>
            <div className="choice-card__meta">
              <span>
                <strong>{formatQty(counts.medical)}</strong> รายการที่ตั้งค่า
              </span>
            </div>
            <span className="choice-card__cta">
              เริ่มเบิกเวชภัณฑ์
              <span>
                <ArrowRight size={17} />
              </span>
            </span>
          </div>
          <MickeyDoodle departmentId="medical" />
          <span className="choice-card__number">02</span>
        </article>
      </div>

      {drafts.length > 0 && (
        <section className="home-drafts card">
          <header className="home-drafts__head">
            <div className="home-drafts__title">
              <span className="home-drafts__icon">
                <FilePenLine size={19} />
              </span>
              <div>
                <h2>ฉบับร่างที่ยังไม่ได้ส่งเบิก</h2>
                <p>มี {formatQty(drafts.length)} ฉบับ รอแก้ไขและส่งเบิก</p>
              </div>
            </div>
            <span className="home-drafts__count">{formatQty(drafts.length)}</span>
          </header>
          <div className="home-drafts__list">
            {drafts.map((draft) => (
              <button
                type="button"
                className={`home-draft home-draft--${draft.departmentId}`}
                key={draft.id}
                onClick={() => onOpenDraft(draft)}
              >
                <span className="home-draft__number">{draft.number}</span>
                <span className="home-draft__dept">
                  {DEPARTMENTS[draft.departmentId].shortLabel}
                </span>
                <span className="home-draft__meta">
                  {formatQty(draft.lines.length)} รายการ · {draft.workUnit}
                </span>
                <span className="home-draft__date">
                  แก้ไขล่าสุด {formatThaiDateTime(draft.updatedAt)}
                </span>
                <span className="home-draft__action">
                  <FilePenLine size={14} />
                  แก้ไข
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
