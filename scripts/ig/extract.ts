import type { Source, RawElement } from "./discover";
import type { PioElement } from "../../src/domain/catalog";
export const baseUrl = (url: string) => url.split("|")[0];
export function extract(sources: Source[]) {
  const elements: PioElement[] = [];
  const warnings: string[] = [];
  const unresolved: { source: string; reference: string }[] = [];
  const urls = new Set(sources.map((s) => s.resource.url).filter(Boolean));
  for (const { file, resource: r } of sources.filter(
    (s) => s.resource.resourceType === "StructureDefinition",
  )) {
    if (!r.url || !r.version)
      throw new Error(`Canonical/Version fehlt: ${file}`);
    const raw = r.snapshot?.element ?? r.differential?.element ?? [];
    const ids = new Set(raw.map((e) => e.id));
    if (ids.size !== raw.length)
      throw new Error(`Doppelte Element-IDs: ${file}`);
    const key = (id: string) => `${r.url}#${id}`;
    for (const [sortOrder, e] of raw.entries()) {
      let parent = e.id;
      do {
        const cut = Math.max(parent.lastIndexOf("."), parent.lastIndexOf(":"));
        parent = cut < 0 ? "" : parent.slice(0, cut);
      } while (parent && !ids.has(parent));
      const section =
        e.path.startsWith("Composition.section") &&
        /\.section:[^.]+$/.test(e.id);
      const title = section
        ? raw.find((x) => x.id === `${e.id}.title`)
        : undefined;
      const label =
        title?.patternString ??
        e.short ??
        (sortOrder === 0 ? (r.title ?? r.name) : e.sliceName) ??
        e.id.split(".").at(-1)!;
      const references: string[] = (e.type ?? []).flatMap((t: any) => [
        ...(t.profile ?? []),
        ...(t.targetProfile ?? []),
      ]);
      const terminology: string[] = e.binding?.valueSet
        ? [e.binding.valueSet]
        : [];
      for (const reference of [...references, ...terminology])
        if (!urls.has(baseUrl(reference)))
          unresolved.push({ source: key(e.id), reference });
      const node: PioElement = {
        id: key(e.id),
        parentId: parent ? key(parent) : undefined,
        label,
        description:
          e.definition ?? (sortOrder === 0 ? r.description : undefined),
        sortOrder,
        kind: section ? "section" : sortOrder === 0 ? "profile" : "element",
        children: [],
        source: {
          igVersion: r.version,
          file,
          canonical: r.url,
          elementId: e.id,
          fhirPath: e.path,
          labelElementId: title?.id ?? e.id,
          representation: r.snapshot ? "snapshot" : "differential",
        },
        references,
        metadata: {
          cardinality: `${e.min ?? "?"}..${e.max ?? "?"}`,
          conformity:
            e.mustSupport === undefined
              ? undefined
              : `MustSupport: ${e.mustSupport}`,
          type: (e.type ?? []).map((t: any) => t.code).join(" | ") || undefined,
          terminology,
          notes: [
            ...(r.snapshot
              ? []
              : [
                  "Nur Differential: ? bedeutet lokal nicht angegeben, nicht 0. Vererbte Vorgaben sind nicht aufgelöst.",
                ]),
            ...(e.max === "0"
              ? ["Im vorliegenden Profil ausgeschlossen (max=0)."]
              : []),
          ],
        },
        original: e,
        technicalLabel: !title?.patternString && !e.short,
      };
      elements.push(node);
    }
    if (!r.snapshot)
      warnings.push(
        `${file}: Differential ohne aufgelöste Basis ${r.baseDefinition ?? "(nicht angegeben)"}`,
      );
  }
  const byId = new Map(elements.map((e) => [e.id, e]));
  for (const e of elements)
    if (e.parentId) byId.get(e.parentId)!.children.push(e.id);
  return { elements, warnings, unresolved };
}
