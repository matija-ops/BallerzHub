import { useState } from "react";
import { AlertTriangle, Upload, X } from "lucide-react";

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

interface CourtReportDialogProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (
    category: string,
    description: string,
    images: File[]
  ) => Promise<boolean>;
}

export function CourtReportDialog({
  isSubmitting,
  error,
  onSubmit,
}: CourtReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setValidationError(null);
    setSuccessMessage(null);

    if (!category) {
      setValidationError("Bitte wähle eine Kategorie aus.");
      return;
    }

    if (!description.trim()) {
      setValidationError("Bitte beschreibe das Problem.");
      return;
    }

    if (images.length === 0) {
      setValidationError("Bitte lade mindestens ein Foto des Problems hoch.");
      return;
    }

    if (images.length > 5) {
      setValidationError("Du kannst maximal 5 Bilder hochladen.");
      return;
    }

    const success = await onSubmit(category, description.trim(), images);

    if (success) {
      setSuccessMessage("Problem erfolgreich gemeldet.");

      setCategory("");
      setDescription("");
      setImages([]);
      setOpen(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setValidationError(null);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedImages = Array.from(event.target.files ?? []);

    if (selectedImages.length === 0) {
      return;
    }

    const remainingSlots = 5 - images.length;

    if (remainingSlots <= 0) {
      setValidationError("Du kannst maximal 5 Bilder hochladen.");
      event.target.value = "";
      return;
    }

    if (selectedImages.length > remainingSlots) {
      setValidationError(
        `Du kannst noch ${remainingSlots} ${
          remainingSlots === 1 ? "Bild" : "Bilder"
        } hinzufügen.`
      );
      event.target.value = "";
      return;
    }

    const newImages = [...images, ...selectedImages];

    setImages(newImages);
    setValidationError(null);

    // Ermöglicht, dieselbe Datei später erneut auszuwählen.
    event.target.value = "";
  };

  const removeImage = (indexToRemove: number) => {
    setImages((currentImages) =>
      currentImages.filter((_, index) => index !== indexToRemove)
    );

    setValidationError(null);
  };

  return (
    <div className="space-y-3">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          render={
            <Button type="button" variant="outline" className="w-full">
              <AlertTriangle className="h-4 w-4" />
              Problem melden
            </Button>
          }
        />

        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Problem melden</DialogTitle>

            <DialogDescription>
              Melde ein Problem an diesem Court. Du kannst bis zu 5 Bilder
              hochladen.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="court-report-category"
                className="text-sm font-medium"
              >
                Kategorie
              </label>

              <Select
                value={category}
                onValueChange={setCategory}
                disabled={isSubmitting}
              >
                <SelectTrigger id="court-report-category">
                  <SelectValue placeholder="Kategorie auswählen" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Beschädigter Korb">
                    Beschädigter Korb
                  </SelectItem>

                  <SelectItem value="Boden">Boden</SelectItem>

                  <SelectItem value="Beleuchtung">Beleuchtung</SelectItem>

                  <SelectItem value="Verschmutzung">Verschmutzung</SelectItem>

                  <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="court-report-description"
                className="text-sm font-medium"
              >
                Beschreibung
              </label>

              <Textarea
                id="court-report-description"
                placeholder="Beschreibe das Problem möglichst genau …"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={isSubmitting}
                rows={5}
              />
            </div>

            <div className="space-y-3">
              <label
                htmlFor="court-report-image"
                className="text-sm font-medium"
              >
                Fotos
              </label>

              <Input
                id="court-report-image"
                type="file"
                accept="image/*"
                multiple
                disabled={isSubmitting || images.length >= 5}
                onChange={handleImageChange}
              />

              <p className="text-xs text-muted-foreground">
                {images.length} von 5 Bildern ausgewählt.
              </p>

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image, index) => {
                    const previewUrl = URL.createObjectURL(image);

                    return (
                      <div
                        key={`${image.name}-${image.lastModified}-${index}`}
                        className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                      >
                        <img
                          src={previewUrl}
                          alt={`Hochgeladenes Bild ${index + 1}`}
                          className="h-full w-full object-cover"
                          onLoad={() => URL.revokeObjectURL(previewUrl)}
                        />

                        <button
                          type="button"
                          aria-label={`Bild ${index + 1} entfernen`}
                          disabled={isSubmitting}
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className="absolute right-0 bottom-0 left-0 bg-black/50 px-2 py-1">
                          <p className="truncate text-xs text-white">
                            Bild {index + 1}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {images.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  <span>Noch keine Bilder ausgewählt.</span>
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
                disabled={isSubmitting}
                onClick={() => setOpen(false)}
              >
                Abbrechen
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Wird gesendet …" : "Problem melden"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {successMessage && (
        <p className="text-sm font-medium text-green-600" role="status">
          {successMessage}
        </p>
      )}
    </div>
  );
}
