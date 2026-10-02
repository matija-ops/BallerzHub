import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const EMPTY_FAVORITES = new Set<string>();

export function useCourtFavorites() {
  const { user } = useAuth();
  const userId = user?.id;
  const [favorites, setFavorites] = useState<{
    userId: string;
    ids: Set<string>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      if (!userId) {
        setFavorites(null);
        return;
      }

      const { data } = await supabase
        .from("court_favorites")
        .select("court_id")
        .eq("user_id", userId);

      if (!cancelled) {
        setFavorites({
          userId,
          ids: new Set((data ?? []).map((favorite) => favorite.court_id)),
        });
      }
    }

    void loadFavorites();

    if (!userId) {
      return () => {
        cancelled = true;
      };
    }

    const channel = supabase
      .channel(`court-favorites-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "court_favorites",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void loadFavorites();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return favorites?.userId === userId && favorites
    ? favorites.ids
    : EMPTY_FAVORITES;
}
