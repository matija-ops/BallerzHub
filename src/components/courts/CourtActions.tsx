import { useState } from "react";
import { AlertTriangle, Heart } from "lucide-react";

import { CourtReportDialog } from "@/components/courts/CourtReportDialog";
import { Button } from "@/components/ui/button";

interface CourtActionsProps {
  isAuthenticated: boolean;

  isFavorite: boolean;
  isFavoriteLoading: boolean;
  favoriteError: string | null;
  onToggleFavorite: () => void;

  isReportSubmitting: boolean;
  reportError: string | null;
  onCreateReport: (
    category: string,
    description: string,
    images: File[]
  ) => Promise<boolean>;
}

export function CourtActions({
  isAuthenticated,

  isFavorite,
  isFavoriteLoading,
  favoriteError,
  onToggleFavorite,

  isReportSubmitting,
  reportError,
  onCreateReport,
}: CourtActionsProps) {
  const [authError, setAuthError] = useState<string | null>(null);

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      setAuthError("Du musst eingeloggt sein, um diese Aktion auszuführen.");
      return;
    }

    setAuthError(null);
    onToggleFavorite();
  };

  const handleReportClick = () => {
    if (!isAuthenticated) {
      setAuthError("Du musst eingeloggt sein, um diese Aktion auszuführen.");
      return;
    }

    setAuthError(null);
  };

  return (
    <section aria-label="Court-Aktionen" className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant={isFavorite ? "default" : "outline"}
          disabled={isFavoriteLoading}
          onClick={handleFavoriteClick}
          className="flex-1"
        >
          <Heart className={isFavorite ? "h-4 w-4 fill-current" : "h-4 w-4"} />

          {isFavorite ? "Favorisiert" : "Favorisieren"}
        </Button>

        {isAuthenticated ? (
          <CourtReportDialog
            isSubmitting={isReportSubmitting}
            error={reportError}
            onSubmit={onCreateReport}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handleReportClick}
            className="flex-1"
          >
            <AlertTriangle className="h-4 w-4" />
            Problem melden
          </Button>
        )}
      </div>

      {(authError || favoriteError || reportError) && (
        <p className="text-sm text-destructive" role="alert">
          {authError || favoriteError || reportError}
        </p>
      )}
    </section>
  );
}
