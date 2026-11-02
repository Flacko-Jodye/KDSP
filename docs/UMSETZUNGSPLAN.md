Codex-Umsetzungsplan: Kerndatensatz Pflege – Interaktiver Workshop-Editor
Verwendungszweck: Diese Datei ist als Arbeitsauftrag und Umsetzungsplan für Codex in einem bestehenden lokalen Repository gedacht. Der vollständige PIO-Überleitungsbogen-Implementation-Guide (IG) ist bereits lokal im Codex-Projekt vorhanden. Arbeite mit diesen lokalen Originaldateien; bitte nicht zunächst einen eigenen Fantasie-Datenkatalog erzeugen.

Ziel des MVP: Eine lokal ausführbare, deutschsprachige Browser-Anwendung, in der jede Person unabhängig PIO-Informationsbausteine untersuchen, eigenen Themen zuordnen, priorisieren und frei gestalteten Versorgungsprozessen zuordnen kann. Speicherung und Export erfolgen lokal. Kein Deployment auf GitHub Pages, keine Anmeldung, keine zentrale Datenbank und keine Live-Kollaboration in dieser Entwicklungsstufe.

0. Arbeitsmodus für Codex
1. Zuerst Repository und IG analysieren, dann implementieren. Erkunde das vorhandene Projekt, seine Verzeichnisse, Abhängigkeiten, Dokumentation und den Git-Status. Bestehende Dateien nicht ohne Not überschreiben oder löschen.
2. Erstelle vor dem UI-Bau die Dateien docs/IG_INVENTORY.md, docs/FACHLICHES_MAPPING.md und docs/ARCHITEKTUR.md. Halte darin gesicherte Erkenntnisse, offene Fragen und Entscheidungen fest.
3. Verwende ausschließlich belegbare Inhalte des lokal vorhandenen IG als normative Ausgangsdaten. Externe Websites dürfen nur zur Erläuterung, Bibliotheksdokumentation oder zur Verifikation herangezogen werden; die konkrete lokal vorhandene IG-Version bleibt für das Projekt maßgeblich.
4. Implementiere iterativ, aber liefere am Ende ein zusammenhängendes, lokal startbares MVP; nach jeder Phase Typecheck/Tests ausführen.
5. Sind Teile der fachlichen IG-Hierarchie nicht aus den Dateien rekonstruierbar, dokumentiere die Lücke explizit und zeige im UI einen entsprechenden Hinweis. Keine vermeintlich offiziellen PIO-Bausteine, Pflichtfelder oder semantischen Zuordnungen erfinden.
6. Erzeuge keine echten Patienten- oder Pflegedaten und speichere keine personenbezogenen Falldaten. Beispiele nur synthetisch und eindeutig als Demonstration gekennzeichnet.
1. Produktziel und fachlicher Rahmen
Die Anwendung ist ein fachliches Beteiligungs- und Strukturierungswerkzeug für einen KIG-Arbeitskreis „Kerndatensatz Pflege“. Sie ist kein PIO-Eingabeformular, kein FHIR-Validator, kein Pflege-Primärsystem und kein BPMN-Workflow-Ausführungssystem.
Zielgruppe
Pflegefachpersonen, Versorgungsakteure, Fachvertretungen und Personen ohne Kenntnisse von FHIR oder der mio42-Spezifikation. Technische Fachbegriffe bleiben bei Bedarf in einem aufklappbaren Detailbereich verfügbar.
Leitfragen, die die Anwendung beantworten hilft
- Welche Informationen umfasst der PIO-Überleitungsbogen tatsächlich?
- Welche Informationen werden in einem selbst beschriebenen Versorgungsszenario benötigt?
- Wer benötigt, erzeugt oder übergibt welche Information – und an welchem Prozessschritt?
- Welche Informationsbausteine gehören nach Einschätzung des Teilnehmers in einen minimalen Kerndatensatz? Welche wären Erweiterungen oder sind noch unklar?
- Welche Unterschiede ergeben sich später zwischen individuellen Bewertungen?
Fachlich strikt zu trennen
- IG-Original: Quelle, Version, Hierarchie, Benennung, Beschreibung, Pfade, Kardinalität, Konformität, Terminologien, FHIR-Mapping und gegebenenfalls Bedingungen/Constraints.
- Workshop-Zuordnung: frei gewählte Themenbereiche und Gruppen von Informationsbausteinen.
- Workshop-Priorisierung: offen / kern / erweiterung / nicht_im_kern; jeweils mit Begründung.
- Prozessmodell: eigene Prozessschritte, Akteure, gerichtete Verbindungen und Zuordnung von Informationen zu einzelnen Schritten.
Keine Gleichsetzung: 0..1, 1..1, MustSupport, M, O oder ähnliche technische bzw. modellbezogene Angaben definieren nicht automatisch die Kernrelevanz im geplanten neuen Kerndatensatz. Umgekehrt ändert eine Workshop-Bewertung keine Vorgabe des ursprünglichen IG.
2. Technologiestack
Aufgabe	Vorschlag	Begründung
Frontend	React + TypeScript	Gute Komponentenarchitektur, typisierte Domänenobjekte
Lokale Entwicklung und Build	Vite	Lokaler Entwicklungsserver, später statischer Build möglich
Fachliche Drag-and-drop-Kategorien	dnd-kit (@dnd-kit/react, bei Bedarf @dnd-kit/helpers)	Karten zwischen frei definierbaren Themen und Priorisierungen bewegen
Prozess-/Graph-Editor	React Flow (@xyflow/react)	Knoten, Kanten, Zoom, Pan, eigene Node-Typen, freie Positionierung
UI	Tailwind CSS und einfache, barrierearme Komponenten (optional shadcn/ui)	Deutschsprachiges, übersichtliches Interface
App-State	Zustand	Trennung von IG-Lesemodell und bearbeitbarem Workspace
Lokale Persistenz	IndexedDB über Dexie	Zuverlässiger als große, häufig wechselnde JSON-Objekte in localStorage
Validierung	Zod	Import-, Export- und Metadatenvalidierung
Tests	Vitest, React Testing Library, Playwright	Domänenlogik, UI, reale Drag-and-drop-Abläufe und persistente Daten
IG-Extraktion	TypeScript/Node-Skripte in scripts/ig/	Reproduzierbare Umwandlung in einen lesbaren Fachkatalog


