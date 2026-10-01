import { useEffect } from "react";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";

const translations: Record<string, string> = {
  "Basketball-Events in deiner Umgebung": "Basketball events near you", "Court-Bilder": "Court photos",
  "Basketball Event": "Basketball event", "Event ansehen": "View event", 
  Eventname: "Event name", Datum: "Date", "Court auswählen": "Select court",
  Turnier: "Tournament", Training: "Training", Sonstiges: "Other", Herren: "Men", Damen: "Women", Offen: "Open",
  "Basketballplätze finden": "Find basketball courts", "Spiele & Turniere": "Games & tournaments",
  "Courts": "Courts", "Verein": "Club", "Verein auswählen": "Select club", "Team suchen": "Search team",
  "Team suchen ...": "Search team ...", "Gehörst du einem Verein an?": "Are you a member of a club?",
  "Persönliche Daten": "Personal information", Vorname: "First name", Nachname: "Last name",
  "Kein Profilbild vorhanden": "No profile picture available", "Neues Profilbild entfernen": "Remove new profile picture",
  "Profilbild entfernen": "Remove profile picture", "Noch keine Bilder ausgewählt.": "No images selected yet.",
  "Court-Vorschläge werden geladen …": "Loading court suggestions …", "Kommune auswählen": "Select municipality",
  Körbe: "Hoops", Längengrad: "Longitude", Breitengrad: "Latitude", "Status ändern": "Change status",
  "Bitte auswählen": "Please select", "Nächster Spieltag": "Next matchday", "Vorheriger Spieltag": "Previous matchday",
  "Nächstes Bild": "Next image", "Vorheriges Bild": "Previous image", "Navigation öffnen": "Open navigation",
  "Beschreibe das Problem möglichst genau …": "Describe the problem as precisely as possible …",
  "Beschreibe dein Event ...": "Describe your event ...", "Weitere Informationen zum Court …": "Additional information about the court …",
  "Meldungen durchsuchen...": "Search reports...", "Spieltag auswählen": "Select matchday",
  "z. B. Basketball Summer Cup": "e.g. Basketball Summer Cup", "z. B. Dunk Masters": "e.g. Dunk Masters",
  "z. B. Mönchengladbach": "e.g. Mönchengladbach", "z. B. Stadtpark Court": "e.g. City park court",
  "z. B. U16m oder Herren": "e.g. U16m or men's", "z. B. 16": "e.g. 16", "z. B. 2": "e.g. 2",
  "Court-Aktionen": "Court actions", "Close toast": "Close notification", "Status ändern": "Change status",
  Abbrechen: "Cancel", Account: "Account", "Alle Kategorien": "All categories", "Alle Status": "All statuses",
  "Alle offenen": "All open", Altersgruppen: "Age groups", "Angemeldete Teams": "Registered teams",
  "Bild entfernen": "Remove image", "Court-Bild": "Court image", Dashboard: "Dashboard", "Dashboard wird geladen …": "Loading dashboard …",
  "Der Court konnte nicht geladen werden.": "The court could not be loaded.", "Dieser Court wurde nicht gefunden.": "This court was not found.",
  "E-Mail": "Email", "Erstellt am": "Created on", "Events filtern": "Filter events", "Geburtsdatum": "Date of birth",
  "Keine Mannschaften vorhanden": "No teams available", "Keine Mannschaft": "No team", "Keine Teams gefunden": "No teams found",
  "Keine Meldungs-ID angegeben.": "No report ID provided.", "Keine offenen Tickets": "No open tickets", "Kein Verein": "No club",
  "Letztes Spiel": "Last game", "Logo-URL": "Logo URL", "Meine Mannschaft": "My team", "Meldung verwalten": "Manage report",
  "Nicht hinterlegt": "Not provided", Nein: "No", "Problem melden": "Report a problem", "Profil bearbeiten": "Edit profile",
  Profilbild: "Profile picture", "Social Media": "Social media", Sonstiges: "Other", Spiel: "Game", Spieler: "Players",
  Spielklasse: "Division", Standort: "Location", Teamname: "Team name", Teams: "Teams", Teilnahme: "Participation",
  Veranstaltungsort: "Venue", "Verein bearbeiten": "Edit club", "Zur Liga": "To league", Wohnort: "Place of residence",
  "Beispiel: 16 Teams.": "Example: 16 teams.", Verschmutzung: "Litter", Boden: "Surface", "Sp.": "GP", Pkt: "Pts", "Pkt.": "Pts.",
  Platz: "Rank", "Saison:": "Season:", "Altersklasse:": "Age group:", "Spielklasse:": "Division:",
  Vereine: "Clubs", "Verein suchen ...": "Search clubs ...", "Verein suchen": "Search clubs",
  "Keine Vereine vorhanden": "No clubs available", "Keine Vereine gefunden": "No clubs found",
  Ligen: "Leagues", "Keine Ligen vorhanden": "No leagues available", Events: "Events",
  "Keine Events gefunden": "No events found", "Event erstellen": "Create event", "Event bearbeiten": "Edit event",
  "Event-Kalender": "Event calendar", "Kalender wird geladen …": "Loading calendar …",
  "Die Events konnten nicht geladen werden.": "The events could not be loaded.",
  "Courts werden geladen …": "Loading courts …", "Courts werden geladen...": "Loading courts...",
  "Die Courts konnten nicht geladen werden.": "The courts could not be loaded.",
  "Keine Court-ID angegeben.": "No court ID provided.", "Problem melden": "Report a problem",
  "Court wird geladen...": "Loading court...", "Court nicht gefunden.": "Court not found.",
  "Court bearbeiten": "Edit court", "Neuen Court vorschlagen": "Suggest a new court",
  "Court-Bilder hinzufügen": "Add court photos", "Teile Fotos des Courts mit der Community. Maximal 5 Bilder pro Court (0/5).": "Share photos of this court with the community. Maximum 5 photos per court (0/5).",
  "Court-Informationen": "Court information", "Court-Typ": "Court type", "Offene Meldungen": "Open reports",
  "Für diesen Court gibt es aktuell keine offenen Meldungen.": "There are currently no open reports for this court.",
  Favorisiert: "Favorited", Bewertungen: "Reviews", Bewertung: "Rating", Kommentar: "Comment",
  "Wie findest du den Court?": "What do you think of this court?", "Sehr gut": "Very good",
  "Nicht vorhanden": "Not available", "Nicht barrierefrei": "Not accessible", Route: "Directions",
  "Route starten": "Get directions", Aktiv: "Active", "Number of hoops": "Number of hoops",
  "Court-Vorschläge verwalten": "Manage court suggestions", "Keine offenen Court-Vorschläge": "No open court suggestions",
  "Meine Courts": "My courts", "Stadt & Kommune": "City & municipality", "Meldungen": "Reports",
  "Meldungen werden geladen...": "Loading reports...", "Meine Meldungen": "My reports",
  "Meldungen verwalten": "Manage reports", "Meldung wird geladen...": "Loading report...",
  "Meldung wurde nicht gefunden.": "Report not found.", "Meldung verwalten": "Manage report",
  "Meldungsdetails": "Report details", "Zurück": "Back", "Abbrechen": "Cancel", Speichern: "Save",
  Bearbeiten: "Edit", Löschen: "Delete", Erstellen: "Create", Aktualisieren: "Update", Suchen: "Search",
  Kategorie: "Category", "Kategorie auswählen": "Select category", Altersklasse: "Age group",
  "Altersklasse auswählen": "Select age group", Ort: "Location", "Ort suchen …": "Search location …",
  "Ort oder Stadt weltweit suchen ...": "Search location or city worldwide ...", Beschreibung: "Description",
  "Beschreibung des Vereins": "Club description", Name: "Name", Typ: "Type", "Typ auswählen": "Select type",
  Standort: "Location", Bilder: "Images", "Bilder auswählen": "Select images", "Bild hinzufügen": "Add image",
  "Bild entfernen": "Remove image", "Anzahl Körbe": "Number of hoops", Beleuchtung: "Lighting",
  Barrierefrei: "Accessible", Status: "Status", "Status auswählen": "Select status", Aktiv: "Active",
  Wartung: "Maintenance", Geschlossen: "Closed", Neu: "New", "In Bearbeitung": "In progress", Behoben: "Resolved",
  "Verein bearbeiten": "Edit club", "Vereinsname": "Club name", "Logo-URL": "Logo URL",
  "Mannschaft hinzufügen": "Add team", "Mannschaft bearbeiten": "Edit team", Mannschaft: "Team",
  Spieler: "Players", Liga: "League", "Liga auswählen": "Select league", "Spiel erstellen": "Create game",
  Spiel: "Game", Heimmannschaft: "Home team", "Heimmannschaft auswählen": "Select home team",
  Auswärtsmannschaft: "Away team", "Auswärtsmannschaft auswählen": "Select away team", Spieldatum: "Game date",
  Uhrzeit: "Time", "Punkte Heim": "Home score", "Punkte Auswärts": "Away score", Saison: "Season",
  Altersklasse: "Age group", Spielklasse: "Division", Heim: "Home", Auswärts: "Away", Vergangen: "Past",
  "Datum & Uhrzeit": "Date & time", Veranstaltungsort: "Venue", Teilnahme: "Participation",
  "Angemeldete Teams": "Registered teams", "Routenführung auswählen": "Choose directions",
  "Meine Courts": "My courts", "Court-Aktionen": "Court actions", "Meinen Standort anzeigen": "Show my location",
  Einloggen: "Log in", "E-Mail": "Email", "E-Mail-Adresse": "Email address", Passwort: "Password",
  "Mindestens 6 Zeichen": "At least 6 characters", "oder mit E-Mail": "or with email", Account: "Account",
  "Die Anmeldung konnte nicht abgeschlossen werden. Bitte versuche es erneut.": "Sign-in could not be completed. Please try again.",
  "Zur Anmeldung": "Back to sign in", "Anmeldung wird abgeschlossen …": "Completing sign-in …",
};

