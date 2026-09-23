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
      onClick={onLocate}
      disabled={isLocating}
      aria-label="Meinen Standorf anzeigen"
      className="1-11 gb-white flex h-8 w-8 items-center justify-center rounded-md bg-blue-400 transition disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LocateFixed className={`h-5 w-5${isLocating ? "animate-pulse" : ""}`} />
    </Button>
  );
}
