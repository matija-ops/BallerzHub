import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

type Municipality = Tables<"municipalities">;
type CourtReport = Tables<"court_reports">;

type ReportWithCourt = CourtReport & {
  court: {
    id: string;
    name: string;
  } | null;
};

type ReportStatus = "neu" | "in progress" | "resolved";

const normalizeStatus = (status: string | null): ReportStatus => {
  const normalized = status?.trim().toLowerCase();

  if (normalized === "in progress") {
    return "in progress";
  }

  if (normalized === "resolved") {
    return "resolved";
  }

  return "neu";
};

const getStatusLabel = (status: string | null) => {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case "in progress":
      return "In Progress";

    case "resolved":
      return "Resolved";

    default:
      return "Neu";
  }
};

export default function MunicipalityDashboardPage() {
  const [municipality, setMunicipality] = useState<Municipality | null>(null);

  const [reports, setReports] = useState<ReportWithCourt[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error("Kein eingeloggter Benutzer gefunden.");
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

        if (!municipalityUser?.municipality_id) {
          throw new Error("Dem Benutzer ist keine Kommune zugeordnet.");
        }

        const municipalityId = municipalityUser.municipality_id;

        const [
          { data: municipalityData, error: municipalityError },
          { data: reportsData, error: reportsError },
        ] = await Promise.all([
          supabase
            .from("municipalities")
            .select("*")
            .eq("id", municipalityId)
            .maybeSingle(),

          supabase
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
            .order("created_at", {
              ascending: false,
            }),
        ]);

        if (municipalityError) {
          throw municipalityError;
        }

        if (reportsError) {
          throw reportsError;
        }

        if (!isMounted) {
          return;
        }

        setMunicipality(municipalityData);

        setReports((reportsData ?? []) as ReportWithCourt[]);
      } catch (loadError) {
        console.error(
          "Kommunen-Dashboard konnte nicht geladen werden:",
          loadError
        );

        if (isMounted) {
          setError("Das Dashboard konnte nicht geladen werden.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const statistics = useMemo(() => {
    return reports.reduce(
      (result, report) => {
        const status = normalizeStatus(report.status);

        if (status === "neu") {
          result.neu += 1;
        }

        if (status === "in progress") {
          result.inProgress += 1;
        }

        if (status === "resolved") {
          result.resolved += 1;
        }

        return result;
      },
      {
        neu: 0,
        inProgress: 0,
        resolved: 0,
      }
    );
  }, [reports]);

  /**
   * Im unteren Bereich werden ausschließlich
   * offene Meldungen angezeigt.
   */
  const openReports = useMemo(() => {
    return reports.filter((report) => {
      const status = normalizeStatus(report.status);

      return status === "neu" || status === "in progress";
    });
  }, [reports]);

  const filteredReports = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return openReports.filter((report) => {
      const normalizedStatus = normalizeStatus(report.status);

      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        report.id,
        report.category,
        report.description,
        report.status,
        report.court?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [openReports, search, statusFilter]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0d151d] px-8 py-8 text-white">
        <div className="mx-auto max-w-[1920px]">
          <p className="text-sm text-slate-400">Dashboard wird geladen …</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0d151d] px-8 py-8 text-white">
        <div className="mx-auto max-w-[1920px]">
          <Card className="border-white/10 bg-[#182231]">
            <CardContent className="py-8">
              <p className="text-sm text-red-400">{error}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d151d] px-8 py-8 text-white">
      <div className="mx-auto max-w-[1920px] space-y-16">
        {/* Header */}
        <section>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

          <p className="mt-5 text-lg text-slate-300">
            {municipality?.name ?? "Kommune"}
          </p>
        </section>

        {/* Statistik */}
        <section className="grid grid-cols-3 gap-4">
          {/* Neu */}
          <Card>
            <CardHeader>
              <CardTitle className="leading-none font-semibold text-[#ff3344]">
                Neu
              </CardTitle>
            </CardHeader>

            <CardContent className="flex h-full flex-col justify-end">
              <p className="text-2xl leading-none font-bold text-[#ff3344]">
                {statistics.neu}
              </p>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="leading-none font-semibold text-[#ffb800]">
                In Progress
              </CardTitle>
            </CardHeader>

            <CardContent className="flex h-full flex-col justify-end">
              <p className="text-2xl leading-none font-bold text-[#ffb800]">
                {statistics.inProgress}
              </p>
            </CardContent>
          </Card>

          {/* Resolved */}
          <Card>
            <CardHeader>
              <CardTitle className="leading-none font-semibold text-[#00c853]">
                Resolved
              </CardTitle>
            </CardHeader>

            <CardContent className="flex h-full flex-col justify-end">
              <p className="text-2xl leading-none font-bold text-[#00c853]">
                {statistics.resolved}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Offene Tickets */}
        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Offene Tickets
            </h2>

            <p className="mt-2 text-lg text-slate-400">
              Meldungen deiner Kommune
            </p>
          </div>

          {/* Suche und Filter */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Meldungen durchsuchen..."
                className="h-12 border-white/10 bg-[#182231] pl-11 text-white placeholder:text-slate-500"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value ?? "")}
            >
              <SelectTrigger
                size="default"
                className="h-12 w-full border-white/10 bg-[#182231] text-white"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Alle offenen</SelectItem>

                <SelectItem value="neu">Neu</SelectItem>

                <SelectItem value="in progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ticket-Liste */}
          {filteredReports.length === 0 ? (
            <Card className="border-white/10 bg-[#182231]">
              <CardContent className="py-8 text-center">
                <p className="font-medium text-white">Keine offenen Tickets</p>

                <p className="mt-1 text-sm text-slate-400">
                  Aktuell wurden keine offenen Meldungen gefunden.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Link
                  key={report.id}
                  to={`/municipality/reports/${report.id}`}
                  className="block"
                >
                  <Card className="border-white/10 bg-[#182231] transition-colors hover:bg-[#1d2939]">
                    <CardContent className="flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {report.court ? (
                            <Link
                              to={`/courts/${report.court.id}`}
                              onClick={(event) => event.stopPropagation()}
                              className="text-sm font-medium text-white hover:underline"
                            >
                              {report.court.name}
                            </Link>
                          ) : (
                            <p className="text-sm font-medium text-white">
                              Unbekannter Court
                            </p>
                          )}

                          <Badge className="border-red-500/30 bg-red-500 px-2 py-0.5 text-xs text-white hover:bg-red-500">
                            {getStatusLabel(report.status)}
                          </Badge>
                        </div>

                        {report.category && (
                          <p className="text-xs text-slate-400">
                            {report.category}
                          </p>
                        )}

                        {report.description && (
                          <p className="line-clamp-1 text-xs text-slate-400">
                            {report.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-xs font-medium text-white">
                          {getStatusLabel(report.status)}
                        </p>

                        {report.created_at && (
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {new Date(report.created_at).toLocaleDateString(
                              "de-DE"
                            )}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
