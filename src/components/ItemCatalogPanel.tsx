import { useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAppStore } from "../store/AppStore";
import type { CatalogItem, DepartmentId } from "../types";
import { formatQty } from "../lib/format";
import { ItemEditorDialog } from "./ItemEditorDialog";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import { EmptyState, SegmentedTabs } from "./ui";

export function ItemCatalogPanel() {
  const { items, deleteItem, renumberItems } = useAppStore();
  const toast = useToast();
  const [departmentId, setDepartmentId] = useState<DepartmentId>("office");
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<CatalogItem | null>(null);
  const [renumberOpen, setRenumberOpen] = useState(false);

  const departmentItems = useMemo(
    () => items.filter((item) => item.departmentId === departmentId),
    [items, departmentId],
  );
  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return departmentItems
      .filter((item) => {
        if (!needle) return true;
        return (
          item.name.toLowerCase().includes(needle) ||
          item.code.toLowerCase().includes(needle) ||
          item.unit.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => a.code.localeCompare(b.code, "th"));
  }, [departmentItems, query]);

  const officeCount = items.filter((item) => item.departmentId === "office").length;
  const medicalCount = items.filter((item) => item.departmentId === "medical").length;

  const openAdd = () => {
    setEditingItem(null);
    setEditorOpen(true);
  };

  const handleDelete = () => {
    if (!deletingItem) return;
    const result = deleteItem(deletingItem.id);
    if (result.ok) {
      toast.success(`ลบ ${deletingItem.name} แล้ว`);
      setDeletingItem(null);
    } else {
      toast.error(result.message ?? "ลบรายการไม่สำเร็จ");
    }
  };

  const handleRenumber = () => {
    const count = renumberItems(departmentId);
    if (count > 0) {
      toast.success(`รันเลขใหม่ ${formatQty(count)} รายการแล้ว`);
    } else {
      toast.info("รหัสเรียงต่อเนื่องอยู่แล้ว");
    }
    setRenumberOpen(false);
  };

  return (
    <div className="item-catalog-panel">
      <div className="item-catalog-toolbar">
        <SegmentedTabs
          value={departmentId}
          onChange={setDepartmentId}
          options={[
            { value: "office", label: "รายการพัสดุ", count: officeCount },
            { value: "medical", label: "รายการเวชภัณฑ์", count: medicalCount },
          ]}
        />
        <div className="item-catalog-toolbar__right">
          <div className="search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาชื่อ รหัส หรือหน่วยนับ..."
            />
            {query && (
              <button
                type="button"
                aria-label="ล้างคำค้นหา"
                onClick={() => setQuery("")}
              >
                <X size={13} />
              </button>
            )}
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setRenumberOpen(true)}
            disabled={departmentItems.length === 0}
          >
            <RefreshCw size={15} />
            รันเลขใหม่
          </button>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={openAdd}
          >
            <Plus size={15} />
            เพิ่มรายการใหม่
          </button>
        </div>
      </div>

      <p className="form-note item-catalog-note">
        เพิ่มรายการใหม่จะไปยังหมวดที่กำลังเลือกอยู่
        และรายการในหน้านี้บันทึกทันที
      </p>

      {filteredItems.length === 0 ? (
        <EmptyState
          compact
          icon={<Plus size={24} />}
          title={query ? "ไม่พบรายการ" : "ยังไม่มีรายการในหมวดนี้"}
          description={
            query
              ? "ลองค้นหาด้วยคำอื่น"
              : "เพิ่มรายการและกำหนดหน่วยนับเพื่อใช้ในการเบิก"
          }
          action={
            <button
              type="button"
              className="btn btn--soft btn--sm"
              onClick={openAdd}
            >
              <Plus size={14} />
              เพิ่มรายการใหม่
            </button>
          }
        />
      ) : (
        <div className="table-scroll item-catalog-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>รายการ</th>
                <th>หน่วยนับ</th>
                <th className="actions-col">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="code-chip">{item.code}</span>
                  </td>
                  <td>
                    <div className="item-name-cell">
                      <strong>{item.name}</strong>
                      {item.detail && <small>{item.detail}</small>}
                    </div>
                  </td>
                  <td>
                    <span className="unit-chip">{item.unit}</span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="icon-button icon-button--tiny"
                        title="แก้ไขรายการ"
                        aria-label={`แก้ไข ${item.name}`}
                        onClick={() => {
                          setEditingItem(item);
                          setEditorOpen(true);
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--tiny icon-button--danger"
                        title="ลบรายการ"
                        aria-label={`ลบ ${item.name}`}
                        onClick={() => setDeletingItem(item)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="item-catalog-footer">
        <span>
          แสดง {formatQty(filteredItems.length)} จาก{" "}
          {formatQty(departmentItems.length)} รายการ
        </span>
        <span>
          {departmentId === "office" ? "พัสดุสำนักงาน" : "เวชภัณฑ์ที่มิใช่ยา"}
        </span>
      </div>

      <ItemEditorDialog
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        defaultDepartment={departmentId}
      />

      <Modal
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="ลบรายการ?"
        subtitle={deletingItem ? `${deletingItem.code} · ${deletingItem.name}` : ""}
        icon={<Trash2 size={21} />}
        tone={deletingItem?.departmentId}
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setDeletingItem(null)}
            >
              ยกเลิก
            </button>
            <button type="button" className="btn btn--danger" onClick={handleDelete}>
              <Trash2 size={16} />
              ลบรายการ
            </button>
          </>
        }
      >
        <p className="form-note form-note--warn">
          ลบรายการนี้ออกจากคลังได้เลย ใบเบิกที่บันทึกไว้ก่อนหน้าจะยังคงแสดงรายการเดิมครบถ้วน
        </p>
      </Modal>

      <Modal
        open={renumberOpen}
        onClose={() => setRenumberOpen(false)}
        title="รันเลขใหม่?"
        subtitle={`${
          departmentId === "office" ? "รายการพัสดุ" : "รายการเวชภัณฑ์"
        } · ${formatQty(departmentItems.length)} รายการ`}
        icon={<RefreshCw size={21} />}
        tone={departmentId}
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setRenumberOpen(false)}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className={`btn ${
                departmentId === "office" ? "btn--yellow" : "btn--primary"
              }`}
              onClick={handleRenumber}
            >
              <RefreshCw size={16} />
              รันเลขใหม่
            </button>
          </>
        }
      >
        <p className="form-note form-note--warn">
          ระบบจะเรียงรหัสใหม่ตั้งแต่ 0001 ต่อเนื่องกัน ใบเบิกที่บันทึกไว้แล้วจะยังใช้รหัสเดิม
        </p>
      </Modal>
    </div>
  );
}
