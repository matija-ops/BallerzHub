import { supabase } from "@/lib/supabase";

import type { Database } from "@/types/supabase.types";

export async function getCurrentMunicipalityId() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("Kein Benutzer eingeloggt.");
  }

  const { data, error } = await supabase
    .from("municipality_users")
    .select("municipality_id")
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data.municipality_id;
}

export async function getMunicipalityCourts(municipalityId: string) {
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    //.eq("municipality_id", municipalityId)
    .neq("status", "deleted")
    .order("name");

  if (error) {
    throw error;
  }

  return data;
}

export async function getMunicipalityCourt(
  municipalityId: string,
  courtId: string
) {
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .eq("id", courtId)
    //.eq("municipality_id", municipalityId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateMunicipalityCourt(
  municipalityId: string,
  courtId: string,
  updates: Database["public"]["Tables"]["courts"]["Update"]
) {
  const { data, error } = await supabase
    .from("courts")
    .update(updates)
    .eq("id", courtId)
    .eq("municipality_id", municipalityId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteMunicipalityCourt(
  municipalityId: string,
  courtId: string
) {
  const { error } = await supabase
    .from("courts")
    .update({ status: "deleted" })
    .eq("id", courtId)
    .eq("municipality_id", municipalityId)
    .select("id")
    .single();

  if (error) {
    throw error;
  }
}
