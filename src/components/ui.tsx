import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Building2,
  CheckCircle2,
  FilePenLine,
  Stethoscope,
  XCircle,
} from "lucide-react";
import {
  DEPARTMENTS,
  STATUS_META,
  type DepartmentId,
  type RequisitionStatus,
} from "../types";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="page-head__text">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </header>
  );
}

export function DepartmentBadge({
  departmentId,
  short = false,
  subtle = false,
}: {
  departmentId: DepartmentId;
  short?: boolean;
  subtle?: boolean;
}) {
  const department = DEPARTMENTS[departmentId];
  const Icon = departmentId === "medical" ? Stethoscope : Building2;
  return (
    <span
      className={`dept-badge dept-badge--${department.accent} ${
        subtle ? "dept-badge--subtle" : ""
      }`}
    >
      <Icon size={13} strokeWidth={2.2} />
      {short ? department.shortLabel : department.pageTitle}
    </span>
  );
}

export function StatusBadge({
  status,
  withIcon = true,
}: {
  status: RequisitionStatus;
  withIcon?: boolean;
}) {
  const meta = STATUS_META[status];
  const Icon =
    status === "draft"
      ? FilePenLine
      : status === "cancelled"
        ? XCircle
        : CheckCircle2;
  return (
    <span className={`status-badge status-badge--${meta.tone}`}>
      {withIcon && <Icon size={12.5} strokeWidth={2.3} />}
      {meta.label}
    </span>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
  className = "",
}: {
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`field ${className}`.trim()}>
      <span className="field__label">
        {label}
        {required && <em className="field__required">*</em>}
      </span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`empty-state ${compact ? "empty-state--compact" : ""}`}>
      <span className="empty-state__icon">{icon}</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  note,
  tone = "red",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: "red" | "yellow" | "green" | "dark";
}) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__icon">{icon}</span>
      <div className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        <strong className="stat-card__value">{value}</strong>
        {note && <span className="stat-card__note">{note}</span>}
      </div>
    </div>
  );
}

export function PaperPreview({
  children,
  paperWidth = 794,
  paperHeight = 1123,
  className = "",
}: {
  children: ReactNode;
  paperWidth?: number;
  paperHeight?: number;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const update = () => {
      const width = element.clientWidth;
      if (width > 0) {
        setScale(Math.min(1, width / paperWidth));
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [paperWidth]);

  return (
    <div
      ref={viewportRef}
      className={`paper-viewport ${className}`.trim()}
      style={{ height: paperHeight * scale }}
    >
      <div
        className="paper-scale"
        style={
          {
            width: paperWidth,
            height: paperHeight,
            transform: `scale(${scale})`,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  className = "",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
  className?: string;
}) {
  return (
    <div className={`segmented ${className}`.trim()} role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={`segmented__item ${
            value === option.value ? "segmented__item--active" : ""
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {typeof option.count === "number" && (
            <span className="segmented__count">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function SettingsSection({
  id,
  icon,
  title,
  description,
  children,
  action,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section id={id} className="settings-section card" data-settings-section>
      <header className="settings-section__head">
        <span className="settings-section__icon">{icon}</span>
        <div className="settings-section__title">
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action && <div className="settings-section__action">{action}</div>}
      </header>
      <div className="settings-section__body">{children}</div>
    </section>
  );
}
