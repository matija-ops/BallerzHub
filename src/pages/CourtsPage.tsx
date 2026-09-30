import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { CourtMap } from "@/components/courts/CourtMap";
import { CourtListSheet } from "@/components/courts/CourtListSheet";
import { CourtProposalDialog } from "@/components/courts/CourtProposalDialog";
import { CourtSearch } from "@/components/courts/CourtSearch";

import { useCourts } from "@/hooks/courts/useCourts";
import { useCourtProposals } from "@/hooks/courts/useCourtProposals";
import { useGeocoding } from "@/hooks/courts/useGeocoding";
import { useCourtFavorites } from "@/hooks/courts/useCourtFavorites";

import { Button } from "@/components/ui/button";
import type { Tables } from "@/types/supabase.types";

type Court = Tables<"courts">;
type MapLocation = [number, number];

function CourtsPage() {
  const navigate = useNavigate();

  const { courts, isLoading, error, refetch } = useCourts();
  const favoriteCourtIds = useCourtFavorites();
  const [visibleCourts, setVisibleCourts] = useState<Court[]>([]);

  const {
    isSubmitting: isProposalSubmitting,
    error: proposalError,
    createProposal,
  } = useCourtProposals();

  const { searchLocation, isSearching, search } = useGeocoding();

  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

  const [proposalLocation, setProposalLocation] = useState<MapLocation | null>(
    null
  );

  const [isSelectingProposalLocation, setIsSelectingProposalLocation] =
    useState(false);

  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);

  const handleSelectCourt = (court: Court) => {
    setSelectedCourt(court);
    void navigate(`/courts/${court.id}`);
  };

  const favoriteCourts = courts.filter((court) => favoriteCourtIds.has(court.id));

  const handleRequestLocationSelection = () => {
    setIsProposalDialogOpen(false);
    setIsSelectingProposalLocation(true);
  };

  const handleSelectProposalLocation = (location: MapLocation) => {
    setProposalLocation(location);
    setIsSelectingProposalLocation(false);
    setIsProposalDialogOpen(true);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Courts werden geladen …</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>Die Courts konnten nicht geladen werden.</p>

        <Button type="button" onClick={() => void refetch()}>
          Erneut versuchen
        </Button>
      </main>
    );
  }

  return (
    <main className="relative -mt-16 h-[100dvh] w-full overflow-hidden">
      <CourtMap
        courts={courts}
        favoriteCourtIds={favoriteCourtIds}
        selectedCourt={selectedCourt}
        searchLocation={searchLocation}
        isSearching={isSearching}
        onSelectCourt={handleSelectCourt}
        isSelectingLocation={isSelectingProposalLocation}
        selectedLocation={proposalLocation}
        onSelectLocation={handleSelectProposalLocation}
        onVisibleCourtsChange={setVisibleCourts}
      />

      <div className="fixed top-0 right-0 left-0 z-[1000] flex items-center gap-2 bg-background/60 [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] p-4 pb-16 sm:justify-center sm:gap-4">
        <div className="w-12 shrink-0 sm:hidden" />

        <div className="min-w-0 flex-1 sm:flex-none">
          <CourtSearch onSearch={search} isSearching={isSearching} />
        </div>

        <div className="w-10 shrink-0">
          <CourtProposalDialog
            isOpen={isProposalDialogOpen}
            onOpenChange={setIsProposalDialogOpen}
            isSubmitting={isProposalSubmitting}
            error={proposalError}
            onSubmit={createProposal}
            location={proposalLocation}
            onLocationChange={setProposalLocation}
            onRequestLocationSelection={handleRequestLocationSelection}
          />
        </div>
      </div>
      <CourtListSheet
        courts={visibleCourts.length || favoriteCourts.length ? visibleCourts : favoriteCourts}
        selectedCourt={selectedCourt}
        onSelectCourt={handleSelectCourt}
      />
    </main>
  );
}

export default CourtsPage;
