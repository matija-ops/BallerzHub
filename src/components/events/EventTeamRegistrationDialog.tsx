import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Tables } from "@/types/supabase.types";

const EVENT_CATEGORIES = [
  "Herren A",
  "Herren B",
  "Damen",
  "U18 m",
  "U18 w",
  "U16 m",
  "U16 w",
] as const;

type EventTeam = Tables<"event_teams">;

type EventTeamRegistrationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  isSubmitting: boolean;
  error: string | null;

  team?: EventTeam | null;
  playerNames?: string[];

  onSubmit: (params: {
    teamName: string;
    category: string;
    playerNames: string[];
  }) => Promise<boolean>;

  onDelete?: () => Promise<boolean>;
};

function EventTeamRegistrationDialog({
  open,
  onOpenChange,
  isSubmitting,
  error,
  team,
  playerNames: initialPlayerNames = [],
  onSubmit,
  onDelete,
}: EventTeamRegistrationDialogProps) {
  const isEditing = Boolean(team);

  const [teamName, setTeamName] = useState("");
  const [category, setCategory] = useState("");
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTeamName(team?.team_name ?? "");
    setCategory(team?.category ?? "");

    setPlayerNames([
      initialPlayerNames[0] ?? "",
      initialPlayerNames[1] ?? "",
      initialPlayerNames[2] ?? "",
      initialPlayerNames[3] ?? "",
    ]);
  }, [open, team, initialPlayerNames]);

  const updatePlayerName = (index: number, value: string) => {
    setPlayerNames((current) =>
      current.map((name, playerIndex) => (playerIndex === index ? value : name))
    );
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const success = await onSubmit({
      teamName: teamName.trim(),
      category,
      playerNames: playerNames.map((name) => name.trim()),
    });

    if (success) {
      onOpenChange(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || !team) {
      return;
    }

    const confirmed = window.confirm(
      "Möchtest du dieses Team wirklich löschen?"
    );

    if (!confirmed) {
      return;
    }

    const success = await onDelete();

    if (success) {
      onOpenChange(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Team bearbeiten" : "Team anmelden"}
            </DialogTitle>

            <DialogDescription>
              {isEditing
                ? "Bearbeite die Daten deines angemeldeten Teams."
                : "Melde dein Team für dieses 3x3-Event an."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-team-name">Teamname</Label>

              <Input
                id="event-team-name"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="z. B. Dunk Masters"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-team-category">Kategorie</Label>

              <Select
                value={category}
                onValueChange={(value) => setCategory(value ?? "")}
                disabled={isSubmitting}
              >
                <SelectTrigger id="event-team-category">
                  <SelectValue placeholder="Kategorie auswählen" />
                </SelectTrigger>

                <SelectContent>
                  {EVENT_CATEGORIES.map((eventCategory) => (
                    <SelectItem key={eventCategory} value={eventCategory}>
                      {eventCategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Spieler</Label>

                <p className="mt-1 text-sm text-muted-foreground">
                  Bis zu 4 Spielernamen eintragen.
                </p>
              </div>

              <div className="grid gap-3">
                {playerNames.map((playerName, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`event-team-player-${index}`}>
                      Spieler {index + 1}
                    </Label>

                    <Input
                      id={`event-team-player-${index}`}
                      value={playerName}
                      onChange={(event) =>
                        updatePlayerName(index, event.target.value)
                      }
                      placeholder={`Name von Spieler ${index + 1}`}
                      disabled={isSubmitting}
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  void handleDelete();
                }}
                disabled={isSubmitting}
                className="sm:mr-auto"
              >
                Löschen
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? "Wird gespeichert …"
                  : "Wird angemeldet …"
                : isEditing
                  ? "Änderungen speichern"
                  : "Team anmelden"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EventTeamRegistrationDialog;
