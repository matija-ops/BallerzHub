import { useState } from "react";
import type { FormEvent } from "react";
import { ImagePlus, MapPin, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MapLocation = [number, number];

interface CourtProposalDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  isSubmitting?: boolean;
  error?: string | null;

  location: MapLocation | null;
  onLocationChange: (location: MapLocation | null) => void;
  onRequestLocationSelection: () => void;

  onSubmit?: (
    name: string,
    latitude: number,
    longitude: number,
    type: string,
    hoopsCount: number,
    description: string,
    images: File[]
  ) => Promise<boolean>;
}

export function CourtProposalDialog({
  isOpen,
  onOpenChange,
  isSubmitting = false,
  error = null,
  location,
  onLocationChange,
  onRequestLocationSelection,
  onSubmit,
}: CourtProposalDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = isOpen ?? internalOpen;

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [hoopsCount, setHoopsCount] = useState("");
  const [description, setDescription] = useState("");

  const [images, setImages] = useState<File[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setDialogOpen = (nextOpen: boolean) => {
    setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    setDialogOpen(nextOpen);

    if (!nextOpen) {
      setValidationError(null);
      setSuccess(false);
    }
  };

  const handleSelectLocation = () => {
    setValidationError(null);
    setSuccess(false);

    setDialogOpen(false);
    onRequestLocationSelection();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    setImages((currentImages) => {
      const updatedImages = [...currentImages, ...selectedFiles];

      if (updatedImages.length > 5) {
        setValidationError("Du kannst maximal 5 Bilder hochladen.");
        return updatedImages.slice(0, 5);
      }

      setValidationError(null);
      return updatedImages;
    });

    event.target.value = "";
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((currentImages) =>
      currentImages.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setValidationError(null);
    setSuccess(false);

    if (!name.trim()) {
      setValidationError("Bitte gib einen Namen ein.");
      return;
    }

    if (!type) {
      setValidationError("Bitte wähle einen Court-Typ aus.");
      return;
    }

    const parsedHoopsCount = Number(hoopsCount);

    if (!Number.isInteger(parsedHoopsCount) || parsedHoopsCount < 1) {
      setValidationError("Bitte gib eine gültige Anzahl an Körben ein.");
      return;
    }

    if (!location) {
      setValidationError("Bitte wähle einen Standort aus.");
      return;
    }

    if (!description.trim()) {
      setValidationError("Bitte beschreibe den Court.");
      return;
    }

    if (images.length > 5) {
      setValidationError("Du kannst maximal 5 Bilder hochladen.");
      return;
    }

    if (!onSubmit) {
      setValidationError("Der Court-Vorschlag konnte nicht gesendet werden.");
      return;
    }

    const submitted = await onSubmit(
      name.trim(),
      location[0],
      location[1],
      type,
      parsedHoopsCount,
      description.trim(),
      images
    );

    if (!submitted) {
      return;
    }

    setSuccess(true);

    setName("");
    setType("");
    setHoopsCount("");
    setDescription("");
    setImages([]);
    onLocationChange(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="icon"
            aria-label="Neuen Court vorschlagen"
            className="h-12 w-12 rounded-xl"
          >
            <Plus className="h-6 w-6" />
          </Button>
        }
      />

      <DialogContent
        portalClassName="relative z-[6000]"
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Neuen Court vorschlagen</DialogTitle>

          <DialogDescription>
            Schlage einen neuen Basketball-Court für die Plattform vor.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <>
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Der Court wurde erfolgreich vorgeschlagen.
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  setDialogOpen(false);
                  setSuccess(false);
                  setValidationError(null);
                }}
              >
                Schließen
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="court-proposal-name"
                className="text-sm font-medium"
              >
                Name
              </label>

              <Input
                id="court-proposal-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="z. B. Stadtpark Court"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Court-Typ</label>

                <Select
                  value={type}
                  onValueChange={setType}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Typ auswählen" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Outdoor">Outdoor</SelectItem>
                    <SelectItem value="Indoor">Indoor</SelectItem>
                    <SelectItem value="3x3">3x3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="court-proposal-hoops"
                  className="text-sm font-medium"
                >
                  Anzahl Körbe
                </label>

                <Input
                  id="court-proposal-hoops"
                  type="number"
                  min={1}
                  step={1}
                  value={hoopsCount}
                  onChange={(event) => setHoopsCount(event.target.value)}
                  placeholder="z. B. 2"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Standort</label>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSelectLocation}
                disabled={isSubmitting}
              >
                <MapPin className="h-4 w-4" />

                {location
                  ? "Standort auf Karte ändern"
                  : "Standort auf Karte auswählen"}
              </Button>

              {location && (
                <p className="text-xs text-muted-foreground">
                  Standort: {location[0].toFixed(6)}, {location[1].toFixed(6)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="court-proposal-description"
                className="text-sm font-medium"
              >
                Beschreibung
              </label>

              <Textarea
                id="court-proposal-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Weitere Informationen zum Court …"
                rows={4}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="court-proposal-images"
                className="text-sm font-medium"
              >
                Bilder{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>

              <label
                htmlFor="court-proposal-images"
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition-colors hover:bg-muted/50"
              >
                <ImagePlus className="mb-2 h-6 w-6 text-muted-foreground" />

                <span className="text-sm font-medium">Bilder auswählen</span>

                <span className="mt-1 text-xs text-muted-foreground">
                  Bis zu 5 Bilder hinzufügen ({images.length}/5).
                </span>
              </label>

              <Input
                id="court-proposal-images"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
                disabled={isSubmitting || images.length >= 5}
              />

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image, index) => (
                    <div
                      key={`${image.name}-${image.lastModified}-${index}`}
                      className="group relative overflow-hidden rounded-lg border"
                    >
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Ausgewähltes Bild ${index + 1}`}
                        className="aspect-square w-full object-cover"
                      />

                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-7 w-7"
                        onClick={() => handleRemoveImage(index)}
                        disabled={isSubmitting}
                        aria-label={`Bild ${index + 1} entfernen`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(validationError || error) && (
              <p className="text-sm text-destructive" role="alert">
                {validationError ?? error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Wird gesendet …" : "Court vorschlagen"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
