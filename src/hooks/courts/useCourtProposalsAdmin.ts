import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/types/supabase.types";

type CourtProposal = Tables<"court_proposals">;
type CourtProposalImage = Tables<"court_proposal_images">;
type Municipality = Tables<"municipalities">;

type CourtProposalWithImages = CourtProposal & {
  images: CourtProposalImage[];
};

export function useCourtProposalsAdmin() {
  const [proposals, setProposals] = useState<CourtProposalWithImages[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Du musst eingeloggt sein.");
      }

      const { data: municipalityUser, error: membershipError } = await supabase
        .from("municipality_users")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        throw membershipError;
      }

      if (!municipalityUser) {
        throw new Error("Du hast keine Berechtigung für die Verwaltung.");
      }

      const { data: proposalData, error: proposalError } = await supabase
        .from("court_proposals")
        .select(
          `
          *,
          images:court_proposal_images(*)
        `
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      const { data: municipalityData, error: municipalityError } =
        await supabase
          .from("municipalities")
          .select("*")
          .order("name", { ascending: true });

      if (proposalError) {
        throw proposalError;
      }

      if (municipalityError) {
        throw municipalityError;
      }

      setProposals((proposalData ?? []) as CourtProposalWithImages[]);

      setMunicipalities(municipalityData ?? []);
    } catch (loadError) {
      console.error(
        "Court-Vorschläge konnten nicht geladen werden:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Die Court-Vorschläge konnten nicht geladen werden."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const approveProposal = useCallback(
    async (
      proposal: CourtProposalWithImages,
      municipalityId: string
    ): Promise<boolean> => {
      if (isSubmitting) {
        return false;
      }

      if (!municipalityId) {
        setError("Bitte wähle eine Kommune aus.");
        return false;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const court: TablesInsert<"courts"> = {
          name: proposal.name,
          latitude: proposal.latitude,
          longitude: proposal.longitude,
          type: proposal.type,
          hoops_count: proposal.hoops_count,
          municipality_id: municipalityId,
          has_lightning: false,
          is_accessible: false,
          status: "active",
        };

        const { data: createdCourt, error: courtError } = await supabase
          .from("courts")
          .insert(court)
          .select("id")
          .single();

        if (courtError) {
          throw courtError;
        }

        if (!createdCourt) {
          throw new Error("Der Court konnte nicht erstellt werden.");
        }

        if (proposal.images.length > 0) {
          const courtImages: TablesInsert<"court_images">[] = proposal.images
            .slice(0, 5)
            .map((image) => ({
              court_id: createdCourt.id,
              image_url: image.image_url,
              media_type: image.media_type,
              user_id: image.user_id,
            }));

          const { error: imageError } = await supabase
            .from("court_images")
            .insert(courtImages);

          if (imageError) {
            throw imageError;
          }
        }

        const proposalUpdate: TablesUpdate<"court_proposals"> = {
          status: "approved",
        };

        const { error: proposalUpdateError } = await supabase
          .from("court_proposals")
          .update(proposalUpdate)
          .eq("id", proposal.id);

        if (proposalUpdateError) {
          throw proposalUpdateError;
        }

        setProposals((current) =>
          current.filter((item) => item.id !== proposal.id)
        );

        return true;
      } catch (approveError) {
        console.error(
          "Court-Vorschlag konnte nicht bestätigt werden:",
          approveError
        );

        setError(
          approveError instanceof Error
            ? approveError.message
            : "Der Court-Vorschlag konnte nicht bestätigt werden."
        );

        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting]
  );

  const rejectProposal = useCallback(
    async (proposalId: string): Promise<boolean> => {
      if (isSubmitting) {
        return false;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const proposalUpdate: TablesUpdate<"court_proposals"> = {
          status: "rejected",
        };

        const { error: updateError } = await supabase
          .from("court_proposals")
          .update(proposalUpdate)
          .eq("id", proposalId);

        if (updateError) {
          throw updateError;
        }

        setProposals((current) =>
          current.filter((proposal) => proposal.id !== proposalId)
        );

        return true;
      } catch (rejectError) {
        console.error(
          "Court-Vorschlag konnte nicht abgelehnt werden:",
          rejectError
        );

        setError(
          rejectError instanceof Error
            ? rejectError.message
            : "Der Court-Vorschlag konnte nicht abgelehnt werden."
        );

        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting]
  );

  return {
    proposals,
    municipalities,
    isLoading,
    isSubmitting,
    error,
    refetch: loadData,
    approveProposal,
    rejectProposal,
  };
}
