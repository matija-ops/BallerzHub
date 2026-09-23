export const REPORT_STATUSES = ["neu", "in progress", "resolved"] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_FILTERS = [
  "all",
  "active",
  "neu",
  "in progress",
  "resolved",
] as const;

export type ReportStatusFilter = (typeof REPORT_STATUS_FILTERS)[number];

export function getStatusLabel(status: string) {
  switch (status.trim().toLowerCase()) {
    case "neu":
      return "Neu";

    case "open":
      return "Offen";

    case "in progress":
      return "In Bearbeitung";

    case "resolved":
      return "Behoben";

    case "active":
      return "Aktiv";

    default:
      return status;
  }
}

/**
 * "active" ist laut Entwicklungsplan ein Dashboard-/Filterzustand
 * und kein zusätzlicher Workflow-Schritt.
 *
 * Die bestehende Datenbank kann zusätzlich "open" enthalten.
 * Deshalb werden beide Werte als aktiv/offen berücksichtigt.
 */
export function isActiveReportStatus(status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  return normalizedStatus === "active" || normalizedStatus === "open";
}
