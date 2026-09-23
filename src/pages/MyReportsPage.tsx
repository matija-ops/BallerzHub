import { useMyReports } from "@/hooks/reports/useMyReports";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

function getStatusLabel(status: string) {
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

function MyReportsPage() {
  const { reports, isLoading, error } = useMyReports();

  if (isLoading) {
    return (
      <main className="container mx-auto p-6">
        <p className="text-muted-foreground">Meldungen werden geladen...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto p-6">
        <p className="text-destructive">{error}</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Meine Meldungen</h1>

      {reports.length === 0 ? (
        <p className="text-muted-foreground">
          Du hast noch keine Meldungen erstellt.
        </p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Link
              key={report.id}
              to={`/reports/${report.id}`}
              className="block"
            >
              <Card>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-semibold">
                      {report.court?.name ?? "Unbekannter Court"}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {report.category}
                    </p>

                    <p className="mt-1 text-sm">
                      {new Date(report.created_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>

                  <Badge>{getStatusLabel(report.status)}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default MyReportsPage;
