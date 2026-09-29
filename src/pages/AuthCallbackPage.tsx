import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function finishSignIn() {
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));
      if (query.has("error") || hash.has("error")) throw new Error("OAuth failed");
      // The shared Supabase client processes the OAuth URL before getSession resolves.
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) throw new Error("No session");
      const user = data.session.user;
      const { data: profile, error: profileError } = await supabase
        .from("profiles").select("first_name,last_name,birth_date,location")
        .eq("id", user.id).maybeSingle();
      if (profileError) throw profileError;
      if (cancelled) return;
      if (!profile?.first_name || !profile.last_name || !profile.birth_date || !profile.location) {
        navigate("/register?complete=1", { replace: true });
        return;
      }
      const { data: membership, error: membershipError } = await supabase
        .from("municipality_users").select("municipality_id")
        .eq("user_id", user.id).maybeSingle();
      if (membershipError) throw membershipError;
      if (!cancelled) navigate(membership ? "/municipality/dashboard" : "/courts", { replace: true });
    }
    void finishSignIn().catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      {error ? <>
        <p role="alert">Die Anmeldung konnte nicht abgeschlossen werden. Bitte versuche es erneut.</p>
        <Link to="/login" className="text-primary underline">Zur Anmeldung</Link>
      </> : <p role="status">Anmeldung wird abgeschlossen …</p>}
    </main>
  );
}
