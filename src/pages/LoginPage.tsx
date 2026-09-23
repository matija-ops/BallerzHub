import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { supabase } from "@/lib/supabase";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.user) {
        throw new Error("Der Login konnte keinem Benutzer zugeordnet werden.");
      }

      /*
       * Prüfen, ob der eingeloggte Benutzer einer Kommune
       * zugeordnet ist.
       *
       * municipality_users ist die verbindliche Zuordnung
       * zwischen Benutzer und Kommune.
       */
      const { data: municipalityUser, error: municipalityError } =
        await supabase
          .from("municipality_users")
          .select("municipality_id")
          .eq("user_id", data.user.id)
          .maybeSingle();

      if (municipalityError) {
        throw municipalityError;
      }

      /*
       * Municipality-Account:
       * direkt zum Kommune-Dashboard.
       */
      if (municipalityUser) {
        navigate("/municipality/dashboard", {
          replace: true,
        });

        return;
      }

      /*
       * Normaler User:
       * wie bisher zur Courts-Map.
       */
      navigate("/courts", {
        replace: true,
      });
    } catch (loginError) {
      console.error("Login fehlgeschlagen:", loginError);

      setError(
        loginError instanceof Error
          ? loginError.message
          : "Der Login ist fehlgeschlagen."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Einloggen</CardTitle>

          <CardDescription>
            Logge dich ein, um persönliche Funktionen zu nutzen.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>

              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="E-Mail-Adresse"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>

              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Passwort"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Einloggen …" : "Einloggen"}
            </Button>

            <div className="pt-2 text-center text-sm text-muted-foreground">
              Noch keinen Account?{" "}
              <Link
                to="/register"
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
              >
                Registrieren
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default LoginPage;
