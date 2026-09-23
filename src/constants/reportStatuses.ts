export const REPORT_STATUSES = {
  NEW: "neu",
  IN_PROGRESS: "in progress",
  RESOLVED: "resolved",
  ACTIVE: "active",
  OPEN: "open",
} as const;

export type ReportStatus =
  (typeof REPORT_STATUSES)[keyof typeof REPORT_STATUSES];
