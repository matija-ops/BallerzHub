import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useCourtFavorites() {
  const [favoriteCourtIds, setFavoriteCourtIds] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data } = await supabase
        .from("court_favorites")
        .select("court_id")
        .eq("user_id", user.id);

      if (!cancelled) {
        setFavoriteCourtIds(new Set((data ?? []).map((favorite) => favorite.court_id)));
      }
    }

    void loadFavorites();
    return () => {
      cancelled = true;
    };
  }, []);

  return favoriteCourtIds;
}