Pragmatische Entscheidung: dnd-kit zunächst für die Themen-/Priorisierungsboards, React Flow für die Canvas-Prozessdarstellung einsetzen. Für das Drag-and-drop aus der Sidebar auf React-Flow-Knoten zuerst einen isolierten technischen Proof-of-Concept bauen: Koordinatenumrechnung (z. B. screenToFlowPosition), Treffererkennung, Canvas-Panning und Firefox/Chromium testen. Gegebenenfalls React-Flow-kompatibles HTML-Drag-and-drop im Canvas verwenden. Nicht zwei konkurrierende DnD-Mechanismen ohne Test verschachteln. Zusätzlich stets eine alternative Aktion „Information zu Schritt hinzufügen“ anbieten.
3. Phase A – Lokalen IG fachlich auswerten (verpflichtend vor der UI)
A1. Verzeichnisinventar
Untersuche rekursiv sämtliche relevanten lokalen Dateien. Mögliche Inhalte:
- FHIR-Packages / .tgz mit package/ und package.json
- StructureDefinition-*.json / XML, Composition-Profile, Slices, Extensions, FHIR-Examples
- ValueSet-*, CodeSystem-*, ConceptMap-*, weitere definierte Terminologien
- HTML-/Markdown-Seiten des publizierten IG einschließlich Navigation, Tabellen und Beschreibungen
- FSH-Quellen (.fsh), sushi-config.yaml, ig.ini, weitere fachliche Informationsmodelle, Excel-/CSV-Tabellen oder Begleitdokumentation
Für jedes Fundstück nach Möglichkeit Dateipfad, Version, Canonical URL, Ressourcentyp und Nutzbarkeit für die fachliche Darstellung dokumentieren. Archivformate nicht zerstörend analysieren. Für den Fall mehrerer IG-Versionen aktive Version eindeutig bestimmen und ältere Versionen nicht vermischen.
A2. Fachlichen Katalog ableiten
Ermittle zunächst aus den Dateien, welche übergeordnete fachliche Gliederung der IG vorgibt. Nutze das fachliche Informationsmodell, sofern vorhanden, vor dem technischen FHIR-Pfadbaum für die Darstellung an Pflegefachpersonen. Den technischen FHIR-Pfadbaum nur als Referenz/Mapping und als Fallback nutzen.

