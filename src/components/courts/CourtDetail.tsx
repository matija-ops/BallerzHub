import { useState } from "react";
import {
  Accessibility,
  AlertTriangle,
  ArrowLeft,
  CircleCheck,
  CircleX,
  Lightbulb,
  MapPin,
  Users,
  Wrench,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { CourtActions } from "@/components/courts/CourtActions";
import CourtReviews from "@/components/courts/CourtReviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCourt } from "@/hooks/courts/useCourt";

interface CourtDetailProps {
  courtId: string;
}

function getReportStatusLabel(status: string) {
  switch (status.trim().toLowerCase()) {
    case "neu":
      return "Neu";
    case "open":
      return "Offen";
    case "in progress":
      return "In Bearbeitung";
    case "active":
      return "Aktiv";
    case "resolved":
      return "Behoben";
    default:
      return status;
  }
}

function CourtDetail({ courtId }: CourtDetailProps) {
  const navigate = useNavigate();

  const [checkinAuthError, setCheckinAuthError] = useState<string | null>(null);

  const {
    court,
    images,
    reviews,
    checkins,
    currentUserId,
    openReports,

    isFavorite,
    isFavoriteLoading,
    favoriteError,
    toggleFavorite,

    isCheckedIn,
    isCheckinLoading,
    checkinError,
    toggleCheckin,

    isReportSubmitting,
    reportError,
    createReport,

    isReviewSubmitting,
    reviewError,
    createReview,
    updateReview,
    deleteReview,

    isLoading,
    error,
    refetch,
  } = useCourt(courtId);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Court wird geladen …</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p>Der Court konnte nicht geladen werden.</p>

        <Button type="button" onClick={() => void refetch()}>
          Erneut versuchen
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/courts")}
        >
          Zurück zu den Courts
        </Button>
      </main>
    );
  }

  if (!court) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p>Dieser Court wurde nicht gefunden.</p>

        <Button type="button" onClick={() => navigate("/courts")}>
          Zurück zu den Courts
        </Button>
      </main>
    );
  }

  const statusConfig = {
    active: {
      label: "Aktiv",
      icon: CircleCheck,
      variant: "default" as const,
    },
    maintenance: {
      label: "Wartung",
      icon: Wrench,
      variant: "secondary" as const,
    },
    closed: {
      label: "Geschlossen",
      icon: CircleX,
      variant: "destructive" as const,
    },
  };

  const currentStatus = statusConfig[
    court.status as keyof typeof statusConfig
  ] ?? {
    label: court.status,
    icon: AlertTriangle,
    variant: "outline" as const,
  };

  const StatusIcon = currentStatus.icon;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
        <div className="mb-2">
          <Button
            asChild
            variant="ghost"
            className="mt-4 mb-6 text-orange-500 hover:bg-transparent hover:text-orange-400"
          >
            <Link to="/courts" className="inline-flex items-center gap-2">
              <ArrowLeft className="size-5 shrink-0" />
              <span>Zurück zur Map</span>
            </Link>
          </Button>
        </div>

        {images.length > 0 && (
          <section
            aria-label="Court-Bilder"
            className="overflow-hidden rounded-xl"
          >
            <div className="flex gap-3 overflow-x-auto">
              {images.map((image) => (
                <img
                  key={image.id}
                  src={image.image_url}
                  alt={court.name}
                  className="h-64 min-w-[85%] rounded-xl object-cover"
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{court.name}</h1>

              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />

                <span>
                  {court.latitude}, {court.longitude}
                </span>
              </div>
            </div>

            <Badge
              variant={currentStatus.variant}
              className="flex items-center gap-1.5"
            >
              <StatusIcon className="h-4 w-4" />
              {currentStatus.label}
            </Badge>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Court-Informationen</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Court-Typ</p>

              <p className="font-medium">{court.type}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Anzahl Körbe</p>

              <p className="font-medium">{court.hoops_count}</p>
            </div>

            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />

              <div>
                <p className="text-sm text-muted-foreground">Beleuchtung</p>

                <p className="font-medium">
                  {court.has_lightning ? "Vorhanden" : "Nicht vorhanden"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Accessibility className="h-4 w-4 text-muted-foreground" />

              <div>
                <p className="text-sm text-muted-foreground">
                  Barrierefreiheit
                </p>

                <p className="font-medium">
                  {court.is_accessible ? "Barrierefrei" : "Nicht barrierefrei"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Offene Meldungen
            </CardTitle>
          </CardHeader>

          <CardContent>
            {openReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Für diesen Court gibt es aktuell keine offenen Meldungen.
              </p>
            ) : (
              <div className="space-y-3">
                {openReports.map((report) => (
                  <Link
                    key={report.id}
                    to={`/reports/${report.id}`}
                    className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">{report.category}</p>

                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {report.description}
                        </p>
                      </div>

                      <Badge variant="destructive">
                        {getReportStatusLabel(report.status)}
                      </Badge>
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">
                      Gemeldet am{" "}
                      {new Date(report.created_at).toLocaleDateString("de-DE")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <CourtActions
          isAuthenticated={Boolean(currentUserId)}
          isFavorite={isFavorite}
          isFavoriteLoading={isFavoriteLoading}
          favoriteError={favoriteError}
          onToggleFavorite={toggleFavorite}
          isReportSubmitting={isReportSubmitting}
          reportError={reportError}
          onCreateReport={createReport}
        />

        <CourtReviews
          reviews={reviews}
          currentUserId={currentUserId}
          isSubmitting={isReviewSubmitting}
          reviewError={reviewError}
          onCreateReview={createReview}
          onUpdateReview={updateReview}
          onDeleteReview={deleteReview}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Check-ins
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="text-2xl font-bold">{checkins.length}</p>

              <p className="text-sm text-muted-foreground">
                aktuell eingecheckt
              </p>
            </div>

            <Button
              type="button"
              className="w-full"
              variant={isCheckedIn ? "outline" : "default"}
              disabled={isCheckinLoading}
              onClick={() => {
                if (!currentUserId) {
                  setCheckinAuthError(
                    "Du musst eingeloggt sein, um diese Aktion auszuführen."
                  );
                  return;
                }

                setCheckinAuthError(null);
                void toggleCheckin();
              }}
            >
              {isCheckinLoading
                ? "Wird aktualisiert …"
                : isCheckedIn
                  ? "Auschecken"
                  : "Einchecken"}
            </Button>

            {checkinAuthError && (
              <p className="text-sm text-destructive" role="alert">
                {checkinAuthError}
              </p>
            )}

            {isCheckedIn && (
              <p className="text-sm text-green-600">
                Du bist aktuell bei diesem Court eingecheckt.
              </p>
            )}

            {checkinError && (
              <p className="text-sm text-destructive" role="alert">
                {checkinError}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default CourtDetail;
