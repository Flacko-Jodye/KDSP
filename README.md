# Pflegedaten im Dialog

Deutschsprachiger Workshop-Editor für den Kerndatensatz Pflege. Der Katalog wird aus den vorhandenen Originaldateien des PIO-Überleitungsbogens generiert. Die Anwendung kann lokal oder über GitHub Pages laufen. Keine Anmeldung, zentrale Datenbank oder Cloud-Synchronisierung.

## Start unter Windows / PowerShell

Voraussetzung: Node.js **22.14 oder neuer** (mitgelieferte Konfiguration: Vite 6; Vite 6 unterstützt Node 18/20/22, dieses Projekt setzt Node 22.14 als getestetes Minimum). Im Projektordner:

```powershell
npm ci
npm run ig:build
npm run dev
```

Öffne **http://127.0.0.1:5173/**. Der Server ist ausschließlich an die lokale Loopback-Adresse gebunden. `Strg+C` beendet ihn. Für lokale Nutzung nach dem Build: `npm run build`, dann `npm run preview` (separate Browser-Origin, deshalb Arbeitsstand vorher als JSON exportieren).

Die Originaldateien in `PIO_Überleitungsbogen` werden ausschließlich gelesen. Die Anwendung liegt direkt im übergeordneten Projektordner.

## GitHub Pages

Der Workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) baut nach jedem Push auf `main` den Katalog aus den Originalquellen und veröffentlicht `dist` über GitHub Actions. In den Repository-Einstellungen unter **Settings → Pages → Build and deployment** muss **GitHub Actions** als Quelle eingestellt sein. Für ein Projekt-Repository setzt der Workflow den Vite-Basispfad automatisch auf `/<Repositoryname>/`. Die öffentliche Adresse lautet `https://<Benutzername>.github.io/<Repositoryname>/`.

Arbeitsstände werden weiterhin nur im IndexedDB-Speicher des jeweiligen Browsers und der jeweiligen Website-Adresse abgelegt. Ein bestehender Arbeitsstand unter `127.0.0.1` erscheint online nicht automatisch; vor dem Wechsel als JSON exportieren und auf der GitHub Page importieren. Keine personenbezogenen Falldaten in das Repository committen.

## Funktionen

- **PIO entdecken:** 40 belegte Composition-Abschnitte, vollständiger technischer Baum aus 110 Profilen, Suche über 7.902 Originalelemente, Quellenbelege, Profilverweise und lokale Terminologien.
- **Themen ordnen:** eigene Themen samt Beschreibung und Reihenfolge, unabhängige Prioritäten und Begründungen; Drag-and-drop und alternative Formularaktionen. Eine Elternbewertung erfasst nur die Gruppe, niemals automatisch die Kinder.
- **Abläufe gestalten:** beliebig viele freie Abläufe, vier Schritttypen, Positionen, gerichtete/beschriftete Verbindungen, Akteure und mehrfach verwendbare Informationen mit „Benötigt“, „Erzeugt“ oder „Übergibt“. Drag-and-drop sowie Auswahl ohne Ziehen. Fiktive Startervorlage ohne Falldaten.
- **Ergebnisse:** Prioritätsverteilung, Tabelle mit Prozesskontext, vollständiger JSON-Export/Import, CSV und Druckansicht.
- **Arbeitsstände:** automatische lokale Speicherung, Anlegen, Umbenennen, Öffnen, Duplizieren und Löschen mit Bestätigung.

## Quellen und fachliche Grenzen

Belegte Ressourcen-Version **1.0.0**, FHIR **4.0.1**. 222 JSON-Dateien; kein Package-Manifest, keine ImplementationGuide-Ressource, kein separates fachliches Informationsmodell. Die fachliche Kapitelhierarchie lässt sich daher nicht vollständig rekonstruieren. Als belegbarer Einstieg dienen die deutschen Originaltitel der Composition-Abschnitte; darunter zeigt die Anwendung die technische Differential-Hierarchie als gekennzeichneten Fallback.

Es liegen keine aufgelösten Snapshots vor. `?` in Kardinalitäten bedeutet „lokal nicht angegeben“. Weder MustSupport noch eine Kardinalität bestimmen die Workshop-Priorität. Auch `max=0`-Einträge bleiben zur Nachvollziehbarkeit sichtbar und sind in Fachdetails als ausgeschlossen gekennzeichnet. Externe Terminologien/Basisprofile werden nicht nachgeladen. Der Bericht dokumentiert 118 nicht lokal auflösbare Referenzvorkommen.