Extrahiere, soweit vorhanden:
- Kapitel-/Elementnummer, Titel, Beschreibung, Erläuterung, Rationale, Hinweise und ggf. Beispiele
- Eltern-Kind-Beziehung mit mehreren Hierarchieebenen; Unterbausteine und Datenelemente dürfen nicht pauschal zu einer Kachel zusammengeschmolzen werden
- fachliche und technische IDs, absolute/relative Quelle, IG-Version, Quellpfad, Canonical URLs
- FHIR-Profil(e), ElementDefinition.path/id, Slice, ggf. Verweisbeziehungen
- Datentyp, Wertebereich, Kardinalität, Konformität, terminologische Bindung, Bedingung und ggf. CodeSystem/ValueSet, nur wenn die Quelle dies belegt
- Quelle von labelspezifischen Übertragungen oder vereinfachten Erklärungen
Beachte StructureDefinition.snapshot vs. differential: Keine mehrfachen fachlichen Bausteine durch das Zusammenführen identischer Pfade. Vererbung, Slices, choice[x], Referenzen und wiederverwendete Definitionen korrekt handhaben. Mehrfach genutzte Definitionen dürfen verschiedene fachliche Verwendungsstellen haben.

Quellentreue: Jede Kachel erhält eine navigierbare Herkunft: Quelle anzeigen mit Pfad/Originalbezeichnung, ggf. lokaler Link/Profil/FHIR-Mapping. UI-Hilfstexte ausdrücklich als „Vereinfachte Erklärung“ kennzeichnen; sie dürfen keinen falschen normativen Eindruck erwecken. Echte Codelisten nicht erfinden oder externe Terminologiedienste stillschweigend abfragen.
A3. Prüfbericht und Datenqualität
Lege docs/IG_INVENTORY.md und docs/FACHLICHES_MAPPING.md an mit:
- identifizierter FHIR-/IG-Version und Quellen (Version nicht aus Annahmen setzen)
- ermittelter Anzahl von Kapitel- bzw. Bausteinebenen, Elementen und Quellen, aus Daten berechnet
- Beispiele für Originalbezeichnungen, Originalverweise und fachliche Erklärungen
- Grenzen der automatischen Extraktion, noch nicht zuordenbare Profile/Elemente und Dubletten
- klare Abgrenzung zwischen originalem IG-Inhalt und lokaler Workshop-Ergänzung
Erzeuge src/generated/pio-catalog.json per reproduzierbarem Skript (npm run ig:build) sowie einen Bericht über unbehandelte/unaufgelöste Einträge. Generierte Inhalte sind read-only; Teilnehmende bearbeiten nur ihre persönlichen Zuordnungen.

Abnahmekriterium A: Mehrstufige fachliche Hierarchie durchsuchbar; Testbeispiele lassen sich anhand der Originaldateien zurückverfolgen; keine hart codierten, frei erfundenen „43 Bausteine“ oder Pflichtfelder.
4. Phase B – Projektskelett, Datenmodelle, Speicherung
B1. Vorgegebene fachliche Basistypen (an reale IG-Struktur anpassen)
interface PioElement {
  id: string;                  // stabile fachliche Katalog-ID (aus belegbarer Quelle)
  parentId?: string;
  label: string;               // Originalbezeichnung, soweit vorhanden
  description?: string;        // originaler fachlicher Text
  helpText?: string;           // als UI-Hilfe gekennzeichnet
  sortOrder: number;
  source: {
    igVersion: string;
    file: string;
    elementId?: string;
    canonical?: string;
    fhirPath?: string;
    sourceUrl?: string;
  };
  children?: string[];
  metadata?: {
    cardinality?: string;
    conformity?: string;
    type?: string;
    terminology?: string[];
    notes?: string[];
  };
}

