import type { AppData, DepartmentProfile } from "../types";
import { currentBuddhistYear } from "./date";

function blankProfile(): DepartmentProfile {
  return {
    workUnit: "",
    requester: { name: "", position: "" },
    receiver: { name: "", position: "" },
    orderer: { name: "", position: "" },
    payer: { name: "", position: "" },
    systemHead: { name: "", position: "" },
  };
}

/**
 * Default data for a fresh install. Everything starts empty so no sample
 * hospital, staff, or catalog items are shown before the user configures them.
 */
export function seedData(): AppData {
  return {
    schemaVersion: 4,
    settings: {
      orgName: "",
      addressedTo: "",
      noteOfficer: "",
      departments: {
        office: blankProfile(),
        medical: blankProfile(),
      },
      numbering: {
        office: {
          prefix: "OFF",
          year: currentBuddhistYear(),
          next: 1,
        },
        medical: {
          prefix: "MED",
          year: currentBuddhistYear(),
          next: 1,
        },
      },
    },
    items: [],
    requisitions: [],
  };
}