Quellen: [Inventar](docs/IG_INVENTORY.md), [fachliches Mapping](docs/FACHLICHES_MAPPING.md), [vollständiger Extraktionsbericht](docs/ig-extraction-report.json), [Architektur](docs/ARCHITEKTUR.md).

## IG-Pfad und Reproduzierbarkeit

Standardpfad relativ zum Projekt: `PIO_Überleitungsbogen`. Bei abweichender Ablage:

```powershell
$env:PIO_IG_PATH = 'C:\Pfad\zum\PIO_Überleitungsbogen'
npm run ig:build
```

Die Pipeline schreibt `src/generated/pio-catalog.json`, getrennte generierte Terminologiebelege und Inventar/Mapping/Bericht. Jede Quelldatei wird mit SHA-256 inventarisiert. Katalog-IDs sind Canonical URL plus vollständige ElementDefinition.id. Generierte Dateien nicht manuell bearbeiten. Ein neuer Quellbestand führt zu einem neuen Fingerprint; bestehende Exporte mit anderem Fingerprint werden nicht automatisch migriert. Direkte Originaldatei-Links funktionieren im Entwicklungsserver beim Standardpfad; eingebettete Elementbelege und generierte Terminologiebelege funktionieren auch im Build. Bei externem IG-Pfad den dokumentierten Originalpfad im Dateisystem öffnen.

## Speicherung, Backup und Datenschutz

Arbeitsstände liegen in IndexedDB dieses Browsers. Profil, Gerät und Browser-Origin (Protokoll/Hostname/Port) bestimmen den lokalen Speicher. `localhost` und `127.0.0.1` sind beispielsweise verschiedene Speicherorte. Regelmäßig **JSON-Backup** herunterladen. CSV dient zur Auswertung und ist kein vollständiges Backup. Browserdaten können gelöscht werden. Bei Speicherfehlern zeigt die App einen Hinweis und ermöglicht den JSON-Export der aktuell im Arbeitsspeicher vorhandenen Änderungen.

Es werden keine Workshopdaten an externe Server übertragen. Lokal liefert ein Webserver die Anwendung; bei GitHub Pages werden Anwendung und öffentliche IG-Dateien von GitHub geladen. Es gibt keine externen Fonts, Analysewerkzeuge oder Terminologieabfragen. Keine Patienten-, Pflegefall- oder anderen personenbezogenen Daten eingeben. Mehrere gleichzeitig geöffnete Tabs desselben Arbeitsstands sind kein unterstützter Kollaborationsmodus; dafür getrennte Arbeitsstände nutzen.

Ein JSON-Import legt immer eine neue lokale Kopie an. Schema, Version, Quellfingerprint, eindeutige IDs und sämtliche Referenzen werden geprüft. Fehlerhafte/inkompatible Dateien werden ohne Teilimport abgelehnt. Es gibt noch keine Versionsmigration und keine Gruppenkonsolidierung.

## Prüfungen

```powershell
npm run ig:build
npm run typecheck
npm run test
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.local/browsers'
npx playwright install chromium firefox
npm run test:e2e
npm run build
```

Browserinstallation nur einmal erforderlich. Playwright startet bei Bedarf den lokalen Server; Testprofile sind vom persönlichen Browserprofil getrennt. Der HTML-Bericht liegt in `playwright-report`, Screenshots in `test-results`. In restriktiven Windows-Sandboxes kann der esbuild-Loader Zugriff auf übergeordnete Verzeichnisse benötigen; die Prüfungen dann in einem normalen lokalen Terminal ausführen.

Die `.npmrc` deaktiviert automatische Peer-Auflösung wegen eines npm-10-Fehlers bei optionalen Vitest-Integrationen. Tatsächlich benötigte Pakete sind explizit angegeben und im Lockfile fixiert.

Weiter: [Bedienung](docs/USER_GUIDE.md), [Testbericht](docs/TEST_REPORT.md). Technische Referenzen: [Vite 6](https://v6.vite.dev/guide/), [React Flow](https://reactflow.dev/learn), [dnd-kit React](https://dndkit.com/react/quickstart/).
