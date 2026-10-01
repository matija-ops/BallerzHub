import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase.types";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Team = Tables<"teams">;
type League = Tables<"leagues">;

function GameEditPage() {
  const { leagueId, gameId } = useParams<{
    leagueId: string;
    gameId?: string;
  }>();

  const navigate = useNavigate();

  const isEditMode = Boolean(gameId);

  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [gameDate, setGameDate] = useState("");
  const [gameTime, setGameTime] = useState("");
  const [homeScore, setHomeScore] = useState("0");
  const [awayScore, setAwayScore] = useState("0");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setError("Keine Liga angegeben.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchGameData() {
      setIsLoading(true);
      setError(null);

      const leagueResult = await supabase
        .from("leagues")
        .select("*")
        .eq("id", leagueId!)
        .single();

      if (!isMounted) {
        return;
      }

      if (leagueResult.error) {
        console.error("Fehler beim Laden der Liga:", leagueResult.error);

        setError("Die Liga konnte nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      const teamsResult = await supabase
        .from("teams")
        .select("*")
        .eq("league_id", leagueId!)
        .order("name", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (teamsResult.error) {
        console.error("Fehler beim Laden der Mannschaften:", teamsResult.error);

        setError("Die Mannschaften konnten nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      setLeague(leagueResult.data);
      setTeams(teamsResult.data ?? []);

      if (gameId) {
        const gameResult = await supabase
          .from("games")
          .select("*")
          .eq("id", gameId)
          .eq("league_id", leagueId!)
          .single();

        if (!isMounted) {
          return;
        }

        if (gameResult.error) {
          console.error("Fehler beim Laden des Spiels:", gameResult.error);

          setError("Das Spiel konnte nicht geladen werden.");
          setIsLoading(false);
          return;
        }

        const loadedGame = gameResult.data;

        setHomeTeamId(loadedGame.home_team_id);
        setAwayTeamId(loadedGame.away_team_id);
        setGameDate(loadedGame.game_date);
        setGameTime(loadedGame.game_time ?? "");
        setHomeScore(String(loadedGame.home_score));
        setAwayScore(String(loadedGame.away_score));
      }

      setIsLoading(false);
    }

    void fetchGameData();

    return () => {
      isMounted = false;
    };
  }, [gameId, leagueId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!leagueId) {
      setSaveError("Keine Liga angegeben.");
      return;
    }

    if (!homeTeamId) {
      setSaveError("Bitte wähle die Heimmannschaft aus.");
      return;
    }

    if (!awayTeamId) {
      setSaveError("Bitte wähle die Auswärtsmannschaft aus.");
      return;
    }

    if (homeTeamId === awayTeamId) {
      setSaveError("Heim- und Auswärtsmannschaft müssen unterschiedlich sein.");
      return;
    }

    if (!gameDate) {
      setSaveError("Bitte gib ein Spieldatum an.");
      return;
    }

    const parsedHomeScore = Number(homeScore);
    const parsedAwayScore = Number(awayScore);

    if (!Number.isInteger(parsedHomeScore) || parsedHomeScore < 0) {
      setSaveError("Die Heimpunkte müssen eine gültige Zahl sein.");
      return;
    }

    if (!Number.isInteger(parsedAwayScore) || parsedAwayScore < 0) {
      setSaveError("Die Auswärtspunkte müssen eine gültige Zahl sein.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    if (isEditMode && gameId) {
      const update: TablesUpdate<"games"> = {
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        game_date: gameDate,
        game_time: gameTime || null,
        home_score: parsedHomeScore,
        away_score: parsedAwayScore,
      };

      const { error: supabaseError } = await supabase
        .from("games")
        .update(update)
        .eq("id", gameId)
        .eq("league_id", leagueId);

      if (supabaseError) {
        console.error("Fehler beim Aktualisieren des Spiels:", supabaseError);

        setSaveError(
          `Das Spiel konnte nicht gespeichert werden: ${supabaseError.message}`
        );

        setIsSaving(false);
        return;
      }
    } else {
      const insert: TablesInsert<"games"> = {
        league_id: leagueId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        game_date: gameDate,
        game_time: gameTime || null,
        home_score: parsedHomeScore,
        away_score: parsedAwayScore,
      };

      const { error: supabaseError } = await supabase
        .from("games")
        .insert(insert);

      if (supabaseError) {
        console.error("Fehler beim Erstellen des Spiels:", supabaseError);

        setSaveError(
          `Das Spiel konnte nicht erstellt werden: ${supabaseError.message}`
        );

        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    navigate(`/leagues/${leagueId}`);
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <Skeleton className="h-7 w-64" />
          </CardHeader>

          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error || !league) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl">
          <CardContent className="py-6">
            <p className="text-sm text-destructive">
              {error ?? "Die Liga konnte nicht gefunden werden."}
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
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <Button
        type="button"
        variant="ghost"
        className="text-orange-500 hover:bg-transparent hover:text-orange-400"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-5 shrink-0" />
        <span>Zurück</span>
      </Button>

      <Card className="mt-4 max-w-2xl">
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Spiel bearbeiten" : "Spiel hinzufügen"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Liga</Label>

              <Input value={league.name} disabled aria-label="Liga" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="homeTeam">Heimmannschaft</Label>

              <Select
                value={homeTeamId || null}
                items={teams.map((team) => ({ value: team.id, label: team.name }))}
                onValueChange={(value) => setHomeTeamId(value ?? "")}
              >
                <SelectTrigger id="homeTeam" className="w-full">
                  <SelectValue placeholder="Heimmannschaft auswählen" />
                </SelectTrigger>

                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="awayTeam">Auswärtsmannschaft</Label>

              <Select
                value={awayTeamId || null}
                items={teams.map((team) => ({ value: team.id, label: team.name }))}
                onValueChange={(value) => setAwayTeamId(value ?? "")}
              >
                <SelectTrigger id="awayTeam" className="w-full">
                  <SelectValue placeholder="Auswärtsmannschaft auswählen" />
                </SelectTrigger>

                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gameDate">Spieldatum</Label>

                <Input
                  id="gameDate"
                  type="date"
                  value={gameDate}
                  onChange={(event) => setGameDate(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameTime">Uhrzeit</Label>

                <Input
                  id="gameTime"
                  type="time"
                  value={gameTime}
                  onChange={(event) => setGameTime(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="homeScore">Punkte Heim</Label>

                <Input
                  id="homeScore"
                  type="number"
                  min="0"
                  step="1"
                  value={homeScore}
                  onChange={(event) => setHomeScore(event.target.value)}
                  disabled={
                    new Date(gameDate ?? Date.now).getTime() >
                    new Date().getTime()
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="awayScore">Punkte Auswärts</Label>

                <Input
                  id="awayScore"
                  type="number"
                  min="0"
                  step="1"
                  value={awayScore}
                  onChange={(event) => setAwayScore(event.target.value)}
                  disabled={
                    new Date(gameDate ?? Date.now).getTime() >
                    new Date().getTime()
                  }
                  required
                />
              </div>
            </div>

            {saveError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {saveError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button asChild variant="outline">
                <Link to={`/leagues/${league.id}`}>Abbrechen</Link>
              </Button>

              <Button type="submit" disabled={isSaving || teams.length < 2}>
                <Save />

                {isSaving
                  ? "Speichern …"
                  : isEditMode
                    ? "Änderungen speichern"
                    : "Spiel erstellen"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default GameEditPage;
