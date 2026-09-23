import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

type Profile = Tables<"profiles">;

type UseEventParticipantsProps = {
  eventId: string;
};

export function useEventParticipants({ eventId }: UseEventParticipantsProps) {
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    if (!eventId) {
      setParticipants([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data: participantRows, error: participantError } = await supabase
      .from("event_participants")
      .select("user_id")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (participantError) {
      setParticipants([]);
      setError(participantError.message);
      setIsLoading(false);
      return;
    }

    const userIds = (participantRows ?? []).map(
      (participant) => participant.user_id
    );

    if (userIds.length === 0) {
      setParticipants([]);
      setIsLoading(false);
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (profilesError) {
      setParticipants([]);
      setError(profilesError.message);
      setIsLoading(false);
      return;
    }

    const profilesById = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile])
    );

    const orderedParticipants = userIds
      .map((userId) => profilesById.get(userId))
      .filter((profile): profile is Profile => Boolean(profile));

    setParticipants(orderedParticipants);
    setIsLoading(false);
  }, [eventId]);

  useEffect(() => {
    void fetchParticipants();
  }, [fetchParticipants]);

  return {
    participants,
    isLoading,
    error,
    refetch: fetchParticipants,
  };
}
