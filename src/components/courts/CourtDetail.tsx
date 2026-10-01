import { useState } from "react";
import {
  Accessibility,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  ImagePlus,
  Lightbulb,
  MapPin,
  Users,
  Wrench,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { DirectionsButton } from "@/components/courts/DirectionsButton";
import { CourtActions } from "@/components/courts/CourtActions";
import CourtReviews from "@/components/courts/CourtReviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

    isImageUploading,
    imageUploadError,
    uploadCourtImages,

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
          <ArrowLeft className="size-5 shrink-0" />
          <span>Zurück</span>
        </Button>
      </main>
    );
  }

  if (!court) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p>Dieser Court wurde nicht gefunden.</p>

        <Button type="button" onClick={() => navigate("/courts")}>
          <ArrowLeft className="size-5 shrink-0" />
          <span>Zurück</span>
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

  const remainingImageSlots = 5 - images.length;


  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setSelectedImages(files.slice(0, Math.max(remainingImageSlots, 0)));
    event.target.value = "";
  };

  const handleImageUpload = async () => {
    const uploaded = await uploadCourtImages(selectedImages);

    if (uploaded) {
      setSelectedImages([]);
    }
  };

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
              <span>Zurück</span>
            </Link>
          </Button>
        </div>

        {images.length > 0 && (
          <section
            aria-label="Court-Bilder"
            className="overflow-hidden rounded-xl"
          >
            <Dialog>
              <div className="flex gap-3 overflow-x-auto">
                {images.map((image, index) => (
                  <DialogTrigger
                    key={image.id}
                    onClick={() => setActiveImageIndex(index)}
                    className="h-64 min-w-[85%] shrink-0 cursor-zoom-in overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    aria-label={`Bild ${index + 1} von ${court.name} vergrößern`}
                  >
                    <img
                      src={image.image_url}
                      alt={`${court.name} – Bild ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </DialogTrigger>
                ))}
              </div>
              <DialogContent
                className="w-[95vw] max-w-[95vw] p-2 pt-10 sm:max-w-5xl"
                aria-describedby={undefined}
                onKeyDown={(event) => {
                  if (images.length < 2) return;
                  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    event.preventDefault();
                    const direction = event.key === "ArrowLeft" ? -1 : 1;
                    setActiveImageIndex(
                      (current) => (current + direction + images.length) % images.length
                    );
                  }
                }}
              >
                <DialogTitle className="sr-only">
                  {court.name} – Bilder
                </DialogTitle>
                <img
                  src={(images[activeImageIndex] ?? images[0]).image_url}
                  alt={`${court.name} – Bild ${activeImageIndex + 1}`}
                  className="max-h-[70dvh] w-full rounded-lg object-contain"
                />
                {images.length > 1 && (
                  <div className="flex items-center justify-center gap-4 pb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Vorheriges Bild"
                      onClick={() => setActiveImageIndex(
                        (current) => (current - 1 + images.length) % images.length
                      )}
                    >
                      <ChevronLeft />
                    </Button>
                    <span className="text-sm tabular-nums" aria-live="polite" aria-atomic="true">
                      {activeImageIndex + 1} von {images.length}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Nächstes Bild"
                      onClick={() => setActiveImageIndex(
                        (current) => (current + 1) % images.length
                      )}
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </section>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5" />
              Court-Bilder hinzufügen
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Teile Fotos des Courts mit der Community. Maximal 5 Bilder pro
              Court ({images.length}/5).
            </p>

            {remainingImageSlots > 0 ? (
              <>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelection}
                  disabled={!currentUserId || isImageUploading}
                />

                {selectedImages.length > 0 && (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      {selectedImages.length} Bild
                      {selectedImages.length === 1 ? "" : "er"} ausgewählt
                    </p>
                    <Button
                      type="button"
                      onClick={() => void handleImageUpload()}
                      disabled={isImageUploading}
                    >
                      {isImageUploading ? "Wird hochgeladen …" : "Hochladen"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Die maximale Anzahl von 5 Bildern wurde erreicht.
              </p>
            )}

            {!currentUserId && (
              <p className="text-sm text-muted-foreground">
                Melde dich an, um Bilder hochzuladen.
              </p>
            )}

            {imageUploadError && (
              <p className="text-sm text-destructive" role="alert">
                {imageUploadError}
              </p>
            )}
          </CardContent>
        </Card>

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

              <DirectionsButton
                latitude={court.latitude}
                longitude={court.longitude}
                className="mt-4"
              />
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
                          {new Date(report.created_at ?? "").toLocaleDateString("de-DE")}
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
