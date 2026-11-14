import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ListPlus,
  Minus,
  Package,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { CatalogItem, DepartmentId, RequisitionLine } from "../types";
import { DEPARTMENTS } from "../types";
import { formatQty, parseQty } from "../lib/format";
import { makeEmptyLine } from "../store/AppStore";
import { Modal } from "./Modal";
import { EmptyState } from "./ui";

export function ItemPickerModal({
  open,
  onClose,
  departmentId,
  items,
  lines,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  departmentId: DepartmentId;
  items: CatalogItem[];
  lines: RequisitionLine[];
  onApply: (lines: RequisitionLine[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [draftLines, setDraftLines] = useState<RequisitionLine[]>(lines);
  const [tempOpen, setTempOpen] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempUnit, setTempUnit] = useState("");
  const [tempQty, setTempQty] = useState("1");
  const [tempError, setTempError] = useState("");
  const linesRef = useRef(lines);
  linesRef.current = lines;

  useEffect(() => {
    if (open) {
      setDraftLines(linesRef.current.map((line) => ({ ...line })));
      setTempOpen(false);
      setTempName("");
      setTempUnit("");
      setTempQty("1");
      setTempError("");
    }
  }, [open]);

  const department = DEPARTMENTS[departmentId];
  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => a.code.localeCompare(b.code, "th"));
    if (!needle) return sorted;
    return sorted.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.code.toLowerCase().includes(needle) ||
        item.unit.toLowerCase().includes(needle),
    );
  }, [items, query]);

  const totalQty = draftLines.reduce((sum, line) => sum + line.requestQty, 0);
  const hasUnsetQty = draftLines.some((line) => line.requestQty <= 0);
  const availableItems = filteredItems.filter(
    (item) => !draftLines.some((line) => line.itemId === item.id),
  );

  const addItem = (item: CatalogItem) => {
    setDraftLines((previous) => {
      const existing = previous.find((line) => line.itemId === item.id);
      if (existing) {
        return previous.map((line) =>
          line.itemId === item.id
            ? { ...line, requestQty: line.requestQty + 1 }
            : line,
        );
      }
      return [makeEmptyLine(item, 0), ...previous];
    });
  };

  const updateQty = (lineId: string, value: string) => {
    const quantity = Math.max(0, parseQty(value, 0));
    setDraftLines((previous) =>
      previous.map((line) =>
        line.id === lineId ? { ...line, requestQty: quantity } : line,
      ),
    );
  };

  const removeLine = (lineId: string) => {
    setDraftLines((previous) => previous.filter((line) => line.id !== lineId));
  };

  const addTempItem = () => {
    const name = tempName.trim();
    const unit = tempUnit.trim();
    if (!name) {
      setTempError("กรุณากรอกชื่อรายการ");
      return;
    }
    if (!unit) {
      setTempError("กรุณากรอกหน่วยนับ");
      return;
    }
    const quantity = Math.max(1, Math.round(parseQty(tempQty, 1)));
    const line: RequisitionLine = {
      id: crypto.randomUUID(),
      itemId: `temp-${crypto.randomUUID()}`,
      code: "TMP",
      name,
      detail: "รายการชั่วคราว",
      unit,
      requestQty: quantity,
      note: "",
    };
    setDraftLines((previous) => [line, ...previous]);
    setTempOpen(false);
    setTempName("");
    setTempUnit("");
    setTempQty("1");
    setTempError("");
  };

  const handleFinish = () => {
    if (hasUnsetQty) return;
    onApply(draftLines.map((line) => ({ ...line })));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="เลือกรายการที่ต้องการเบิก"
      subtitle={`${department.pageTitle} · คลิกรายการทางซ้ายเพื่อเพิ่ม แล้วกรอกจำนวน`}
      icon={<ListPlus size={21} />}
      tone={departmentId}
      size="lg"
      footer={
        <>
          <span
            className={`item-picker__footer-summary ${
              hasUnsetQty ? "is-warning" : ""
            }`}
          >
            {hasUnsetQty
              ? "กรุณาระบุจำนวนให้ครบทุกรายการก่อนกดเสร็จสิ้น"
              : `${formatQty(draftLines.length)} รายการ · ${formatQty(totalQty)} หน่วย`}
          </span>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleFinish}
            disabled={hasUnsetQty}
          >
            <Check size={16} />
            เสร็จสิ้น
          </button>
        </>
      }
    >
      <div className="item-picker">
        <section className="item-picker__catalog">
          <div className="item-picker__head">
            <strong>รายการทั้งหมด</strong>
            <span>เหลือ {formatQty(availableItems.length)} รายการ</span>
          </div>
          <div className="catalog-search item-picker__search">
            <Search size={17} className="catalog-search__icon" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาชื่อหรือรหัส..."
              autoFocus
            />
            {query && (
              <button
                type="button"
                className="catalog-search__clear"
                onClick={() => setQuery("")}
                aria-label="ล้างคำค้นหา"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="item-picker__temp-tools">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setTempOpen((value) => !value);
                setTempError("");
              }}
            >
              <Plus size={14} />
              เพิ่มรายการชั่วคราว
            </button>
          </div>

          {tempOpen && (
            <div className="item-picker__temp">
              <div className="item-picker__temp-head">
                <strong>เพิ่มรายการชั่วคราว</strong>
                <span>ใช้ในใบเบิกนี้เท่านั้น · ไม่บันทึกในการตั้งค่า</span>
              </div>
              <div className="item-picker__temp-fields">
                <input
                  className="text-input"
                  value={tempName}
                  onChange={(event) => setTempName(event.target.value)}
                  placeholder="ชื่อรายการ"
                  autoFocus
                />
                <input
                  className="text-input"
                  value={tempUnit}
                  onChange={(event) => setTempUnit(event.target.value)}
                  placeholder="หน่วยนับ"
                />
                <input
                  className="text-input"
                  type="number"
                  min={1}
                  value={tempQty}
                  onChange={(event) => setTempQty(event.target.value)}
                  placeholder="จำนวน"
                />
                <button
                  type="button"
                  className={`btn btn--sm ${
                    departmentId === "office" ? "btn--yellow" : "btn--primary"
                  }`}
                  onClick={addTempItem}
                >
                  <Plus size={14} />
                  เพิ่ม
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setTempOpen(false);
                    setTempError("");
                  }}
                >
                  ยกเลิก
                </button>
              </div>
              {tempError && <p className="form-error">{tempError}</p>}
            </div>
          )}

          <div className="item-picker__catalog-list">
            {availableItems.length === 0 ? (
              <EmptyState
                compact
                icon={<Search size={23} />}
                title={
                  filteredItems.length === 0
                    ? "ไม่พบรายการ"
                    : "รายการทั้งหมดถูกเลือกแล้ว"
                }
                description={
                  filteredItems.length === 0
                    ? "ลองค้นหาด้วยคำอื่น"
                    : "รายการที่เลือกอยู่ในช่องขวา"
                }
              />
            ) : (
              availableItems.map((item) => (
                <button
                  type="button"
                  className="catalog-item catalog-item--button"
                  key={item.id}
                  onClick={() => addItem(item)}
                  aria-label={`เพิ่ม ${item.name} เข้ารายการที่เบิก`}
                >
                  <span className="catalog-item__icon catalog-item__icon--ok">
                    <Package size={18} />
                  </span>
                  <span className="catalog-item__body">
                    <strong>{item.name}</strong>
                    <small>
                      {item.code}
                      {item.detail ? ` · ${item.detail}` : ""}
                    </small>
                    <span className="catalog-item__stock">
                      หน่วยนับ {item.unit}
                    </span>
                  </span>
                  <span className="catalog-item__add">
                    <Plus size={16} />
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="item-picker__selected">
          <div className="item-picker__head item-picker__head--selected">
            <strong>รายการที่เบิก</strong>
            <span>
              {formatQty(draftLines.length)} รายการ · {formatQty(totalQty)} หน่วย
            </span>
          </div>
          {draftLines.length === 0 ? (
            <EmptyState
              compact
              icon={<Package size={24} />}
              title="ยังไม่ได้เลือกรายการ"
              description="คลิกรายการทางซ้ายเพื่อย้ายมาที่นี่"
            />
          ) : (
            <div className="item-picker__selected-list">
              {draftLines.map((line) => {
                const quantity = line.requestQty > 0 ? line.requestQty : 0;
                return (
                  <div className="selected-line selected-line--simple" key={line.id}>
                    <div className="selected-line__name">
                      <strong>{line.name}</strong>
                      <small>
                        {line.code}
                        {line.itemId.startsWith("temp-") && (
                          <em className="selected-line__temp">ชั่วคราว</em>
                        )}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="icon-button icon-button--tiny icon-button--danger selected-line__remove"
                      onClick={() => removeLine(line.id)}
                      aria-label={`ลบ ${line.name}`}
                    >
                      <X size={15} />
                    </button>
                    <div
                      className={`qty-field ${
                        line.requestQty <= 0 ? "qty-field--missing" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="qty-field__step"
                        disabled={quantity <= 1}
                        onClick={() =>
                          updateQty(line.id, String(Math.max(1, quantity - 1)))
                        }
                        aria-label={`ลดจำนวน ${line.name}`}
                      >
                        <Minus size={13} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={line.requestQty > 0 ? line.requestQty : ""}
                        placeholder="0"
                        onChange={(event) => updateQty(line.id, event.target.value)}
                        onFocus={(event) => event.currentTarget.select()}
                        aria-label={`จำนวน ${line.name}`}
                      />
                      <button
                        type="button"
                        className="qty-field__step"
                        onClick={() =>
                          updateQty(line.id, String(quantity + 1))
                        }
                        aria-label={`เพิ่มจำนวน ${line.name}`}
                      >
                        <Plus size={13} />
                      </button>
                      <span className="qty-field__unit">{line.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
