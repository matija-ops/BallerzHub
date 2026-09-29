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
import { Textarea } from "@/components/ui/textarea";

type Club = Tables<"clubs">;

function ClubEditPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();

  const [club, setClub] = useState<Club | null>(null);

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) {
      setError("Kein Verein angegeben.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchClub() {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", clubId)
        .single();

      if (!isMounted) {
        return;
      }

      if (supabaseError) {
        console.error("Fehler beim Laden des Vereins:", supabaseError);

        setClub(null);
        setError("Der Verein konnte nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      setClub(data);
      setName(data.name);
      setLogoUrl(data.logo_url);
      setDescription(data.description);
      setIsLoading(false);
    }

    void fetchClub();

    return () => {
      isMounted = false;
    };
  }, [clubId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clubId) {
      setSaveError("Kein Verein angegeben.");
      return;
    }

    if (!name.trim()) {
      setSaveError("Bitte gib einen Vereinsnamen ein.");
      return;
    }

    if (!description.trim()) {
      setSaveError("Bitte gib eine Beschreibung ein.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const update: TablesUpdate<"clubs"> = {
      name: name.trim(),
      logo_url: logoUrl.trim(),
      description: description.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error: supabaseError } = await supabase
      .from("clubs")
      .update(update)
      .eq("id", clubId);

    if (supabaseError) {
      console.error("Fehler beim Speichern des Vereins:", supabaseError);

      setSaveError(
        `Der Verein konnte nicht gespeichert werden: ${supabaseError.message}`
      );

      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    navigate(`/clubs/${clubId}`);
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <Skeleton className="h-7 w-56" />
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error || !club) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl">
          <CardContent className="py-6">
            <p className="text-sm text-destructive">
              {error ?? "Der Verein konnte nicht gefunden werden."}
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
        <Link to="/clubs" className="inline-flex items-center gap-2">
          <ArrowLeft className="size-5 shrink-0" />
          <span>Zurück</span>
        </Link>
      </Button>

      <Card className="mt-4 max-w-2xl">
        <CardHeader>
          <CardTitle>Verein bearbeiten</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Vereinsname</Label>

              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Vereinsname"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo-URL</Label>

              <Input
                id="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://..."
              />

              <p className="text-sm text-muted-foreground">
                Optional kann hier die URL des Vereinslogos hinterlegt werden.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>

              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Beschreibung des Vereins"
                rows={6}
                required
              />
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
                <Link to={`/clubs/${club.id}`}>Abbrechen</Link>
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

export default ClubEditPage;
