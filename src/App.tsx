import { useEffect, useState } from "react";
import { useAppStore } from "./store/AppStore";
import type { AppView } from "./navigation";
import type { DepartmentId, Person } from "./types";
import { DEPARTMENTS } from "./types";
import { loadLastUser, saveLastUser } from "./lib/storage";
import { LoginScreen } from "./components/LoginScreen";
import { TopBar } from "./components/TopBar";
import { HomePage } from "./components/HomePage";
import { RequisitionPage } from "./components/RequisitionPage";
import { HistoryPage } from "./components/HistoryPage";
import { HistoryDetailPage } from "./components/HistoryDetailPage";
import { SettingsPage } from "./components/SettingsPage";
import { PrintPage } from "./components/PrintPage";

function AppShell() {
  const { settings } = useAppStore();
  const [view, setView] = useState<AppView>({ name: "home" });
  const [currentUser, setCurrentUser] = useState<Person | null>(null);
  const [lastUser, setLastUser] = useState<Person | null>(() => loadLastUser());

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    const title = !currentUser
      ? "เข้าสู่ระบบ"
      : view.name === "home"
        ? "เลือกประเภทใบเบิก"
        : view.name === "requisition"
          ? DEPARTMENTS[view.departmentId].pageTitle
          : view.name === "history"
              ? "ประวัติการเบิก"
              : view.name === "history-detail"
                ? "รายละเอียดใบเบิก"
                : view.name === "settings"
                  ? "ตั้งค่า"
                  : "พิมพ์ใบเบิก";
    document.title = `BerkKong — ${title}`;
  }, [view, currentUser]);

  const navigate = (next: AppView) => setView(next);

  const openDepartment = (departmentId: DepartmentId) =>
    setView({ name: "requisition", departmentId });

  const handleLogin = () => {
    const user: Person = lastUser ?? {
      name: settings.departments.office.requester.name || "ผู้ใช้งาน",
      position: settings.departments.office.requester.position,
    };
    setCurrentUser(user);
    setLastUser(user);
    saveLastUser(user);
    setView({ name: "home" });
  };

  if (!currentUser) {
    return (
      <LoginScreen onLogin={handleLogin} />
    );
  }

  if (view.name === "print") {
    return (
      <PrintPage
        id={view.id}
        auto={view.auto}
        returnTo={view.returnTo}
        onNavigate={navigate}
      />
    );
  }

  return (
    <div className="app-shell">
      <div className="app-decor app-decor--top" aria-hidden="true" />
      <div className="app-decor app-decor--bottom" aria-hidden="true" />
      <TopBar
        view={view}
        settings={settings}
        onNavigate={navigate}
        onLogout={() => {
          setCurrentUser(null);
          setView({ name: "home" });
        }}
      />
      <main className="app-main">
        {view.name === "home" && (
          <HomePage
            onOpenDepartment={openDepartment}
            onOpenDraft={(draft) =>
              navigate({
                name: "requisition",
                departmentId: draft.departmentId,
                draftId: draft.id,
              })
            }
          />
        )}
        {view.name === "requisition" && (
          <RequisitionPage
            key={`${view.departmentId}-${view.draftId ?? "new"}`}
            departmentId={view.departmentId}
            draftId={view.draftId}
            onNavigate={navigate}
          />
        )}
        {view.name === "history" && (
          <HistoryPage
            onNavigate={navigate}
            onCreateNew={() => navigate({ name: "home" })}
          />
        )}
        {view.name === "history-detail" && (
          <HistoryDetailPage id={view.id} onNavigate={navigate} />
        )}
        {view.name === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}

export default AppShell;