type Priority = 'offen' | 'kern' | 'erweiterung' | 'nicht_im_kern';

interface Assignment {
  elementId: string;
  themeId?: string;             // fachliche Zuordnung unabhängig von Priorität
  priority: Priority;
  rationale?: string;
  updatedAt: string;
}

interface Theme {
  id: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder: number;
}

interface Actor {
  id: string;
  name: string;               // z.B. abgebende Einrichtung, aufnehmende Pflege
  description?: string;
}

interface StepInformation {
  elementId: string;
  usage: 'benoetigt' | 'erzeugt' | 'uebergibt';
  notes?: string;
}

interface ProcessStep {
  id: string;
  title: string;
  description?: string;
  actorIds: string[];
  information: StepInformation[];
  position: { x: number; y: number };
  kind: 'start' | 'aktion' | 'entscheidung' | 'ende';
}

interface ProcessConnection {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: ProcessStep[];
  connections: ProcessConnection[];
}

interface Workspace {
  schemaVersion: number;
  id: string;
  name: string;                // optionaler selbstgewählter Arbeitstitel
  sourceIgVersion: string;
  createdAt: string;
  updatedAt: string;
  themes: Theme[];
  actors: Actor[];
  assignments: Assignment[];
  workflows: Workflow[];
}
Der Entwurf ist keine normative FHIR-Modellierung. Bei alternativen bzw. mehrfachen Themenzuordnungen ggf. themeIds verwenden; die Entscheidung explizit dokumentieren. Ein PIO-Element kann an beliebig vielen Prozessschritten erscheinen, ohne aus dem Katalog entfernt zu werden.
B2. Persistenz
- IG-Katalog als statisch generiertes, versioniertes Artefakt laden.
- Workspace-Daten in IndexedDB speichern; Autosave mit entprellten Schreibvorgängen und Status „Gespeichert“.
- Mehrere lokale Arbeitsstände pro Browser erlauben: neu anlegen, benennen, duplizieren, öffnen, löschen (mit Bestätigung).
- Browserprofile, Geräte und Nutzer sind in Stufe 1 getrennt: kein Login, keine serverseitige Synchronisierung.
- Vollständiger JSON-Export/Import mit Schema- und IG-Versionsangabe; fehlerhafte Dateien verständlich ablehnen. Warnung bei IG-Version-Konflikt, niemals IDs stillschweigend umdeuten.
- CSV-Export der priorisierten Elemente und Prozesszuordnungen sowie druckbare Zusammenfassung; JSON bleibt das verlustfreie Austauschformat.
- Hinweistexte: Browserdaten können gelöscht werden; JSON als Backup empfehlen. Es werden keine Daten an einen Server übertragen.
Abnahmekriterium B: Reload, Browser-Neustart und Wechsel zwischen zwei Workspaces erhalten alle Änderungen. JSON aus einem Workspace lässt sich in einem frischen Browserprofil importieren.
5. Phase C – Modul „PIO-Katalog“
Layout: Links fachlicher Navigationsbaum, Mitte Suche/Elementkarten, rechts aufklappbare Elementdetails.
- Mehrstufigen IG-Baum auf-/zuklappen, mit Breadcrumbs und Volltextsuche.
- Karten enthalten Originaltitel, gut verständliche Kurzbeschreibung, Kindanzahl/Unterinformationen und eindeutigen Quellenlink.
- Umschalten zwischen Einfache Ansicht und Fachdetails (Originaltext, Kardinalität, Mapping, Codes, Elementpfad soweit vorhanden).
- Filter: Noch offen / Kern / Erweiterung / nicht im Kern; Themenbereich; bereits im Prozess verwendet.
- Einzelelemente und – soweit fachlich sinnvoll – Gruppen auswählbar. Wird ein Elternbaustein ausgewählt, muss klar sein, ob nur die Gruppe oder auch die Unterelemente gemeint sind. Keine stille automatische Prioritätsvererbung.
- Suche nutzt die tatsächlich extrahierten Begriffe; Begriffe aus dem Workshop sind separate, nicht-normative Synonyme.
Abnahmekriterium C: Nicht technisch versierte Personen können sich von einem Hauptthema bis zum einzelnen Element bewegen und dessen Herkunft erkennen.
6. Phase D – Modul „Themenbereiche & Priorisierung“
Zwei fachlich getrennte Aktionen in einer übersichtlichen Oberfläche:
D1. Themenboard
- Eigene Themenbereiche hinzufügen, umbenennen, beschreiben, umsortieren und löschen (Zuordnungen beim Löschen bewusst behandeln).
- Informationsbausteine aus einer dauerhaft verfügbaren Palette per Drag-and-drop in Themenbereiche einordnen.
- Karten innerhalb eines Themenbereichs sortieren und zwischen Themenbereichen verschieben.
- Optional im Detail: gleiche Information mit mehreren Themen markieren, falls das reale Workshopvorgehen dies erforderlich macht.
D2. Priorisierungsboard
- Vier Spalten: Offen, Kerndatensatz, Erweiterung, Nicht im Kern.
- Dieselben Katalogelemente erhalten eine separate Prioritätszuordnung; Themenzuordnungen bleiben unverändert.
- Drag-and-drop zwischen den Spalten, Kommentare/Begründungen, Zähler und Filter.
- Möglichkeit, eine Gruppe zu bewerten, ohne die Unterelemente implizit als ausgewählt auszugeben.
- Alternative zu Drag-and-drop: Dropdown/Buttons; Tastaturbedienung und ausreichende Kontraste.
Abnahmekriterium D: Eine verschobene Karte ändert ausschließlich die gewählte Dimension (Thema oder Priorität). Kein Informationsverlust beim Sortieren und Umpriorisieren.
7. Phase E – Modul „Workflow-Editor“ (React Flow)
E1. Freier Prozess
- Nutzer legt beliebig viele Workflows an, benennt sie und ergänzt eine kurze Szenariobeschreibung.
- Knoten per Sidebar oder Plus-Button hinzufügen: Start, Aktivität, Entscheidung, Ende.
- Knoten verschieben, verbinden, Verbindung beschriften, zoomen, Canvas bewegen, löschen, duplizieren.
- Einfaches manuelles Layout und optional „Ansicht anpassen“; automatische Anordnung nicht verpflichtend.
- Jeder Knoten hat editierbare Felder Titel, Beschreibung, Akteur(e), Informationen.
- Akteure frei definierbar und Prozessschritten zuordenbar (fachliche Rolle, nicht Browser-Nutzerkonto). Swimlanes zunächst nicht erforderlich.
E2. IG-Informationen einem Schritt zuordnen
- Seitenleiste enthält den gleichen PIO-Katalog wie Modul C, durchsuchbar und nach Priorität/Thema filterbar.
- Baustein aus Seitenleiste auf einen Knoten ziehen; zielgenaue Hervorhebung und Bestätigung.
- Verknüpfung benötigt, erzeugt oder übergibt angeben; mehrere Informationen pro Schritt möglich.
- Alternative: Knoten anklicken → „Information hinzufügen“ → Auswahlmodal, auch ohne Drag-and-drop.
- Karte/Knoten zeigt kompakte Badges der zugeordneten Informationen. Klick öffnet Details/IG-Herkunft.
- Ein Element darf in mehreren Knoten vorkommen; Zuordnung ist eine Referenz, keine Verschiebung und keine Kopie der Normdaten.
- Bereits zugeordnete Elemente können entfernt werden, ohne Katalog oder Priorität zu verändern.
- Beim Löschen eines Prozessschritts betroffene Beziehungen/Kanten bereinigen; Nutzerdialog bei potenziellem Verlust von Annotationen.
E3. Beispielprozesse
Nur klar gekennzeichnete, fiktive Startervorlagen, beispielsweise Krankenhaus → stationäre Pflegeeinrichtung; keine normative Behauptung eines mio42-Prozessmodells. Der Nutzer kann alle Schritte, Beziehungen und Informationen bearbeiten. Vorlagen nur mit belegbar vorhandenen Katalogelementen befüllen.

