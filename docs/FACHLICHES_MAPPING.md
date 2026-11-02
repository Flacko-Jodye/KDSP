# Fachliches Mapping

## Gesicherte Herkunft

Die 40 Abschnitte stammen aus Composition.section-Slices; deutsche Titel unverändert aus der jeweiligen .title.patternString. Beispiel: **Pflegegrad** aus `Profile/KBV_PR_MIO_ULB_Composition.xml.json`, `Composition.section:pflegegrad.title`. Auch Originalschreibweisen wie „Notwendigkeit der räumlichen Isoation“ bleiben erhalten.

Profilverweise werden ausschließlich aus type.profile/targetProfile übernommen. Beim Pflegegrad verweist .entry auf KBV_PR_MIO_ULB_Observation_Care_Level|1.0.0; dessen Originalbeschreibung lautet „Dieses Profil bildet den Pflegegrad ab.“ Keine aus technischen IDs geratenen deutschen Fachbezeichnungen.

## Hierarchie und Grenzen

Canonical + vollständige Element-ID bildet die stabile ID. Slices/choice[x] bleiben getrennt. Nächster tatsächlich vorhandener ID-Vorfahre wird Elternknoten. Snapshot hätte Vorrang vor Differential; niemals beide addieren. Wiederverwendete Profile sind über alle belegten Verwendungsstellen navigierbar, bleiben aber eine Definition; unterschiedliche Workshop-Prozesskontexte werden separat gespeichert.

Kein separates fachliches Modell liegt vor. Die Profiluntergliederung ist deshalb ein sichtbarer technischer Fallback, keine Rekonstruktion nicht vorhandener Kapitelnummern. Alle 7902 Einträge sind zugänglich, auch max=0. Fehlende min/max werden als ? dargestellt, niemals aus MustSupport abgeleitet. Constraints, Binding-Stärke, Fixed/Pattern-Werte und Extensions bleiben im Originalbeleg erhalten. 118 nicht lokal auflösbare Referenzvorkommen werden im maschinenlesbaren Bericht aufgeführt.

## Workshop-Ergänzungen

Eigene Themen, Prioritäten, Begründungen, Akteure und Abläufe sind nicht normativ. Keine automatische Vererbung von Elternbewertungen. Ein Thema je Element; mehrere Prozessverwendungen möglich. Der JSON-Export enthält zusätzlich ID-/Originaltitel-Snapshots. Vereinfachende Bedienhinweise tragen die Kennzeichnung „Vereinfachte Erklärung“.
