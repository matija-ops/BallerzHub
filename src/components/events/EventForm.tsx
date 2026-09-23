import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
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
  onSubmit: (values: EventFormValues) => Promise<void>;
};

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
    value: "offen",
    label: "Offen",
  },
];

function EventForm({ event, isSubmitting, onSubmit }: EventFormProps) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoadingCourts, setIsLoadingCourts] = useState(true);
  const [courtError, setCourtError] = useState<string | null>(null);

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

  const is3x3 = category.trim().toLowerCase() === "3x3";

  /*
   * Courts laden
   */
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

  /*
   * Formular beim Bearbeiten mit den
   * vorhandenen Eventdaten befüllen.
   */
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

  /*
   * Wenn die Kategorie von 3x3 auf ein
   * normales Event geändert wird, entfernen
   * wir die 3x3-spezifische Altersgruppe.
   *
   * max_teams wird auf 0 gesetzt, weil
   * 0 im bestehenden EventDetailPage-Code
   * "kein aktives Teamlimit" bedeutet.
   */
  useEffect(() => {
    if (!is3x3) {
      form.setValue("age_group", "");

      if (form.getValues("max_teams") !== 0) {
        form.setValue("max_teams", 0);
      }
    }
  }, [is3x3, form]);

  async function handleSubmit(values: EventFormValues) {
    await onSubmit(values);
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Name */}

      <div className="space-y-2">
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

      <div className="space-y-2">
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

      <div className="space-y-2">
        <label className="text-sm font-medium">Kategorie</label>

        <Select
          value={form.watch("category")}
          onValueChange={(value) =>
            form.setValue("category", value, {
              shouldValidate: true,
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
        <div className="space-y-2">
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

        <div className="space-y-2">
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

      <div className="space-y-2">
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

      <div className="space-y-2">
        <label className="text-sm font-medium">Court</label>

        <Select
          value={form.watch("court_id")}
          onValueChange={(value) =>
            form.setValue("court_id", value, {
              shouldValidate: true,
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

      {/* 3x3-Bereich */}

      {is3x3 && (
        <div className="space-y-6 rounded-xl border bg-muted/30 p-5">
          <div>
            <h2 className="font-semibold">3x3-Einstellungen</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Diese Angaben werden nur für 3x3-Events benötigt.
            </p>
          </div>

          {/* Altersgruppe */}

          <div className="space-y-2">
            <label className="text-sm font-medium">Altersgruppe</label>

            <Select
              value={form.watch("age_group")}
              onValueChange={(value) =>
                form.setValue("age_group", value, {
                  shouldValidate: true,
                })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Altersgruppe auswählen" />
              </SelectTrigger>

              <SelectContent>
                {ageGroups.map((ageGroup) => (
                  <SelectItem key={ageGroup.value} value={ageGroup.value}>
                    {ageGroup.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

      {/* Submit */}

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
