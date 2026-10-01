import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/lib/supabase";

import {
  eventFormSchema,
  type EventFormValues,
} from "@/lib/events/event-validation";

import type { Tables } from "@/types/supabase.types";

type Event = Tables<"events">;
type Court = Tables<"courts">;

type EventFormProps = {
  event?: Event;
  isSubmitting: boolean;
  onSubmit: (values: EventFormValues, images: File[]) => Promise<void>;
};

const MAX_EVENT_IMAGES = 2;
const MAX_EVENT_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_EVENT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const eventCategories = [
  {
    value: "pickup",
    label: "Pickup",
  },
  {
    value: "tournament",
    label: "Turnier",
  },
  {
    value: "training",
    label: "Training",
  },
  {
    value: "3x3",
    label: "3x3",
  },
  {
    value: "other",
    label: "Sonstiges",
  },
];

const ageGroups = [
  {
    value: "U14",
    label: "U14",
  },
  {
    value: "U16",
    label: "U16",
  },
  {
    value: "U18",
    label: "U18",
  },
  {
    value: "U21",
    label: "U21",
  },
  {
    value: "Herren",
    label: "Herren",
  },
  {
    value: "Damen",
    label: "Damen",
  },
  {
    value: "Ü30",
    label: "Ü30",
  },
  {
    value: "Offen",
    label: "Offen",
  },
];

