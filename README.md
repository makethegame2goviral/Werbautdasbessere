# LEGEND DRAFT

Ein Multiplayer-Team-Draft für Freunde. Jeder Spieler erstellt ein Konto, sieht aktive Spieler, lädt jemanden in eine Lobby ein und baut mit einem **virtuellen Spielbudget von 20 Punkten** sein Team. Es gibt keine Echtgeld-Funktion.

## Enthalten

- Benutzername + Passwort über Supabase Auth
- Online-Anzeige mit Supabase Realtime Presence
- Freundschafts- und Spieleinladungen
- Multiplayer-Lobbys
- 8 Themen: Fußball-Legenden, Basketball, Anime, Superhelden, Traumautos, Tierreich, Gaming und Musik
- Live-Gebote mit virtuellem Budget
- Teamübersicht beider Spieler und Spielverlauf
- automatische schwächere Füllspieler, wenn das Budget aufgebraucht ist
- responsive Oberfläche für Desktop, Tablet und Smartphone

## Supabase

Das Projekt verwendet das bestehende NEXYRON-Projekt. Die Tabellen beginnen mit `draft_`, damit bestehende NEXYRON-Daten nicht überschrieben werden.

**Wichtig für die Benutzername-Anmeldung:** Das Frontend verwendet intern eine technische E-Mail-Adresse aus dem Benutzernamen (`<username>@users.legenddraft.app`). In Supabase muss unter **Authentication → Providers → Email** die E-Mail-Bestätigung deaktiviert sein, da die Nutzer sich nur mit Benutzername und Passwort anmelden. Passwörter werden ausschließlich von Supabase Auth verwaltet.

Der Browser verwendet nur den öffentlichen Publishable Key. Niemals den `service_role`- oder Secret-Key in das Frontend eintragen.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
npm run dev
```

Produktions-Build:

```bash
npm run build
npm run preview
```

## GitHub Pages

Der Workflow unter `.github/workflows/pages.yml` baut und veröffentlicht die App. In den Repository-Einstellungen unter **Pages** muss als Build-Quelle **GitHub Actions** ausgewählt sein.
