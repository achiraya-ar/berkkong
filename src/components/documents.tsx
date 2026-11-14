import { type ReactNode } from "react";
import {
  DEPARTMENTS,
  type Requisition,
  type RequisitionLine,
  type Settings,
} from "../types";
import { formatThaiDate, formatThaiDateTime } from "../lib/date";
import { formatQty } from "../lib/format";
import { logoSrc } from "./BrandMark";
import { PaperPreview } from "./ui";

const ROWS_PER_PAGE = 20;

interface Slot {
  line: RequisitionLine | null;
  number: number;
}

interface PageData {
  number: number;
  total: number;
  slots: Slot[];
  isLast: boolean;
}

function paginate(lines: RequisitionLine[]): PageData[] {
  const pages: PageData[] = [];
  const total = Math.max(1, Math.ceil(lines.length / ROWS_PER_PAGE));
  for (let pageIndex = 0; pageIndex < total; pageIndex += 1) {
    const start = pageIndex * ROWS_PER_PAGE;
    const pageLines = lines.slice(start, start + ROWS_PER_PAGE);
    const slots: Slot[] = [];
    for (let offset = 0; offset < ROWS_PER_PAGE; offset += 1) {
      slots.push({
        line: pageLines[offset] ?? null,
        number: start + offset + 1,
      });
    }
    pages.push({
      number: pageIndex + 1,
      total,
      slots,
      isLast: pageIndex === total - 1,
    });
  }
  return pages;
}

function documentDate(requisition: Requisition): string {
  if (!requisition.submittedAt) return "";
  return formatThaiDate(requisition.submittedAt, "full");
}

function printDate(requisition: Requisition): string {
  return formatThaiDateTime(requisition.printedAt ?? new Date());
}

function statusStamp(requisition: Requisition): ReactNode {
  if (requisition.status === "draft") {
    return <span className="doc-stamp doc-stamp--draft">ฉบับร่าง</span>;
  }
  if (requisition.status === "cancelled") {
    return <span className="doc-stamp doc-stamp--cancelled">ยกเลิก</span>;
  }
  return null;
}

function DocumentPages({
  pages,
  renderPage,
  preview,
  kind,
}: {
  pages: PageData[];
  renderPage: (page: PageData) => ReactNode;
  preview: boolean;
  kind: "system" | "official";
}) {
  return (
    <>
      {pages.map((page) => {
        const pageNode = (
          <article
            key={page.number}
            className={`sheet sheet--${kind} print-sheet`}
            data-page={page.number}
          >
            {renderPage(page)}
          </article>
        );
        if (!preview) return pageNode;
        return (
          <PaperPreview
            key={page.number}
            className="document-preview-page"
            paperWidth={794}
            paperHeight={1123}
          >
            {pageNode}
          </PaperPreview>
        );
      })}
    </>
  );
}

function SystemSign({
  title,
  name,
  date,
  blank = false,
}: {
  title: string;
  name: string;
  date: string;
  blank?: boolean;
}) {
  return (
    <div className="system-sign">
      <div className="system-sign__line">
        <span>ลงชื่อ</span>
        <i />
        <b>{title}</b>
      </div>
      <p className="system-sign__name">
        ({" "}
        <span className={blank ? "system-sign__blank-name" : ""}>
          {blank ? "" : name || ""}
        </span>{" "}
        )
      </p>
      <p className="system-sign__detail">
        <span className="system-sign__detail-label">วันที่</span>
        <span
          className={`system-sign__detail-value ${
            blank ? "system-sign__detail-value--blank" : ""
          }`}
        >
          {blank ? "" : date || ""}
        </span>
      </p>
    </div>
  );
}

