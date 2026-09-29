import { useCallback, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { TablesInsert } from "@/types/supabase.types";

const STORAGE_BUCKET = "court_proposals";
const MAX_COURT_MEDIA = 5;

export function useCourtProposals() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProposal = useCallback(
    async (
      name: string,
      latitude: number,
      longitude: number,
      type: string,
      hoopsCount: number,
      description: string,
      images: File[] = []
    ): Promise<boolean> => {
      if (isSubmitting) {
        return false;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            "Du musst eingeloggt sein, um einen Court vorzuschlagen."
          );
        }

        if (!name.trim()) {
          throw new Error("Bitte gib einen Namen für den Court ein.");
        }

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          throw new Error("Bitte wähle einen gültigen Standort aus.");
        }

        if (!type.trim()) {
          throw new Error("Bitte wähle einen Court-Typ aus.");
        }

        if (!Number.isInteger(hoopsCount) || hoopsCount < 1) {
          throw new Error("Bitte gib eine gültige Anzahl an Körben ein.");
        }

        if (!description.trim()) {
          throw new Error("Bitte beschreibe den Court.");
        }

        if (images.length > MAX_COURT_MEDIA) {
          throw new Error("Du kannst maximal 5 Medien hochladen.");
        }

        if (
          images.some(
            (image) =>
              !(image instanceof File) ||
              (!image.type.startsWith("image/") && !image.type.startsWith("video/"))
          )
        ) {
          throw new Error("Bitte lade ausschließlich Bilder oder Videos hoch.");
        }

        const proposal: TablesInsert<"court_proposals"> = {
          user_id: user.id,
          name: name.trim(),
          latitude,
          longitude,
          type: type.trim(),
          hoops_count: hoopsCount,
          description: description.trim(),
          status: "pending",
        };

        const { data: createdProposal, error: insertError } = await supabase
          .from("court_proposals")
          .insert(proposal)
          .select("id")
          .single();

        if (insertError) {
          throw insertError;
        }

        if (!createdProposal) {
          throw new Error("Der Court-Vorschlag konnte nicht erstellt werden.");
        }

        if (images.length > 0) {
          const imageRows: TablesInsert<"court_proposal_images">[] = [];

          for (const image of images) {
            const extension =
              image.name.split(".").pop()?.toLowerCase() || "jpg";

            const mediaType = image.type.startsWith("video/")
              ? "video"
              : "image";
            const filePath = `proposals/${createdProposal.id}/${user.id}/${crypto.randomUUID()}.${extension}`;

            const { error: uploadError } = await supabase.storage
              .from(STORAGE_BUCKET)
              .upload(filePath, image, {
                cacheControl: "3600",
                upsert: false,
              });

            if (uploadError) {
              throw uploadError;
            }

            const {
              data: { publicUrl },
            } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

            imageRows.push({
              proposal_id: createdProposal.id,
              image_url: publicUrl,
              media_type: mediaType,
              user_id: user.id,
            });
          }

          const { error: imageInsertError } = await supabase
            .from("court_proposal_images")
            .insert(imageRows);

          if (imageInsertError) {
            throw imageInsertError;
          }
        }

        return true;
      } catch (submitError) {
        console.error(
          "Court-Vorschlag konnte nicht erstellt werden:",
          submitError
        );

        setError(
          submitError instanceof Error
            ? submitError.message
            : "Der Court-Vorschlag konnte nicht erstellt werden."
        );

        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting]
  );

  return {
    isSubmitting,
    error,
    createProposal,
  };
}
