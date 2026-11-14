import { useEffect, useState } from "react";
import { AlertTriangle, Ban } from "lucide-react";
import type { Requisition } from "../types";
import { useAppStore } from "../store/AppStore";
import { Modal } from "./Modal";
import { Field } from "./ui";
import { useToast } from "./Toast";

export function CancelDialog({
  requisition,
  open,
  onClose,
}: {
  requisition: Requisition | null;
  open: boolean;
  onClose: () => void;
}) {
  const { cancelRequisition } = useAppStore();
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
    }
  }, [open, requisition?.id]);

  if (!requisition) return null;

  const handleCancel = () => {
    if (!reason.trim()) {
      setError("กรุณาระบุเหตุผลการยกเลิก");
      return;
    }
    const result = cancelRequisition(requisition.id, reason);
    if (!result.ok) {
      setError(result.message ?? "ยกเลิกใบเบิกไม่สำเร็จ");
      return;
    }
    toast.success(`ยกเลิกใบเบิก ${requisition.number} แล้ว`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ยกเลิกใบเบิก"
      subtitle={`${requisition.number} · ${requisition.requester.name}`}
      icon={<Ban size={21} />}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            ไม่ยกเลิก
          </button>
          <button type="button" className="btn btn--danger" onClick={handleCancel}>
            <Ban size={16} />
            ยืนยันยกเลิก
          </button>
        </>
      }
    >
      <div className="cancel-dialog">
        <p className="form-note form-note--warn">
          การยกเลิกไม่สามารถย้อนกลับได้ ใบเบิกที่ยกเลิกแล้วยังเปิดดูและพิมพ์ซ้ำได้
        </p>
        <Field label="เหตุผลการยกเลิก" required>
          <textarea
            className="text-area"
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="เช่น เบิกซ้ำซ้อน, ข้อมูลไม่ถูกต้อง"
            autoFocus
          />
        </Field>
        {error && (
          <p className="form-error">
            <AlertTriangle size={15} />
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
