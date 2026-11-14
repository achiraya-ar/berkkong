import type { DepartmentId } from "./types";

export type AppView =
  | { name: "home" }
  | { name: "requisition"; departmentId: DepartmentId; draftId?: string }
  | { name: "history" }
  | { name: "history-detail"; id: string }
  | { name: "settings" }
  | {
      name: "print";
      id: string;
      auto?: boolean;
      returnTo?: AppView;
    };
