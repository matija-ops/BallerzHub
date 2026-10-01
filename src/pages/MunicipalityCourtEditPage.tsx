import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getCurrentMunicipalityId,
  getMunicipalityCourt,
  updateMunicipalityCourt,
} from "@/lib/municipality";

import type { Database } from "@/types/supabase.types";
import { supabase } from "@/lib/supabase";

type Court = Database["public"]["Tables"]["courts"]["Row"];
type CourtImage = Database["public"]["Tables"]["court_images"]["Row"];

type CourtUpdate = Database["public"]["Tables"]["courts"]["Update"];

const COURT_STATUSES = ["active", "maintenance", "closed"] as const;

export default function MunicipalityCourtEditPage() {
  const { courtId } = useParams<{ courtId: string }>();
  const navigate = useNavigate();

  const [court, setCourt] = useState<Court | null>(null);

  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [type, setType] = useState("");
  const [hoopsCount, setHoopsCount] = useState("");
  const [hasLightning, setHasLightning] = useState(false);
  const [isAccessible, setIsAccessible] = useState(false);
  const [status, setStatus] = useState("");
  const [images, setImages] = useState<CourtImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourt() {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!courtId) {
          throw new Error("Keine Court-ID vorhanden.");
        }

        const municipalityId = await getCurrentMunicipalityId();

        const data = await getMunicipalityCourt(municipalityId, courtId);
        const { data: imageData, error: imageError } = await supabase
          .from("court_images")
          .select("*")
          .eq("court_id", courtId)
          .order("created_at", { ascending: true });

        if (imageError) throw imageError;

        setCourt(data);
        setImages(imageData ?? []);

        setName(data.name);
        setLatitude(String(data.latitude));
        setLongitude(String(data.longitude));
        setType(data.type);
        setHoopsCount(String(data.hoops_count));
        setHasLightning(data.has_lightning);
        setIsAccessible(data.is_accessible);
        setStatus(data.status);
      } catch (error) {
        console.error(error);
        setError("Der Court konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }

    loadCourt();
  }, [courtId]);

  async function handleSubmit() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!courtId) {
        throw new Error("Keine Court-ID vorhanden.");
      }

      if (!name.trim()) {
        setError("Bitte gib einen Namen ein.");
        return;
      }

      if (!type.trim()) {
        setError("Bitte gib einen Court-Typ ein.");
        return;
      }

      if (!COURT_STATUSES.includes(status as (typeof COURT_STATUSES)[number])) {
        setError("Bitte wähle einen gültigen Status.");
        return;
      }

      const parsedHoopsCount = Number(hoopsCount);
      const parsedLatitude = Number(latitude);
      const parsedLongitude = Number(longitude);

      if (
        !Number.isFinite(parsedHoopsCount) ||
        !Number.isFinite(parsedLatitude) ||
        !Number.isFinite(parsedLongitude)
      ) {
        setError("Bitte gib gültige Zahlen ein.");
        return;
      }

      if (parsedHoopsCount < 1) {
        setError("Die Anzahl der Körbe muss mindestens 1 sein.");
        return;
      }

      const updates: CourtUpdate = {
        name: name.trim(),
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        type: type.trim(),
        hoops_count: parsedHoopsCount,
        has_lightning: hasLightning,
        is_accessible: isAccessible,
        status: status,
        updated_at: new Date().toISOString(),
      };

      const municipalityId = await getCurrentMunicipalityId();

      const updatedCourt = await updateMunicipalityCourt(
        municipalityId,
        courtId,
        updates
      );

      if (deletedImageIds.length > 0) {
        const { error: imageDeleteError } = await supabase
          .from("court_images")
          .delete()
          .in("id", deletedImageIds)
          .eq("court_id", courtId);

        if (imageDeleteError) throw imageDeleteError;

        setImages((current) =>
          current.filter((image) => !deletedImageIds.includes(image.id))
        );
        setDeletedImageIds([]);
      }

      setCourt(updatedCourt);

      setName(updatedCourt.name);
      setLatitude(String(updatedCourt.latitude));
      setLongitude(String(updatedCourt.longitude));
      setType(updatedCourt.type);
      setHoopsCount(String(updatedCourt.hoops_count));
      setHasLightning(updatedCourt.has_lightning);
      setIsAccessible(updatedCourt.is_accessible);
      setStatus(updatedCourt.status);

      setSuccess("Die Änderungen wurden erfolgreich gespeichert.");
    } catch (error) {
      console.error(error);
      setError("Die Änderungen konnten nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Court wird geladen...</p>
      </div>
    );
  }

  if (error && !court) {
    return (
      <div className="p-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!court) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Court nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/courts/${courtId}`)}
        >
          Bilder verwalten
        </Button>

        <Button type="button" disabled={saving} onClick={handleSubmit}>
          {saving ? "Speichern..." : "Änderungen speichern"}
        </Button>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Court bearbeiten</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="space-y-3">
            <Label>Court-Bilder</Label>

            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine Bilder vorhanden.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images
                  .filter((image) => !deletedImageIds.includes(image.id))
                  .map((image) => (
                  <div key={image.id} className="space-y-2">
                    <img
                      src={image.image_url}
                      alt={`${court.name} – Court-Bild`}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      onClick={() =>
                        setDeletedImageIds((current) =>
                          current.includes(image.id)
                            ? current
                            : [...current, image.id]
                        )
                      }
                    >
                      Bild löschen
                    </Button>
                  </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>

            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Typ</Label>

            <Input
              id="type"
              value={type}
              onChange={(event) => setType(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hoopsCount">Anzahl Körbe</Label>

            <Input
              id="hoopsCount"
              type="number"
              min="1"
              value={hoopsCount}
              onChange={(event) => setHoopsCount(event.target.value)}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Breitengrad</Label>

              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Längengrad</Label>

              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="hasLightning">Beleuchtung</Label>

              <p className="text-sm text-muted-foreground">
                Verfügt der Court über Beleuchtung?
              </p>
            </div>

            <Switch
              id="hasLightning"
              checked={hasLightning}
              onCheckedChange={setHasLightning}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="isAccessible">Barrierefrei</Label>

              <p className="text-sm text-muted-foreground">
                Ist der Court barrierefrei zugänglich?
              </p>
            </div>

            <Switch
              id="isAccessible"
              checked={isAccessible}
              onCheckedChange={setIsAccessible}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>

            <Select value={status} onValueChange={(value) => setStatus(value ?? "")}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Status auswählen" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="active">Aktiv</SelectItem>

                <SelectItem value="maintenance">Wartung</SelectItem>

                <SelectItem value="closed">Geschlossen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? "Speichern..." : "Änderungen speichern"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
