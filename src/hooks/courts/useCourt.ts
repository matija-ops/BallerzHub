import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/types/supabase.types";

type Court = Tables<"courts">;
type CourtImage = Tables<"court_images">;
type CourtReview = Tables<"court_reviews">;
type CourtCheckin = Tables<"court_checkins">;
type CourtFavorite = Tables<"court_favorites">;
type CourtReport = Tables<"court_reports">;
type Event = Tables<"events">;

const COURT_MEDIA_BUCKET = "court_proposals";
const MAX_COURT_MEDIA = 5;

export function useCourt(courtId: string) {
  const [court, setCourt] = useState<Court | null>(null);
  const [images, setImages] = useState<CourtImage[]>([]);
  const [reviews, setReviews] = useState<CourtReview[]>([]);
  const [checkins, setCheckins] = useState<CourtCheckin[]>([]);
  const [reports, setReports] = useState<CourtReport[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckinLoading, setIsCheckinLoading] = useState(false);
  const [checkinError, setCheckinError] = useState<string | null>(null);

  const [isReportSubmitting, setIsReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCourt = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id ?? null);

      const [
        courtResult,
        imagesResult,
        reviewsResult,
        checkinsResult,
        reportsResult,
        eventsResult,
      ] = await Promise.all([
        supabase.from("courts").select("*").eq("id", courtId).maybeSingle(),

        supabase
          .from("court_images")
          .select("*")
          .eq("court_id", courtId)
          .order("created_at", { ascending: true }),

        supabase
          .from("court_reviews")
          .select("*")
          .eq("court_id", courtId)
          .order("created_at", { ascending: false }),

        supabase
          .from("court_checkins")
          .select("*")
          .eq("court_id", courtId)
          .gt("timeout_at", new Date().toISOString()),

        supabase
          .from("court_reports")
          .select("*")
          .eq("court_id", courtId)
          .order("created_at", { ascending: false }),

        supabase
          .from("events")
          .select("*")
          .eq("court_id", courtId)
          .order("event_date", { ascending: true })
          .order("event_time", { ascending: true }),

      ]);

      if (courtResult.error) {
        throw courtResult.error;
      }

      if (imagesResult.error) {
        throw imagesResult.error;
      }

      if (reviewsResult.error) {
        throw reviewsResult.error;
      }

      if (checkinsResult.error) {
        throw checkinsResult.error;
      }

      if (reportsResult.error) {
        throw reportsResult.error;
      }

      if (eventsResult.error) {
        throw eventsResult.error;
      }

      let favorite: CourtFavorite | null = null;

      if (user) {
        const favoriteResult = await supabase
          .from("court_favorites")
          .select("*")
          .eq("court_id", courtId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (favoriteResult.error) {
          throw favoriteResult.error;
        }

        favorite = favoriteResult.data;
      }

      const activeCheckins = checkinsResult.data ?? [];
      const courtReports = reportsResult.data ?? [];

      setCourt(courtResult.data);
      let sourceImages = imagesResult.data ?? [];

      // Ältere Freigaben haben die Vorschlagsbilder nicht in court_images kopiert.
      // In diesem Fall werden sie über die Koordinaten des freigegebenen Vorschlags
      // nachgeladen, damit sie weiterhin auf der Court-Seite erscheinen.
      if (sourceImages.length === 0 && courtResult.data) {
        const { data: proposalsWithImages } = await supabase
          .from("court_proposals")
          .select("id, court_proposal_images(*)")
          .eq("status", "approved")
          .gte("latitude", courtResult.data.latitude - 0.00001)
          .lte("latitude", courtResult.data.latitude + 0.00001)
          .gte("longitude", courtResult.data.longitude - 0.00001)
          .lte("longitude", courtResult.data.longitude + 0.00001);

        const proposalImages = (proposalsWithImages ?? []).flatMap(
          (proposal) => proposal.court_proposal_images ?? []
        );

        sourceImages = proposalImages.map((image) => ({
          court_id: courtId,
          created_at: image.created_at,
          id: image.id,
          image_url: image.image_url,
          media_type: image.media_type,
          user_id: image.user_id,
        }));
      }

      const courtImages = sourceImages.map((image) => ({
        ...image,
        image_url: image.image_url.startsWith("http")
          ? image.image_url
          : supabase.storage.from(COURT_MEDIA_BUCKET).getPublicUrl(image.image_url)
              .data.publicUrl,
      }));

      setImages(courtImages);
      setReviews(reviewsResult.data ?? []);
      setCheckins(activeCheckins);
      setReports(courtReports);
      setEvents(eventsResult.data ?? []);

      setIsCheckedIn(
        user
          ? activeCheckins.some((checkin) => checkin.user_id === user.id)
          : false
      );

      setIsFavorite(Boolean(favorite));
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError
          : new Error("Der Court konnte nicht geladen werden.")
      );
    } finally {
      setIsLoading(false);
    }
  }, [courtId]);

  const toggleFavorite = useCallback(async () => {
    if (isFavoriteLoading) {
      return;
    }

    setIsFavoriteLoading(true);
    setFavoriteError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Du musst eingeloggt sein, um Courts zu favorisieren.");
      }

      if (isFavorite) {
        const { error: deleteError } = await supabase
          .from("court_favorites")
          .delete()
          .eq("court_id", courtId)
          .eq("user_id", user.id);

        if (deleteError) {
          throw deleteError;
        }

        setIsFavorite(false);
        return;
      }

      const favorite: TablesInsert<"court_favorites"> = {
        court_id: courtId,
        user_id: user.id,
      };

      const { error: insertError } = await supabase
        .from("court_favorites")
        .insert(favorite);

      if (insertError) {
        throw insertError;
      }

      setIsFavorite(true);
    } catch (favoriteError) {
      console.error(
        "Favoritenstatus konnte nicht geändert werden:",
        favoriteError
      );

      setFavoriteError(
        favoriteError instanceof Error
          ? favoriteError.message
          : "Der Favoritenstatus konnte nicht geändert werden."
      );
    } finally {
      setIsFavoriteLoading(false);
    }
  }, [courtId, isFavorite, isFavoriteLoading]);

  const toggleCheckin = useCallback(async () => {
    if (isCheckinLoading) {
      return;
    }

    setIsCheckinLoading(true);
    setCheckinError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Du musst eingeloggt sein, um dich bei einem Court einzuchecken."
        );
      }

      if (isCheckedIn) {
        const { error: deleteError } = await supabase
          .from("court_checkins")
          .delete()
          .eq("court_id", courtId)
          .eq("user_id", user.id);

        if (deleteError) {
          throw deleteError;
        }

        setCheckins((currentCheckins) =>
          currentCheckins.filter((checkin) => checkin.user_id !== user.id)
        );

        setIsCheckedIn(false);
        return;
      }

      const checkin: TablesInsert<"court_checkins"> = {
        court_id: courtId,
        user_id: user.id,
      };

      const { data, error: insertError } = await supabase
        .from("court_checkins")
        .insert(checkin)
        .select("*")
        .single();

      if (insertError) {
        throw insertError;
      }

      setCheckins((currentCheckins) => [...currentCheckins, data]);
      setIsCheckedIn(true);
    } catch (checkinSubmitError) {
      console.error(
        "Check-in konnte nicht geändert werden:",
        checkinSubmitError
      );

      setCheckinError(
        checkinSubmitError instanceof Error
          ? checkinSubmitError.message
          : "Der Check-in konnte nicht geändert werden."
      );
    } finally {
      setIsCheckinLoading(false);
    }
  }, [courtId, isCheckedIn, isCheckinLoading]);

  const createReport = useCallback(
    async (
      category: string,
      description: string,
      images: File[]
    ): Promise<boolean> => {
      if (isReportSubmitting) {
        return false;
      }

      setIsReportSubmitting(true);
      setReportError(null);

      const uploadedImagePaths: string[] = [];
      let reportId: string | null = null;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            "Du musst eingeloggt sein, um ein Problem zu melden."
          );
        }

        if (!court) {
          throw new Error("Der Court konnte nicht gefunden werden.");
        }

        const trimmedCategory = category.trim();
        const trimmedDescription = description.trim();

        if (!trimmedCategory) {
          throw new Error("Bitte wähle eine Kategorie aus.");
        }

        if (!trimmedDescription) {
          throw new Error("Bitte beschreibe das Problem.");
        }

        if (!Array.isArray(images) || images.length === 0) {
          throw new Error("Bitte lade mindestens ein Foto des Problems hoch.");
        }

        if (images.length > 5) {
          throw new Error("Du kannst maximal 5 Bilder hochladen.");
        }

        if (!court.municipality_id) {
          throw new Error("Für diesen Court ist keine Kommune hinterlegt.");
        }

        for (const image of images) {
          if (!(image instanceof File)) {
            throw new Error("Ungültige Bilddatei.");
          }

          if (!image.type.startsWith("image/")) {
            throw new Error("Bitte lade ausschließlich Bilder hoch.");
          }
        }

        for (const image of images) {
          const fileExtension = image.name.includes(".")
            ? (image.name.split(".").pop()?.toLowerCase() ?? "jpg")
            : "jpg";

          const fileName = `${crypto.randomUUID()}.${fileExtension}`;

          const imagePath = `${user.id}/${courtId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("court-reports")
            .upload(imagePath, image, {
              cacheControl: "3600",
              contentType: image.type || "image/jpeg",
              upsert: false,
            });

          if (uploadError) {
            throw uploadError;
          }

          uploadedImagePaths.push(imagePath);
        }

        const report: TablesInsert<"court_reports"> = {
          category: trimmedCategory,
          court_id: courtId,
          description: trimmedDescription,
          image_url: uploadedImagePaths[0],
          municipality_id: court.municipality_id,
          user_id: user.id,
          status: "neu",
        };

        const { data: createdReport, error: insertError } = await supabase
          .from("court_reports")
          .insert(report)
          .select("id")
          .single();

        if (insertError) {
          throw insertError;
        }

        reportId = createdReport.id;

        const reportImages: TablesInsert<"court_report_images">[] =
          uploadedImagePaths.map((imagePath, index) => ({
            report_id: createdReport.id,
            image_url: imagePath,
            image_order: index + 1,
          }));

        const { error: reportImagesError } = await supabase
          .from("court_report_images")
          .insert(reportImages);

        if (reportImagesError) {
          throw reportImagesError;
        }

        return true;
      } catch (reportSubmitError) {
        console.error(
          "Problem konnte nicht gemeldet werden:",
          reportSubmitError
        );

        if (reportId) {
          const { error: deleteReportError } = await supabase
            .from("court_reports")
            .delete()
            .eq("id", reportId);

          if (deleteReportError) {
            console.error(
              "Fehlerhafte Report-Meldung konnte nicht entfernt werden:",
              deleteReportError
            );
          }
        }

        if (uploadedImagePaths.length > 0) {
          const { error: cleanupError } = await supabase.storage
            .from("court-reports")
            .remove(uploadedImagePaths);

          if (cleanupError) {
            console.error(
              "Hochgeladene Report-Bilder konnten nicht entfernt werden:",
              cleanupError
            );
          }
        }

        setReportError(
          reportSubmitError instanceof Error
            ? reportSubmitError.message
            : "Das Problem konnte nicht gemeldet werden."
        );

        return false;
      } finally {
        setIsReportSubmitting(false);
      }
    },
    [court, courtId, isReportSubmitting]
  );

  const uploadCourtImages = useCallback(
    async (newImages: File[]): Promise<boolean> => {
      if (isImageUploading) {
        return false;
      }

      setIsImageUploading(true);
      setImageUploadError(null);

      const uploadedPaths: string[] = [];

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Du musst eingeloggt sein, um Bilder hochzuladen.");
        }

        if (!Array.isArray(newImages) || newImages.length === 0) {
          throw new Error("Bitte wähle mindestens ein Bild aus.");
        }

        if (
          newImages.some(
            (image) =>
              !(image instanceof File) || !image.type.startsWith("image/")
          )
        ) {
          throw new Error("Bitte lade ausschließlich Bilddateien hoch.");
        }

        const { count, error: countError } = await supabase
          .from("court_images")
          .select("id", { count: "exact", head: true })
          .eq("court_id", courtId);

        if (countError) {
          throw countError;
        }

        if ((count ?? 0) + newImages.length > MAX_COURT_MEDIA) {
          throw new Error(
            "Pro Court können maximal 5 Medien hochgeladen werden."
          );
        }

        const imageRows: TablesInsert<"court_images">[] = [];

        for (const image of newImages) {
          if (!(image instanceof File)) {
            throw new Error("Ungültige Mediendatei.");
          }

          const mediaType = image.type.startsWith("video/")
            ? "video"
            : image.type.startsWith("image/")
              ? "image"
              : null;

          if (!mediaType) {
            throw new Error("Bitte lade ausschließlich Bilder oder Videos hoch.");
          }

          const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `courts/${courtId}/${user.id}/${crypto.randomUUID()}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from(COURT_MEDIA_BUCKET)
            .upload(path, image, {
              cacheControl: "3600",
              contentType: image.type,
              upsert: false,
            });

          if (uploadError) {
            throw uploadError;
          }

          uploadedPaths.push(path);

          const {
            data: { publicUrl },
          } = supabase.storage.from(COURT_MEDIA_BUCKET).getPublicUrl(path);

          imageRows.push({
            court_id: courtId,
            image_url: publicUrl,
            media_type: mediaType,
            user_id: user.id,
          });
        }

        const { data: createdImages, error: insertError } = await supabase
          .from("court_images")
          .insert(imageRows)
          .select();

        if (insertError) {
          throw insertError;
        }

        setImages((currentImages) => [
          ...currentImages,
          ...(createdImages ?? []),
        ]);
        return true;
      } catch (uploadError) {
        if (uploadedPaths.length > 0) {
          const { error: cleanupError } = await supabase.storage
            .from(COURT_MEDIA_BUCKET)
            .remove(uploadedPaths);

          if (cleanupError) {
            console.error(
              "Court-Bilder konnten nicht bereinigt werden:",
              cleanupError
            );
          }
        }

        setImageUploadError(
          uploadError instanceof Error
            ? uploadError.message
            : "Die Bilder konnten nicht hochgeladen werden."
        );
        return false;
      } finally {
        setIsImageUploading(false);
      }
    },
    [courtId, isImageUploading]
  );

  const deleteCourtImage = useCallback(
    async (image: CourtImage): Promise<boolean> => {
      const { error: deleteError } = await supabase
        .from("court_images")
        .delete()
        .eq("id", image.id)
        .eq("court_id", courtId);

      if (deleteError) {
        setImageUploadError(deleteError.message);
        return false;
      }

      const marker = "/storage/v1/object/public/";
      const storagePath = image.image_url.includes(marker)
        ? image.image_url.slice(image.image_url.indexOf(marker) + marker.length)
        : image.image_url;
      const bucketPrefix = `${COURT_MEDIA_BUCKET}/`;

      if (storagePath.startsWith(bucketPrefix)) {
        await supabase.storage
          .from(COURT_MEDIA_BUCKET)
          .remove([storagePath.slice(bucketPrefix.length)]);
      }

      setImages((currentImages) =>
        currentImages.filter((currentImage) => currentImage.id !== image.id)
      );
      return true;
    },
    [courtId]
  );

  const createReview = useCallback(
    async (rating: number, comment: string) => {
      setIsReviewSubmitting(true);
      setReviewError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            "Du musst eingeloggt sein, um den Court zu bewerten."
          );
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
          throw new Error("Die Bewertung muss zwischen 1 und 5 liegen.");
        }

        const trimmedComment = comment.trim();

        if (!trimmedComment) {
          throw new Error("Bitte gib einen Kommentar ein.");
        }

        const review: TablesInsert<"court_reviews"> = {
          court_id: courtId,
          user_id: user.id,
          rating,
          comment: trimmedComment,
        };

        const { data, error: insertError } = await supabase
          .from("court_reviews")
          .insert(review)
          .select("*")
          .single();

        if (insertError) {
          throw insertError;
        }

        setReviews((currentReviews) => [data, ...currentReviews]);
      } catch (reviewSubmitError) {
        console.error(
          "Bewertung konnte nicht erstellt werden:",
          reviewSubmitError
        );

        setReviewError(
          reviewSubmitError instanceof Error
            ? reviewSubmitError.message
            : "Die Bewertung konnte nicht erstellt werden."
        );
      } finally {
        setIsReviewSubmitting(false);
      }
    },
    [courtId]
  );

  const updateReview = useCallback(
    async (reviewId: string, rating: number, comment: string) => {
      setIsReviewSubmitting(true);
      setReviewError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            "Du musst eingeloggt sein, um deine Bewertung zu bearbeiten."
          );
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
          throw new Error("Die Bewertung muss zwischen 1 und 5 liegen.");
        }

        const trimmedComment = comment.trim();

        if (!trimmedComment) {
          throw new Error("Bitte gib einen Kommentar ein.");
        }

        const reviewUpdate: TablesUpdate<"court_reviews"> = {
          rating,
          comment: trimmedComment,
        };

        const { data, error: updateError } = await supabase
          .from("court_reviews")
          .update(reviewUpdate)
          .eq("id", reviewId)
          .eq("user_id", user.id)
          .select("*")
          .single();

        if (updateError) {
          throw updateError;
        }

        setReviews((currentReviews) =>
          currentReviews.map((review) =>
            review.id === reviewId ? data : review
          )
        );
      } catch (reviewUpdateError) {
        console.error(
          "Bewertung konnte nicht bearbeitet werden:",
          reviewUpdateError
        );

        setReviewError(
          reviewUpdateError instanceof Error
            ? reviewUpdateError.message
            : "Die Bewertung konnte nicht bearbeitet werden."
        );
      } finally {
        setIsReviewSubmitting(false);
      }
    },
    []
  );

  const deleteReview = useCallback(async (reviewId: string) => {
    setIsReviewSubmitting(true);
    setReviewError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Du musst eingeloggt sein, um deine Bewertung zu löschen."
        );
      }

      const { error: deleteError } = await supabase
        .from("court_reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setReviews((currentReviews) =>
        currentReviews.filter((review) => review.id !== reviewId)
      );
    } catch (reviewDeleteError) {
      console.error(
        "Bewertung konnte nicht gelöscht werden:",
        reviewDeleteError
      );

      setReviewError(
        reviewDeleteError instanceof Error
          ? reviewDeleteError.message
          : "Die Bewertung konnte nicht gelöscht werden."
      );
    } finally {
      setIsReviewSubmitting(false);
    }
  }, []);

  useEffect(() => {
    void fetchCourt();
  }, [fetchCourt]);

  const openReports = reports.filter((report) => report.status !== "resolved");

  return {
    court,
    images,
    reviews,
    checkins,
    reports,
    events,
    openReports,
    openReportsCount: openReports.length,
    currentUserId,

    isFavorite,
    isFavoriteLoading,
    favoriteError,
    toggleFavorite,

    isCheckedIn,
    isCheckinLoading,
    checkinError,
    toggleCheckin,

    isReportSubmitting,
    reportError,
    createReport,

    isReviewSubmitting,
    reviewError,
    createReview,
    updateReview,
    deleteReview,

    isImageUploading,
    imageUploadError,
    uploadCourtImages,
    deleteCourtImage,

    isLoading,
    error,
    refetch: fetchCourt,
  };
}
