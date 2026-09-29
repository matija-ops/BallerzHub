import { useState } from "react";

import { supabase } from "@/lib/supabase";

import type { Database } from "@/types/supabase.types";
import type { EventFormValues } from "@/lib/events/event-validation";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];

const EVENT_IMAGE_BUCKET = "event-images";
const MAX_EVENT_IMAGES = 2;

function getFileExtension(file: File) {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      return "jpg";
  }
}

export function useCreateEvent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadEventImages(
    userId: string,
    eventId: string,
    images: File[]
  ): Promise<string[]> {
    if (images.length === 0) {
      return [];
    }

    const imagesToUpload = images.slice(0, MAX_EVENT_IMAGES);

    const uploadedPaths: string[] = [];
    const imageUrls: string[] = [];

    try {
      for (let index = 0; index < imagesToUpload.length; index += 1) {
        const image = imagesToUpload[index];

        const extension = getFileExtension(image);

        const filePath =
          `${userId}/${eventId}/` +
          `image-${index + 1}-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(EVENT_IMAGE_BUCKET)
          .upload(filePath, image, {
            cacheControl: "3600",
            upsert: false,
            contentType: image.type,
          });

        if (uploadError) {
          console.error(
            "Event-Bild konnte nicht hochgeladen werden:",
            uploadError
          );

          throw new Error("Ein Event-Bild konnte nicht hochgeladen werden.");
        }

        uploadedPaths.push(filePath);

        const {
          data: { publicUrl },
        } = supabase.storage.from(EVENT_IMAGE_BUCKET).getPublicUrl(filePath);

        imageUrls.push(publicUrl);
      }

      return imageUrls;
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(EVENT_IMAGE_BUCKET).remove(uploadedPaths);
      }

      throw error;
    }
  }

  async function createEvent(values: EventFormValues, images: File[] = []) {
    setIsSubmitting(true);
    setError(null);

    let createdEventId: string | null = null;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Du musst eingeloggt sein, um ein Event zu erstellen.");

        return null;
      }

      const payload: EventInsert = {
        created_by: user.id,
        court_id: values.court_id,
        name: values.name,
        description: values.description,
        location: values.location,
        event_date: values.event_date,
        event_time: values.event_time,
        category: values.category,
        age_group: values.age_group,
        max_teams: values.max_teams,
      };

      const { data: event, error: supabaseError } = await supabase
        .from("events")
        .insert(payload)
        .select()
        .single();

      if (supabaseError || !event) {
        console.error("Event konnte nicht erstellt werden:", supabaseError);

        setError("Das Event konnte nicht erstellt werden.");

        return null;
      }

      createdEventId = event.id;

      const imageUrls = await uploadEventImages(user.id, event.id, images);

      if (imageUrls.length > 0) {
        const eventImages = imageUrls.map((imageUrl) => ({
          event_id: event.id,
          image_url: imageUrl,
        }));

        const { error: eventImagesError } = await supabase
          .from("event_images")
          .insert(eventImages);

        if (eventImagesError) {
          console.error(
            "Event-Bilder konnten nicht gespeichert werden:",
            eventImagesError
          );

          const imagePaths = images
            .slice(0, MAX_EVENT_IMAGES)
            .map((image, index) => {
              const extension = getFileExtension(image);

              return `${user.id}/${event.id}/` + `image-${index + 1}-`;
            });

          void imagePaths;

          throw new Error("Die Event-Bilder konnten nicht gespeichert werden.");
        }
      }

      return event;
    } catch (error) {
      console.error("Unerwarteter Fehler beim Erstellen des Events:", error);

      if (createdEventId) {
        await supabase.from("events").delete().eq("id", createdEventId);
      }

      setError(
        error instanceof Error
          ? error.message
          : "Beim Erstellen des Events ist ein Fehler aufgetreten."
      );

      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    createEvent,
    isSubmitting,
    error,
  };
}