export function SystemDocument({
  requisition,
  settings,
  preview = true,
}: {
  requisition: Requisition;
  settings: Settings;
  preview?: boolean;
}) {
  const department = DEPARTMENTS[requisition.departmentId];
  const pages = paginate(requisition.lines);
  const title =
    requisition.departmentId === "medical"
      ? "ใบเบิกเวชภัณฑ์ที่มิใช่ยา"
      : "ใบเบิกพัสดุ";
  const dateText = documentDate(requisition);
  const subtitle =
    requisition.departmentId === "office" ? "" : department.formSubtitle;

  return (
    <DocumentPages
      pages={pages}
      preview={preview}
      kind="system"
      renderPage={(page) => (
        <>
          {statusStamp(requisition)}
          <div className="system-brandline">
            <div className="system-brand">
              <img src={logoSrc} alt="" className="system-brand__logo" />
              <div>
                <div className="system-brand__name">BerkKong</div>
                <div className="system-brand__sub">
                  ระบบเบิกของ · เบิกง่าย ตรวจสอบได้
                </div>
              </div>
            </div>
            <div className="system-docbox">
              <span>เลขที่ใบเบิก</span>
              <strong>{requisition.number}</strong>
              <em>
                {page.total > 1
                  ? `หน้า ${page.number} / ${page.total}`
                  : "เอกสารต้นฉบับ"}
              </em>
            </div>
          </div>

          <header className="system-head">
            <p className="system-org">{settings.orgName}</p>
            <h1>{title}</h1>
            {subtitle && <p className="system-subtitle">{subtitle}</p>}
          </header>

          <div className="system-meta">
            <MetaItem label="งาน / หน่วยงาน" value={requisition.workUnit || ""} />
            <MetaItem label="ผู้เบิก" value={requisition.requester.name || ""} />
            <MetaItem
              label="ผู้รับของ"
              value={requisition.receiver.name || ""}
            />
            <MetaItem
              label="ต้องการใช้ภายใน"
              value={formatThaiDate(requisition.neededDate, "full") || ""}
            />
          </div>

          <table className="system-table">
            <colgroup>
              <col style={{ width: "28px" }} />
              <col style={{ width: "58px" }} />
              <col />
              <col style={{ width: "54px" }} />
              <col style={{ width: "64px" }} />
              <col style={{ width: "116px" }} />
            </colgroup>
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>รหัส</th>
                <th>รายการ</th>
                <th>หน่วยนับ</th>
                <th>จำนวนเบิก</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {page.slots.map((slot) => (
                <tr key={slot.number} className={!slot.line ? "is-blank" : ""}>
                  <td className="center muted-cell">{slot.number}</td>
                  <td className="center code-cell">{slot.line?.code ?? ""}</td>
                  <td>
                    {slot.line ? (
                      <div className="system-item">
                        <span>{slot.line.name}</span>
                        {slot.line.detail && <small>{slot.line.detail}</small>}
                      </div>
                    ) : null}
                  </td>
                  <td className="center">{slot.line?.unit ?? ""}</td>
                  <td className="center strong-cell">
                    {slot.line && slot.line.requestQty > 0
                      ? formatQty(slot.line.requestQty)
                      : ""}
                  </td>
                  <td className="note-cell">{slot.line?.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {page.isLast && (
            <div className="system-signatures">
              <SystemSign
                title="ผู้เบิก"
                name={requisition.requester.name}
                date={dateText}
              />
              <SystemSign
                title="หัวหน้างาน"
                name={requisition.systemHead.name}
                date={dateText}
              />
              <SystemSign
                title="ผู้ตรวจรับ"
                name=""
                date=""
                blank
              />
            </div>
          )}

          <footer className="system-footer">
            <span>
              พิมพ์จากระบบ BerkKong · {printDate(requisition)}
            </span>
            <span>
              หน้า {page.number} / {page.total}
            </span>
          </footer>
        </>
      )}
    />
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="system-meta__item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function OfficialDocument({
  requisition,
  settings,
  preview = true,
}: {
  requisition: Requisition;
  settings: Settings;
  preview?: boolean;
}) {
  const department = DEPARTMENTS[requisition.departmentId];
  const pages = paginate(requisition.lines);
  const requesterDate = documentDate(requisition);
  const subtitle =
    requisition.departmentId === "office" ? "" : department.formSubtitle;
  const addressedTo = settings.addressedTo.trim() || "หัวหน้าหน่วยงานพัสดุ";
  const noteOfficer = settings.noteOfficer.trim();

  return (
    <DocumentPages
      pages={pages}
      preview={preview}
      kind="official"
      renderPage={(page) => (
        <>
          {statusStamp(requisition)}
          <header className="official-head">
            <h1>ใบเบิกพัสดุ</h1>
            {subtitle && <h2>({subtitle})</h2>}
          </header>

          <div className="official-topline">
            <div className="official-topline__field official-topline__field--work">
              <span>งาน</span>
              <b className="official-dotted official-dotted--work">
                {requisition.workUnit || "\u00a0"}
              </b>
            </div>
            <div className="official-topline__field official-topline__field--number">
              <span>ใบเบิกเลขที่</span>
              <b className="official-dotted official-dotted--number">
                {"\u00a0"}
              </b>
            </div>
          </div>

          <p className="official-addressed">ถึง {addressedTo}</p>

          <div className="official-request">
            <p className="official-request__work">
              <span className="official-request__lead">
                ข้าพเจ้าขอเบิกพัสดุ{subtitle ? ` (${subtitle})` : ""} ตามรายการข้างล่างนี้เพื่อใช้ในงาน
              </span>
              <span className="official-dotted official-dotted--inline official-dotted--workunit">
                {requisition.workUnit || "\u00a0"}
              </span>
            </p>
            <p className="official-request__rest">
              และต้องการใช้สิ่งของตามใบเบิกนี้ ภายในวันที่{" "}
              <span className="official-dotted official-dotted--inline official-dotted--date">
                {formatThaiDate(requisition.neededDate, "short") || "\u00a0"}
              </span>{" "}
              และมอบให้{" "}
              <span className="official-dotted official-dotted--inline official-dotted--receiver">
                {requisition.receiver.name || "\u00a0"}
              </span>{" "}
              เป็นผู้รับสิ่งของตามใบเบิกนี้
            </p>
          </div>

          <table className="official-table">
            <colgroup>
              <col style={{ width: "8.5%" }} />
              <col style={{ width: "39%" }} />
              <col style={{ width: "10.5%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10.5%" }} />
              <col style={{ width: "9.5%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2}>ลำดับ</th>
                <th rowSpan={2}>รายการ</th>
                <th rowSpan={2}>หน่วยนับ</th>
                <th rowSpan={2}>คงเหลือ</th>
                <th colSpan={2}>จำนวน</th>
                <th rowSpan={2}>
                  หมายเหตุ
                  {noteOfficer && (
                    <>
                      <br />
                      สำหรับ {noteOfficer}
                    </>
                  )}
                </th>
              </tr>
              <tr>
                <th>เบิกครั้งนี้</th>
                <th>จ่าย</th>
              </tr>
            </thead>
            <tbody>
              {page.slots.map((slot) => (
                <tr key={slot.number} className={!slot.line ? "is-blank" : ""}>
                  <td className="center">{slot.number}.</td>
                  <td className="official-item-cell">{slot.line?.name ?? ""}</td>
                  <td className="center">{slot.line?.unit ?? ""}</td>
                  <td className="center" />
                  <td className="center">
                    {slot.line && slot.line.requestQty > 0
                      ? formatQty(slot.line.requestQty)
                      : ""}
                  </td>
                  <td className="center" />
                  <td className="official-note-cell">{slot.line?.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {page.isLast && (
            <div className="official-signatures">
              <OfficialSignature
                title="ผู้เบิก"
                name={requisition.requester.name}
                position={requisition.requester.position}
                date={requesterDate}
              />
              <OfficialSignature
                title="ผู้รับ"
                name={requisition.receiver.name}
                position={requisition.receiver.position}
                date=""
              />
              <OfficialSignature
                title="ผู้สั่งจ่าย"
                name={requisition.orderer.name}
                position={requisition.orderer.position}
                date=""
              />
              <OfficialSignature
                title="ผู้จ่าย"
                name={requisition.payer.name}
                position={requisition.payer.position}
                date=""
              />
            </div>
          )}

          <footer className="official-footer">
            <span>
              หน้า {page.number} / {page.total}
            </span>
          </footer>
        </>
      )}
    />
  );
}

function OfficialSignature({
  title,
  name,
  position,
  date,
}: {
  title: string;
  name: string;
  position: string;
  date: string;
}) {
  return (
    <div className="official-sign">
      <div className="official-sign__line">
        <span>ลงชื่อ</span>
        <i />
        <b>{title}</b>
      </div>
      <p className="official-sign__name">
        <span>{name || ""}</span>
      </p>
      <p className="official-sign__detail">
        <span className="official-sign__detail-label">ตำแหน่ง</span>
        <span className="official-sign__detail-value">
          {position || ""}
        </span>
      </p>
      <p className="official-sign__detail">
        <span className="official-sign__detail-label">วันที่</span>
        <span className="official-sign__detail-value">
          {date || ""}
        </span>
      </p>
    </div>
  );
}
