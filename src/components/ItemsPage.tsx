import { useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  Pencil,
  Plus,
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
import {
  DepartmentBadge,
  EmptyState,
  PageHeader,
  SegmentedTabs,
} from "./ui";

type DepartmentFilter = "all" | DepartmentId;

export function ItemsPage() {
  const { items, deleteItem } = useAppStore();
  const toast = useToast();
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<CatalogItem | null>(null);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.departmentId !== b.departmentId) {
          return a.departmentId === "office" ? -1 : 1;
        }
        return a.code.localeCompare(b.code, "th");
      }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sortedItems.filter((item) => {
      if (departmentFilter !== "all" && item.departmentId !== departmentFilter) {
        return false;
      }
      if (!needle) return true;
      return (
        item.name.toLowerCase().includes(needle) ||
        item.code.toLowerCase().includes(needle) ||
        item.unit.toLowerCase().includes(needle)
      );
    });
  }, [sortedItems, departmentFilter, query]);

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

  return (
    <div className="page items-page">
      <PageHeader
        eyebrow="รายการพัสดุ"
        title="รายการพัสดุ"
        subtitle="กำหนดรายการและหน่วยนับที่ใช้บ่อย ระบบไม่ได้ติดตามจำนวนคงเหลือ"
        actions={
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            <Plus size={17} />
            เพิ่มรายการ
          </button>
        }
      />

      <section className="card items-card">
        <div className="items-toolbar">
          <SegmentedTabs
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={[
              { value: "all", label: "ทั้งหมด", count: items.length },
              { value: "office", label: "พัสดุสำนักงาน", count: officeCount },
              { value: "medical", label: "เวชภัณฑ์ที่มิใช่ยา", count: medicalCount },
            ]}
          />
          <div className="items-toolbar__right">
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
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <EmptyState
            icon={<Boxes size={28} />}
            title={items.length === 0 ? "ยังไม่มีรายการ" : "ไม่พบรายการที่ตรงกัน"}
            description={
              items.length === 0
                ? "เพิ่มรายการและกำหนดหน่วยนับเพื่อเริ่มสร้างใบเบิก"
                : "ลองปรับตัวกรองหรือคำค้นหาใหม่อีกครั้ง"
            }
            action={
              <button type="button" className="btn btn--soft" onClick={openAdd}>
                <Plus size={16} />
                เพิ่มรายการ
              </button>
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table items-table">
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>รายการ</th>
                  <th>ประเภท</th>
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
                      <DepartmentBadge departmentId={item.departmentId} short subtle />
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

        <footer className="items-footer">
          <span>
            แสดง {formatQty(filteredItems.length)} จาก {formatQty(items.length)} รายการ
          </span>
          <span>
            {formatQty(officeCount)} พัสดุสำนักงาน · {formatQty(medicalCount)} เวชภัณฑ์
          </span>
        </footer>
      </section>

      <div className="history-tip">
        <span className="history-tip__icon">
          <ArrowRight size={17} />
        </span>
        <p>
          หน่วยนับที่กำหนดไว้จะแสดงในช่องจำนวนของใบเบิก
          และระบบจะไม่ติดตามหรือตัดจำนวนคงเหลือ
        </p>
      </div>

      <ItemEditorDialog
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        defaultDepartment={departmentFilter === "all" ? "office" : departmentFilter}
      />

      <Modal
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="ลบรายการ?"
        subtitle={deletingItem ? `${deletingItem.code} · ${deletingItem.name}` : ""}
        icon={<Trash2 size={21} />}
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
          หากรายการนี้ถูกใช้ในใบเบิกแล้ว ระบบจะไม่อนุญาตให้ลบ
          กรุณาแก้ไขข้อมูลแทน
        </p>
      </Modal>
    </div>
  );
}
