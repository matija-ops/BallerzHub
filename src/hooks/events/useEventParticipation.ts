import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type UseEventParticipationProps = {
  eventId: string;
};

export function useEventParticipation({ eventId }: UseEventParticipationProps) {
  const [participantCount, setParticipantCount] = useState(0);
  const [isParticipating, setIsParticipating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { count, error: countError } = await supabase
      .from("event_participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (countError) {
      setError(countError.message);
      setParticipantCount(0);
      setIsLoading(false);
      return;
    }

    setParticipantCount(count ?? 0);

    if (!user) {
      setIsParticipating(false);
      setIsLoading(false);
      return;
    }

    const { data, error: participationError } = await supabase
      .from("event_participants")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (participationError) {
      setError(participationError.message);
      setIsParticipating(false);
      setIsLoading(false);
      return;
    }

    setIsParticipating(Boolean(data));
    setIsLoading(false);
  }, [eventId]);

  useEffect(() => {
    void fetchParticipation();
  }, [fetchParticipation]);

  const participate = useCallback(
    async (category: string) => {
      setIsSubmitting(true);
      setError(null);

      if (!category) {
        setError("Bitte eine Kategorie auswählen.");
        setIsSubmitting(false);
        return false;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Du musst eingeloggt sein, um teilzunehmen.");
        setIsSubmitting(false);
        return false;
      }

      const { error: insertError } = await supabase
        .from("event_participants")
        .insert({
          event_id: eventId,
          user_id: user.id,
          category,
        });

      if (insertError) {
        setError(insertError.message);
        setIsSubmitting(false);
        return false;
      }

      setIsParticipating(true);
      setParticipantCount((current) => current + 1);
      setIsSubmitting(false);

      return true;
    },
    [eventId]
  );

  const withdraw = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Du musst eingeloggt sein.");
      setIsSubmitting(false);
      return false;
    }

    const { error: deleteError } = await supabase
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);

    if (deleteError) {
      setError(deleteError.message);
      setIsSubmitting(false);
      return false;
    }

    setIsParticipating(false);
    setParticipantCount((current) => Math.max(0, current - 1));
    setIsSubmitting(false);

    return true;
  }, [eventId]);

  return {
    participantCount,
    isParticipating,
    isLoading,
    isSubmitting,
    error,
    participate,
    withdraw,
    refetch: fetchParticipation,
  };
}
