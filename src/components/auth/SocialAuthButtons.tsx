import { useState } from "react";
import { FaApple, FaGoogle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export function SocialAuthButtons({ disabled = false }: { disabled?: boolean }) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: "google" | "apple") {
    setPending(provider);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: new URL(
            `${import.meta.env.BASE_URL}auth/callback`,
            window.location.origin,
          ).href,
        },
      });
      if (error) throw error;
    } catch {
      setError("Die Anmeldung konnte nicht gestartet werden. Bitte versuche es später erneut oder melde dich mit E-Mail an.");
      setPending(null);
    }
  }

  return (
    <div className="mb-6 space-y-3">
      <Button type="button" variant="outline" className="w-full" disabled={disabled || pending !== null} onClick={() => void signIn("google")}>
        <FaGoogle /> {pending === "google" ? "Weiterleitung …" : "Mit Google fortfahren"}
      </Button>
      <Button type="button" variant="outline" className="w-full" disabled={disabled || pending !== null} onClick={() => void signIn("apple")}>
        <FaApple /> {pending === "apple" ? "Weiterleitung …" : "Mit Apple fortfahren"}
      </Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <p className="text-center text-sm text-muted-foreground">oder mit E-Mail</p>
    </div>
  );
}
