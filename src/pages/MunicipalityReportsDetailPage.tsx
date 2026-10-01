import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

import { getStatusLabel } from "@/constants/report-status";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

function MunicipalityReportsDetailPage() {
  const [reports, setReports] = useState<ReportWithCourt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const loadReports = async () => {
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
          .eq("municipality_id", municipalityUser.municipality_id)
          .order("created_at", { ascending: false });

        if (reportError) {
          throw reportError;
        }

        setReports(reportData ?? []);
      } catch (loadError) {
        console.error("Meldungen konnten nicht geladen werden:", loadError);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        reports
          .map((report) => report.category.trim())
          .filter((category) => category.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b, "de"));
  }, [reports]);

  const filteredReports = reports.filter((report) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query ||
      report.id.toLowerCase().includes(query) ||
      report.category.toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query) ||
      (report.court?.name ?? "").toLowerCase().includes(query);

    const normalizedStatus = report.status.trim().toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active"
        ? normalizedStatus === "active" || normalizedStatus === "open"
        : normalizedStatus === statusFilter);

    const matchesCategory =
      categoryFilter === "all" ||
      report.category.trim().toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (isLoading) {
    return (
      <main className="container mx-auto p-4 sm:p-6">
        <p className="text-muted-foreground">Meldungen werden geladen...</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Meldungen verwalten</h1>

      <p className="mt-2 text-muted-foreground">
        Hier werden die Meldungen der Kommune verwaltet.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Meldungen durchsuchen..."
          className="h-11 w-full sm:max-w-md"
        />

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "")}>
          <SelectTrigger className="h-11 w-full sm:w-[220px]">
            <SelectValue placeholder="Status auswählen" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="neu">Neu</SelectItem>
            <SelectItem value="in progress">In Bearbeitung</SelectItem>
            <SelectItem value="resolved">Behoben</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value ?? "")}>
          <SelectTrigger className="h-11 w-full sm:w-[220px]">
            <SelectValue placeholder="Kategorie auswählen" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>

            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 grid gap-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-5 sm:p-6">
              <p className="text-muted-foreground">
                {reports.length === 0
                  ? "Für diese Kommune liegen keine Meldungen vor."
                  : "Keine Meldungen für die gewählten Filter gefunden."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Link
              key={report.id}
              to={`/municipality/reports/${report.id}`}
              className="block rounded-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div>
                        <p className="font-semibold">
                          {report.court?.name ?? "Unbekannter Court"}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Meldungs-ID:{" "}
                          <span className="font-mono break-all">
                            {report.id}
                          </span>
                        </p>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Kategorie: {report.category}
                      </p>

                      <p className="text-sm leading-relaxed">
                        {report.description}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Gemeldet am:{" "}
                        {report.created_at
                          ? new Date(report.created_at).toLocaleDateString(
                              "de-DE"
                            )
                          : "Kein Datum"}
                      </p>
                    </div>

                    <div className="shrink-0 self-start">
                      <Badge>{getStatusLabel(report.status)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}

export default MunicipalityReportsDetailPage;
