import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import type { Tables, TablesUpdate } from "@/lib/supabase";
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
type Club = Tables<"clubs">;
type League = Tables<"leagues">;

function TeamEditPage() {
  const { clubId, teamId } = useParams<{
    clubId: string;
    teamId: string;
  }>();

  const navigate = useNavigate();

  const [team, setTeam] = useState<Team | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);

  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [leagueId, setLeagueId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId || !teamId) {
      setError("Verein oder Mannschaft wurde nicht angegeben.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchTeamData() {
      setIsLoading(true);
      setError(null);

      const [teamResult, clubResult, leaguesResult] = await Promise.all([
        supabase
          .from("teams")
          .select("*")
          .eq("id", teamId!)
          .eq("club_id", clubId!)
          .single(),

        supabase.from("clubs").select("*").eq("id", clubId!).single(),

        supabase.from("leagues").select("*").order("name", {
          ascending: true,
        }),
      ]);

      if (!isMounted) {
        return;
      }

      if (teamResult.error) {
        console.error("Fehler beim Laden der Mannschaft:", teamResult.error);

        setTeam(null);
        setError("Die Mannschaft konnte nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      if (clubResult.error) {
        console.error("Fehler beim Laden des Vereins:", clubResult.error);

        setTeam(null);
        setClub(null);
        setError("Der zugehörige Verein konnte nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      if (leaguesResult.error) {
        console.error("Fehler beim Laden der Ligen:", leaguesResult.error);

        setTeam(teamResult.data);
        setClub(clubResult.data);
        setLeagues([]);
        setError("Die Ligen konnten nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      setTeam(teamResult.data);
      setClub(clubResult.data);
      setLeagues(leaguesResult.data ?? []);

      setName(teamResult.data.name);
      setAgeGroup(teamResult.data.age_group);
      setLeagueId(teamResult.data.league_id);

      setIsLoading(false);
    }

    void fetchTeamData();

    return () => {
      isMounted = false;
    };
  }, [clubId, teamId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clubId || !teamId) {
      setSaveError("Verein oder Mannschaft wurde nicht angegeben.");
      return;
    }

    if (!name.trim()) {
      setSaveError("Bitte gib einen Mannschaftsnamen ein.");
      return;
    }

    if (!ageGroup.trim()) {
      setSaveError("Bitte gib eine Altersklasse ein.");
      return;
    }

    if (!leagueId) {
      setSaveError("Bitte wähle eine Liga aus.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const update: TablesUpdate<"teams"> = {
      name: name.trim(),
      age_group: ageGroup.trim(),
      league_id: leagueId,
      updated_at: new Date().toISOString(),
    };

    const { error: supabaseError } = await supabase
      .from("teams")
      .update(update)
      .eq("id", teamId)
      .eq("club_id", clubId);

    if (supabaseError) {
      console.error("Fehler beim Speichern der Mannschaft:", supabaseError);

      setSaveError(
        `Die Mannschaft konnte nicht gespeichert werden: ${supabaseError.message}`
      );

      setIsSaving(false);
      return;
    }

    setIsSaving(false);

    navigate(`/clubs/${clubId}/teams/${teamId}`);
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <Skeleton className="h-7 w-64" />
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error || !team || !club) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl">
          <CardContent className="py-6">
            <p className="text-sm text-destructive">
              {error ?? "Die Mannschaft konnte nicht gefunden werden."}
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
        asChild
        variant="ghost"
        className="mt-4 mb-6 text-orange-500 hover:bg-transparent hover:text-orange-400"
      >
        <Link to="/teams" className="inline-flex items-center gap-2">
          <ArrowLeft className="size-5 shrink-0" />
          <span>Zurück</span>
        </Link>
      </Button>

      <Card className="mt-4 max-w-2xl">
        <CardHeader>
          <CardTitle>Mannschaft bearbeiten</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Verein</Label>

              <Input value={club.name} disabled aria-label="Verein" />

              <p className="text-sm text-muted-foreground">
                Die Mannschaft bleibt diesem Verein zugeordnet.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamName">Mannschaftsname</Label>

              <Input
                id="teamName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Mannschaftsname"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ageGroup">Altersklasse</Label>

              <Input
                id="ageGroup"
                value={ageGroup}
                onChange={(event) => setAgeGroup(event.target.value)}
                placeholder="z. B. U16m oder Herren"
                required
              />

              <p className="text-sm text-muted-foreground">
                Die Altersklasse wird entsprechend der vorhandenen Daten als
                Text gespeichert.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="league">Liga</Label>

              <Select
                value={leagueId || null}
                items={leagues.map((league) => ({
                  value: league.id,
                  label: [league.name, league.season, league.division]
                    .filter(Boolean)
                    .join(" · "),
                }))}
                onValueChange={(value) => setLeagueId(value ?? "")}
              >
                <SelectTrigger id="league" className="w-full">
                  <SelectValue placeholder="Liga auswählen" />
                </SelectTrigger>

                <SelectContent>
                  {leagues.map((league) => (
                    <SelectItem key={league.id} value={league.id}>
                      {league.name}
                      {league.season ? ` · ${league.season}` : ""}
                      {league.division ? ` · ${league.division}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {leagues.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Es sind aktuell keine Ligen verfügbar.
                </p>
              )}
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
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSaving}
              >
                Abbrechen
              </Button>

              <Button type="submit" disabled={isSaving}>
                <Save />
                {isSaving ? "Speichern …" : "Änderungen speichern"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default TeamEditPage;
