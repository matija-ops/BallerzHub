import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface EventFilterValues {
  date: string;
  location: string;
  category: string;
  ageGroup: string;
}

interface EventFiltersProps {
  filters: EventFilterValues;
  onChange: (filters: EventFilterValues) => void;
  onReset: () => void;
  resultCount: number;
}

const categoryOptions = [
  { value: "all", label: "Alle Kategorien" },
  { value: "pickup", label: "Pickup" },
  { value: "tournament", label: "Turnier" },
  { value: "training", label: "Training" },
  { value: "3x3", label: "3x3" },
  { value: "other", label: "Sonstiges" },
];

const ageGroupOptions = [
  { value: "all", label: "Alle Altersklassen" },
  { value: "U14", label: "U14" },
  { value: "U16", label: "U16" },
  { value: "U18", label: "U18" },
  { value: "U21", label: "U21" },
  { value: "Herren", label: "Herren" },
  { value: "Damen", label: "Damen" },
  { value: "Ü30", label: "Ü30" },
  { value: "offen", label: "Offen" },
];

function EventFilterFields({
  filters,
  onChange,
}: {
  filters: EventFilterValues;
  onChange: (filters: EventFilterValues) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="event-filter-date" className="text-sm font-medium">
          Datum
        </label>

        <Input
          id="event-filter-date"
          type="date"
          value={filters.date}
          onChange={(event) =>
            onChange({
              ...filters,
              date: event.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="event-filter-location" className="text-sm font-medium">
          Ort
        </label>

        <Input
          id="event-filter-location"
          type="search"
          placeholder="Ort suchen …"
          value={filters.location}
          onChange={(event) =>
            onChange({
              ...filters,
              location: event.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Kategorie</label>

        <Select
          value={filters.category}
          onValueChange={(value) =>
            onChange({
              ...filters,
              category: value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Kategorie auswählen" />
          </SelectTrigger>

          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Altersklasse</label>

        <Select
          value={filters.ageGroup}
          onValueChange={(value) =>
            onChange({
              ...filters,
              ageGroup: value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Altersklasse auswählen" />
          </SelectTrigger>

          <SelectContent>
            {ageGroupOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function EventFilters({
  filters,
  onChange,
  onReset,
  resultCount,
}: EventFiltersProps) {
  const hasActiveFilters =
    filters.date !== "" ||
    filters.location !== "" ||
    filters.category !== "all" ||
    filters.ageGroup !== "all";

  return (
    <div className="space-y-4">
      {/* Desktop */}
      <div className="hidden rounded-xl border p-4 md:block">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Events filtern</h2>

            <p className="text-sm text-muted-foreground">
              {resultCount} {resultCount === 1 ? "Event" : "Events"} gefunden
            </p>
          </div>

          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
              Zurücksetzen
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label
              htmlFor="event-filter-date-desktop"
              className="text-sm font-medium"
            >
              Datum
            </label>

            <Input
              id="event-filter-date-desktop"
              type="date"
              value={filters.date}
              onChange={(event) =>
                onChange({
                  ...filters,
                  date: event.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="event-filter-location-desktop"
              className="text-sm font-medium"
            >
              Ort
            </label>

            <Input
              id="event-filter-location-desktop"
              type="search"
              placeholder="Ort suchen …"
              value={filters.location}
              onChange={(event) =>
                onChange({
                  ...filters,
                  location: event.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Kategorie</label>

            <Select
              value={filters.category}
              onValueChange={(value) =>
                onChange({
                  ...filters,
                  category: value,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kategorie auswählen" />
              </SelectTrigger>

              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Altersklasse</label>

            <Select
              value={filters.ageGroup}
              onValueChange={(value) =>
                onChange({
                  ...filters,
                  ageGroup: value,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Altersklasse auswählen" />
              </SelectTrigger>

              <SelectContent>
                {ageGroupOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="w-full">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  aktiv
                </span>
              )}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Events filtern</DialogTitle>
            </DialogHeader>

            <EventFilterFields filters={filters} onChange={onChange} />

            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onReset}
                disabled={!hasActiveFilters}
              >
                <RotateCcw className="h-4 w-4" />
                Zurücksetzen
              </Button>

              <p className="text-sm text-muted-foreground">
                {resultCount} {resultCount === 1 ? "Event" : "Events"}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default EventFilters;
