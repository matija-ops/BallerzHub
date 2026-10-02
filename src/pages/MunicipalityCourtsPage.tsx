import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  getCurrentMunicipalityId,
  getMunicipalityCourts,
  deleteMunicipalityCourt,
} from "@/lib/municipality";

import type { Database } from "@/types/supabase.types";

type Court = Database["public"]["Tables"]["courts"]["Row"];

export default function MunicipalityCourtsPage() {
  const navigate = useNavigate();

  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingCourtId, setDeletingCourtId] = useState<string | null>(null);

  async function handleDeleteCourt(court: Court) {
    if (!window.confirm(`Möchtest du „${court.name}“ wirklich löschen?`)) return;

    try {
      setDeletingCourtId(court.id);
      setError(null);
      const municipalityId = await getCurrentMunicipalityId();
      await deleteMunicipalityCourt(municipalityId, court.id);
      setCourts((current) => current.filter((item) => item.id !== court.id));
    } catch (deleteError) {
      console.error(deleteError);
      setError("Der Court konnte nicht gelöscht werden.");
    } finally {
      setDeletingCourtId(null);
    }
  }

  useEffect(() => {
    async function loadCourts() {
      try {
        setLoading(true);
        setError(null);

        const municipalityId = await getCurrentMunicipalityId();
        const data = await getMunicipalityCourts(municipalityId);

        setCourts(data);
      } catch (error) {
        console.error(error);
        setError("Die Courts konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }

    loadCourts();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Courts werden geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (courts.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Meine Courts</h1>

        <p className="mt-2 text-muted-foreground">
          Für deine Kommune wurden noch keine Courts gefunden.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Meine Courts</h1>

        <p className="text-muted-foreground">
          Verwalte die Courts deiner Kommune.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courts.map((court) => (
          <Card key={court.id}>
            <CardHeader>
              <CardTitle>{court.name}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Typ</p>

                <p>{court.type}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Körbe</p>

                <p>{court.hoops_count}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {court.has_lightning && (
                  <Badge variant="secondary">Beleuchtung</Badge>
                )}

                {court.is_accessible && (
                  <Badge variant="secondary">Barrierefrei</Badge>
                )}

                <Badge>{court.status}</Badge>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => navigate(`/municipality/courts/${court.id}/edit`)}>
                  Bearbeiten
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void handleDeleteCourt(court)}
                  disabled={deletingCourtId !== null}
                >
                  {deletingCourtId === court.id ? "Löschen ..." : "Löschen"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
