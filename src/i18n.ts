import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export type Language = "de" | "en";
const saved = localStorage.getItem("ballerzhub-language");
const initial: Language = saved === "en" || saved === "de" ? saved : "de";

void i18n.use(initReactI18next).init({
  lng: initial,
  fallbackLng: "de",
  interpolation: { escapeValue: false },
  resources: {
    de: { translation: { closeNavigation: "Navigation schließen", mainNavigation: "Hauptnavigation", findCourts: "Basketballplätze finden", eventsDescription: "Spiele & Turniere", cityAndMunicipality: "Stadt & Kommune", manageCourtsAndReports: "Courts & Meldungen verwalten", reports: "Meldungen", myProfile: "Mein Profil", logout: "Abmelden", loginRegister: "Login / Registrieren", language: "Sprache", german: "Deutsch", english: "English", basketballer: "Basketballer" } },
    en: { translation: { closeNavigation: "Close navigation", mainNavigation: "Main navigation", findCourts: "Find basketball courts", eventsDescription: "Games & tournaments", cityAndMunicipality: "City & municipality", manageCourtsAndReports: "Manage courts & reports", reports: "Reports", myProfile: "My profile", logout: "Log out", loginRegister: "Log in / Register", language: "Language", german: "Deutsch", english: "English", basketballer: "Basketball player" } },
  },
});

export default i18n;