function EventForm({ event, isSubmitting, onSubmit }: EventFormProps) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoadingCourts, setIsLoadingCourts] = useState(true);
  const [courtError, setCourtError] = useState<string | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const previewUrlsRef = useRef<string[]>([]);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),

    defaultValues: {
      name: event?.name ?? "",
      description: event?.description ?? "",
      location: event?.location ?? "",
      event_date: event?.event_date ?? "",
      event_time: event?.event_time?.slice(0, 5) ?? "",
      category: event?.category ?? "",
      age_group: event?.age_group ?? "",
      max_teams: event?.max_teams ?? 0,
      court_id: event?.court_id ?? "",
    },
  });

  const category = form.watch("category");
  const ageGroupValue = form.watch("age_group");

  const is3x3 = category.trim().toLowerCase() === "3x3";

  const selectedAgeGroups = ageGroupValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const allAgeGroupsSelected = selectedAgeGroups.length === ageGroups.length;

  useEffect(() => {
    async function loadCourts() {
      setIsLoadingCourts(true);
      setCourtError(null);

      const { data, error } = await supabase
        .from("courts")
        .select("*")
        .order("name", {
          ascending: true,
        });

      if (error) {
        setCourts([]);
        setCourtError("Die Courts konnten nicht geladen werden.");
        setIsLoadingCourts(false);
        return;
      }

      setCourts(data ?? []);
      setIsLoadingCourts(false);
    }

    void loadCourts();
  }, []);

  useEffect(() => {
    if (!event) {
      return;
    }

    form.reset({
      name: event.name,
      description: event.description,
      location: event.location,
      event_date: event.event_date,
      event_time: event.event_time.slice(0, 5),
      category: event.category,
      age_group: event.age_group,
      max_teams: event.max_teams,
      court_id: event.court_id,
    });
  }, [event, form]);

  useEffect(() => {
    if (!is3x3) {
      form.setValue("age_group", "");

      if (form.getValues("max_teams") !== 0) {
        form.setValue("max_teams", 0);
      }
    }
  }, [is3x3, form]);

  useEffect(() => {
    previewUrlsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, []);

  function handleAgeGroupChange(
    ageGroup: string,
    checked: boolean | "indeterminate"
  ) {
    const currentValues = form
      .getValues("age_group")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    let nextValues: string[];

    if (checked === true) {
      nextValues = currentValues.includes(ageGroup)
        ? currentValues
        : [...currentValues, ageGroup];
    } else {
      nextValues = currentValues.filter((value) => value !== ageGroup);
    }

    form.setValue("age_group", nextValues.join(","), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  function handleToggleAllAgeGroups() {
    if (allAgeGroupsSelected) {
      form.setValue("age_group", "", {
        shouldValidate: true,
        shouldDirty: true,
      });

      return;
    }

    form.setValue(
      "age_group",
      ageGroups.map((ageGroup) => ageGroup.value).join(","),
      {
        shouldValidate: true,
        shouldDirty: true,
      }
    );
  }

  function handleImagesChange(event: React.ChangeEvent<HTMLInputElement>) {
    setImageError(null);

    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const remainingSlots = MAX_EVENT_IMAGES - images.length;

    if (remainingSlots <= 0) {
      setImageError(`Du kannst maximal ${MAX_EVENT_IMAGES} Bilder hochladen.`);
      event.target.value = "";
      return;
    }

    const filesToAdd = selectedFiles.slice(0, remainingSlots);

    if (selectedFiles.length > remainingSlots) {
      setImageError(`Du kannst maximal ${MAX_EVENT_IMAGES} Bilder hochladen.`);
    }

    const invalidFile = filesToAdd.find(
      (file) => !ALLOWED_EVENT_IMAGE_TYPES.includes(file.type)
    );

    if (invalidFile) {
      setImageError("Bitte verwende nur JPG-, PNG- oder WebP-Bilder.");
      event.target.value = "";
      return;
    }

    const tooLargeFile = filesToAdd.find(
      (file) => file.size > MAX_EVENT_IMAGE_SIZE
    );

    if (tooLargeFile) {
      setImageError("Jedes Bild darf maximal 5 MB groß sein.");
      event.target.value = "";
      return;
    }

    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));

    setImages((current) => [...current, ...filesToAdd]);

    setImagePreviews((current) => [...current, ...newPreviews]);

    event.target.value = "";
  }

  function handleRemoveImage(index: number) {
    const previewToRemove = imagePreviews[index];

    if (previewToRemove) {
      URL.revokeObjectURL(previewToRemove);
    }

    setImages((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );

    setImagePreviews((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );

    setImageError(null);
  }

  async function handleSubmit(values: EventFormValues) {
    await onSubmit(values, images);
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Eventname */}

      <div className="space-y-3">
        <label htmlFor="event-name" className="text-sm font-medium">
          Eventname
        </label>

        <Input
          id="event-name"
          placeholder="z. B. Basketball Summer Cup"
          disabled={isSubmitting}
          {...form.register("name")}
        />

        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Beschreibung */}

      <div className="space-y-3">
        <label htmlFor="event-description" className="text-sm font-medium">
          Beschreibung
        </label>

        <Textarea
          id="event-description"
          placeholder="Beschreibe dein Event ..."
          className="min-h-32 resize-none"
          disabled={isSubmitting}
          {...form.register("description")}
        />

        {form.formState.errors.description && (
          <p className="text-sm text-destructive">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      {/* Kategorie */}

      <div className="space-y-3">
        <label className="text-sm font-medium">Kategorie</label>

        <Select
          value={form.watch("category")}
          onValueChange={(value) =>
            form.setValue("category", value ?? "", {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Kategorie auswählen" />
          </SelectTrigger>

          <SelectContent>
            {eventCategories.map((categoryOption) => (
              <SelectItem
                key={categoryOption.value}
                value={categoryOption.value}
              >
                {categoryOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {form.formState.errors.category && (
          <p className="text-sm text-destructive">
            {form.formState.errors.category.message}
          </p>
        )}
      </div>

      {/* Datum + Uhrzeit */}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <label htmlFor="event-date" className="text-sm font-medium">
            Datum
          </label>

          <Input
            id="event-date"
            type="date"
            disabled={isSubmitting}
            {...form.register("event_date")}
          />

          {form.formState.errors.event_date && (
            <p className="text-sm text-destructive">
              {form.formState.errors.event_date.message}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <label htmlFor="event-time" className="text-sm font-medium">
            Uhrzeit
          </label>

          <Input
            id="event-time"
            type="time"
            disabled={isSubmitting}
            {...form.register("event_time")}
          />

          {form.formState.errors.event_time && (
            <p className="text-sm text-destructive">
              {form.formState.errors.event_time.message}
            </p>
          )}
        </div>
      </div>

      {/* Ort */}

      <div className="space-y-3">
        <label htmlFor="event-location" className="text-sm font-medium">
          Ort
        </label>

        <Input
          id="event-location"
          placeholder="z. B. Stadtpark Court"
          disabled={isSubmitting}
          {...form.register("location")}
        />

        {form.formState.errors.location && (
          <p className="text-sm text-destructive">
            {form.formState.errors.location.message}
          </p>
        )}
      </div>

      {/* Court */}

      <div className="space-y-3">
        <label className="text-sm font-medium">Court</label>

        <Select
          value={form.watch("court_id")}
          onValueChange={(value) =>
            form.setValue("court_id", value ?? "", {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
          disabled={isSubmitting || isLoadingCourts || courts.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                isLoadingCourts
                  ? "Courts werden geladen ..."
                  : "Court auswählen"
              }
            />
          </SelectTrigger>

          <SelectContent>
            {courts.map((court) => (
              <SelectItem key={court.id} value={court.id}>
                {court.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {courtError && (
          <p className="text-sm text-destructive" role="alert">
            {courtError}
          </p>
        )}

        {form.formState.errors.court_id && (
          <p className="text-sm text-destructive">
            {form.formState.errors.court_id.message}
          </p>
        )}
      </div>

      {/* Bilder */}

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Bilder</label>

          <p className="mt-1 text-xs text-muted-foreground">
            Optional · maximal 2 Bilder · JPG, PNG oder WebP · maximal 5 MB pro
            Bild
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {imagePreviews.map((preview, index) => (
            <div
              key={preview}
              className="relative overflow-hidden rounded-xl border bg-muted"
            >
              <img
                src={preview}
                alt={`Eventbild ${index + 1}`}
                className="aspect-video w-full object-cover"
              />

              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => handleRemoveImage(index)}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />

                <span className="sr-only">Bild entfernen</span>
              </Button>
            </div>
          ))}

          {images.length < MAX_EVENT_IMAGES && (
            <label
              htmlFor="event-images"
              className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 transition-colors hover:bg-muted/60"
            >
              <ImagePlus className="mb-2 h-7 w-7 text-muted-foreground" />

              <span className="text-sm font-medium">Bild hinzufügen</span>

              <span className="mt-1 text-xs text-muted-foreground">
                {images.length}/{MAX_EVENT_IMAGES}
              </span>

              <input
                id="event-images"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                disabled={isSubmitting}
                onChange={handleImagesChange}
              />
            </label>
          )}
        </div>

        {imageError && (
          <p className="text-sm text-destructive" role="alert">
            {imageError}
          </p>
        )}
      </div>

      {/* 3x3 Einstellungen */}

      {is3x3 && (
        <div className="space-y-6 rounded-xl border bg-muted/30 p-5">
          <div>
            <h2 className="font-semibold">3x3-Einstellungen</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Diese Angaben werden nur für 3x3-Events benötigt.
            </p>
          </div>

          {/* Altersgruppen */}

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Altersgruppen</label>

              <p className="mt-1 text-xs text-muted-foreground">
                Du kannst mehrere Altersgruppen auswählen.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleAllAgeGroups}
              disabled={isSubmitting}
            >
              {allAgeGroupsSelected ? "Alle abwählen" : "Alle auswählen"}
            </Button>

            <div className="grid gap-3 sm:grid-cols-2">
              {ageGroups.map((ageGroup) => {
                const isChecked = selectedAgeGroups.includes(ageGroup.value);

                return (
                  <label
                    key={ageGroup.value}
                    htmlFor={`event-age-group-${ageGroup.value}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`event-age-group-${ageGroup.value}`}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleAgeGroupChange(ageGroup.value, checked)
                      }
                      disabled={isSubmitting}
                    />

                    <span className="text-sm font-medium">
                      {ageGroup.label}
                    </span>
                  </label>
                );
              })}
            </div>

            {selectedAgeGroups.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Ausgewählt: {selectedAgeGroups.join(", ")}
              </p>
            )}

            {form.formState.errors.age_group && (
              <p className="text-sm text-destructive">
                {form.formState.errors.age_group.message}
              </p>
            )}
          </div>

          {/* Maximale Teamanzahl */}

          <div className="space-y-2">
            <label htmlFor="event-max-teams" className="text-sm font-medium">
              Maximale Teamanzahl
            </label>

            <Input
              id="event-max-teams"
              type="number"
              min={1}
              step={1}
              placeholder="z. B. 16"
              disabled={isSubmitting}
              {...form.register("max_teams", {
                valueAsNumber: true,
              })}
            />

            <p className="text-xs text-muted-foreground">Beispiel: 16 Teams.</p>

            {form.formState.errors.max_teams && (
              <p className="text-sm text-destructive">
                {form.formState.errors.max_teams.message}
              </p>
            )}
          </div>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || isLoadingCourts || courts.length === 0}
      >
        {isSubmitting
          ? "Event wird gespeichert ..."
          : event
            ? "Änderungen speichern"
            : "Event erstellen"}
      </Button>
    </form>
  );
}

export default EventForm;
