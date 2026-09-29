import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReport } from "@/hooks/reports/useReport";

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

function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const { report, images, isLoading, error } = useReport(reportId ?? "");

  if (!reportId) {
    return (
      <main className="container mx-auto max-w-3xl p-4 sm:p-6">
        <p className="text-muted-foreground">Keine Meldungs-ID angegeben.</p>

        <Button
          asChild
          variant="link"
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="size-5 shrink-0" />
            <span>Zurück</span>
          </span>
        </Button>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="container mx-auto max-w-3xl p-4 sm:p-6">
        <p className="text-muted-foreground">Meldung wird geladen...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto max-w-3xl p-4 sm:p-6">
        <p className="text-destructive">{error}</p>

        <Button
          asChild
          variant="link"
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="size-5 shrink-0" />
            <span>Zurück</span>
          </span>
        </Button>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="container mx-auto max-w-3xl p-4 sm:p-6">
        <p className="text-muted-foreground">Meldung wurde nicht gefunden.</p>

        <Button
          asChild
          variant="link"
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="size-5 shrink-0" />
            <span>Zurück</span>
          </span>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-3xl p-4 sm:p-6">
      <Button
        asChild
        variant="link"
        className="mt-4"
        onClick={() => navigate(-1)}
      >
        <span className="inline-flex items-center gap-2">
          <ArrowLeft className="size-5 shrink-0" />
          <span>Zurück</span>
        </span>
      </Button>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Meldungsdetails</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Court</p>

            {report.court?.id ? (
              <Link
                to={`/courts/${report.court.id}`}
                className="font-medium text-primary hover:underline"
              >
                {report.court.name}
              </Link>
            ) : (
              <p className="font-medium">
                {report.court?.name ?? "Unbekannter Court"}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Kommune</p>

            <p className="font-medium">
              {report.municipality?.name ?? "Unbekannte Kommune"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Kategorie</p>

            <p className="font-medium">{report.category}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Beschreibung</p>

            <p className="whitespace-pre-wrap">{report.description}</p>
          </div>

          <div>
            <p className="mb-2 text-sm text-muted-foreground">Status</p>

            <Badge>{getStatusLabel(report.status)}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Erstellt am</p>

              <p>{new Date(report.created_at).toLocaleString("de-DE")}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Zuletzt aktualisiert
              </p>

              <p>{new Date(report.updated_at).toLocaleString("de-DE")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default ReportDetailPage;
