import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = "md",
  tone,
  children,
  footer,
  closeOnBackdrop = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "office" | "medical";
  children: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
}) {
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => {
      const focusable = cardRef.current?.querySelector<HTMLElement>(
        "input, select, textarea, button:not([disabled])",
      );
      focusable?.focus();
    }, 40);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        className={`modal modal--${size} ${tone ? `modal--${tone}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="modal__head">
          <div className="modal__heading">
            {icon && <span className="modal__icon">{icon}</span>}
            <div>
              <h2 id={titleId} className="modal__title">
                {title}
              </h2>
              {subtitle && <div className="modal__subtitle">{subtitle}</div>}
            </div>
          </div>
          <button
            className="icon-button icon-button--muted"
            type="button"
            aria-label="ปิด"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
