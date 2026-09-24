import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building,
  Building2,
  CalendarDays,
  ChevronDown,
  LogOut,
  Map,
  Table2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { supabase } from "@/lib/supabase";

import NavigationItem from "./NavigationItem";
import NavigationTrigger from "./NavigationTrigger";

type AppNavigationProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

function AppNavigation({ isOpen, onOpenChange }: AppNavigationProps) {
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);

  const [isClubsOpen, setIsClubsOpen] = useState(false);
  const [isMunicipalityOpen, setIsMunicipalityOpen] = useState(false);

  const closeNavigation = () => {
    onOpenChange(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (!user) {
        setUserId(null);
        setFirstName(null);
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      setFirstName(profile?.first_name ?? null);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (!session?.user) {
        setUserId(null);
        setFirstName(null);
        return;
      }

      setUserId(session.user.id);

      void (async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", session.user.id)
          .maybeSingle();

        if (isMounted) {
          setFirstName(profile?.first_name ?? null);
        }
      })();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout fehlgeschlagen:", error);
      return;
    }

    closeNavigation();
    navigate("/courts", { replace: true });
  };

  const isLoggedIn = Boolean(userId);

  return (
    <>
      {!isOpen && (
        <div className="fixed top-4 left-4 z-1100">
          <NavigationTrigger onClick={() => onOpenChange(true)} />
        </div>
      )}

      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[85vw] max-w-sm gap-0 p-0"
        >
          <SheetHeader className="relative border-b px-5 py-5 pr-14 text-left">
            <SheetTitle className="text-xl font-bold tracking-tight">
              BALLHUB
            </SheetTitle>

            <SheetClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Navigation schließen"
                  className="absolute top-4 right-4 z-10"
                />
              }
              onClick={closeNavigation}
            >
              <X className="size-5" />
            </SheetClose>
          </SheetHeader>

          <nav
            aria-label="Hauptnavigation"
            className="flex flex-1 flex-col overflow-y-auto px-3 py-4"
          >
            <div className="space-y-1">
              {/* Courts */}
              <NavigationItem
                to="/courts"
                end
                icon={Map}
                title="Courts"
                description="Basketballplätze finden"
                onNavigate={closeNavigation}
              />

              {/* Events */}
              <NavigationItem
                to="/events"
                icon={CalendarDays}
                title="Events"
                description="Spiele & Turniere"
                onNavigate={closeNavigation}
              />

              {/* Vereine */}
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted"
                  aria-expanded={isClubsOpen}
                  onClick={() => setIsClubsOpen((current) => !current)}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Building className="size-5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold">
                      Vereine
                    </span>

                    <span className="block text-sm text-muted-foreground">
                      Vereine entdecken
                    </span>
                  </span>

                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition-transform ${
                      isClubsOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {isClubsOpen && (
                  <div className="space-y-1">
                    {/* Vereine */}
                    <NavigationItem
                      to="/clubs"
                      icon={Building}
                      title="Vereine"
                      onNavigate={closeNavigation}
                      nested
                    />

                    {/* Teams */}
                    <NavigationItem
                      to="/teams"
                      icon={Users}
                      title="Teams"
                      onNavigate={closeNavigation}
                      nested
                    />

                    {/* Tabellen */}
                    <NavigationItem
                      to="/leagues"
                      icon={Table2}
                      title="Tabellen"
                      onNavigate={closeNavigation}
                      nested
                    />
                  </div>
                )}
              </div>

              {/* Stadt & Kommune */}
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted"
                  aria-expanded={isMunicipalityOpen}
                  onClick={() => setIsMunicipalityOpen((current) => !current)}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="size-5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold">
                      Stadt & Kommune
                    </span>

                    <span className="block text-sm text-muted-foreground">
                      Courts & Meldungen
                      <wbr /> verwalten
                    </span>
                  </span>

                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition-transform ${
                      isMunicipalityOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {isMunicipalityOpen && (
                  <div className="space-y-1">
                    {/* Courts */}
                    <NavigationItem
                      to="/municipality/courts"
                      icon={Map}
                      title="Courts"
                      onNavigate={closeNavigation}
                      nested
                    />

                    {/* Reports / Kommunen-Dashboard */}
                    <NavigationItem
                      to="/municipality/dashboard"
                      icon={Building2}
                      title="Reports"
                      onNavigate={closeNavigation}
                      nested
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="my-4">
              <Separator />
            </div>

            {/* Benutzerbereich */}
            {isLoggedIn ? (
              <div className="space-y-1">
                <NavigationItem
                  to="/profile"
                  icon={UserRound}
                  title={`Hi ${firstName || "Basketballer"} 👋`}
                  description="Mein Profil"
                  onNavigate={closeNavigation}
                />

                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 w-full justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"
                  onClick={handleLogout}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <LogOut className="size-5" />
                  </span>

                  <span>Abmelden</span>
                </Button>
              </div>
            ) : (
              <NavigationItem
                to="/login"
                icon={UserRound}
                title="Login / Registrieren"
                onNavigate={closeNavigation}
              />
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default AppNavigation;