Abnahmekriterium E: Nutzer erstellt einen frei benannten Ablauf mit mindestens drei verbundenen Schritten, definiert zwei Akteure, zieht ein reales IG-Element auf zwei verschiedene Prozessschritte, setzt die Informationsverwendung unterschiedlich, speichert und lädt den Ablauf fehlerfrei neu.
8. Phase F – Ergebnisse, Vergleich und Vorbereitung des Infomodells
Im MVP
- Individuelles Dashboard: Anzahl sichtbarer/kategorisierter Elemente; Prioritätenverteilung; Anzahl Workflows, Schritte, Informationszuordnungen.
- Ergebnisübersicht als Tabelle mit: IG-ID, Originalbezeichnung, Thema, Priorität, Begründung, verwendet in Workflow/Schritt, Akteur(e), Informationsverwendung, Quelle.
- Export als JSON, zusätzlich CSV mit einer Zeile je fachlich sinnvoller Information/Prozess-Relation, sowie druckfähige Ergebnisansicht.
- Export soll möglichst die referenzierten Originalbezeichnungen (Snapshot für Lesbarkeit) zusätzlich zu stabilen IDs enthalten, nicht anstelle der IDs.
Optional direkt nach dem MVP (nicht erforderlich für die erste Abnahme)
- Offline-Gruppenauswertung: Mehrere von Teilnehmenden exportierte JSON-Dateien in einem Browser importieren, als separate individuelle Bewertungen behandeln und vergleichend darstellen: Übereinstimmung, Dissens, Kommentare, priorisierte Elemente. Nichts ungefragt überschreiben oder konsolidieren.
- Konsens-Arbeitsstand: explizit eine neue, durch Moderator bearbeitbare Konsensversion anlegen.
- Weiterverarbeitung: strukturierte Liste fachlicher Elemente und ihrer Prozesskontexte als Ausgangspunkt für ein späteres kommentierbares Informationsmodell. Kein automatisch generierter FHIR-IG ohne zusätzliche Modellierungs- und Validierungsarbeit.
9. Gestaltung / Nutzerführung
- Interface vollständig auf Deutsch; bevorzugt alltagsnahe Worte („Pflegeinformationen“, „Versorgungsschritt“, „Benötigt von“) statt FHIR-Jargon.
- Startbildschirm mit vier klaren Reitern: PIO entdecken, Themen ordnen, Abläufe gestalten, Ergebnisse.
- Schritt-für-Schritt-Einführung als wegklickbare Hilfe, danach ungestörter Arbeitsbereich.
- Desktop-/Laptop-first; Browser-Zoom, kurze Hilfetexte, große Drop-Zonen, deutliche Drag-Indikatoren.
- Feste Unterscheidung: „Original aus dem PIO“ versus „Deine Workshop-Entscheidung“.
- Keine inhaltliche Veränderung normativer Bezeichnungen durch UI-Vereinfachung; die Originaltitel bleiben abrufbar.
- Wenn ein Element nicht sicher extrahiert wurde, sichtbar mit Quellzuordnung offen kennzeichnen.
10. Repository-Struktur (bei vorhandenem Projekt anpassen)
.
├── README.md
├── package.json
├── vite.config.ts
├── index.html
├── docs/
│   ├── IG_INVENTORY.md
│   ├── FACHLICHES_MAPPING.md
│   ├── ARCHITEKTUR.md
│   ├── USER_GUIDE.md
│   └── TEST_REPORT.md
├── scripts/
│   └── ig/
│       ├── discover.ts
│       ├── extract.ts
│       ├── validate.ts
│       └── build-catalog.ts
├── src/
│   ├── app/
│   ├── domain/            # Katalogtypen, Workshoptypen, Konverter, Validierung
│   ├── generated/         # automatisch erzeugter PIO-Katalog
│   ├── features/
│   │   ├── catalog/
│   │   ├── themes/
│   │   ├── prioritization/
│   │   ├── workflows/
│   │   └── results/
│   ├── components/
│   ├── storage/           # Dexie / Workspace-Migrationen
│   └── test/
└── tests/
    ├── unit/
    └── e2e/
