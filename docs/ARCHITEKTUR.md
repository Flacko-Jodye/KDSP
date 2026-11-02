# Architektur und Entscheidungen

React-/TypeScript-/Vite-Projekt im bestehenden Projektordner. Die Originalquellen in `PIO_Überleitungsbogen` bleiben unverändert. Die Bereitstellung auf GitHub Pages erfolgt über GitHub Actions; Workshopdaten verbleiben im Browser. Keine Serverdatenbank, Anmeldung oder Cloud-Synchronisierung.

1. Read-only-Katalog: reproduzierbare TypeScript-Pipeline; IDs aus Canonical URL und vollständiger ElementDefinition.id, einschließlich Slices. Der Katalog enthält Quellbelege und separat navigierbare Referenzziele; keine rekursive Vervielfältigung von Definitionen.
2. Fachlicher Einstieg: belegte Composition-Abschnitte. Darunter technische Differential-Hierarchie als ausdrücklich markierter Fallback. Keine erfundenen Kapitel oder vervollständigten FHIR-Basiselemente.
3. Workshop: Zustand für den aktuellen Arbeitsstand, Dexie/IndexedDB für mehrere Arbeitsstände, entprelltes Autosave. Beim Wechsel werden ausstehende Änderungen gesichert. JSON exportiert unmittelbar den neuesten Arbeitsspeicherstand, auch bei einem Speicherfehler. Speicherfehler bleiben sichtbar. JSON ist das Backupformat.
4. Ein Element hat höchstens ein eigenes Thema, unabhängig von seiner Priorität; Zuordnungen tragen eine Reihenfolge. Elternbewertungen vererben sich nicht. Prozesse referenzieren dieselbe Katalog-ID beliebig oft.
5. Themen/Prioritäten: dnd-kit React; separate HTML-Drag-and-drop-Zone für React Flow, ohne verschachtelten dnd-kit-Kontext. Alle Aktionen haben bedienbare Formulare/Buttons. Knotenpositionen werden in Flow-Koordinaten gespeichert.
6. Import: Zod-Strukturprüfung plus referenzielle Integrität, Versions- und Katalogfingerprint-Prüfung. Import erzeugt immer einen neuen Arbeitsstand. Fremde IG-Versionen werden mit verständlichem Hinweis abgelehnt, niemals umgedeutet.
7. Export: vollständiger Workspace plus Lesesnapshot der referenzierten Originalbezeichnungen, CSV pro Information/Prozessrelation, Druckansicht. CSV schützt vor Tabellenformeln.

Vite 6 wird wegen des vorhandenen Node 22.14 verwendet (neuere Vite-Hauptversionen benötigen einen neueren Node-22-Patchstand). Bibliotheken lokal gebündelt; keine externen Schriftarten oder Terminologieanfragen. Styling mit normalem CSS statt zusätzlicher Tailwind-Buildstufe.

Große Terminologiebelege werden beim Katalogbau separat unter `src/generated/terminologies` abgeleitet und erst bei Bedarf vom jeweiligen Webserver geladen. Originalpfad und Version bleiben im Katalogindex erhalten. Ein einzelnes lokales ValueSet umfasst über 21 MB. Der unveränderte Quellbestand ist weiterhin ausschließlich `PIO_Überleitungsbogen`; generierte Belege sind eindeutig zugeordnet und reproduzierbar.
