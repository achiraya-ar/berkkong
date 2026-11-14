import {
  CalendarDays,
  FileText,
  History,
  LogOut,
  Settings,
} from "lucide-react";
import { BrandMark } from "./BrandMark";
import type { AppView } from "../navigation";
import type { Settings as AppSettings } from "../types";
import { formatThaiDateLongWithDay } from "../lib/date";

export function TopBar({
  view,
  settings,
  onNavigate,
  onLogout,
}: {
  view: AppView;
  settings: AppSettings;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
}) {
  const active =
    view.name === "home" || view.name === "requisition"
      ? "home"
      : view.name === "history" || view.name === "history-detail"
        ? "history"
        : view.name === "settings"
          ? "settings"
          : null;

  const items = [
    { key: "home", label: "ใบเบิก", icon: FileText, view: { name: "home" } as AppView },
    {
      key: "history",
      label: "ประวัติการเบิก",
      icon: History,
      view: { name: "history" } as AppView,
    },
    { key: "settings", label: "ตั้งค่า", icon: Settings, view: { name: "settings" } as AppView },
  ];

  return (
    <header className="topbar">
      <button
        className="topbar__brand"
        type="button"
        onClick={() => onNavigate({ name: "home" })}
        aria-label="กลับหน้าแรก BerkKong"
      >
        <BrandMark size={42} className="topbar__logo" />
        <span className="topbar__brand-text">
          <strong>BerkKong</strong>
          <small>ระบบเบิกของ · {settings.orgName}</small>
        </span>
      </button>

      <nav className="topbar__nav" aria-label="เมนูหลัก">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className={`nav-item ${active === item.key ? "nav-item--active" : ""}`}
              onClick={() => onNavigate(item.view)}
            >
              <Icon size={17.5} strokeWidth={2.05} />
              <span className="nav-item__label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="topbar__right">
        <span className="topbar__date">
          <CalendarDays size={14.5} />
          {formatThaiDateLongWithDay(new Date())}
        </span>
        <button
          type="button"
          className="icon-button topbar__logout"
          aria-label="ออกจากระบบ"
          title="ออกจากระบบ"
          onClick={onLogout}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