Wichtig: Die vorhandenen IG-Dateien in ihrem bestehenden Ordner unverändert belassen. Der genaue Pfad wird aus dem Repository ermittelt und als Skriptkonfiguration dokumentiert; keine neue IG-Kopie mit unklarer Versionslage anlegen.
11. Qualitätssicherung / Tests
IG-Katalog
- Hierarchie vollständig und zyklenfrei, jede referenzierte parentId vorhanden.
- Stabile eindeutige IDs, nachvollziehbare Quellen, keine unbegründeten Datenverluste bei der Extraktion.
- Stichprobentests: Originaltitel, verschachtelte Elemente, Konformität/Kardinalität, Profil-/Slice-Mapping, Terminologie.
- Parser liefert verständliche Warnungen für fehlende oder nicht unterstützte Ressourcenformate.
Priorisierung und Themen
- Cross-list Drag-and-drop verschiebt korrekt; Reordering erhält Element-IDs.
- Änderung der Priorität beeinflusst nicht das zugeordnete Thema und umgekehrt.
- Löschvorgänge mit referenzierten Daten sicher behandeln.
Workflow
- Auf Canvas gezogener Knoten landet an der erwarteten Position.
- Knotenverbindung, -löschung, -verschiebung sowie Akteurs- und Informationszuweisung funktionieren.
- Ein Katalogelement mehrfach zuordnen; Zuordnungsvarianten unabhängig ändern.
- Canvas-Drag und Sidebar-Drag verursachen keine konkurrierenden Interaktionen.
- Modal-/Button-Fallback für alle Drag-and-drop-Aktionen.
Datenintegrität
- IndexedDB-Speicherung nach Reload; mehrere Workspaces bleiben getrennt.
- Export → Daten löschen → Import ergibt äquivalenten Workspace, einschließlich Koordinaten und Kanten.
- Fehlerhafte JSON und unpassende IG-Versionen werden korrekt behandelt.
- Zwei unabhängige Browserprofile zeigen unterschiedliche, nicht vermischte Arbeitsstände.
Abschlussbefehle
- npm run dev startet die Anwendung lokal.
- npm run ig:build baut den PIO-Katalog aus den Originaldateien.
- npm run typecheck, npm run test, npm run test:e2e und npm run build laufen erfolgreich (Scripts entsprechend einrichten).
- README enthält Setup, IG-Pfadkonfiguration, Node-Anforderung laut verwendeter Vite-Version, Start, Speicherung, Backup, Export und Grenzen.
12. Definition of Done für die erste nutzbare Version
- [ ] Der lokal hinterlegte mio42-IG wurde inventarisiert; Version und Quelle sind dokumentiert.
- [ ] Der fachliche PIO-Katalog ist aus realen IG-Dateien reproduzierbar generiert, verschachtelt und durchsuchbar.
- [ ] Jedes nutzbare Katalogelement hat nachvollziehbare Metadaten bzw. eine sichtbare Quellenlücke.
- [ ] Nutzer können eigene Themenbereiche und Priorisierungen unabhängig voneinander per Drag-and-drop bearbeiten.
- [ ] Nutzer können frei einen Versorgungsprozess aufbauen, Akteure festlegen und Elemente per Drag-and-drop Schritten zuordnen.
- [ ] Drag-and-drop hat eine funktionierende Alternative ohne Ziehen.
- [ ] Jeder Arbeitsstand wird nur lokal gespeichert und kann als JSON exportiert/importiert werden.
- [ ] Eine Ergebnisübersicht mit Prozessbezug und IG-Referenzen ist exportierbar.
- [ ] App startet lokal ohne Cloud-, Auth- oder Backend-Dienste; alle Tests und Build erfolgreich.
- [ ] Keine Deployment-Pipeline und keine GitHub-Pages-Konfiguration erforderlich.
13. Umsetzungsreihenfolge für Codex (in kleinen, überprüfbaren Arbeitspaketen)
1. Repository untersuchen, IG-Funde und aktive Version berichten.
2. IG-Katalog-Pipeline bauen, Stichproben gegen Quellen testen; Mapping-Dokumente schreiben.
3. App-Grundgerüst und Datenmodelle erstellen; Dexie-Persistenz, Workspaceverwaltung und Import/Export testen.
4. PIO-Katalogansicht mit Hierarchie, Suche, Details, Quellverweisen implementieren.
5. Themenboard und Priorisierungsboard mit dnd-kit bauen und testen.
6. React-Flow-Prototyp mit Knoten, Verbindungen und Sidebardrop inklusive Zuordnung eines PIO-Elements testen.
7. Workflow-Modul vollständig umsetzen, Akteure und Prozesszuordnungen integrieren.
8. Ergebnisübersicht, JSON/CSV-Export, Druckansicht ergänzen.
9. End-to-End-Tests und README fertigstellen; abschließend die lokale Anwendung starten und UI/Interaktionen prüfen.
Nach jedem Arbeitspaket kurz festhalten: umgesetzt, getestete Funktionen, offene fachliche und technische Risiken. Nicht für fehlende fachliche IG-Daten einfach erfundene Einträge einsetzen.
Direkt nutzbarer Start-Prompt für Codex
Setze den beigefügten Plan Codex_Plan_Kerndatensatz_Pflege_Workshop_Editor.md im aktuellen lokalen Repository um. Der vollständige PIO-Überleitungsbogen-Implementation-Guide liegt bereits in diesem Projekt. Analysiere zuerst die vorhandenen Dateien einschließlich IG-Version, FHIR-Artefakten und gegebenenfalls fachlichem Informationsmodell, bevor du den Katalog implementierst. Erhalte die originale mio42-Hierarchie und Semantik einschließlich stabiler Quellverweise. Realisiere mit React/TypeScript/Vite, dnd-kit, React Flow und lokaler IndexedDB eine deutschsprachige Anwendung, in der Teilnehmende unabhängig ihre eigenen Kategorien, Priorisierungen und frei gestalteten Versorgungsworkflows bearbeiten können. Informationen müssen per Drag-and-drop aus dem echten IG-Katalog Prozessen und Prozessschritten zugeordnet werden können. Mehrfache Zuordnungen müssen möglich sein. Ergebnisse lokal speichern und als JSON/CSV exportieren; Import bereitstellen. Kein Backend, keine Anmeldung, kein GitHub-Pages-Deployment. Arbeite iterativ gemäß den Phasen, schreibe zuerst IG-Inventar und Mapping-Dokumentation, führe Tests aus und dokumentiere fachliche Datenlücken statt sie zu erfinden. Starte die Anwendung am Ende lokal und nenne mir die konkreten Startbefehle und die umgesetzten Funktionen.

Technische Referenzen für Codex
- React Flow: https://reactflow.dev/learn
- dnd-kit (aktuelle React-API): https://dndkit.com/react/quickstart/
- dnd-kit Multiple Sortable Lists: https://dndkit.com/react/guides/multiple-sortable-lists/
- Dexie/IndexedDB: https://dexie.org/docs/index
- Vite: https://vite.dev/guide/
- Öffentliches fachliches Informationsmodell des PIO-Überleitungsbogens als Orientierung, nicht als Ersatz des lokalen IG: https://mio.kbv.de/spaces/ULB1X0X0/pages/98304440/Informationsmodell%2BPhase%2BI