# Google und Apple aktivieren

Die App bietet beide Anbieter auf `/register` und `/login` an. Nach OAuth
verarbeitet `/auth/callback` die Supabase-Sitzung. Benutzer ohne vollständiges
Profil ergänzen ihre Angaben unter `/register?complete=1`. Bestehende Profile
werden beim Login nicht überschrieben. E-Mail/Passwort bleibt verfügbar.

## Supabase

1. Unter Authentication → URL Configuration die Site URL auf die öffentliche
   App-Adresse setzen.
2. Unter Redirect URLs `https://DEINE-DOMAIN/auth/callback` sowie für lokale
   Entwicklung `http://localhost:5173/auth/callback` hinzufügen (Port ggf. anpassen).
3. Unter Authentication → Sign In / Providers Google und Apple aktivieren und
   deren Client-Zugangsdaten eintragen.
4. Beim Hosting alle App-Routen einschließlich `/auth/callback` auf `index.html`
   weiterleiten, damit direkte Browseraufrufe funktionieren.

## Google

In Google Cloud einen OAuth-Client für eine Webanwendung einrichten. Als
Redirect URI die im Supabase-Dashboard angezeigte Callback-URL verwenden:
`https://PROJECT-REF.supabase.co/auth/v1/callback`.
Client ID und Client Secret in Supabase hinterlegen. Bei einer OAuth-App im
Testmodus die gewünschten Testbenutzer freischalten.

## Apple

Im Apple Developer Account Sign in with Apple für die App konfigurieren und
für die Website eine Services ID anlegen. Supabase-Domain und die Callback-URL
`https://PROJECT-REF.supabase.co/auth/v1/callback` registrieren. Die Services ID
und das mit Team ID, Key ID und privatem Apple-Schlüssel erzeugte Client Secret
in Supabase eintragen. Das Apple Client Secret muss spätestens nach sechs
Monaten erneuert werden. Secrets ausschließlich in den Provider-Einstellungen
speichern, niemals als VITE-Variablen oder im Frontend.

## Instagram und FIBA 3x3

Die vorhandenen Profilfelder verlinken Instagram und FIBA 3x3; sie sind keine
Identitätsprüfung. Meta bietet Instagram Login für professionelle Konten,
nicht als allgemeinen Login für private Instagram-Konten. Für FIBA 3x3 wurde
kein öffentlich dokumentierter Drittanbieter-Login gefunden. Eine zusätzliche
Anbindung benötigt eine geeignete, freigegebene Authentifizierungsschnittstelle
und entsprechende Anbieter-Zugangsdaten.

## Prüfung nach der Einrichtung

- Mit neuem Google-/Apple-Konto registrieren, Profil vervollständigen und prüfen,
  dass genau ein profiles-Datensatz mit der auth.users-ID existiert.
- Abmelden und erneut über denselben Anbieter einloggen; vorhandene Profildaten
  müssen erhalten bleiben und das Vervollständigungsformular darf nicht erscheinen.
- Zustimmung beim Anbieter abbrechen und die Fehleransicht prüfen.
- Bei Apple auch eine private Relay-E-Mail-Adresse testen.
- Profil-RLS muss authentifizierten Benutzern SELECT, INSERT und UPDATE für die
  eigene ID erlauben. Vorhandene Auth-Trigger dürfen keine nur für E-Mail-Logins
  verfügbaren Metadaten voraussetzen.

Live-Tests und Anbieteraktivierung stehen aus; hierfür fehlen die Provider-Zugangsdaten.

Quellen:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/social-login/auth-apple
- https://supabase.com/docs/guides/auth/redirect-urls
- https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- https://premium-api.fiba3x3.com/
