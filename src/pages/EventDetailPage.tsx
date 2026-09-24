import { ArrowLeft, CalendarDays, MapPin, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useEventParticipation } from "@/hooks/events/useEventParticipation";
import { useEventParticipants } from "@/hooks/events/useEventParticipants";
import { useEventTeams } from "@/hooks/events/useEventTeams";
import { useRegisterEventTeam } from "@/hooks/events/useRegisterEventTeam";
import { useEventTeamManagement } from "@/hooks/events/useEventTeamManagement";
import { useDeleteEvent } from "@/hooks/events/useDeleteEvent";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

import EventTeamRegistrationDialog from "@/components/events/EventTeamRegistrationDialog";
import CourtLocationMap from "@/components/courts/CourtLocationMap";

type Event = Tables<"events">;
type Court = Tables<"courts">;

function formatEventDate(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatEventTime(time: string) {
  return time.slice(0, 5);
}

function isEventPast(event: Event) {
  const eventDateTime = new Date(`${event.event_date}T${event.event_time}`);

  return eventDateTime.getTime() < Date.now();
}

function isThreeVsThreeEvent(event: Event) {
  return event.category.trim().toLowerCase().includes("3x3");
}

function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [court, setCourt] = useState<Court | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);

  const [selectedTeam, setSelectedTeam] =
    useState<Tables<"event_teams"> | null>(null);

  const [selectedTeamPlayerNames, setSelectedTeamPlayerNames] = useState<
    string[]
  >([]);

  const [teamSuccessMessage, setTeamSuccessMessage] = useState<string | null>(
    null
  );

  const {
    participantCount,
    isParticipating,
    isLoading: isParticipationLoading,
    isSubmitting: isParticipationSubmitting,
    error: participationError,
    participate,
    withdraw,
  } = useEventParticipation({
    eventId: eventId ?? "",
  });

  const {
    participants,
    isLoading: isParticipantsLoading,
    error: participantsError,
    refetch: refetchParticipants,
  } = useEventParticipants({
    eventId: eventId ?? "",
  });

  const {
    teams,
    isLoading: isTeamsLoading,
    error: teamsError,
    refetch: refetchTeams,
  } = useEventTeams({
    eventId: eventId ?? "",
  });

  const {
    registerTeam,
    isSubmitting: isRegisteringTeam,
    error: registerTeamError,
  } = useRegisterEventTeam();

  const {
    updateTeam,
    deleteTeam,
    isSubmitting: isManagingTeam,
    error: managementTeamError,
  } = useEventTeamManagement();

  const { deleteEvent, isDeleting, error: deleteEventError } = useDeleteEvent();

  /*
   * Event und zugehörigen Court laden
   */
  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      setCourt(null);
      setError("Kein Event angegeben.");
      setIsLoading(false);
      return;
    }

    const currentEventId = eventId;

    async function fetchEvent() {
      setIsLoading(true);
      setError(null);
      setCourt(null);

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", currentEventId)
        .maybeSingle();

      if (eventError) {
        setEvent(null);
        setError(eventError.message);
        setIsLoading(false);
        return;
      }

      if (!eventData) {
        setEvent(null);
        setError("Das Event wurde nicht gefunden.");
        setIsLoading(false);
        return;
      }

      setEvent(eventData);

      /*
       * Der Court wird über events.court_id geladen.
       */
      const { data: courtData, error: courtError } = await supabase
        .from("courts")
        .select("*")
        .eq("id", eventData.court_id)
        .maybeSingle();

      if (courtError) {
        console.error(
          "Der zum Event gehörende Court konnte nicht geladen werden:",
          courtError
        );
      } else {
        setCourt(courtData);
      }

      setIsLoading(false);
    }

    void fetchEvent();
  }, [eventId]);

  /*
   * Aktuellen Benutzer laden
   */
  useEffect(() => {
    async function loadCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id ?? null);
    }

    void loadCurrentUser();
  }, []);

  /*
   * Loading
   */
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Event wird geladen …</p>
      </main>
    );
  }

  /*
   * Fehler
   */
  if (error || !event) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-center">
          {error ?? "Das Event konnte nicht geladen werden."}
        </p>

        <Button
          asChild
          variant="link"
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="size-5 shrink-0" />
            <span>Zurück</span>
          </span>
        </Button>
      </main>
    );
  }

  const isPast = isEventPast(event);
  const is3x3 = isThreeVsThreeEvent(event);

  /*
   * Der aktuelle Nutzer ist der Ersteller des Events.
   *
   * Die tatsächliche Berechtigung wird zusätzlich
   * durch RLS in Supabase abgesichert.
   */
  const isOwner = currentUserId === event.created_by;

  /*
   * Maximale Teamanzahl
   */
  const teamLimitReached =
    event.max_teams > 0 && teams.length >= event.max_teams;

  const isTeamSubmitting = isRegisteringTeam || isManagingTeam;

  const teamDialogError = registerTeamError ?? managementTeamError;

  /*
   * Einzelteilnahme
   */
  async function handleIndividualRegistration(category: string) {
    const success = await participate(category);

    if (success) {
      await refetchParticipants();
    }

    return success;
  }

  async function handleIndividualWithdraw() {
    const success = await withdraw();

    if (success) {
      await refetchParticipants();
    }
  }

  /*
   * Event löschen
   */
  async function handleDeleteEvent() {
    if (!eventId || !isOwner) {
      return;
    }

    const success = await deleteEvent(eventId);

    if (success) {
      navigate("/events");
    }
  }

  /*
   * Neues Team anmelden
   */
  function handleOpenCreateTeamDialog() {
    setSelectedTeam(null);
    setSelectedTeamPlayerNames([]);
    setTeamSuccessMessage(null);
    setTeamDialogOpen(true);
  }

  /*
   * Eigenes Team anklicken.
   *
   * Nur Teams mit created_by === currentUserId
   * dürfen geöffnet/bearbeitet werden.
   */
  async function handleTeamClick(team: Tables<"event_teams">) {
    if (!currentUserId || team.created_by !== currentUserId) {
      return;
    }

    setTeamSuccessMessage(null);

    const { data, error: playersError } = await supabase
      .from("event_team_players")
      .select("player_name")
      .eq("event_team_id", team.id)
      .order("created_at", {
        ascending: true,
      });

    if (playersError) {
      console.error("Spieler konnten nicht geladen werden:", playersError);
      return;
    }

    setSelectedTeam(team);

    setSelectedTeamPlayerNames(
      (data ?? []).map((player) => player.player_name ?? "")
    );

    setTeamDialogOpen(true);
  }

  /*
   * Team erstellen oder bearbeiten
   */
  async function handleTeamSubmit({
    teamName,
    category,
    playerNames,
  }: {
    teamName: string;
    category: string;
    playerNames: string[];
  }) {
    if (!eventId) {
      return false;
    }

    /*
     * Bearbeiten
     */
    if (selectedTeam) {
      const success = await updateTeam({
        teamId: selectedTeam.id,
        teamName,
        category,
        playerNames,
      });

      if (success) {
        await refetchTeams();

        setSelectedTeam(null);
        setSelectedTeamPlayerNames([]);

        setTeamSuccessMessage("✓ Team aktualisiert");
      }

      return success;
    }

    /*
     * Neues Team
     */
    const success = await registerTeam({
      eventId,
      teamName,
      category,
      playerNames,
    });

    if (success) {
      await refetchTeams();

      setTeamSuccessMessage("✓ Team angemeldet");
    }

    return success;
  }

  /*
   * Eigenes Team löschen
   */
  async function handleDeleteTeam() {
    if (!selectedTeam) {
      return false;
    }

    const success = await deleteTeam(selectedTeam.id);

    if (success) {
      await refetchTeams();

      setSelectedTeam(null);
      setSelectedTeamPlayerNames([]);

      setTeamSuccessMessage("✓ Team gelöscht");
    }

    return success;
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Button
          asChild
          variant="link"
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="size-5 shrink-0" />
            <span>Zurück</span>
          </span>
        </Button>

        <Card className="mt-4">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{event.category}</Badge>

              {is3x3 && <Badge variant="secondary">3x3</Badge>}

              {isPast && <Badge variant="outline">Vergangen</Badge>}

              {isOwner && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/events/${event.id}/edit`)}
                    disabled={isDeleting}
                  >
                    Bearbeiten
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                        Löschen
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Event wirklich löschen?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                          Möchtest du „{event.name}“ wirklich löschen? Diese
                          Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      {deleteEventError && (
                        <p className="text-sm text-destructive" role="alert">
                          {deleteEventError}
                        </p>
                      )}

                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                          Abbrechen
                        </AlertDialogCancel>

                        <AlertDialogAction
                          onClick={(event) => {
                            event.preventDefault();
                            void handleDeleteEvent();
                          }}
                          disabled={isDeleting}
                          className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                        >
                          {isDeleting
                            ? "Event wird gelöscht ..."
                            : "Event löschen"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>

            <CardTitle className="text-2xl">{event.name}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Eventinformationen */}

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                <div>
                  <p className="font-medium">Datum & Uhrzeit</p>

                  <p className="text-sm text-muted-foreground">
                    {formatEventDate(event.event_date)}
                    {" · "}
                    {formatEventTime(event.event_time)} Uhr
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                <div>
                  <p className="font-medium">Ort</p>

                  <p className="text-sm text-muted-foreground">
                    {event.location || "Ort nicht angegeben"}
                  </p>

                  {court && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Court: {court.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Court-Karte */}

            {court && (
              <section className="space-y-3">
                <h2 className="font-semibold">Veranstaltungsort</h2>

                <CourtLocationMap court={court} />
              </section>
            )}

            {/* Beschreibung */}

            {event.description && (
              <div className="space-y-2">
                <h2 className="font-semibold">Beschreibung</h2>

                <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                  {event.description}
                </p>
              </div>
            )}

            {/* Teilnahme */}

            <div className="space-y-6 border-t pt-6">
              <div>
                <h2 className="text-lg font-semibold">Teilnahme</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {is3x3
                    ? "Du kannst einzeln oder mit einem Team teilnehmen."
                    : "Melde dich als Einzelspieler für dieses Event an."}
                </p>
              </div>

              {participationError && (
                <p className="text-sm text-destructive" role="alert">
                  {participationError}
                </p>
              )}

              {/* Teilnahme Buttons */}

              {is3x3 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant={isParticipating ? "secondary" : "default"}
                    disabled={
                      isParticipationLoading ||
                      isParticipationSubmitting ||
                      isPast
                    }
                    onClick={() => {
                      if (isParticipating) {
                        void handleIndividualWithdraw();
                      } else {
                        void handleIndividualRegistration(event.age_group);
                      }
                    }}
                  >
                    {isParticipating
                      ? "Einzelteilnahme zurückziehen"
                      : "Als Einzelspieler teilnehmen"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPast || teamLimitReached || isTeamSubmitting}
                    onClick={handleOpenCreateTeamDialog}
                  >
                    Mit meinem Team teilnehmen
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    type="button"
                    className="w-full"
                    disabled={
                      isParticipationLoading ||
                      isParticipationSubmitting ||
                      isPast
                    }
                    onClick={() => {
                      if (isParticipating) {
                        void handleIndividualWithdraw();
                      } else {
                        void handleIndividualRegistration(event.age_group);
                      }
                    }}
                  >
                    {isParticipating
                      ? "Teilnahme zurückziehen"
                      : "Am Event teilnehmen"}
                  </Button>
                </div>
              )}

              {/* 3x3 Teams */}

              {is3x3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Angemeldete Teams</h3>

                    <p className="text-sm text-muted-foreground">
                      {teams.length}
                      {event.max_teams > 0 && ` von ${event.max_teams}`}{" "}
                      {teams.length === 1 ? "Team" : "Teams"} angemeldet
                    </p>
                  </div>

                  {teamSuccessMessage && (
                    <p
                      className="text-sm font-medium text-green-600"
                      role="status"
                    >
                      {teamSuccessMessage}
                    </p>
                  )}

                  {isTeamsLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Teams werden geladen …
                    </p>
                  ) : teamsError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {teamsError}
                    </p>
                  ) : teams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Noch keine Teams angemeldet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {teams.map((team) => {
                        const isOwnTeam = team.created_by === currentUserId;

                        return (
                          <button
                            key={team.id}
                            type="button"
                            disabled={!isOwnTeam}
                            onClick={() => {
                              void handleTeamClick(team);
                            }}
                            className={`w-full rounded-lg border p-4 text-left transition-colors ${
                              isOwnTeam
                                ? "cursor-pointer hover:bg-muted/50"
                                : "cursor-default"
                            }`}
                          >
                            <p className="font-medium">{team.team_name}</p>

                            {team.category && (
                              <p className="text-sm text-muted-foreground">
                                {team.category}
                              </p>
                            )}

                            {isOwnTeam && (
                              <p className="mt-2 text-xs font-medium text-green-600">
                                Mein Team · Zum Bearbeiten klicken
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Teilnehmer */}

            <div className="space-y-4 border-t pt-6">
              <div>
                <h3 className="font-medium">
                  {is3x3 ? "Einzelteilnehmer" : "Teilnehmer"}
                </h3>

                <p
                  className={`text-sm ${
                    isParticipating
                      ? "font-medium text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {participantCount}{" "}
                  {participantCount === 1 ? "Person" : "Personen"} angemeldet
                </p>
              </div>

              {isParticipantsLoading ? (
                <p className="text-sm text-muted-foreground">
                  Teilnehmer werden geladen …
                </p>
              ) : participantsError ? (
                <p className="text-sm text-destructive" role="alert">
                  {participantsError}
                </p>
              ) : participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Noch keine Einzelteilnehmer.
                </p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="rounded-lg border p-3">
                      <p className="font-medium">
                        {participant.display_name ||
                          participant.username ||
                          "Unbekannter Benutzer"}
                      </p>

                      {participant.basketball_position && (
                        <p className="text-sm text-muted-foreground">
                          {participant.basketball_position}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team anmelden / bearbeiten */}

        <EventTeamRegistrationDialog
          open={teamDialogOpen}
          onOpenChange={(open) => {
            setTeamDialogOpen(open);

            if (!open) {
              setSelectedTeam(null);
              setSelectedTeamPlayerNames([]);
            }
          }}
          team={selectedTeam}
          playerNames={selectedTeamPlayerNames}
          isSubmitting={isTeamSubmitting}
          error={teamDialogError}
          onSubmit={handleTeamSubmit}
          onDelete={selectedTeam ? handleDeleteTeam : undefined}
        />
      </div>
    </main>
  );
}

export default EventDetailPage;
