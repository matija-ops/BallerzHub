import { useState } from "react";
import { Check, MapPin, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCourtProposalsAdmin } from "@/hooks/courts/useCourtProposalsAdmin";

export default function CourtProposalsAdminPage() {
  const {
    proposals,
    municipalities,
    isLoading,
    isSubmitting,
    error,
    refetch,
    approveProposal,
    rejectProposal,
  } = useCourtProposalsAdmin();

  const [selectedMunicipalities, setSelectedMunicipalities] = useState<
    Record<string, string>
  >({});

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleApprove = async (proposal: (typeof proposals)[number]) => {
    const municipalityId = selectedMunicipalities[proposal.id] ?? "";

    await approveProposal(proposal, municipalityId);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Court-Vorschläge werden geladen …</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Court-Vorschläge verwalten</h1>

          <p className="text-sm text-muted-foreground">
            Prüfe vorgeschlagene Courts und bestätige oder lehne sie ab.
          </p>
        </div>

        {error && (
          <div
            className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        {proposals.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="font-medium">Keine offenen Court-Vorschläge</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Aktuell gibt es keine Vorschläge mit dem Status „pending“.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardHeader>
                  <CardTitle>{proposal.name}</CardTitle>

                  <CardDescription>
                    Eingereicht am{" "}
                    {proposal.created_at
                      ? new Date(proposal.created_at).toLocaleDateString(
                          "de-DE"
                        )
                      : "unbekannt"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium">Court-Typ</p>

                      <p className="text-sm text-muted-foreground">
                        {proposal.type}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Anzahl Körbe</p>

                      <p className="text-sm text-muted-foreground">
                        {proposal.hoops_count}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Standort</p>

                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />

                      <span>
                        {proposal.latitude.toFixed(6)},{" "}
                        {proposal.longitude.toFixed(6)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Beschreibung</p>

                    <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
                      {proposal.description}
                    </p>
                  </div>

                  {proposal.images.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Bilder</p>

                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                        {proposal.images.map((image) => (
                          <button
                            key={image.id}
                            type="button"
                            className="group relative aspect-square overflow-hidden rounded-md border bg-muted focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                            onClick={() => setSelectedImage(image.image_url)}
                          >
                            <img
                              src={image.image_url}
                              alt={`Bild zu ${proposal.name}`}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Kommune für den Court
                    </label>

                    <Select
                      value={selectedMunicipalities[proposal.id] ?? ""}
                      onValueChange={(value) => {
                        setSelectedMunicipalities((current) => ({
                          ...current,
                          [proposal.id]: value,
                        }));
                      }}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Kommune auswählen" />
                      </SelectTrigger>

                      <SelectContent>
                        {municipalities.map((municipality) => (
                          <SelectItem
                            key={municipality.id}
                            value={municipality.id}
                          >
                            {municipality.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void rejectProposal(proposal.id)}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                      Ablehnen
                    </Button>

                    <Button
                      type="button"
                      onClick={() => void handleApprove(proposal)}
                      disabled={isSubmitting}
                    >
                      <Check className="h-4 w-4" />
                      Court bestätigen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={() => void refetch()}
          disabled={isSubmitting}
        >
          Aktualisieren
        </Button>
      </div>

      <Dialog
        open={selectedImage !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedImage(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Court-Bild</DialogTitle>
          </DialogHeader>

          {selectedImage && (
            <div className="flex max-h-[75vh] justify-center overflow-hidden rounded-md bg-muted">
              <img
                src={selectedImage}
                alt="Vergrößerte Court-Aufnahme"
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
