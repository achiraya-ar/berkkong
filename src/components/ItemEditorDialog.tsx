import { useEffect, useState } from "react";
import { Building2, PackagePlus, Save, Stethoscope } from "lucide-react";
import type { CatalogItem, DepartmentId } from "../types";
import { DEPARTMENTS } from "../types";
import { useAppStore, type ItemInput } from "../store/AppStore";
import { Modal } from "./Modal";
import { Field } from "./ui";
import { useToast } from "./Toast";

export function ItemEditorDialog({
  open,
  onClose,
  defaultDepartment = "office",
  item,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  defaultDepartment?: DepartmentId;
  item?: CatalogItem | null;
  onSaved?: (item: CatalogItem) => void;
}) {
  const { saveItem } = useAppStore();
  const toast = useToast();
  const departmentId = item?.departmentId ?? defaultDepartment;
  const department = DEPARTMENTS[departmentId];
  const CategoryIcon = departmentId === "medical" ? Stethoscope : Building2;
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setDetail(item?.detail ?? "");
    setUnit(item?.unit ?? "");
    setError("");
  }, [open, item, defaultDepartment]);

  const handleSave = () => {
    if (!name.trim()) {
      setError("กรุณากรอกชื่อรายการ");
      return;
    }
    if (!unit.trim()) {
      setError("กรุณากรอกหน่วยนับ");
      return;
    }
    const input: ItemInput = {
      id: item?.id,
      departmentId,
      code: item?.code,
      name: name.trim(),
      detail: detail.trim(),
      unit: unit.trim(),
      note: "",
    };
    const saved = saveItem(input);
    toast.success(item ? "แก้ไขรายการแล้ว" : "เพิ่มรายการแล้ว", saved.code);
    onSaved?.(saved);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
      subtitle={`${department.pageTitle} · ${department.shortLabel}`}
      icon={<PackagePlus size={21} />}
      tone={departmentId}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className={`btn ${departmentId === "office" ? "btn--yellow" : "btn--primary"}`}
            onClick={handleSave}
          >
            <Save size={16} />
            บันทึก
          </button>
        </>
      }
    >
      <div className="item-editor">
        <div className={`item-editor__category item-editor__category--${departmentId}`}>
          <CategoryIcon size={17} />
          <span>
            <small>หมวดที่จะเพิ่ม</small>
            <strong>{department.pageTitle}</strong>
          </span>
        </div>

        <div className="form-grid form-grid--2">
          <Field label="ชื่อรายการ" required className="form-grid__span2">
            <input
              className="text-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="เช่น กระดาษ A4 80 แกรม"
              autoFocus
            />
          </Field>
          <Field label="หน่วยนับ" required hint="หน่วยที่ใช้กรอกจำนวนในใบเบิก">
            <input
              className="text-input"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              placeholder="เช่น รีม, กล่อง, แพ็ค"
            />
          </Field>
          <Field label="รายละเอียด">
            <input
              className="text-input"
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="เช่น 12 ด้าม / กล่อง"
            />
          </Field>
        </div>

        {item && <p className="form-note">รหัสรายการ: {item.code}</p>}
        {error && <p className="form-error">{error}</p>}
      </div>
    </Modal>
  );
}
