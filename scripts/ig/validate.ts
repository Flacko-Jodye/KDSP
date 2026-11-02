import type { PioElement } from "../../src/domain/catalog";
export function validate(elements: PioElement[]) {
  const map = new Map(elements.map((e) => [e.id, e]));
  if (map.size !== elements.length) throw new Error("Doppelte Katalog-IDs");
  let maxDepth = 0;
  for (const e of elements) {
    const seen = new Set([e.id]);
    let p = e.parentId;
    let depth = 1;
    while (p) {
      if (seen.has(p)) throw new Error(`Zyklus: ${p}`);
      seen.add(p);
      const parent = map.get(p);
      if (!parent) throw new Error(`Elternquelle fehlt: ${p}`);
      p = parent.parentId;
      depth++;
    }
    maxDepth = Math.max(maxDepth, depth);
    if (!e.source.file || !e.source.elementId) throw new Error("Quelle fehlt");
  }
  return {
    elements: elements.length,
    profiles: elements.filter((e) => e.kind === "profile").length,
    sections: elements.filter((e) => e.kind === "section").length,
    maxDepth,
  };
}