const reverseTranslations = Object.fromEntries(Object.entries(translations).map(([de, en]) => [en, de]));

function LanguageSync() {
  const { i18n: languageInstance } = useTranslation();
  useEffect(() => {
    let isSyncing = false;
    let observer: MutationObserver;
    const sync = () => {
      if (isSyncing) return;
      isSyncing = true;
      observer?.disconnect();
      const dictionary = i18n.language.startsWith("en") ? translations : reverseTranslations;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const value = node.nodeValue?.trim();
        if (value && dictionary[value] !== undefined) {
          node.nodeValue = node.nodeValue!.replace(value, dictionary[value]);
        } else if (value && i18n.language.startsWith("en") && /\b\d{1,2}:\d{2} Uhr\b/.test(value)) {
          node.nodeValue = node.nodeValue!.replace(/ Uhr\b/g, " h");
        } else if (value && !i18n.language.startsWith("en") && /\b\d{1,2}:\d{2} h\b/.test(value)) {
          node.nodeValue = node.nodeValue!.replace(/ h\b/g, " Uhr");
        }
      }
      document.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title]").forEach((element) => {
        ["placeholder", "aria-label", "title"].forEach((attribute) => {
          const value = element.getAttribute(attribute);
          if (value && dictionary[value]) element.setAttribute(attribute, dictionary[value]);
        });
      });
      isSyncing = false;
      observer?.observe(document.body, { childList: true, subtree: true, characterData: true });
    };
    sync();
    observer = new MutationObserver(() => sync());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [languageInstance.language]);
  return null;
}

export default LanguageSync;
