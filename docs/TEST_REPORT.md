# Prüfbericht – 22. Oktober 2026

## Ergebnis

Die lokale MVP-Anwendung wurde implementiert. Katalogbau, Typecheck, sieben Domänen-/Persistenztests, zehn Browser-Abnahmeläufe in Chromium und Firefox sowie der Produktionsbuild sind erfolgreich. Die Originalquellen wurden nicht verändert. Keine Bereitstellung auf einem externen Server.

| Prüfung | Ergebnis |
| --- | --- |
| `npm run ig:build` | 222 Quellen, 110 Profile, 40 Abschnitte, 7.902 Elementdefinitionen, maximal 12 technische Hierarchieebenen |
| `npm run typecheck` | Erfolgreich; zusätzlich Bestandteil des abschließenden Builds |
| `npm run test` | 7/7 Tests erfolgreich |
| `npm run test:e2e` | 10/10 Tests erfolgreich, je fünf mit Chromium und Firefox |
| `npm run build` | Erfolgreich; statischer Build unter `dist` |
| npm-Paketaudit | Nach Aktualisierung auf Vitest 4.1.12: keine gemeldeten Schwachstellen |

Der ursprüngliche Gesamtfingerprint und der abschließende Katalogfingerprint stimmen überein: `5df1c2931e7d43dcb319fa2cb9334b7d7db113b4574ecbbbde79cdffc232c8fe`. Das vollständige Quellinventar enthält einzelne SHA-256-Prüfsummen.

## Geprüfte Funktionen

### Katalog und Datenmodell

- Jedes lokale Element wird genau einmal abgebildet. Eindeutige IDs, vollständige Elternreferenzen und Zyklenfreiheit werden geprüft.
- Stichprobe „Pflegegrad“: deutscher Titel aus Composition, Kardinalität 1..1, belegter Verweis auf Observation_Care_Level. Choice-/Slice-IDs und Terminologiebindungen bleiben erhalten.
- Themenwechsel und Prioritätswechsel bleiben fachlich unabhängig. Themenlöschung behält Begründung und Priorität.
- Ein Element an mehreren Schritten behält unabhängige Verwendungen. Schrittentfernung bereinigt Kanten.
- JSON-Roundtrip erhält Positionen, Kanten, Bewertungen und Mehrfachverwendungen. Ungültiges JSON, Versionen, Fingerprints, unbekannte IDs und doppelte IDs werden abgelehnt.
- CSV maskiert Tabellenformeln und Anführungszeichen.
- Zwei separate Arbeitsstände werden mit IndexedDB gespeichert und nach Wiederöffnung unverändert gelesen.

### Browser-Abnahme, jeweils Chromium und Firefox

1. Vollständiger Workshop: PIO-Original ansehen und bewerten; Thema erstellen; drei Schritte und zwei Akteure anlegen; dasselbe Element zweimal mit verschiedenen Verwendungen zuordnen; zwei beschriftete Verbindungen anlegen; Reload; Ergebnisse und JSON exportieren; Import in ein frisches Browserprofil; Äquivalenz von Bewertungen/Abläufen prüfen; zwischen zwei Arbeitsständen wechseln. Keine JavaScript-Laufzeitfehler in diesem Ablauf.
2. Reales Pointer-Drag-and-drop: Palette → Thema A → Thema B; Prioritätswechsel per Ziehen; Thema bleibt erhalten.
3. Reales natives Drag-and-drop: dieselbe PIO-Information auf zwei Knoten ziehen; Verwendung ändern; Knoten verschieben; zoomen und Canvas bewegen; Reload; Schritt mit Bestätigung löschen und Kantenbereinigung prüfen.
4. Karten innerhalb eines Themas per Ziehen sortieren; neuen Schritttyp auf die Canvas ziehen und Bildschirm-/Canvas-Koordinaten abgleichen; Knoten direkt über ihre Verbindungspunkte verbinden.
5. Persistentes Browserprofil schließen und neu starten; Arbeitsstand bleibt erhalten. Export → Arbeitsstand löschen → Import. Falsche IG-Version wird verständlich abgelehnt und hinterlässt keine Teiländerungen.

Der Playwright-HTML-Bericht befindet sich nach einem Lauf unter `playwright-report`. Screenshots liegen unter `test-results`; ausgewählte zusätzliche Ansichten des Builds unter `docs/qa`.

Der fertige Build wurde zusätzlich über `vite preview` mit einem isolierten Chromium-Profil geprüft: keine JavaScript-Laufzeitfehler, keine externen Netzwerkanfragen und kein horizontaler Seitenüberlauf bei 750 px Breite. Katalog, Ergebnistabelle und Browser-Druckansicht wurden visuell kontrolliert. Die lokale Entwicklungsanwendung bleibt auf `http://127.0.0.1:5173/` gestartet; der zusätzliche Prüfserver wurde beendet.

## Iterative Korrekturen

Die Prüfung hat uneindeutige Formularnamen, eine React-Flow-Aktualisierungsschleife bei Dimensionsmeldungen und das Abfangen eines Schritttyp-Drops durch bestehende Knoten aufgedeckt. Diese Punkte wurden korrigiert und durch die abschließenden Tests abgedeckt. Automatisierte Board-Tests warten auf den Abschluss der dnd-kit-Dropanimation, bevor sie die endgültige Kartenreihenfolge prüfen.

Die umfangreichen Terminologiebelege wurden vom initialen Anwendungscode getrennt. Sie laden ausschließlich lokal bei Bedarf. Der vollständige Katalog einschließlich Originalbelegen bleibt als separater Datenchunk enthalten.

## Bewusste Grenzen

- Lokal fehlt ein eigenständiges fachliches Informationsmodell. Die 40 Originalabschnitte sind belegt; die darunterliegende Darstellung ist eine technische Differential-Hierarchie. Das wird im UI erklärt.
- Nur Differentials, keine aufgelösten Basissnapshots. Fehlende Werte werden nicht ergänzt. 118 externe/nicht lokal auflösbare Referenzvorkommen sind dokumentiert.
- Kein FHIR-Validator, kein Pflege-Primärsystem, keine Versionsmigration, kein gemeinsamer Mehrbenutzerbetrieb, keine Gruppen-Konsolidierung. Mehrere gleichzeitig bearbeitende Tabs desselben Arbeitsstands werden nicht synchronisiert.
- Ein Thema pro Information; beliebig viele Prozessverwendungen. Bewertungen von Gruppen vererben sich nicht auf Kinder.
- Aufgrund der vollständigen Originalbelege meldet Vite große Chunks: Katalog rund 10 MB unkomprimiert, rund 0,50 MB gzip; Anwendung rund 1,08 MB unkomprimiert. Die größte Werteliste hat rund 21,6 MB und wird erst bei Bedarf geladen. Dies ist eine Größenwarnung, kein Buildfehler.
- Browser- und Betriebssystemabstürze während eines noch ausstehenden Autosaves sind keine zugesicherte Speicherung. Auf „Gespeichert“ warten und JSON-Backups anlegen. Speicherfehler werden sichtbar angezeigt.
- Die Druckansicht wurde als Browser-Druckmedium visuell geprüft. Druckerabhängige Ränder und Pagination können abweichen; eine Zertifizierung der Barrierefreiheit wurde nicht vorgenommen.
