import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { discover } from "./discover";
import { extract } from "./extract";
import { validate } from "./validate";
const root = process.env.PIO_IG_PATH ?? "PIO_Überleitungsbogen";
const sources = await discover(root);
const versions = [
  ...new Set(sources.map((s) => s.resource.version).filter(Boolean)),
];
if (versions.length !== 1)
  throw new Error(`Versionslage nicht eindeutig: ${versions.join(", ")}`);
const { elements, warnings, unresolved } = extract(sources);
const stats = validate(elements);
const fingerprint = createHash("sha256")
  .update(sources.map((s) => s.hash).join("\n"))
  .digest("hex");
const inventory = sources.map(({ file, hash, resource: r }) => ({
  file,
  sha256: hash,
  type: r.resourceType,
  version: r.version ?? null,
  canonical: r.url ?? null,
  fhirVersion: r.fhirVersion ?? null,
}));
const catalog = {
  igVersion: versions[0]!,
  fhirVersions: [
    ...new Set(sources.map((s) => s.resource.fhirVersion).filter(Boolean)),
  ],
  fingerprint,
  stats,
  elements,
  inventory,
  terminologies: sources
    .filter((s) => s.resource.resourceType !== "StructureDefinition")
    .map((s) => ({
      file: s.file,
      canonical: s.resource.url ?? "",
      id: s.resource.id,
      version: s.resource.version ?? null,
      asset: s.resource.id + ".json",
    })),
  limitations: [
    "Ein separates fachliches Informationsmodell liegt lokal nicht vor. Einstieg über Original-Abschnitte der Composition; darunter technische Profilhierarchie.",
    "Nur Differentials vorhanden. Vererbte Kardinalitäten und Basiselemente sind nicht aufgelöst. Technische Vorgaben bestimmen keine Workshop-Priorität.",
  ],
};
await mkdir("src/generated", { recursive: true });
await mkdir("docs", { recursive: true });
await mkdir("src/generated/terminologies", { recursive: true });
for (const s of sources.filter(
  (s) => s.resource.resourceType !== "StructureDefinition",
))
  await writeFile(
    "src/generated/terminologies/" + s.resource.id + ".json",
    JSON.stringify(s.resource),
  );
await writeFile("src/generated/pio-catalog.json", JSON.stringify(catalog));
await writeFile(
  "docs/ig-extraction-report.json",
  JSON.stringify({ stats, warnings, unresolved, inventory }, null, 2),
);
await writeFile(
  "docs/IG_INVENTORY.md",
  `# Lokales IG-Inventar\n\nQuellordner: \`${root}\`. Ressourcen-Version: **${versions[0]}**. FHIR: **${catalog.fhirVersions.join(", ")}**. Kein Package-Manifest/ImplementationGuide-Resource; daher ist 1.0.0 die belegte Artefaktversion, keine darüber hinaus nachgewiesene Publikationsversion.\n\n${sources.length} JSON-Dateien, ${stats.profiles} StructureDefinitions, ${sources.filter((s) => s.resource.resourceType === "ValueSet").length} ValueSets, ${sources.filter((s) => s.resource.resourceType === "CodeSystem").length} CodeSystems, ein ConceptMap, ein NamingSystem. Keine HTML-, FSH-, Tabellen-, Archiv- oder fachlichen Modellquellen.\n\n${stats.elements} eindeutige ElementDefinition-Einträge; ${stats.sections} Composition-Abschnitte; ${stats.maxDepth} Hierarchieebenen im technischen Fallback. Alle 110 Profile enthalten nur Differentials.\n\nSHA-256-Katalogfingerprint: \`${fingerprint}\`. Vollständiges Inventar mit Dateipfad, Version, Canonical und SHA-256 sowie ${unresolved.length} externen/nicht lokal aufgelösten Referenzvorkommen: [ig-extraction-report.json](ig-extraction-report.json). Terminologien werden im Original eingebettet, nicht extern ergänzt. NamingSystem ohne Versionsangabe bleibt entsprechend markiert.\n\n${catalog.limitations.join("\n\n")}\n`,
);
await writeFile(
  "docs/FACHLICHES_MAPPING.md",
  `# Fachliches Mapping\n\n## Gesicherte Herkunft\n\nDie ${stats.sections} Abschnitte stammen aus Composition.section-Slices; deutsche Titel unverändert aus der jeweiligen .title.patternString. Beispiel: **Pflegegrad** aus \`Profile/KBV_PR_MIO_ULB_Composition.xml.json\`, \`Composition.section:pflegegrad.title\`. Auch Originalschreibweisen wie „Notwendigkeit der räumlichen Isoation“ bleiben erhalten.\n\nProfilverweise werden ausschließlich aus type.profile/targetProfile übernommen. Beim Pflegegrad verweist .entry auf KBV_PR_MIO_ULB_Observation_Care_Level|1.0.0; dessen Originalbeschreibung lautet „Dieses Profil bildet den Pflegegrad ab.“ Keine aus technischen IDs geratenen deutschen Fachbezeichnungen.\n\n## Hierarchie und Grenzen\n\nCanonical + vollständige Element-ID bildet die stabile ID. Slices/choice[x] bleiben getrennt. Nächster tatsächlich vorhandener ID-Vorfahre wird Elternknoten. Snapshot hätte Vorrang vor Differential; niemals beide addieren. Wiederverwendete Profile sind über alle belegten Verwendungsstellen navigierbar, bleiben aber eine Definition; unterschiedliche Workshop-Prozesskontexte werden separat gespeichert.\n\nKein separates fachliches Modell liegt vor. Die Profiluntergliederung ist deshalb ein sichtbarer technischer Fallback, keine Rekonstruktion nicht vorhandener Kapitelnummern. Alle ${stats.elements} Einträge sind zugänglich, auch max=0. Fehlende min/max werden als ? dargestellt, niemals aus MustSupport abgeleitet. Constraints, Binding-Stärke, Fixed/Pattern-Werte und Extensions bleiben im Originalbeleg erhalten. ${unresolved.length} nicht lokal auflösbare Referenzvorkommen werden im maschinenlesbaren Bericht aufgeführt.\n\n## Workshop-Ergänzungen\n\nEigene Themen, Prioritäten, Begründungen, Akteure und Abläufe sind nicht normativ. Keine automatische Vererbung von Elternbewertungen. Ein Thema je Element; mehrere Prozessverwendungen möglich. Der JSON-Export enthält zusätzlich ID-/Originaltitel-Snapshots. Vereinfachende Bedienhinweise tragen die Kennzeichnung „Vereinfachte Erklärung“.\n`,
);
console.log(
  JSON.stringify(
    {
      version: versions[0],
      sources: sources.length,
      ...stats,
      unresolved: unresolved.length,
      fingerprint,
    },
    null,
    2,
  ),
);
