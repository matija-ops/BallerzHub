import { Button } from "@base-ui/react/button";
import { LocateFixed } from "lucide-react";

interface CourtLocationButtonProps {
  onLocate: () => void;
  isLocating: boolean;
}

export function CourtLocationButton({
  onLocate,
  isLocating,
}: CourtLocationButtonProps) {
  return (
    <Button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        onLocate();
      }}
      disabled={isLocating}
      aria-label="Meinen Standort anzeigen"
      className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LocateFixed className={`h-5 w-5${isLocating ? "animate-pulse" : ""}`} />
    </Button>
  );
}
