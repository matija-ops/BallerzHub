import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  LogOut,
  Map,
  Table2,
  UserRound,
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
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";

import NavigationItem from "./NavigationItem";
import NavigationTrigger from "./NavigationTrigger";

type AppNavigationProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

function AppNavigation({ isOpen, onOpenChange }: AppNavigationProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
  const currentLanguage = i18n.language.startsWith("en") ? "en" : "de";
  const changeLanguage = (language: "de" | "en") => {
    void i18n.changeLanguage(language);
    localStorage.setItem("ballerzhub-language", language);
    document.documentElement.lang = language;
  };

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
            <SheetTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
              BallerzHub
              <svg
                aria-hidden="true"
                viewBox="0 0 48 52"
                className="h-12 w-11 shrink-0 overflow-visible"
              >
                <ellipse
                  className="brand-ball-shadow"
                  cx="24"
                  cy="48"
                  rx="13"
                  ry="3"
                  fill="currentColor"
                  opacity="0.18"
                />
                <g className="brand-ball-bounce">
                  <g>
                    <circle
                      cx="24"
                      cy="27"
                      r="17"
                      fill="#ff852b"
                      stroke="#382014"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M12 38a17 17 0 0 0 27-19 17 17 0 0 1-27 19"
                      fill="#e85c12"
                    />
                    <g
                      fill="none"
                      stroke="#382014"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M23 10c-11 5-16 23-7 32M7.2 28c9 3 24 3 33.5-2M9 19c-1 11 8 9 17 2 5-4 9-6 12-5M10 36c6-6 17 10 26 3" />
                    </g>
                    <path
                      d="M14 20q2-5 7-6"
                      fill="none"
                      stroke="#ffe0a3"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </g>
                </g>
              </svg>
            </SheetTitle>

            <SheetClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("closeNavigation")}
                  className="absolute top-4 right-4 z-10"
                />
              }
              onClick={closeNavigation}
            >
              <X className="size-5" />
            </SheetClose>
          </SheetHeader>

          <nav
            aria-label={t("mainNavigation")}
            className="flex flex-1 flex-col overflow-y-auto px-3 py-4"
          >
            <div className="space-y-1">
              {/* Courts */}
              <NavigationItem
                to="/courts"
                end
                icon={Map}
                title="Courts"
                description={t("findCourts")}
                onNavigate={closeNavigation}
              />

              {/* Events */}
              <NavigationItem
                to="/events"
                icon={CalendarDays}
                title="Events"
                description={t("eventsDescription")}
                onNavigate={closeNavigation}
              />

              {/* 5 vs. 5 */}
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
                      5 vs. 5
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
                    {/* easycreditBBL */}
                    <NavigationItem
                      to="/leagues/f88f2e61-9bb0-4e8f-9b5b-e563db6b0cbf"
                      icon={Table2}
                      title="easyCreditBBL"
                      onNavigate={closeNavigation}
                      nested
                    />

                    {/* Bezirksliga Herren Niers */}
                    <NavigationItem
                      to="/leagues/c2a39c5b-ecab-475b-b620-6a4f2da8faba"
                      icon={Table2}
                      title="Bezirksliga Herren Niers"
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
                      {t("cityAndMunicipality")}
                    </span>

                    <span className="block text-sm text-muted-foreground">
                      {t("manageCourtsAndReports")}
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

                    <NavigationItem
                      to="/admin/court-proposals"
                      icon={ClipboardCheck}
                      title="Court-Vorschläge"
                      onNavigate={closeNavigation}
                      nested
                    />

                    {/* Reports / Kommunen-Dashboard */}
                    <NavigationItem
                      to="/municipality/dashboard"
                      icon={Building2}
                      title={t("reports")}
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
                  title={`Hi ${firstName || t("basketballer")} 👋`}
                  description={t("myProfile")}
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

                  <span>{t("logout")}</span>
                </Button>
              </div>
            ) : (
              <NavigationItem
                to="/login"
                icon={UserRound}
                title={t("loginRegister")}
                onNavigate={closeNavigation}
              />
            )}

            <div className="mt-4 rounded-xl bg-muted/60 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {t("language")}
              </p>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("language")}>
                <Button
                  type="button"
                  variant={currentLanguage === "de" ? "default" : "outline"}
                  className="text-xl"
                  onClick={() => changeLanguage("de")}
                  aria-label={t("german")}
                  aria-pressed={currentLanguage === "de"}
                >
                  <span aria-hidden="true">🇩🇪</span>
                </Button>
                <Button
                  type="button"
                  variant={currentLanguage === "en" ? "default" : "outline"}
                  className="text-xl"
                  onClick={() => changeLanguage("en")}
                  aria-label={t("english")}
                  aria-pressed={currentLanguage === "en"}
                >
                  <span aria-hidden="true">🇺🇸</span>
                </Button>
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default AppNavigation;
