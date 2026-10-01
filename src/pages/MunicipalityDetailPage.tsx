import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ArrowLeft } from "lucide-react";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

import { getStatusLabel, REPORT_STATUSES } from "@/constants/report-status";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CourtReport = Tables<"court_reports">;
type Court = Tables<"courts">;

type ReportWithCourt = CourtReport & {
  court: Pick<Court, "id" | "name"> | null;
};

function getStatusBadgeClassName(status: string) {
  switch (status.trim().toLowerCase()) {
    case "neu":
      return "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-50";

    case "in progress":
      return "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-50";

    case "resolved":
      return "border-green-200 bg-green-50 text-green-800 hover:bg-green-50";

    default:
      return "";
  }
}

function MunicipalityDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<ReportWithCourt | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      if (!reportId) {
        setIsLoading(false);
        return;
      }

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error("Du bist nicht eingeloggt.");
        }

        const { data: municipalityUser, error: municipalityUserError } =
          await supabase
            .from("municipality_users")
            .select("municipality_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (municipalityUserError) {
          throw municipalityUserError;
        }

        if (!municipalityUser) {
          throw new Error("Du bist keiner Kommune als Benutzer zugeordnet.");
        }

        const { data: reportData, error: reportError } = await supabase
          .from("court_reports")
          .select(
            `
            *,
            court:courts!court_reports_court_id_fkey (
              id,
              name
            )
          `
          )
          .eq("id", reportId)
          .eq("municipality_id", municipalityUser.municipality_id)
          .maybeSingle();

        if (reportError) {
          throw reportError;
        }

        setReport(reportData);
        setSelectedStatus(reportData?.status ?? "");

        if (reportData?.image_url) {
          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
              .from("court-reports")
              .createSignedUrl(reportData.image_url, 60 * 60);

          if (signedUrlError) {
            throw signedUrlError;
          }

          setImageUrl(signedUrlData.signedUrl);
        } else {
          setImageUrl(null);
        }
      } catch (loadError) {
        console.error("Meldung konnte nicht geladen werden:", loadError);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [reportId]);

  const handleStatusChange = async () => {
    if (!reportId || !report) {
      return;
    }

    if (
      !REPORT_STATUSES.includes(
        selectedStatus as (typeof REPORT_STATUSES)[number]
      )
    ) {
      setSaveError("Ungültiger Status.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("Du bist nicht eingeloggt.");
      }

      const { data: municipalityUser, error: municipalityUserError } =
        await supabase
          .from("municipality_users")
          .select("municipality_id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (municipalityUserError) {
        throw municipalityUserError;
      }

      if (!municipalityUser) {
        throw new Error("Du bist keiner Kommune als Benutzer zugeordnet.");
      }

      const { data: updatedReport, error: updateError } = await supabase
        .from("court_reports")
        .update({
          status: selectedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .eq("municipality_id", municipalityUser.municipality_id)
        .select(
          `
          *,
          court:courts!court_reports_court_id_fkey (
            id,
            name
          )
        `
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      setReport(updatedReport);
      setSelectedStatus(updatedReport.status);
      setSaveSuccess("Der Status wurde erfolgreich aktualisiert.");
    } catch (updateError) {
      console.error("Status konnte nicht aktualisiert werden:", updateError);

      setSaveError(
        updateError instanceof Error
          ? updateError.message
          : "Der Status konnte nicht aktualisiert werden."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolveReport = async () => {
    if (!reportId || !report) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("Du bist nicht eingeloggt.");
      }

      const { data: municipalityUser, error: municipalityUserError } =
        await supabase
          .from("municipality_users")
          .select("municipality_id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (municipalityUserError) {
        throw municipalityUserError;
      }

      if (!municipalityUser) {
        throw new Error("Du bist keiner Kommune als Benutzer zugeordnet.");
      }

      const { data: updatedReport, error: updateError } = await supabase
        .from("court_reports")
        .update({
          status: "resolved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .eq("municipality_id", municipalityUser.municipality_id)
        .select(
          `
          *,
          court:courts!court_reports_court_id_fkey (
            id,
            name
          )
        `
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      setReport(updatedReport);
      setSelectedStatus(updatedReport.status);
      setSaveSuccess("Die Meldung wurde als erledigt markiert.");
    } catch (updateError) {
      console.error(
        "Meldung konnte nicht als erledigt markiert werden:",
        updateError
      );

      setSaveError(
        updateError instanceof Error
          ? updateError.message
          : "Die Meldung konnte nicht als erledigt markiert werden."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto p-6">
        <p className="text-muted-foreground">Meldung wird geladen...</p>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Die Meldung konnte nicht gefunden werden.
            </p>

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
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl p-6">
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

      <div className="mt-4 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Meldung verwalten</h1>

            <p className="mt-2 text-muted-foreground">
              Details zur gemeldeten Problematik am Basketball-Court.
            </p>
          </div>

          <Badge className={getStatusBadgeClassName(report.status)}>
            {getStatusLabel(report.status)}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{report.court?.name ?? "Unbekannter Court"}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Meldungs-ID
              </p>

              <p className="mt-1 font-mono text-sm break-all">{report.id}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Kategorie
              </p>

              <p className="mt-1">{report.category}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Beschreibung
              </p>

              <p className="mt-1 leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Gemeldet am
              </p>

              <p className="mt-1">
                {report.created_at
                  ? new Date(report.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "Kein Datum"}
              </p>
            </div>

            {imageUrl && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Foto
                </p>

                <img
                  src={imageUrl}
                  alt={`Foto zur Meldung am ${
                    report.court?.name ?? "Basketball-Court"
                  }`}
                  className="mt-2 max-h-[500px] w-full rounded-lg border object-cover"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status ändern</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value ?? "")}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Status auswählen" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="neu">Neu</SelectItem>
                  <SelectItem value="in progress">In Bearbeitung</SelectItem>
                  <SelectItem value="resolved">Behoben</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                onClick={handleStatusChange}
                disabled={
                  isSaving ||
                  !selectedStatus ||
                  selectedStatus === report.status
                }
              >
                {isSaving ? "Wird gespeichert..." : "Status speichern"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleResolveReport}
                disabled={isSaving || report.status === "resolved"}
              >
                {report.status === "resolved"
                  ? "Bereits erledigt"
                  : "Als erledigt markieren"}
              </Button>
            </div>

            {saveSuccess && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                {saveSuccess}
              </div>
            )}

            {saveError && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default MunicipalityDetailPage;
